import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "danger" | "warning" | "info" | "neutral";
  size?: "sm" | "md";
}

export default function Badge({
  children,
  variant = "neutral",
  size = "sm",
}: BadgeProps) {
  const variantStyles = {
    success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 backdrop-blur-md shadow-[0_0_10px_rgba(16,185,129,0.15)]",
    danger: "bg-rose-500/15 text-rose-300 border-rose-500/30 backdrop-blur-md shadow-[0_0_10px_rgba(244,63,94,0.15)]",
    warning: "bg-amber-500/15 text-amber-300 border-amber-500/30 backdrop-blur-md shadow-[0_0_10px_rgba(245,158,11,0.15)]",
    info: "bg-blue-500/15 text-blue-300 border-blue-500/30 backdrop-blur-md shadow-[0_0_10px_rgba(59,130,246,0.15)]",
    neutral: "bg-white/[0.06] text-slate-300 border-white/[0.1] backdrop-blur-md",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${variantStyles[variant]} ${sizeStyles[size]}`}
    >
      {children}
    </span>
  );
}
