"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import { useAuth, UserProfile } from "@/context/AuthContext";
import { formatIDR } from "@/services/api";
import { 
 User, Shield, Wallet, TrendingUp, Target, Clock, Lock, Check,
 AlertCircle, Sparkles, Brain, Save, KeyRound, LogOut, CheckCircle2
} from "lucide-react";

export default function ProfilePage() {
 const { user, updateProfile, updatePassword, logout } = useAuth();

 // Form states initialized with user context
 const [fullName, setFullName] = useState("");
 const [username, setUsername] = useState("");
 const [age, setAge] = useState<number>(25);
 const [occupation, setOccupation] = useState("");
 const [monthlyIncome, setMonthlyIncome] = useState<number>(10000000);
 const [monthlyExpenses, setMonthlyExpenses] = useState<number>(5000000);
 const [emergencyMonths, setEmergencyMonths] = useState<number>(6);
 const [riskProfile, setRiskProfile] = useState<"conservative" | "moderate" | "aggressive">("moderate");
 const [investmentGoals, setInvestmentGoals] = useState("");
 const [timeHorizon, setTimeHorizon] = useState<number>(10);
 const [strategyPreference, setStrategyPreference] = useState("");

 // Password update states
 const [oldPassword, setOldPassword] = useState("");
 const [newPassword, setNewPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [pwdMsg, setPwdMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
 const [pwdLoading, setPwdLoading] = useState(false);

 // Status feedback
 const [saveSuccess, setSaveSuccess] = useState(false);
 const [saveError, setSaveError] = useState("");
 const [isSaving, setIsSaving] = useState(false);

 useEffect(() => {
 if (user) {
 setFullName(user.full_name || "Adam Wahyu Kurniawan");
 setUsername(user.username || "adamwahyukur");
 setAge(user.age || 25);
 setOccupation(user.occupation || "Investor & Professional");
 setMonthlyIncome(Number(user.monthly_income || 10000000));
 setMonthlyExpenses(Number(user.monthly_expenses || 5000000));
 setEmergencyMonths(Number(user.emergency_fund_months || 6));
 setRiskProfile(user.risk_profile || "moderate");
 setInvestmentGoals(user.investment_goals || "Financial Independence / Dana Pensiun & Dividen Pasif");
 setTimeHorizon(Number(user.time_horizon_years || 10));
 setStrategyPreference(user.strategy_preference || "Pertumbuhan seimbang: DCA berkala di ETF Global VT, Saham Bluechip Dividen, Kripto terukur, dan Emas sebagai pelindung nilai.");
 }
 }, [user]);

 // Derived calculations
 const monthlySurplus = Math.max(0, monthlyIncome - monthlyExpenses);
 const savingsRate = monthlyIncome > 0 ? ((monthlySurplus / monthlyIncome) * 100).toFixed(0) : "0";
 const emergencyFundTarget = monthlyExpenses * emergencyMonths;

 const handleSaveProfile = async (e: React.FormEvent) => {
 e.preventDefault();
 setIsSaving(true);
 setSaveError("");
 setSaveSuccess(false);

 try {
 const res = await updateProfile({
 full_name: fullName,
 age: Number(age),
 occupation,
 monthly_income: Number(monthlyIncome),
 monthly_expenses: Number(monthlyExpenses),
 emergency_fund_months: Number(emergencyMonths),
 risk_profile: riskProfile,
 investment_goals: investmentGoals,
 time_horizon_years: Number(timeHorizon),
 strategy_preference: strategyPreference,
 });

 if (res.success) {
 setSaveSuccess(true);
 setTimeout(() => setSaveSuccess(false), 4000);
 } else {
 setSaveError(res.message);
 }
 } catch (err: any) {
 setSaveError("Gagal menyimpan profil.");
 } finally {
 setIsSaving(false);
 }
 };

 const handleChangePassword = async (e: React.FormEvent) => {
 e.preventDefault();
 setPwdMsg(null);

 if (!newPassword || newPassword.length < 6) {
 setPwdMsg({ type: "error", text: "Password baru minimal 6 karakter." });
 return;
 }
 if (newPassword !== confirmPassword) {
 setPwdMsg({ type: "error", text: "Konfirmasi password baru tidak cocok." });
 return;
 }

 setPwdLoading(true);
 try {
 const res = await updatePassword(oldPassword, newPassword);
 if (res.success) {
 setPwdMsg({ type: "success", text: "Password brankas berhasil diperbarui!" });
 setOldPassword("");
 setNewPassword("");
 setConfirmPassword("");
 setTimeout(() => setPwdMsg(null), 4000);
 } else {
 setPwdMsg({ type: "error", text: res.message || "Gagal mengubah password." });
 }
 } catch (err: any) {
 setPwdMsg({ type: "error", text: "Terjadi kesalahan saat mengganti password." });
 } finally {
 setPwdLoading(false);
 }
 };

 return (
 <div className="flex-1 flex flex-col min-w-0 bg-[#0d1117] min-h-screen">
 <Header title="Profil & Jati Diri Investor" />

 <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-8">
 {/* Page Title & Lock Action */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#30363d]/80 pb-6">
 <div>
 <div className="flex items-center gap-2 text-xs font-semibold text-[#3fb950] uppercase tracking-wider">
 <Shield className="w-4 h-4" />
 Jati Diri & Keamanan Brankas
 </div>
 <h1 className="text-2xl sm:text-3xl font-bold text-[#f0f6fc] tracking-tight mt-1">
 Profil Finansial Investor
 </h1>
 <p className="text-xs sm:text-sm text-[#8b949e] mt-1">
 Data jati diri, arus kas, dan sasaran investasi Anda dipelajari langsung oleh AI Jarvis untuk menghasilkan rekomendasi aset yang terpersonalisasi.
 </p>
 </div>

 <button
 onClick={logout}
 className="px-4 py-2.5 rounded-md bg-[#da3633]/15 hover:bg-[#da3633]/15 text-[#f85149] border border-[#da3633]/40 text-xs font-semibold transition flex items-center justify-center gap-2 shrink-0 self-start sm:self-center"
 >
 <LogOut className="w-3.5 h-3.5" />
 Kunci / Logout Akun
 </button>
 </div>

 {/* Live Financial Health & DCA Power Ribbon */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 <div className="p-4 rounded-md bg-[#161b22]/60 border border-[#30363d] shadow-sm space-y-1">
 <span className="text-[11px] font-medium text-[#8b949e] flex items-center gap-1.5">
 <Wallet className="w-3.5 h-3.5 text-[#58a6ff]" />
 Pemasukan Bulanan
 </span>
 <div className="text-xl font-bold text-[#f0f6fc]">{formatIDR(monthlyIncome)}</div>
 <div className="text-[10px] text-[#8b949e]">Arus kas masuk bruto</div>
 </div>

 <div className="p-4 rounded-md bg-[#161b22]/60 border border-[#30363d] shadow-sm space-y-1">
 <span className="text-[11px] font-medium text-[#8b949e] flex items-center gap-1.5">
 <TrendingUp className="w-3.5 h-3.5 text-[#d29922]" />
 Pengeluaran Pokok
 </span>
 <div className="text-xl font-bold text-[#f0f6fc]">{formatIDR(monthlyExpenses)}</div>
 <div className="text-[10px] text-[#8b949e]">Biaya hidup & operasional rutin</div>
 </div>

 <div className="p-4 rounded-md bg-gradient-to-br from-emerald-500/10 to-transparent border border-[#238636]/40 shadow-sm space-y-1">
 <span className="text-[11px] font-medium text-[#3fb950] flex items-center gap-1.5">
 <Sparkles className="w-3.5 h-3.5 text-[#3fb950]" />
 Surplus DCA Bulanan
 </span>
 <div className="text-xl font-bold text-[#3fb950]">{formatIDR(monthlySurplus)}</div>
 <div className="text-[10px] text-[#3fb950]/80">Kapasitas investasi ({savingsRate}% dari pemasukan)</div>
 </div>

 <div className="p-4 rounded-md bg-[#161b22]/60 border border-[#30363d] shadow-sm space-y-1">
 <span className="text-[11px] font-medium text-[#8b949e] flex items-center gap-1.5">
 <Shield className="w-3.5 h-3.5 text-[#a371f7]" />
 Target Dana Darurat
 </span>
 <div className="text-xl font-bold text-[#f0f6fc]">{formatIDR(emergencyFundTarget)}</div>
 <div className="text-[10px] text-[#8b949e]">Bantalan aman {emergencyMonths} bulan hidup</div>
 </div>
 </div>

 {/* Notification alerts */}
 {saveSuccess && (
 <div className="p-4 rounded-md bg-emerald-500/10 border border-[#238636]/40 text-[#3fb950] text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in">
 <CheckCircle2 className="w-5 h-5 text-[#3fb950] shrink-0" />
 <span>Jati diri dan profil finansial Anda berhasil disimpan! AI Jarvis kini telah menyesuaikan strateginya.</span>
 </div>
 )}

 {saveError && (
 <div className="p-4 rounded-md bg-[#da3633]/15 border border-[#da3633]/40 text-[#f85149] text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in">
 <AlertCircle className="w-5 h-5 text-[#f85149] shrink-0" />
 <span>{saveError}</span>
 </div>
 )}

 {/* AI Insight Card: How Jarvis interprets this profile */}
 <div className="p-5 sm:p-6 rounded-md bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-transparent border-[#238636]/40 shadow-none space-y-3">
 <div className="flex items-center gap-2 text-[#3fb950] font-bold text-sm">
 <Brain className="w-4 h-4" />
 Bagaimana AI Jarvis Membaca Jati Diri Finansial Anda:
 </div>
 <div className="text-xs sm:text-sm text-[#c9d1d9] space-y-2 leading-relaxed">
 <p>
 • <strong className="text-[#f0f6fc]">Keunggulan Waktu Usia {age} Tahun:</strong> Anda berada di fase keemasan pertumbuhan modal majemuk (*compound interest*). Horizon investasi {timeHorizon} tahun memberi kebebasan menahan fluktuasi jangka pendek demi pertumbuhan jangka panjang.
 </p>
 <p>
 • <strong className="text-[#f0f6fc]">Arus Kas DCA {formatIDR(monthlySurplus)}/Bulan:</strong> Surplus tabungan Anda tergolong sangat sehat ({savingsRate}%). Saat Anda menyuntikkan modal baru (seperti Rp 2 juta), AI akan mengarahkan alokasi ke aset pondasi (ETF Dunia VT & Bluechip IDX) tanpa membebani kas kebutuhan harian Anda.
 </p>
 <p>
 • <strong className="text-[#f0f6fc]">Fokus Sasaran & Profil {riskProfile.toUpperCase()}:</strong> Selaras dengan visi <em>"{investmentGoals}"</em>, portofolio diarahkan agar memiliki bantalan dividen pasif sekaligus eksposur pertumbuhan multi-aset yang terukur.
 </p>
 </div>
 </div>

 {/* Main Profile Form (Intuitive Sovereign Questionnaire Form) */}
 <form onSubmit={handleSaveProfile} className="space-y-6">
 {/* Section 1: Demografi & Tahun Lahir */}
 <div className="bg-[#0d1117]/70 border border-[#30363d] rounded-md p-6 space-y-5 shadow-none">
 <div className="border-b border-[#30363d] pb-3">
 <h3 className="text-base font-bold text-[#f0f6fc] flex items-center gap-2 font-mono uppercase tracking-wider">
 <User className="w-4 h-4 text-[#58a6ff]" />
 1. Identitas, Tahun Kelahiran &amp; Pekerjaan
 </h3>
 <p className="text-xs text-[#8b949e] mt-0.5">
 Membantu AI menghitung sisa horizon usia produktif dan bunga majemuk (*compound interest*).
 </p>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
 <div className="space-y-1.5">
 <label className="text-xs font-mono font-medium text-[#c9d1d9]">Nama Investor</label>
 <input
 type="text"
 value={fullName}
 onChange={(e) => setFullName(e.target.value)}
 placeholder="Adam Wahyu Kurniawan"
 className="w-full bg-[#0d1117]/40 border border-[#30363d] rounded-md px-3.5 py-2.5 text-xs sm:text-sm text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff] font-sans"
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-mono font-medium text-[#c9d1d9]">Tahun Lahir / Usia</label>
 <div className="flex items-center gap-2">
 <select
 value={new Date().getFullYear() - age}
 onChange={(e) => setAge(new Date().getFullYear() - Number(e.target.value))}
 className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2.5 text-xs sm:text-sm text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff] font-mono"
 >
 {Array.from({ length: 65 }, (_, i) => 2010 - i).map((year) => (
 <option key={year} value={year}>
 Lahir {year} ({new Date().getFullYear() - year} Tahun)
 </option>
 ))}
 </select>
 </div>
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-mono font-medium text-[#c9d1d9]">Profesi / Pekerjaan</label>
 <div className="relative">
 <input
 type="text"
 value={occupation}
 onChange={(e) => setOccupation(e.target.value)}
 placeholder="Pilih atau ketik pekerjaan..."
 className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3.5 py-2.5 text-xs sm:text-sm text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff]"
 />
 {/* Preset quick pills */}
 <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar pb-0.5">
 {["Software Engineer", "Wiraswasta / Bisnis", "Karyawan Swasta", "Trader & Investor", "Freelancer"].map((occ) => (
 <button
 key={occ}
 type="button"
 onClick={() => setOccupation(occ)}
 className={`text-[10px] px-2 py-0.5 rounded-md border whitespace-nowrap transition ${
 occupation === occ
 ? "bg-[#388bfd]/15 border-[#388bfd]/40 text-[#58a6ff] font-bold"
 : "bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:text-[#f0f6fc]"
 }`}
 >
 {occ}
 </button>
 ))}
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Section 2: Arus Kas & Kapasitas Investasi */}
 <div className="bg-[#0d1117]/70 border border-[#30363d] rounded-md p-6 space-y-5 shadow-none">
 <div className="border-b border-[#30363d] pb-3">
 <h3 className="text-base font-bold text-[#f0f6fc] flex items-center gap-2 font-mono uppercase tracking-wider">
 <Wallet className="w-4 h-4 text-[#58a6ff]" />
 2. Arus Kas Bulanan &amp; Kapasitas Investasi Dingin
 </h3>
 <p className="text-xs text-[#8b949e] mt-0.5">
 AI menghitung surplus tabungan Anda agar rekomendasi alokasi tidak mengganggu kebutuhan harian.
 </p>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div className="space-y-1.5">
 <label className="text-xs font-mono font-medium text-[#c9d1d9]">Pemasukan / Gaji Bulanan</label>
 <input
 type="number"
 value={monthlyIncome}
 onChange={(e) => setMonthlyIncome(Number(e.target.value))}
 step={500000}
 className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3.5 py-2.5 text-xs sm:text-sm text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff] font-mono tabular-nums"
 />
 <span className="text-[11px] text-[#58a6ff] font-mono block">{formatIDR(monthlyIncome)}</span>
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-mono font-medium text-[#c9d1d9]">Pengeluaran Rutin Pokok</label>
 <input
 type="number"
 value={monthlyExpenses}
 onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
 step={500000}
 className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3.5 py-2.5 text-xs sm:text-sm text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff] font-mono tabular-nums"
 />
 <span className="text-[11px] text-[#8b949e] font-mono block">{formatIDR(monthlyExpenses)}</span>
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-mono font-medium text-[#c9d1d9]">Cadangan Dana Darurat</label>
 <select
 value={emergencyMonths}
 onChange={(e) => setEmergencyMonths(Number(e.target.value))}
 className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3.5 py-2.5 text-xs sm:text-sm text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff] font-mono"
 >
 <option value={3}>3 Bulan (Agresif / Minimal)</option>
 <option value={6}>6 Bulan (Standar Disarankan)</option>
 <option value={12}>12 Bulan (Sangat Konservatif)</option>
 </select>
 <span className="text-[11px] text-[#8b949e] font-mono block">Bantalan aman: {formatIDR(emergencyFundTarget)}</span>
 </div>
 </div>
 </div>

 {/* Section 3: Target Visi Finansial & Gaya Investasi */}
 <div className="bg-[#0d1117]/70 border border-[#30363d] rounded-md p-6 space-y-5 shadow-none">
 <div className="border-b border-[#30363d] pb-3">
 <h3 className="text-base font-bold text-[#f0f6fc] flex items-center gap-2 font-mono uppercase tracking-wider">
 <Target className="w-4 h-4 text-[#58a6ff]" />
 3. Sasaran Visi Finansial &amp; Karakteristik Portofolio
 </h3>
 <p className="text-xs text-[#8b949e] mt-0.5">
 Pilih dengan satu klik tujuan utama dan gaya alokasi aset yang Anda sukai.
 </p>
 </div>

 {/* Quick Choice: Target Visi Finansial */}
 <div className="space-y-2">
 <label className="text-xs font-mono font-medium text-[#c9d1d9]">Apa Target Utama Investasi Anda?</label>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
 {[
 {
 id: "FIRE",
 title: "Financial Freedom (FIRE)",
 desc: "Kebebasan finansial & pensiun dini dari hasil dividen/gain",
 value: "Financial Independence / Pensiun Dini & Bebas Finansial",
 },
 {
 id: "PASSIVE_DIVIDEND",
 title: "Dividen Pasif Rutin",
 desc: "Membangun aliran kas dividen rutin dari saham bluechip & obligasi",
 value: "Membangun Arus Kas Dividen Pasif & Perlindungan Nilai",
 },
 {
 id: "GLOBAL_WEALTH",
 title: "Lindung Nilai Global",
 desc: "Melindungi kekayaan dari inflasi lokal via ETF VT, Big Tech & Emas",
 value: "Proteksi Kekayaan Global, Emas & Pertumbuhan Tanpa Batas Negara",
 },
 {
 id: "EXPONENTIAL",
 title: "Pertumbuhan Eksponensial",
 desc: "Akumulasi aset high-conviction (Bitcoin & Tech Moat) jangka panjang",
 value: "Pertumbuhan Aset Agresif Jangka Panjang via Bitcoin & Wide-Moat",
 },
 ].map((item) => (
 <button
 key={item.id}
 type="button"
 onClick={() => setInvestmentGoals(item.value)}
 className={`p-3 rounded-md border text-left transition flex flex-col justify-between ${
 investmentGoals === item.value
 ? "bg-[#388bfd]/15 border-[#388bfd]/40 text-white shadow-md ring-1 ring-blue-400/40"
 : "bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:border-[#30363d] hover:text-[#f0f6fc]"
 }`}
 >
 <div>
 <div className="text-xs font-bold text-[#f0f6fc]">{item.title}</div>
 <div className="text-[11px] text-[#8b949e] mt-1 leading-relaxed">{item.desc}</div>
 </div>
 {investmentGoals === item.value && (
 <span className="text-[10px] font-mono text-[#58a6ff] font-bold mt-2 flex items-center gap-1">
 <Check className="w-3 h-3" /> Target Terpilih
 </span>
 )}
 </button>
 ))}
 </div>
 <input
 type="text"
 value={investmentGoals}
 onChange={(e) => setInvestmentGoals(e.target.value)}
 placeholder="Atau tulis target kustom Anda sendiri..."
 className="w-full mt-2 bg-[#0d1117] border border-[#30363d] rounded-md px-3.5 py-2 text-xs text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff]"
 />
 </div>

 {/* Quick Choice: Gaya / Strategi Investasi */}
 <div className="space-y-2 pt-2 border-t border-[#30363d]">
 <label className="text-xs font-mono font-medium text-[#c9d1d9]">Gaya &amp; Preferensi Alokasi Portofolio</label>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
 {[
 {
 id: "FUNDAMENTAL_TRI_PILLAR",
 title: "Tri-Pilar Fundamental Bebas Volatilitas",
 desc: "40% Ekuitas VT, 40% Moneter Keras BTC, 20% Emas/Kas. Fokus nilai riil & kelangkaan mutlak.",
 value: "Tri-Pilar Fundamental: 40% Ekuitas Produktif Dunia (VT), 40% Moneter Terdesentralisasi (BTC), 20% Jangkar Emas/Kas Bebas Risiko Rekanan.",
 risk: "moderate",
 },
 {
 id: "SOVEREIGN_WIDE_MOAT",
 title: "Global Wide-Moat Monopoly",
 desc: "40% ETF Dunia (VT), 35% Big Tech (AAPL/MSFT/GOOGL), 15% BTC, 10% Emas.",
 value: "Global Wide-Moat Monopoly: 40% ETF VT/VOO, 35% US Mega-Cap AAPL/MSFT, 15% BTC, 10% Emas.",
 risk: "moderate",
 },
 {
 id: "ALL_WEATHER",
 title: "All-Weather Ray Dalio",
 desc: "Paling tahan banting di segala siklus ekonomi (Saham, Emas, Kas, Obligasi).",
 value: "All-Weather Seimbang: Diversifikasi tahan krisis ala Ray Dalio dengan proteksi emas dan obligasi.",
 risk: "conservative",
 },
 {
 id: "TECH_CRYPTO_MAX",
 title: "Asymmetric High Growth",
 desc: "Fokus aset moneter digital & disrupsi AI dengan toleransi volatilitas tinggi.",
 value: "Pertumbuhan Asimetris Agresif: Dominasi Bitcoin, Semikonduktor, dan Big Tech disrupsi.",
 risk: "aggressive",
 },
 ].map((strat) => (
 <button
 key={strat.id}
 type="button"
 onClick={() => {
 setStrategyPreference(strat.value);
 setRiskProfile(strat.risk as any);
 }}
 className={`p-3.5 rounded-md border text-left transition flex flex-col justify-between ${
 strategyPreference === strat.value
 ? "bg-[#388bfd]/15 border-[#388bfd]/40 text-white shadow-md ring-1 ring-blue-400/40"
 : "bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:border-[#30363d] hover:text-[#f0f6fc]"
 }`}
 >
 <div>
 <div className="text-xs font-bold text-[#f0f6fc] flex items-center justify-between">
 <span>{strat.title}</span>
 <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#161b22] border border-[#30363d] text-[#8b949e]">
 {strat.risk}
 </span>
 </div>
 <div className="text-[11px] text-[#8b949e] mt-1.5 leading-relaxed">{strat.desc}</div>
 </div>
 {strategyPreference === strat.value && (
 <span className="text-[10px] font-mono text-[#58a6ff] font-bold mt-2 flex items-center gap-1">
 <Check className="w-3 h-3" /> Strategi Aktif
 </span>
 )}
 </button>
 ))}
 </div>
 <textarea
 rows={2}
 value={strategyPreference}
 onChange={(e) => setStrategyPreference(e.target.value)}
 placeholder="Catatan strategi kustom untuk AI..."
 className="w-full mt-2 bg-[#0d1117] border border-[#30363d] rounded-md p-3 text-xs text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff] leading-relaxed font-sans"
 />
 </div>

 {/* Horizon Waktu Investasi Slider */}
 <div className="space-y-1.5 pt-2 border-t border-[#30363d]">
 <div className="flex items-center justify-between text-xs">
 <label className="font-mono font-medium text-[#c9d1d9]">Horizon Waktu Investasi Anda</label>
 <span className="font-bold font-mono text-[#58a6ff] bg-blue-500/10 px-2 py-0.5 rounded border border-[#388bfd]/40">
 {timeHorizon} Tahun Ke Depan
 </span>
 </div>
 <input
 type="range"
 min={1}
 max={30}
 value={timeHorizon}
 onChange={(e) => setTimeHorizon(Number(e.target.value))}
 className="w-full accent-blue-600"
 />
 <div className="flex justify-between text-[10px] text-[#8b949e] font-mono">
 <span>1 Tahun (Jangka Pendek)</span>
 <span>10 Tahun (Dekade Emas)</span>
 <span>30 Tahun (Multi-Generasi)</span>
 </div>
 </div>

 <div className="pt-3 flex justify-end">
 <button
 type="submit"
 disabled={isSaving}
 className="px-6 py-3 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs font-mono tracking-wider uppercase shadow-none shadow-blue-500/25 transition flex items-center gap-2 active:scale-[0.98] disabled:opacity-50"
 >
 <Save className="w-4 h-4" />
 {isSaving ? "Menyimpan ke AI..." : "Simpan Profil & Sinkronkan ke AI"}
 </button>
 </div>
 </div>
 </form>

 {/* Password / PIN Vault Security Section */}
 <div className="bg-[#0d1117] border border-[#30363d] rounded-md p-6 space-y-6 shadow-sm">
 <div className="border-b border-[#30363d] pb-4">
 <h3 className="text-base font-bold text-[#f0f6fc] flex items-center gap-2">
 <KeyRound className="w-4 h-4 text-[#a371f7]" />
 4. Keamanan Brankas & Ganti Password
 </h3>
 <p className="text-xs text-[#8b949e] mt-0.5">Ubah kata sandi atau PIN pengunci aplikasi Anda.</p>
 </div>

 {pwdMsg && (
 <div className={`p-3.5 rounded-md text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in ${
 pwdMsg.type === "success" 
 ? "bg-emerald-500/10 border border-[#238636]/40 text-[#3fb950]"
 : "bg-[#da3633]/15 border border-[#da3633]/40 text-[#f85149]"
 }`}>
 {pwdMsg.type === "success" ? <Check className="w-4 h-4 text-[#3fb950] shrink-0" /> : <AlertCircle className="w-4 h-4 text-[#f85149] shrink-0" />}
 <span>{pwdMsg.text}</span>
 </div>
 )}

 <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div className="space-y-1.5">
 <label className="text-xs font-medium text-[#c9d1d9]">Password Lama</label>
 <input
 type="password"
 value={oldPassword}
 onChange={(e) => setOldPassword(e.target.value)}
 placeholder="••••••••"
 className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3.5 py-2.5 text-xs sm:text-sm text-[#f0f6fc] focus:outline-none focus:border-[#8957e5]/40"
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-medium text-[#c9d1d9]">Password Baru</label>
 <input
 type="password"
 value={newPassword}
 onChange={(e) => setNewPassword(e.target.value)}
 placeholder="Minimal 6 karakter"
 className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3.5 py-2.5 text-xs sm:text-sm text-[#f0f6fc] focus:outline-none focus:border-[#8957e5]/40"
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-medium text-[#c9d1d9]">Konfirmasi Password Baru</label>
 <input
 type="password"
 value={confirmPassword}
 onChange={(e) => setConfirmPassword(e.target.value)}
 placeholder="Ulangi password baru"
 className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3.5 py-2.5 text-xs sm:text-sm text-[#f0f6fc] focus:outline-none focus:border-[#8957e5]/40"
 />
 </div>

 <div className="sm:col-span-3 flex justify-end pt-2">
 <button
 type="submit"
 disabled={pwdLoading}
 className="px-5 py-2.5 rounded-md bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition flex items-center gap-2 disabled:opacity-50"
 >
 <Lock className="w-3.5 h-3.5" />
 {pwdLoading ? "Memperbarui..." : "Perbarui Password Brankas"}
 </button>
 </div>
 </form>
 </div>
 </main>
 </div>
 );
}
