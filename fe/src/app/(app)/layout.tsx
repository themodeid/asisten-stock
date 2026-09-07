"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import { Lock, Sparkles } from "lucide-react";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    const handleToggle = () => setIsMobileMenuOpen((prev) => !prev);
    const handleClose = () => setIsMobileMenuOpen(false);

    window.addEventListener("toggle-mobile-menu", handleToggle);
    window.addEventListener("close-mobile-menu", handleClose);

    return () => {
      window.removeEventListener("toggle-mobile-menu", handleToggle);
      window.removeEventListener("close-mobile-menu", handleClose);
    };
  }, []);

  // Show obsidian loading state while checking authentication
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#080a0f] text-zinc-100">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-pulse">
            <Lock className="w-8 h-8" />
          </div>
          <div className="absolute -inset-1 rounded-2xl bg-emerald-500/20 blur-lg -z-10 animate-pulse" />
        </div>
        <div className="mt-4 text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-widest">
            <Sparkles className="w-3 h-3" />
            Verifikasi Otorisasi Brankas
          </div>
          <p className="text-xs text-zinc-500">Mempersiapkan data portofolio pribadi...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, keep locked while redirecting
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-200">
      {/* Sidebar (handles both desktop fixed sidebar & mobile slide-over drawer) */}
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto pb-20 lg:pb-0">
        {children}
      </div>

      {/* Mobile Bottom Dock Navigation */}
      <MobileNav />
    </div>
  );
}
