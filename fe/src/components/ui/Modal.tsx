"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#161b22] border border-zinc-200 dark:border-[#30363d] rounded-md w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl animate-scaleUp overflow-hidden"
      >
        {/* GitHub Dialog Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-zinc-200 dark:border-[#30363d] shrink-0 bg-zinc-50 dark:bg-[#161b22]">
          <h3 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-[#f0f6fc]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            title="Tutup (Esc)"
            className="text-zinc-400 dark:text-[#8b949e] hover:text-zinc-700 dark:hover:text-[#f0f6fc] transition p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-[#21262d]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* GitHub Dialog Body */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-[#0d1117]">{children}</div>
      </div>
    </div>
  );
}
