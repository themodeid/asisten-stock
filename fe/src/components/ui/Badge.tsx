import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "danger" | "warning" | "info" | "neutral" | "purple";
  size?: "sm" | "md";
}

export default function Badge({
  children,
  variant = "neutral",
  size = "sm",
}: BadgeProps) {
  const variantStyles = {
    success: "bg-emerald-500/10 dark:bg-[#238636]/15 text-emerald-600 dark:text-[#3fb950] border-emerald-500/20 dark:border-[#238636]/40",
    danger: "bg-rose-500/10 dark:bg-[#da3633]/15 text-rose-600 dark:text-[#f85149] border-rose-500/20 dark:border-[#da3633]/40",
    warning: "bg-amber-500/10 dark:bg-[#d29922]/15 text-amber-600 dark:text-[#d29922] border-amber-500/20 dark:border-[#d29922]/40",
    info: "bg-blue-500/10 dark:bg-[#388bfd]/15 text-blue-600 dark:text-[#58a6ff] border-blue-500/20 dark:border-[#388bfd]/40",
    purple: "bg-purple-500/10 dark:bg-[#8957e5]/15 text-purple-600 dark:text-[#a371f7] border-purple-500/20 dark:border-[#8957e5]/40",
    neutral: "bg-zinc-100 dark:bg-[#21262d] text-zinc-700 dark:text-[#8b949e] border-zinc-200 dark:border-[#30363d]",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px] rounded-full",
    md: "px-2.5 py-1 text-xs rounded-full",
  };

  return (
    <span
      className={`inline-flex items-center font-medium border ${variantStyles[variant] || variantStyles.neutral} ${sizeStyles[size]}`}
    >
      {children}
    </span>
  );
}
