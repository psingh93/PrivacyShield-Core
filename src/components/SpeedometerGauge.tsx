import React from 'react';

interface SpeedometerGaugeProps {
  score: number;
  loading?: boolean;
}

export const SpeedometerGauge: React.FC<SpeedometerGaugeProps> = ({ score, loading = false }) => {
  const clampedScore = Math.min(100, Math.max(0, score || 0));
  
  // Premium Cyberpunk Color Logic
  let activeColor = '#00C853'; // Safe Green
  let glowColor = 'rgba(0, 200, 83, 0.4)';

  if (clampedScore >= 86) {
    activeColor = '#FF3B30'; // Critical Red
    glowColor = 'rgba(255, 59, 48, 0.5)';
  } else if (clampedScore >= 61) {
    activeColor = '#FF3B30'; // High Red
    glowColor = 'rgba(255, 59, 48, 0.4)';
  } else if (clampedScore >= 21) {
    activeColor = '#FFB800'; // Warning Gold
    glowColor = 'rgba(255, 184, 0, 0.4)';
  }

  // Math for SVG Arc & Needle
  const radius = 85;
  const arcLength = Math.PI * radius; 
  const strokeDashoffset = arcLength - (clampedScore / 100) * arcLength;
  const needleRotation = (clampedScore / 100) * 180 - 90;

  return (
    <div className="flex flex-col items-center justify-center p-4 relative w-full h-48 bg-transparent">
      {/* Background Glow Effect */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full blur-3xl pointer-events-none transition-all duration-700"
        style={{ backgroundColor: glowColor }}
      />

      <svg viewBox="0 0 220 120" className="w-full h-full overflow-visible drop-shadow-2xl z-10">
        <defs>
          <linearGradient id="trackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00C853" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#FFB800" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#FF3B30" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Outer Tick Marks */}
        <path d="M 20 100 A 90 90 0 0 1 200 100" fill="none" stroke="#262A33" strokeWidth="2" strokeDasharray="4 8" />

        {/* Background Track */}
        <path
          d="M 25 100 A 85 85 0 0 1 195 100"
          fill="none"
          stroke="url(#trackGrad)"
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Active Score Arc */}
        <path
          d="M 25 100 A 85 85 0 0 1 195 100"
          fill="none"
          stroke={activeColor}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={arcLength}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 8px ${activeColor})` }}
        />

        {/* Dial Numbers */}
        <text x="25" y="118" fill="#64748B" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">0</text>
        <text x="110" y="5" fill="#64748B" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">50</text>
        <text x="195" y="118" fill="#64748B" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">100</text>

        {/* Dynamic Center Score (Replaces overlapping HTML text) */}
        <text 
          x="110" 
          y="85" 
          fill={activeColor} 
          fontSize="42" 
          fontFamily="monospace" 
          textAnchor="middle" 
          fontWeight="900"
          style={{ textShadow: `0 0 15px ${glowColor}` }}
        >
          {loading ? '--' : clampedScore}
        </text>

        {/* Rotating Needle */}
        <g 
          transform={`rotate(${needleRotation}, 110, 100)`} 
          className="transition-transform duration-1000 ease-out"
        >
          <polygon points="106,100 114,100 110,25" fill="#E2E8F0" />
          <circle cx="110" cy="100" r="8" fill="#0D0F12" stroke={activeColor} strokeWidth="3" />
        </g>
      </svg>
    </div>
  );
};
