"use client";

import { useMemo } from "react";
import {
  Sparkles,
  Check,
  Copy,
  TrendingUp,
  Scale,
  AlertTriangle,
  Target,
  Zap,
  ShieldCheck,
  Award,
} from "lucide-react";

interface AiAnalystReportCardProps {
  ticker: string;
  name: string;
  reportText: string;
  onCopy?: () => void;
  copied?: boolean;
}

interface ParsedSection {
  title: string;
  iconType: "target" | "metrics" | "catalyst" | "valuation" | "strategy" | "general";
  content: string[];
}

export default function AiAnalystReportCard({
  ticker,
  name,
  reportText,
  onCopy,
  copied = false,
}: AiAnalystReportCardProps) {
  // Parse markdown / numbered sections from AI response
  const parsedSections = useMemo(() => {
    if (!reportText) return [];

    const lines = reportText.split("\n");
    const sections: ParsedSection[] = [];
    let currentTitle = "Ringkasan Eksekutif";
    let currentIcon: ParsedSection["iconType"] = "general";
    let currentLines: string[] = [];

    const flush = () => {
      if (currentLines.length > 0) {
        sections.push({
          title: currentTitle,
          iconType: currentIcon,
          content: [...currentLines],
        });
        currentLines = [];
      }
    };

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Check if line is a major section heading (e.g. "1. Ringkasan...", "### 2. Valuasi...", "**3. Katalis...**")
      const isHeader =
        /^(?:###?\s*)?(?:\*\*)?(?:[0-9]+[.)]|Bab|Bagian)?\s*(Ringkasan|Profil|Evaluasi|Metrik|Katalis|Berita|Kesimpulan|Valuasi|Rekomendasi|Strategi|Alokasi|Tindakan)/i.test(
          trimmed
        ) || /^(?:###|##)\s+/.test(trimmed);

      if (isHeader) {
        flush();
        const cleanTitle = trimmed.replace(/^[#*\s0-9.)]+/, "").replace(/[*#]+$/, "").trim();
        currentTitle = cleanTitle || "Poin Analisis";

        const lower = currentTitle.toLowerCase();
        if (lower.includes("rekomendasi") || lower.includes("strategi") || lower.includes("tindakan")) {
          currentIcon = "target";
        } else if (lower.includes("metrik") || lower.includes("keuangan") || lower.includes("rasio")) {
          currentIcon = "metrics";
        } else if (lower.includes("katalis") || lower.includes("berita") || lower.includes("sentimen")) {
          currentIcon = "catalyst";
        } else if (lower.includes("valuasi") || lower.includes("kesimpulan") || lower.includes("diskon")) {
          currentIcon = "valuation";
        } else {
          currentIcon = "general";
        }
      } else {
        currentLines.push(trimmed);
      }
    });

    flush();
    return sections;
  }, [reportText]);

  const getIcon = (type: ParsedSection["iconType"]) => {
    switch (type) {
      case "target":
        return <Target className="w-4 h-4 text-emerald-400" />;
      case "metrics":
        return <Scale className="w-4 h-4 text-blue-400" />;
      case "catalyst":
        return <Zap className="w-4 h-4 text-amber-400" />;
      case "valuation":
        return <Award className="w-4 h-4 text-purple-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getBadgeStyle = (type: ParsedSection["iconType"]) => {
    switch (type) {
      case "target":
        return "bg-emerald-950/40 border-emerald-800/50 text-emerald-300";
      case "metrics":
        return "bg-blue-950/40 border-blue-800/50 text-blue-300";
      case "catalyst":
        return "bg-amber-950/40 border-amber-800/50 text-amber-300";
      case "valuation":
        return "bg-purple-950/40 border-purple-800/50 text-purple-300";
      default:
        return "bg-zinc-800/60 border-zinc-700/60 text-zinc-300";
    }
  };

  return (
    <div className="rounded-3xl bg-[#0c0e14] border border-white/[0.08] p-5 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none -z-0" />

      {/* Top Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Laporan Riset & Valuasi AI</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono">
                {ticker}
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Dianalisis secara komprehensif berdasarkan laporan keuangan & sentimen pasar real-time
            </p>
          </div>
        </div>

        {onCopy && (
          <button
            type="button"
            onClick={onCopy}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border self-start sm:self-auto cursor-pointer ${
              copied
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                : "bg-zinc-900 border-white/[0.08] text-zinc-300 hover:text-white hover:bg-zinc-800"
            }`}
            title="Salin hasil riset AI"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tersalin ke Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Laporan</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Structured Sections Cards */}
      <div className="space-y-4 relative z-10">
        {parsedSections.length > 0 ? (
          parsedSections.map((sec, idx) => (
            <div
              key={idx}
              className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-all space-y-3"
            >
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg border ${getBadgeStyle(sec.iconType)}`}>
                  {getIcon(sec.iconType)}
                </div>
                <h4 className="text-sm font-bold text-white tracking-tight">
                  {sec.title}
                </h4>
              </div>

              <div className="space-y-2 text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal pl-1">
                {sec.content.map((p, pIdx) => {
                  const isBullet = p.startsWith("-") || p.startsWith("•") || p.startsWith("*");
                  const cleanP = isBullet ? p.replace(/^[-•*\s]+/, "") : p;

                  return (
                    <div
                      key={pIdx}
                      className={isBullet ? "flex items-start gap-2 text-zinc-300" : "text-zinc-300"}
                    >
                      {isBullet && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      )}
                      <p className="leading-relaxed">{cleanP}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
            {reportText}
          </div>
        )}
      </div>

      {/* Disclaimer Footer */}
      <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-[11px] text-zinc-500 leading-relaxed flex items-start gap-2 relative z-10">
        <ShieldCheck className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
        <span>
          <strong>Catatan Disclaimer:</strong> Analisis ini disusun secara otomatis oleh AI Asisten+Stock menggunakan data fundamental, konsensus analis, dan berita terkini. Selalu sesuaikan dengan profil risiko dan horizon investasi Anda sendiri sebelum mengambil keputusan beli atau jual.
        </span>
      </div>
    </div>
  );
}
