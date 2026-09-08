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
    <div className="flex-1 flex flex-col min-w-0 bg-[#080a0f] min-h-screen">
      <Header title="Profil & Jati Diri Investor" />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-8">
        {/* Page Title & Lock Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              <Shield className="w-4 h-4" />
              Jati Diri & Keamanan Brankas
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
              Profil Finansial Investor
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Data jati diri, arus kas, dan sasaran investasi Anda dipelajari langsung oleh AI Jarvis untuk menghasilkan rekomendasi aset yang terpersonalisasi.
            </p>
          </div>

          <button
            onClick={logout}
            className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition flex items-center justify-center gap-2 shrink-0 self-start sm:self-center"
          >
            <LogOut className="w-3.5 h-3.5" />
            Kunci / Logout Akun
          </button>
        </div>

        {/* Live Financial Health & DCA Power Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#0d1017] border border-white/5 shadow-sm space-y-1">
            <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-blue-400" />
              Pemasukan Bulanan
            </span>
            <div className="text-xl font-bold text-zinc-100">{formatIDR(monthlyIncome)}</div>
            <div className="text-[10px] text-zinc-500">Arus kas masuk bruto</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0d1017] border border-white/5 shadow-sm space-y-1">
            <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              Pengeluaran Pokok
            </span>
            <div className="text-xl font-bold text-zinc-100">{formatIDR(monthlyExpenses)}</div>
            <div className="text-[10px] text-zinc-500">Biaya hidup & operasional rutin</div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 shadow-sm space-y-1">
            <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Surplus DCA Bulanan
            </span>
            <div className="text-xl font-bold text-emerald-400">{formatIDR(monthlySurplus)}</div>
            <div className="text-[10px] text-emerald-500/80">Kapasitas investasi ({savingsRate}% dari pemasukan)</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0d1017] border border-white/5 shadow-sm space-y-1">
            <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              Target Dana Darurat
            </span>
            <div className="text-xl font-bold text-zinc-100">{formatIDR(emergencyFundTarget)}</div>
            <div className="text-[10px] text-zinc-500">Bantalan aman {emergencyMonths} bulan hidup</div>
          </div>
        </div>

        {/* Notification alerts */}
        {saveSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Jati diri dan profil finansial Anda berhasil disimpan! AI Jarvis kini telah menyesuaikan strateginya.</span>
          </div>
        )}

        {saveError && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* AI Insight Card: How Jarvis interprets this profile */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-950/20 via-blue-950/20 to-transparent border border-emerald-500/20 shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Brain className="w-4 h-4" />
            Bagaimana AI Jarvis Membaca Jati Diri Finansial Anda:
          </div>
          <div className="text-xs sm:text-sm text-zinc-300 space-y-2 leading-relaxed">
            <p>
              • <strong className="text-white">Keunggulan Waktu Usia {age} Tahun:</strong> Anda berada di fase keemasan pertumbuhan modal majemuk (*compound interest*). Horizon investasi {timeHorizon} tahun memberi kebebasan menahan fluktuasi jangka pendek demi pertumbuhan jangka panjang.
            </p>
            <p>
              • <strong className="text-white">Arus Kas DCA {formatIDR(monthlySurplus)}/Bulan:</strong> Surplus tabungan Anda tergolong sangat sehat ({savingsRate}%). Saat Anda menyuntikkan modal baru (seperti Rp 2 juta), AI akan mengarahkan alokasi ke aset pondasi (ETF Dunia VT & Bluechip IDX) tanpa membebani kas kebutuhan harian Anda.
            </p>
            <p>
              • <strong className="text-white">Fokus Sasaran & Profil {riskProfile.toUpperCase()}:</strong> Selaras dengan visi <em>"{investmentGoals}"</em>, portofolio diarahkan agar memiliki bantalan dividen pasif sekaligus eksposur pertumbuhan multi-aset yang terukur.
            </p>
          </div>
        </div>

        {/* Main Profile Form */}
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="bg-[#0d1017] border border-white/5 rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="border-b border-zinc-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-400" />
                1. Identitas & Demografi Investor
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">Identitas pemilik tunggal brankas portofolio.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Nama Lengkap</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Adam Wahyu Kurniawan"
                  className="w-full bg-[#131722] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/60"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Username Akun</label>
                <input
                  type="text"
                  disabled
                  value={username}
                  className="w-full bg-[#131722]/60 border border-zinc-800/60 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-400 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Usia Saat Ini (Tahun)</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  min={15}
                  max={100}
                  className="w-full bg-[#131722] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/60"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Profesi / Pekerjaan</label>
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="Investor & Professional"
                  className="w-full bg-[#131722] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/60"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#0d1017] border border-white/5 rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="border-b border-zinc-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-blue-400" />
                2. Arus Kas Bulanan & Kapasitas Investasi
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">Menentukan batas aman alokasi modal dan rekomendasi DCA.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Pemasukan / Gaji Bulanan (IDR)</label>
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                  step={500000}
                  className="w-full bg-[#131722] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/60"
                />
                <span className="text-[11px] text-zinc-500">{formatIDR(monthlyIncome)}</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Pengeluaran Rutin Bulanan (IDR)</label>
                <input
                  type="number"
                  value={monthlyExpenses}
                  onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
                  step={500000}
                  className="w-full bg-[#131722] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/60"
                />
                <span className="text-[11px] text-zinc-500">{formatIDR(monthlyExpenses)}</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Cadangan Dana Darurat (Bulan)</label>
                <select
                  value={emergencyMonths}
                  onChange={(e) => setEmergencyMonths(Number(e.target.value))}
                  className="w-full bg-[#131722] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/60"
                >
                  <option value={3}>3 Bulan Pengeluaran</option>
                  <option value={6}>6 Bulan Pengeluaran (Standar Disarankan)</option>
                  <option value={12}>12 Bulan Pengeluaran (Sangat Aman)</option>
                </select>
                <span className="text-[11px] text-zinc-500">Total target: {formatIDR(emergencyFundTarget)}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#0d1017] border border-white/5 rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="border-b border-zinc-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                3. Profil Risiko & Sasaran Finansial
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">Panduan AI untuk menyeimbangkan portofolio sesuai preferensi Anda.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-300">Toleransi Risiko</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: "conservative", name: "Konservatif", desc: "Prioritas keamanan modal & dividen defensif" },
                    { id: "moderate", name: "Moderat (Seimbang)", desc: "Kombinasi pertumbuhan & perlindungan nilai" },
                    { id: "aggressive", name: "Agresif (High Alpha)", desc: "Maksimal pertumbuhan dengan toleransi volatilitas tinggi" },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRiskProfile(r.id as any)}
                      className={`p-3 rounded-xl border text-left text-xs transition ${
                        riskProfile === r.id
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-semibold shadow-sm"
                          : "bg-[#131722] border-zinc-800 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      <div className="font-bold">{r.name}</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Tujuan & Visi Finansial Utama</label>
                  <input
                    type="text"
                    value={investmentGoals}
                    onChange={(e) => setInvestmentGoals(e.target.value)}
                    placeholder="Financial Independence / Dana Pensiun & Dividen Pasif"
                    className="w-full bg-[#131722] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Horizon Waktu Investasi (Tahun)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={30}
                      value={timeHorizon}
                      onChange={(e) => setTimeHorizon(Number(e.target.value))}
                      className="flex-1 accent-emerald-500"
                    />
                    <span className="w-16 text-center font-bold text-sm bg-[#131722] border border-zinc-800 py-1 rounded-lg text-emerald-400">
                      {timeHorizon} Thn
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Preferensi & Catatan Strategi Investasi</label>
                  <textarea
                    rows={2}
                    value={strategyPreference}
                    onChange={(e) => setStrategyPreference(e.target.value)}
                    placeholder="Pertumbuhan seimbang: DCA berkala di ETF Global VT, Saham Bluechip Dividen, Kripto terukur, dan Emas sebagai pelindung nilai."
                    className="w-full bg-[#131722] border border-zinc-800 rounded-xl p-3 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/60 leading-relaxed"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] transition flex items-center gap-2 active:scale-[0.98] disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Menyimpan ke AI..." : "Simpan Jati Diri & Sinkronkan ke AI"}
              </button>
            </div>
          </div>
        </form>

        {/* Password / PIN Vault Security Section */}
        <div className="bg-[#0d1017] border border-white/5 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="border-b border-zinc-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-purple-400" />
              4. Keamanan Brankas & Ganti Password
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">Ubah kata sandi atau PIN pengunci aplikasi Anda.</p>
          </div>

          {pwdMsg && (
            <div className={`p-3.5 rounded-xl text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in ${
              pwdMsg.type === "success" 
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
            }`}>
              {pwdMsg.type === "success" ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              <span>{pwdMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Password Lama</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#131722] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-purple-500/60"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Password Baru</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full bg-[#131722] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-purple-500/60"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Konfirmasi Password Baru</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                className="w-full bg-[#131722] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-purple-500/60"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end pt-2">
              <button
                type="submit"
                disabled={pwdLoading}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition flex items-center gap-2 disabled:opacity-50"
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
