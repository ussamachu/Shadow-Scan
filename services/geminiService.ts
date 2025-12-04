import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { AnalysisResult, ScamLikelihood } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    verdict: {
      type: Type.STRING,
      description: "A short 2-3 word verdict (e.g., 'Likely Safe', 'High Risk Scam', 'Suspicious Activity').",
    },
    scamLikelihood: {
      type: Type.NUMBER,
      description: "A number from 0 to 100 representing the probability of this being a scam.",
    },
    vibeScore: {
      type: Type.NUMBER,
      description: "A number from 0 to 100 representing the 'vibe'. 0 is malicious/creepy/aggressive, 100 is genuine/safe/friendly.",
    },
    riskLevel: {
      type: Type.STRING,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      description: "Categorical risk level.",
    },
    scamType: {
      type: Type.STRING,
      description: "The specific category of scam (e.g., 'Phishing', 'Pig Butchering', 'Tech Support Fraud', 'Sextortion', 'Investment Scam', 'YouTube Scam'). If not a scam, label as 'Benign' or 'N/A'.",
    },
    senderIntent: {
      type: Type.STRING,
      description: "A concise sentence describing what the sender/creator of the content wants the recipient to do (e.g., 'Click a malicious link', 'Send money via crypto', 'Download a compromised file', 'Reply to verify account').",
    },
    summary: {
      type: Type.STRING,
      description: "A concise paragraph explaining the analysis findings.",
    },
    transcription: {
      type: Type.STRING,
      description: "If audio or video with speech was provided, provide a verbatim transcription here. Otherwise, leave empty.",
    },
    contentAnalysis: {
      type: Type.STRING,
      description: "A precise, 3-5 word identification of the input content (e.g., 'Instagram DM Screenshot', 'Suspicious Email Header', 'Voicemail Transcription', 'YouTube Video Context').",
    },
    thoughtProcess: {
      type: Type.STRING,
      description: "A transparent, step-by-step reasoning trace. Explain exactly what patterns you saw, what cross-referenced, and how you calculated the risk score.",
    },
    redFlags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of specific warning signs detected.",
    },
    greenFlags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of positive indicators that suggest authenticity.",
    },
    advice: {
      type: Type.STRING,
      description: "Actionable advice for the user on what to do next.",
    },
  },
  required: ["verdict", "scamLikelihood", "vibeScore", "riskLevel", "scamType", "senderIntent", "summary", "contentAnalysis", "thoughtProcess", "redFlags", "greenFlags", "advice"],
};

// Helper to fetch YouTube metadata via noembed (client-side friendly)
async function fetchYoutubeMetadata(url: string) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    // Basic validation to ensure it's a YouTube-like URL
    if (match && match[2].length === 11) {
        try {
            // Using noembed.com as a public oEmbed proxy to avoid CORS issues with direct YouTube API
            const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
            const data = await res.json();
            if (data.error) return null;
            return {
                title: data.title,
                author_name: data.author_name,
                author_url: data.author_url,
                thumbnail_url: data.thumbnail_url
            };
        } catch (e) {
            console.warn("Failed to fetch YouTube metadata", e);
            return null;
        }
    }
    return null;
}

// Helper for exponential backoff retry
async function withRetry<T>(fn: () => Promise<T>, retries = 3, baseDelay = 1000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      // Retry on 5xx errors, network errors (xhr), or rate limits
      const isRetryable = 
        error.message?.includes("500") || 
        error.message?.includes("xhr") || 
        error.message?.includes("fetch") ||
        error.status === 503 ||
        error.status === 429;
        
      if (!isRetryable && i < retries - 1) {
         // Even if not explicitly retryable, sometimes 'unknown' errors (code 6) are worth one retry
         if (error.code === 6 || error.message?.includes("error code: 6")) {
             // continue to retry logic
         } else {
             throw error;
         }
      }
      
      if (i === retries - 1) break;
      
      const delay = baseDelay * Math.pow(2, i);
      console.warn(`Attempt ${i + 1} failed, retrying in ${delay}ms...`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

export const analyzeContent = async (
  text: string,
  imageBase64?: string,
  audioBase64?: string,
  videoBase64?: string,
  useThinking: boolean = false
): Promise<AnalysisResult> => {
  return withRetry(async () => {
    try {
      const parts: any[] = [];
      
      // Select model based on capabilities requested or thinking mode
      let modelName = "gemini-2.5-flash";
      
      if (imageBase64 || useThinking) {
        modelName = "gemini-3-pro-preview";
      }

      let finalText = text;

      // Check for YouTube link and fetch metadata if present
      if (text && (text.includes('youtube.com/') || text.includes('youtu.be/'))) {
          // Attempt to extract the URL
          const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
          if (urlMatch) {
              const url = urlMatch[0];
              const ytData = await fetchYoutubeMetadata(url);
              if (ytData) {
                  finalText += `\n\n[DETECTED_YOUTUBE_CONTEXT]\nVideo Title: ${ytData.title}\nChannel Name: ${ytData.author_name}\nChannel URL: ${ytData.author_url}\n(Note: Analyze this metadata for common video scams like 'Crypto Doubling', 'Fake Giveaways', 'Malicious Tutorials', or 'Free Robux/Skins' generators.)`;
              }
          }
      }

      if (finalText) {
        parts.push({ text: `Analyze the following content for potential scams, social engineering, or malicious intent. \n\nContent: "${finalText}"` });
      }

      if (imageBase64) {
        // Clean base64 string if it contains the prefix
        const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
        parts.push({
          inlineData: {
            data: cleanBase64,
            mimeType: "image/png", // Assuming PNG/JPEG common types
          },
        });
        parts.push({ text: "Also analyze the attached image/screenshot for visual cues of scams (fake logos, urgency, poor design, etc.)." });
      }

      if (audioBase64) {
        // Extract mime type from base64 string or default to audio/mp3
        const mimeMatch = audioBase64.match(/^data:(audio\/[a-zA-Z0-9.-]+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : "audio/mp3";
        const cleanAudio = audioBase64.replace(/^data:audio\/[a-zA-Z0-9.-]+;base64,/, "");
        
        parts.push({
          inlineData: {
            data: cleanAudio,
            mimeType: mimeType,
          }
        });
        parts.push({ text: "Listen to the attached audio snippet. First, provide a verbatim transcription of what was said in the 'transcription' field. Then, analyze the tone, urgency, voice patterns, and content for indicators of vishing (voice phishing), social engineering, or manipulation. Does the speaker sound robotic, aggressive, or unnaturally urgent?" });
      }

      if (videoBase64) {
          // Extract mime type with robust regex for video/mp4, video/webm, etc.
          const mimeMatch = videoBase64.match(/^data:(video\/[a-zA-Z0-9.-]+);base64,/);
          const mimeType = mimeMatch ? mimeMatch[1] : "video/mp4";
          const cleanVideo = videoBase64.replace(/^data:video\/[a-zA-Z0-9.-]+;base64,/, "");

          parts.push({
              inlineData: {
                  data: cleanVideo,
                  mimeType: mimeType
              }
          });
          parts.push({ text: "Watch the attached video. Analyze the visual elements and any spoken audio. Look for deepfake artifacts, unnatural movements, suspicious text overlays, or manipulative scripts. If there is speech, transcribe it in the 'transcription' field." });
      }

      if (parts.length === 0) {
        throw new Error("No content provided for analysis.");
      }

      const config: any = {
        systemInstruction: "You are 'Shadow Scan', an elite cyber-security AI agent. Your job is to detect scams, fraud, and manipulation. \n\nFollow this strict 3-phase analysis process:\n1. **Recognition Phase**: Identify EXACTLY what the user provided (e.g., 'WhatsApp Screenshot', 'Voicemail', 'Email Text', 'YouTube Video Context'). Put this in 'contentAnalysis'.\n2. **Investigation Phase**: Analyze the intent, cross-reference patterns, and detect manipulation. Document this in 'thoughtProcess'.\n3. **Verdict Phase**: Calculate the 'Scam Probability' and 'Vibe Score', and fill out the rest of the report.\n\nBe sharp, cynical but fair, and very protective of the user.",
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.4,
      };

      // Add thinking config if requested
      if (useThinking) {
        config.thinkingConfig = { thinkingBudget: 32768 };
      }

      // Ensure contents is passed as an array to avoid ambiguity in SDK
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ parts }],
        config: config,
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("Empty response from Gemini.");
      }

      const parsedResult = JSON.parse(resultText) as AnalysisResult;
      return parsedResult;

    } catch (error: any) {
      console.error("Gemini Analysis Error:", error);
      throw new Error(error.message || "Failed to analyze content. Please try again.");
    }
  });
};

export const generateSpeech = async (text: string): Promise<string> => {
  return withRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }], // Wrapped in array
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Fenrir" },
            },
          },
        },
      });

      const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!audioData) {
        throw new Error("No audio generated.");
      }
      return audioData;
    } catch (error) {
      console.error("TTS Generation Error:", error);
      throw new Error("Failed to generate speech.");
    }
  });
};