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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xl animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0c101d]/90 backdrop-blur-2xl border border-white/[0.12] rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-[0_25px_70px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.12)] animate-scaleUp overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-white/[0.07] shrink-0 bg-white/[0.02]">
          <h3 className="text-sm sm:text-base font-semibold text-zinc-100">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            title="Tutup (Esc)"
            className="text-zinc-400 hover:text-white transition p-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-transparent hover:border-white/[0.08]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1">{children}</div>
      </div>
    </div>
  );
}
