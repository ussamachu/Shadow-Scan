export enum ScamLikelihood {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface AnalysisResult {
  verdict: string;
  scamLikelihood: number; // 0-100
  vibeScore: number; // 0-100 (0 = bad vibes, 100 = chill/safe)
  riskLevel: ScamLikelihood;
  scamType: string; // e.g., "Phishing", "Romance Scam"
  senderIntent: string; // e.g., "Wants you to click a link"
  summary: string;
  redFlags: string[];
  greenFlags: string[];
  advice: string;
  transcription?: string;
  contentAnalysis?: string;
  thoughtProcess?: string;
  timestamp?: number;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  snippet: string;
  result: AnalysisResult;
  hasImage: boolean;
  hasAudio?: boolean;
  hasVideo?: boolean;
}