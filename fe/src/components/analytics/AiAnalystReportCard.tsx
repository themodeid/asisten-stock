"use client";

import { useMemo } from"react";
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
} from"lucide-react";

interface AiAnalystReportCardProps {
 ticker: string;
 name: string;
 reportText: string;
 onCopy?: () => void;
 copied?: boolean;
}

interface ParsedSection {
 title: string;
 iconType:"target"|"metrics"|"catalyst"|"valuation"|"strategy"|"general";
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
 let currentTitle ="Ringkasan Eksekutif";
 let currentIcon: ParsedSection["iconType"] ="general";
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

 // Check if line is a major section heading (e.g."1. Ringkasan...","### 2. Valuasi...","**3. Katalis...**")
 const isHeader =
 /^(?:###?\s*)?(?:\*\*)?(?:[0-9]+[.)]|Bab|Bagian)?\s*(Ringkasan|Profil|Evaluasi|Metrik|Katalis|Berita|Kesimpulan|Valuasi|Rekomendasi|Strategi|Alokasi|Tindakan)/i.test(
 trimmed
 ) || /^(?:###|##)\s+/.test(trimmed);

 if (isHeader) {
 flush();
 const cleanTitle = trimmed.replace(/^[#*\s0-9.)]+/,"").replace(/[*#]+$/,"").trim();
 currentTitle = cleanTitle ||"Poin Analisis";

 const lower = currentTitle.toLowerCase();
 if (lower.includes("rekomendasi") || lower.includes("strategi") || lower.includes("tindakan")) {
 currentIcon ="target";
 } else if (lower.includes("metrik") || lower.includes("keuangan") || lower.includes("rasio")) {
 currentIcon ="metrics";
 } else if (lower.includes("katalis") || lower.includes("berita") || lower.includes("sentimen")) {
 currentIcon ="catalyst";
 } else if (lower.includes("valuasi") || lower.includes("kesimpulan") || lower.includes("diskon")) {
 currentIcon ="valuation";
 } else {
 currentIcon ="general";
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
 case"target":
 return <Target className="w-4 h-4 text-[#3fb950]"/>;
 case"metrics":
 return <Scale className="w-4 h-4 text-[#58a6ff]"/>;
 case"catalyst":
 return <Zap className="w-4 h-4 text-[#d29922]"/>;
 case"valuation":
 return <Award className="w-4 h-4 text-[#a371f7]"/>;
 default:
 return <Sparkles className="w-4 h-4 text-[#3fb950]"/>;
 }
 };

 const getBadgeStyle = (type: ParsedSection["iconType"]) => {
 switch (type) {
 case"target":
 return"bg-emerald-950/40 border-[#238636]/40 text-[#3fb950]";
 case"metrics":
 return"bg-blue-950/40 border-[#388bfd]/40 text-[#58a6ff]";
 case"catalyst":
 return"bg-amber-950/40 border-[#d29922]/40 text-[#d29922]";
 case"valuation":
 return"bg-purple-950/40 border-[#8957e5]/40 text-[#a371f7]";
 default:
 return"bg-[#161b22]/60 border-[#30363d]/60 text-[#c9d1d9]";
 }
 };

 return (
 <div className="rounded-md bg-[#0d1117] border border-[#30363d] p-5 sm:p-7 shadow-none space-y-6 relative overflow-hidden">
 {/* Ambient background glow */}
 <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-[#238636]/15 blur-3xl pointer-events-none -z-0"/>

 {/* Top Header Toolbar */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#30363d] pb-4 relative z-10">
 <div className="flex items-center gap-2.5">
 <div className="w-9 h-9 rounded-md bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-[#238636]/40 flex items-center justify-center text-[#3fb950] shadow-inner shrink-0">
 <Sparkles className="w-5 h-5"/>
 </div>
 <div>
 <h3 className="text-base sm:text-lg font-bold text-[#f0f6fc] tracking-tight flex items-center gap-2">
 <span>Laporan Riset & Valuasi AI</span>
 <span className="text-xs px-2 py-0.5 rounded-full bg-[#238636]/15 text-[#3fb950] border border-[#238636]/40 font-mono">
 {ticker}
 </span>
 </h3>
 <p className="text-xs text-[#8b949e] mt-0.5">
 Dianalisis secara komprehensif berdasarkan laporan keuangan & sentimen pasar real-time
 </p>
 </div>
 </div>

 {onCopy && (
 <button
 type="button"
 onClick={onCopy}
 className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 border self-start sm:self-auto cursor-pointer ${
 copied
 ?"bg-[#238636]/15 border-[#238636]/40 text-[#3fb950]"
 :"bg-[#0d1117] border-[#30363d] text-[#c9d1d9] hover:text-[#f0f6fc] hover:bg-[#161b22]"
 }`}
 title="Salin hasil riset AI"
 >
 {copied ? (
 <>
 <Check className="w-3.5 h-3.5 text-[#3fb950]"/>
 <span>Tersalin ke Clipboard</span>
 </>
 ) : (
 <>
 <Copy className="w-3.5 h-3.5"/>
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
 className="p-4 sm:p-5 rounded-md bg-[#161b22] border border-[#30363d] hover:border-[#30363d] transition-all space-y-3"
 >
 <div className="flex items-center gap-2">
 <div className={`p-1.5 rounded-md border ${getBadgeStyle(sec.iconType)}`}>
 {getIcon(sec.iconType)}
 </div>
 <h4 className="text-sm font-bold text-[#f0f6fc] tracking-tight">
 {sec.title}
 </h4>
 </div>

 <div className="space-y-2 text-xs sm:text-sm text-[#c9d1d9] leading-relaxed font-normal pl-1">
 {sec.content.map((p, pIdx) => {
 const isBullet = p.startsWith("-") || p.startsWith("•") || p.startsWith("*");
 const cleanP = isBullet ? p.replace(/^[-•*\s]+/,"") : p;

 return (
 <div
 key={pIdx}
 className={isBullet ?"flex items-start gap-2 text-[#c9d1d9]":"text-[#c9d1d9]"}
 >
 {isBullet && (
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"/>
 )}
 <p className="leading-relaxed">{cleanP}</p>
 </div>
 );
 })}
 </div>
 </div>
 ))
 ) : (
 <div className="p-4 rounded-md bg-[#161b22] border border-[#30363d] text-xs sm:text-sm text-[#c9d1d9] leading-relaxed whitespace-pre-wrap">
 {reportText}
 </div>
 )}
 </div>

 {/* Disclaimer Footer */}
 <div className="p-3.5 rounded-md bg-[#161b22] border border-[#30363d] text-[11px] text-[#8b949e] leading-relaxed flex items-start gap-2 relative z-10">
 <ShieldCheck className="w-4 h-4 text-[#8b949e] shrink-0 mt-0.5"/>
 <span>
 <strong>Catatan Disclaimer:</strong> Analisis ini disusun secara otomatis oleh AI Asisten+Stock menggunakan data fundamental, konsensus analis, dan berita terkini. Selalu sesuaikan dengan profil risiko dan horizon investasi Anda sendiri sebelum mengambil keputusan beli atau jual.
 </span>
 </div>
 </div>
 );
}
