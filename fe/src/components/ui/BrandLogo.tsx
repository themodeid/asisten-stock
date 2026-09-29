import React from "react";

interface BrandLogoProps {
  size?: number;
  className?: string;
}

export default function BrandLogo({ size = 32, className = "" }: BrandLogoProps) {
  const iconSize = Math.round(size * 0.62);

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center shrink-0 rounded-xl bg-gradient-to-b from-zinc-800/90 via-zinc-900 to-zinc-950 border border-white/[0.12] shadow-sm shadow-emerald-500/10 group ${className}`}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300 group-hover:scale-105"
      >
        {/* Hexagonal Sovereign Vault Shield */}
        <path
          d="M12 2.5L3.5 7.2V16.8L12 21.5L20.5 16.8V7.2L12 2.5Z"
          stroke="url(#asistenLogoGrad)"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dynamic Growth / Breakout Trajectory */}
        <path
          d="M7 14.5L10.5 11L13.5 13.5L17 9"
          stroke="#10b981"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14.5 9H17V11.5"
          stroke="#10b981"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Central Sovereign Nexus Node */}
        <circle cx="12" cy="12" r="1.5" fill="#3b82f6" />

        <defs>
          <linearGradient id="asistenLogoGrad" x1="3.5" y1="2.5" x2="20.5" y2="21.5" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3b82f6" />
            <stop offset="0.5" stopColor="#10b981" />
            <stop offset="1" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
