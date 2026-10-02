"use client";

import { useMemo, useState } from"react";
import { formatIDR } from"@/services/api";
import {
 ShieldCheck,
 ShieldAlert,
 AlertTriangle,
 CheckCircle2,
 TrendingUp,
 Scale,
 Sparkles,
 Info,
 ArrowRight,
 Flame,
 Shield,
 Zap,
 HelpCircle,
 TrendingDown,
 Lightbulb,
} from"lucide-react";

interface PortfolioHealthCardProps {
 healthData: any;
 onNavigateToRebalance?: () => void;
}

export default function PortfolioHealthCard({
 healthData,
 onNavigateToRebalance,
}: PortfolioHealthCardProps) {
 const [showExplainer, setShowExplainer] = useState(false);

 const score = healthData?.health_score ?? 15;
 const rating = healthData?.rating ??"Tinggi Risiko";
 const riskProfile = healthData?.risk_profile ??"Sangat Agresif";
 const metrics = healthData?.metrics;
 const actions = healthData?.rebalancing_actions ?? [];

 // Metrics extraction with safe defaults
 const topTicker = metrics?.top_holding_concentration?.ticker ||"BTC-USD";
 const topWeight = metrics?.top_holding_concentration?.weight_percent ?? 100;
 const safeHavenPct = metrics?.safe_haven_percentage ?? 0;
 const highGrowthPct = metrics?.high_growth_percentage ?? 100;

 // Grade determination
 const scoreInfo = useMemo(() => {
 if (score >= 85) {
 return {
 grade:"A",
 label:"Sangat Sehat & Prima",
 colorText:"text-[#3fb950]",
 colorBg:"bg-[#238636]/15 border-[#238636]/40",
 colorGlow:"#10b981",
 description:
"Portofolio Anda terdiversifikasi dengan sangat baik, memiliki bantalan pengaman yang solid, dan siap menghadapi volatilitas pasar.",
 };
 } else if (score >= 70) {
 return {
 grade:"B",
 label:"Sehat (Kondisi Baik)",
 colorText:"text-teal-400",
 colorBg:"bg-teal-500/10 border-teal-500/30",
 colorGlow:"#14b8a6",
 description:
"Portofolio Anda dalam kondisi sehat, namun sedikit penyesuaian alokasi akan melindunginya lebih maksimal dari koreksi pasar.",
 };
 } else if (score >= 50) {
 return {
 grade:"C",
 label:"Moderat (Perlu Penyesuaian)",
 colorText:"text-[#d29922]",
 colorBg:"bg-[#d29922]/15 border-[#d29922]/40",
 colorGlow:"#f59e0b",
 description:
"Portofolio memiliki porsi aset berisiko yang cukup dominan. Disarankan menambah aset safe haven untuk menjaga stabilitas modal.",
 };
 } else {
 return {
 grade:"D",
 label:"Butuh Perhatian (Tinggi Risiko)",
 colorText:"text-[#f85149]",
 colorBg:"bg-[#da3633]/15 border-[#da3633]/40",
 colorGlow:"#f43f5e",
 description:
"Portofolio Anda terlalu terpusat pada satu aset volatil tanpa rem pengaman. Jika aset ini turun, modal Anda langsung terancam.",
 };
 }
 }, [score]);

 // SVG Gauge calculations
 // Semi-circle radius 70, center at (100, 85)
 // Arc starts at (30, 85) -> top (100, 15) -> end at (170, 85)
 const semiCircumference = Math.PI * 70; // ~219.9
 const strokeOffset = semiCircumference - (Math.min(100, Math.max(0, score)) / 100) * semiCircumference;

 // Needle angle: 0 score = -180 deg, 100 score = 0 deg
 const needleAngle = -180 + (Math.min(100, Math.max(0, score)) / 100) * 180;
 const needleRad = (needleAngle * Math.PI) / 180;
 const needleX = 100 + 55 * Math.cos(needleRad);
 const needleY = 85 + 55 * Math.sin(needleRad);

 return (
 <div className="space-y-6 select-none">
 {/* ========================================================================= */}
 {/* 1. HERO SECTION: INTERACTIVE SPEEDOMETER & EXECUTIVE DIAGNOSTIC */}
 {/* ========================================================================= */}
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
 {/* LEFT COLUMN: Visual Speedometer Gauge Card (5 Cols) */}
 <div className="lg:col-span-5 rounded-md bg-[#0d1117] border border-[#30363d] p-5 sm:p-6 shadow-none relative overflow-hidden flex flex-col items-center text-center justify-between">
 {/* Subtle Ambient Radial Glow */}
 <div
 className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none -z-0"
 style={{ backgroundColor: scoreInfo.colorGlow }}
 />

 <div className="w-full flex items-center justify-between mb-2 z-10">
 <span className="text-[11px] font-bold text-[#8b949e] uppercase tracking-wider flex items-center gap-1.5">
 <Shield className="w-3.5 h-3.5 text-[#8b949e]"/>
 Skor Kesehatan Portofolio
 </span>
 <button
 type="button"
 onClick={() => setShowExplainer(!showExplainer)}
 className="p-1 rounded-md text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#161b22] transition"
 title="Apa arti skor ini?"
 >
 <HelpCircle className="w-4 h-4"/>
 </button>
 </div>

 {/* Speedometer Gauge SVG */}
 <div className="relative w-56 h-36 mx-auto my-1 flex items-center justify-center z-10">
 <svg viewBox="0 0 200 110"className="w-full h-full overflow-visible">
 <defs>
 {/* Multi-zone Color Gradient */}
 <linearGradient id="gaugeGradient"x1="0%"y1="0%"x2="100%"y2="0%">
 <stop offset="0%"stopColor="#f43f5e"/>
 <stop offset="35%"stopColor="#fbbf24"/>
 <stop offset="70%"stopColor="#10b981"/>
 <stop offset="100%"stopColor="#00e676"/>
 </linearGradient>

 <filter id="glowFilter"x="-20%"y="-20%"width="140%"height="140%">
 <feGaussianBlur stdDeviation="3"result="blur"/>
 <feComposite in="SourceGraphic"in2="blur"operator="over"/>
 </filter>
 </defs>

 {/* Background Inactive Arc Track */}
 <path
 d="M 30,85 A 70,70 0 0,1 170,85"
 fill="none"
 stroke="#1f242d"
 strokeWidth="12"
 strokeLinecap="round"
 />

 {/* Active Score Arc Track */}
 <path
 d="M 30,85 A 70,70 0 0,1 170,85"
 fill="none"
 stroke="url(#gaugeGradient)"
 strokeWidth="12"
 strokeDasharray={semiCircumference}
 strokeDashoffset={strokeOffset}
 strokeLinecap="round"
 className="transition-all duration-1000 ease-out"
 filter="url(#glowFilter)"
 />

 {/* Pointer Needle Indicator Line */}
 <line
 x1="100"
 y1="85"
 x2={needleX}
 y2={needleY}
 stroke="#ffffff"
 strokeWidth="3"
 strokeLinecap="round"
 className="transition-all duration-700 ease-out drop-shadow-md"
 />
 <circle cx="100"cy="85"r="5"fill="#ffffff"/>
 <circle cx="100"cy="85"r="2.5"fill="#0c0e14"/>

 {/* Scale Labels: 0, 50, 100 */}
 <text x="22"y="102"fill="#71717a"fontSize="10"fontFamily="sans-serif"textAnchor="middle">
 0
 </text>
 <text x="100"y="18"fill="#71717a"fontSize="9"fontFamily="sans-serif"textAnchor="middle">
 50
 </text>
 <text x="178"y="102"fill="#71717a"fontSize="10"fontFamily="sans-serif"textAnchor="middle">
 100
 </text>
 </svg>

 {/* Numeric Score in Center of Gauge */}
 <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex flex-col items-center">
 <div className="flex items-baseline">
 <span className={`text-5xl font-black tracking-tight ${scoreInfo.colorText}`}>
 {score}
 </span>
 <span className="text-sm font-bold text-[#8b949e] ml-1">/100</span>
 </div>
 </div>
 </div>

 {/* Rating Status Pill & Risk Profile */}
 <div className="w-full space-y-2.5 z-10 mt-2">
 <div
 className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border ${scoreInfo.colorBg} ${scoreInfo.colorText}`}
 >
 {score >= 70 ? (
 <CheckCircle2 className="w-3.5 h-3.5 shrink-0"/>
 ) : (
 <AlertTriangle className="w-3.5 h-3.5 shrink-0"/>
 )}
 <span>{scoreInfo.label}</span>
 </div>

 <div className="flex items-center justify-center gap-2 text-xs text-[#8b949e]">
 <span>Profil Portofolio:</span>
 <span className="font-semibold text-[#c9d1d9] px-2 py-0.5 rounded-md bg-[#161b22] border border-[#30363d] flex items-center gap-1">
 <Flame className="w-3 h-3 text-[#d29922]"/>
 {riskProfile}
 </span>
 </div>

 <p className="text-[11px] text-[#8b949e] leading-relaxed max-w-sm mx-auto pt-1">
 {scoreInfo.description}
 </p>
 </div>

 {/* Explainer Modal / Dropdown info */}
 {showExplainer && (
 <div className="mt-3 p-3 rounded-md bg-[#161b22] border border-[#30363d] text-left text-xs text-[#c9d1d9] space-y-1.5 z-20">
 <div className="font-bold text-[#f0f6fc] flex items-center gap-1.5">
 <Info className="w-3.5 h-3.5 text-[#58a6ff]"/> Cara Skor Dihitung
 </div>
 <p className="text-[11px] text-[#8b949e] leading-relaxed">
 Skor mengukur 3 hal utama: <strong>Diversifikasi jenis aset</strong> (tidak bertumpu pada 1 koin),{""}
 <strong>Bantalan pengaman</strong> (emas/kas minimal 10%), dan <strong>Toleransi risiko</strong> agar portofolio tidak ambles saat pasar koreksi.
 </p>
 </div>
 )}
 </div>

 {/* RIGHT COLUMN: 3 Key Health Pillars & Diagnostic (7 Cols) */}
 <div className="lg:col-span-7 rounded-md bg-[#0d1117] border border-[#30363d] p-5 sm:p-6 shadow-none flex flex-col justify-between space-y-5">
 <div>
 <div className="flex items-center justify-between mb-3 border-b border-[#30363d] pb-3">
 <h4 className="text-sm sm:text-base font-bold text-[#f0f6fc] flex items-center gap-2">
 <ShieldCheck className="w-4 h-4 text-[#3fb950]"/>
 3 Pilar Pengukur Kesehatan Portofolio
 </h4>
 <span className="text-[11px] text-[#8b949e] hidden sm:inline">
 Acuan Standar Modern Portfolio Theory
 </span>
 </div>

 {/* 3 Visual Meter Bars */}
 <div className="space-y-4">
 {/* Pillar 1: Asset Concentration */}
 <div className="p-3.5 rounded-md bg-[#161b22] hover:bg-[#161b22] border border-[#30363d] hover:border-[#30363d] transition space-y-2">
 <div className="flex items-center justify-between text-xs">
 <div className="flex items-center gap-2">
 <span className="font-bold text-[#c9d1d9]">1. Konsentrasi Aset Tunggal</span>
 <span className="text-[10px] text-[#8b949e]">(Ketergantungan pada 1 koin)</span>
 </div>
 <span
 className={`font-black font-mono text-xs ${
 topWeight > 40 ?"text-[#f85149]":"text-[#3fb950]"
 }`}
 >
 {topTicker} ({topWeight}%)
 </span>
 </div>

 {/* Progress bar with safe benchmark marker (< 30%) */}
 <div className="relative w-full h-2 rounded-full bg-[#161b22] overflow-hidden">
 <div
 className={`h-full rounded-full transition-all duration-700 ${
 topWeight > 40 ?"bg-rose-500":"bg-emerald-500"
 }`}
 style={{ width: `${Math.min(100, topWeight)}%` }}
 />
 {/* Ideal Benchmark dotted line at 30% */}
 <div
 className="absolute top-0 bottom-0 w-0.5 bg-[#161b22] z-10"
 style={{ left:"30%"}}
 title="Batas aman ideal: < 30%"
 />
 </div>

 <div className="flex items-center justify-between text-[11px]">
 <span className="text-[#8b949e]">Batas Aman Ideal: &lt; 30%</span>
 <span className={topWeight > 40 ?"text-[#f85149] font-semibold":"text-[#3fb950]"}>
 {topWeight > 40 ?"⚠️ Terlalu Terpusat (Beresiko)":"✅ Seimbang"}
 </span>
 </div>
 </div>

 {/* Pillar 2: Safe Haven Buffer (Gold / Cash) */}
 <div className="p-3.5 rounded-md bg-[#161b22] hover:bg-[#161b22] border border-[#30363d] hover:border-[#30363d] transition space-y-2">
 <div className="flex items-center justify-between text-xs">
 <div className="flex items-center gap-2">
 <span className="font-bold text-[#c9d1d9]">2. Bantalan Pengaman (Safe Haven)</span>
 <span className="text-[10px] text-[#8b949e]">(Emas, Kas, atau SBN)</span>
 </div>
 <span
 className={`font-black font-mono text-xs ${
 safeHavenPct >= 10 ?"text-[#3fb950]":"text-[#d29922]"
 }`}
 >
 {safeHavenPct}%
 </span>
 </div>

 <div className="relative w-full h-2 rounded-full bg-[#161b22] overflow-hidden">
 <div
 className={`h-full rounded-full transition-all duration-700 ${
 safeHavenPct >= 10 ?"bg-emerald-500":"bg-amber-500"
 }`}
 style={{ width: `${Math.min(100, safeHavenPct * 5)}%` }}
 />
 {/* Ideal Benchmark marker at 10% */}
 <div
 className="absolute top-0 bottom-0 w-0.5 bg-[#161b22] z-10"
 style={{ left:"20%"}}
 title="Minimal aman: 10%"
 />
 </div>

 <div className="flex items-center justify-between text-[11px]">
 <span className="text-[#8b949e]">Minimal Ideal: 10% – 20%</span>
 <span className={safeHavenPct >= 10 ?"text-[#3fb950] font-semibold":"text-[#d29922]"}>
 {safeHavenPct === 0 ?"⚠️ Kosong (Belum Ada Pelindung)": safeHavenPct >= 10 ?"✅ Aman":"Perlu Ditambah"}
 </span>
 </div>
 </div>

 {/* Pillar 3: High Growth & Volatility Exposure */}
 <div className="p-3.5 rounded-md bg-[#161b22] hover:bg-[#161b22] border border-[#30363d] hover:border-[#30363d] transition space-y-2">
 <div className="flex items-center justify-between text-xs">
 <div className="flex items-center gap-2">
 <span className="font-bold text-[#c9d1d9]">3. Aset Pertumbuhan Agresif</span>
 <span className="text-[10px] text-[#8b949e]">(Kripto & Saham Global)</span>
 </div>
 <span className="font-black font-mono text-xs text-[#58a6ff]">
 {highGrowthPct}%
 </span>
 </div>

 <div className="relative w-full h-2 rounded-full bg-[#161b22] overflow-hidden">
 <div
 className="h-full rounded-full bg-blue-500 transition-all duration-700"
 style={{ width: `${Math.min(100, highGrowthPct)}%` }}
 />
 </div>

 <div className="flex items-center justify-between text-[11px]">
 <span className="text-[#8b949e]">Porsi Agresif: &gt; 70%</span>
 <span className="text-[#58a6ff] font-semibold">
 ⚡ Potensi Untung Tinggi & Volatilitas Ekstrem
 </span>
 </div>
 </div>
 </div>
 </div>

 {/* Diagnostic Key Takeaways */}
 <div className="pt-2 border-t border-[#30363d] space-y-2">
 <div className="text-xs font-semibold text-[#c9d1d9]">Kesimpulan Praktis:</div>
 <div className="p-3 rounded-md bg-[#d29922]/15 border border-[#d29922]/40 text-xs text-[#d29922]/90 leading-relaxed flex items-start gap-2.5">
 <AlertTriangle className="w-4 h-4 text-[#d29922] shrink-0 mt-0.5"/>
 <div>
 <strong>Peringatan Risiko:</strong> Seluruh modal Anda saat ini ({topWeight}%) berada di{""}
 <span className="underline font-semibold">{topTicker}</span>. Jika harga kripto mengalami koreksi tajam, modal Anda tidak memiliki bantalan penahan. Menambahkan sedikit Emas atau Kas akan langsung mengamankan portofolio Anda.
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* ========================================================================= */}
 {/* 2. ACTIONABLE REBALANCING PLAN (EASY-TO-FOLLOW CARDS) */}
 {/* ========================================================================= */}
 <div className="rounded-md bg-[#0d1117] border border-[#30363d] p-5 sm:p-6 shadow-none space-y-4">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#30363d] pb-4">
 <div>
 <h4 className="text-base font-bold text-[#f0f6fc] flex items-center gap-2">
 <Scale className="w-4 h-4 text-[#3fb950]"/>
 Solusi Cerdas: Langkah Penyeimbangan Bobot
 </h4>
 <p className="text-xs text-[#8b949e] mt-0.5">
 Tindakan praktis untuk menaikkan skor kesehatan portofolio Anda dari <strong>{score}/100</strong> menuju target prima <strong>85+/100</strong>.
 </p>
 </div>

 {onNavigateToRebalance && (
 <button
 type="button"
 onClick={onNavigateToRebalance}
 className="px-3.5 py-2 rounded-md bg-[#238636]/15 hover:bg-[#238636]/15 border border-[#238636]/40 text-xs font-bold text-[#3fb950] transition flex items-center gap-1.5 shrink-0 self-start sm:self-auto shadow-sm cursor-pointer"
 >
 <Sparkles className="w-3.5 h-3.5 text-[#3fb950]"/>
 <span>Gunakan AI Inflow Routing</span>
 <ArrowRight className="w-3.5 h-3.5"/>
 </button>
 )}
 </div>

 {/* Action Cards List */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
 {actions.length > 0 ? (
 actions.map((act: any, idx: number) => {
 const isReduce = act.action ==="REDUCE";

 return (
 <div
 key={idx}
 className={`rounded-md p-4 transition-all flex flex-col justify-between space-y-3 ${
 isReduce
 ?"bg-gradient-to-br from-amber-500/10 to-transparent border border-[#d29922]/40 shadow-none hover:border-[#d29922]/40"
 :"bg-gradient-to-br from-emerald-500/10 to-transparent border border-[#238636]/40 shadow-none hover:border-[#238636]/40"
 }`}
 >
 <div className="space-y-2">
 {/* Top Action Badge & Asset Name */}
 <div className="flex items-center justify-between">
 <span
 className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
 isReduce
 ?"bg-[#d29922]/15 text-[#d29922] border-[#d29922]/40"
 :"bg-[#238636]/15 text-[#3fb950] border-[#238636]/40"
 }`}
 >
 {isReduce ? (
 <>
 <TrendingDown className="w-3 h-3"/>
 Pangkas Sebagian (Trim)
 </>
 ) : (
 <>
 <ShieldCheck className="w-3 h-3"/>
 Tambah Alokasi (Diversifikasi)
 </>
 )}
 </span>
 <span className="text-xs font-bold text-[#f0f6fc]">
 {act.asset_type}
 </span>
 </div>

 {/* Before vs After Weight Shift */}
 <div className="flex items-center justify-between text-xs pt-1">
 <span className="text-[#8b949e]">Porsi Portofolio:</span>
 <div className="flex items-center gap-1.5 font-bold">
 <span className="text-[#8b949e] line-through">
 {act.current_weight_percent}%
 </span>
 <ArrowRight className="w-3 h-3 text-[#8b949e]"/>
 <span
 className={isReduce ?"text-[#d29922]":"text-[#3fb950]"}
 >
 {act.target_weight_percent}% (Ideal)
 </span>
 </div>
 </div>

 {/* Plain Language Reason */}
 <p className="text-xs text-[#c9d1d9] leading-relaxed pt-1">
 {act.reason}
 </p>
 </div>

 {/* Recommended Amount in IDR */}
 <div className="pt-3 border-t border-[#30363d] flex items-center justify-between">
 <span className="text-[11px] text-[#8b949e]">
 {isReduce ?"Nominal yang Diamankan:":"Nominal Tambahan Disarankan:"}
 </span>
 <span className="text-sm font-black font-mono text-[#f0f6fc]">
 {formatIDR(act.recommended_amount_idr || 0)}
 </span>
 </div>
 </div>
 );
 })
 ) : (
 <div className="col-span-2 py-8 text-center text-xs text-[#8b949e] flex items-center justify-center gap-2">
 <CheckCircle2 className="w-4 h-4 text-[#3fb950]"/>
 Portofolio Anda sudah dalam kondisi prima dan seimbang!
 </div>
 )}
 </div>

 {/* Smart Inflow Tip Box */}
 <div className="p-3.5 rounded-md bg-[#388bfd]/15 border border-[#388bfd]/40 flex items-start gap-3 text-xs text-[#58a6ff]/90 leading-relaxed">
 <Zap className="w-4 h-4 text-[#58a6ff] shrink-0 mt-0.5"/>
 <div>
 <strong className="text-[#f0f6fc] flex items-center gap-1.5 mb-0.5">
 <Lightbulb className="w-3.5 h-3.5 text-[#d29922]"/>
 Tips Tanpa Harus Menjual Kripto Anda:
 </strong>
 Anda tidak harus menjual Bitcoin Anda jika yakin harganya akan naik lagi. Cukup alokasikan modal baru (fresh capital berikutnya) ke aset Emas atau Kas. Skor kesehatan portofolio Anda akan otomatis naik ke zona aman tanpa memicu pajak penjualan!
 </div>
 </div>
 </div>
 </div>
 );
}
