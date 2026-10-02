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

  // Show clean enterprise loading state while checking authentication
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0d1117] text-[#f0f6fc]">
        <div className="w-12 h-12 rounded-md bg-[#161b22] border border-[#30363d] flex items-center justify-center text-[#c9d1d9] shadow-none">
          <Lock className="w-5 h-5 text-[#8b949e]" />
        </div>
        <div className="mt-4 text-center space-y-1">
          <div className="text-xs font-medium text-[#c9d1d9] tracking-wide">
            Verifikasi Sesi Pengguna
          </div>
          <p className="text-xs text-[#8b949e]">Memuat data portofolio...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, keep locked while redirecting
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-150">

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
