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
      className={`relative flex items-center justify-center shrink-0 rounded-lg bg-[#161b22] border border-[#30363d] shadow-[0_1px_0_rgba(27,31,36,0.1)] group transition-colors hover:border-[#8b949e] ${className}`}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-200 group-hover:scale-105"
      >
        {/* GitHub Style Git Branch & Financial Growth Trajectory */}
        {/* Main Trunk / Base Node */}
        <circle cx="6" cy="18" r="2.5" stroke="#8b949e" strokeWidth="1.75" fill="#161b22" />
        
        {/* Branch Connecting Path */}
        <path
          d="M6 15.5V8.5C6 7.12 7.12 6 8.5 6H12"
          stroke="#8b949e"
          strokeWidth="1.75"
          strokeLinecap="round"
        />

        {/* Breakthrough Branch (Ascending Alpha Line) */}
        <path
          d="M6 12L12 8.5L16 11.5L20 5"
          stroke="#3fb950"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Arrowhead on Peak */}
        <path
          d="M17 5H20V8"
          stroke="#3fb950"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Primary Sovereign Node (GitHub Blue) */}
        <circle cx="12" cy="8.5" r="2" fill="#58a6ff" />

        {/* Target Alpha Node (GitHub Green) */}
        <circle cx="20" cy="5" r="1.5" fill="#3fb950" />
      </svg>
    </div>
  );
}
