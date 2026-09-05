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
    success: "bg-emerald-950/40 text-emerald-300 border-emerald-800/60",
    danger: "bg-red-950/40 text-red-300 border-red-800/60",
    warning: "bg-amber-950/40 text-amber-300 border-amber-800/60",
    info: "bg-blue-950/40 text-blue-300 border-blue-800/60",
    neutral: "bg-zinc-800 text-zinc-300 border-zinc-700",
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
