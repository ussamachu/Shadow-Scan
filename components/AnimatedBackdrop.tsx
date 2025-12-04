import React, { useEffect, useRef } from 'react';

const AnimatedBackdrop: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let animationFrameId: number;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', resize);
    resize();

    // Matrix configuration
    const fontSize = 14;
    // Calculate columns based on width
    const columns = Math.ceil(width / fontSize);
    
    // Array to track the y coordinate (row index) of each column
    const drops: number[] = [];
    // Initialize drops at random positions above the screen for a natural start
    for (let i = 0; i < columns; i++) {
        drops[i] = Math.random() * -100; 
    }

    const chars = "10"; // Binary theme

    const draw = () => {
      // 1. Fade out previous frame to create trails
      // "Saturation zero" means we strictly use black/white/gray.
      // A low opacity black fill makes the old text fade to gray then black.
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, width, height);

      // 2. Set font styles
      ctx.font = `${fontSize}px 'Space Grotesk', monospace`;
      
      // 3. Loop over drops
      for (let i = 0; i < drops.length; i++) {
        // Random binary char
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        
        // Visual variety: some chars are bright white (glint), others are gray
        const isBright = Math.random() > 0.98;
        ctx.fillStyle = isBright ? '#ffffff' : '#333333'; 

        // Draw the character
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        ctx.fillText(text, x, y);

        // Reset drop to top randomly after it has crossed the screen
        // Adding randomness prevents all drops from looping together
        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        // Increment y coordinate
        drops[i]++;
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full bg-black -z-50 overflow-hidden pointer-events-none select-none">
      <canvas ref={canvasRef} className="block w-full h-full opacity-40" />
      
      {/* Overlay to darken edges (Vignette) for better UI visibility */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
    </div>
  );
};

export default AnimatedBackdrop;