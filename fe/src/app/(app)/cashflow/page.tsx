"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Plus,
  Camera,
  Trash2,
  Edit2,
  Calendar,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  X,
  UploadCloud,
  FileText,
  DollarSign,
  TrendingUp,
  CreditCard,
  Building2,
  ShoppingBag,
  Utensils,
  Car,
  Receipt,
  Tv,
  HeartPulse,
  GraduationCap,
  HelpCircle,
} from "lucide-react";

interface CashflowTx {
  id: number;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  category: string;
  amount: number;
  currency: string;
  description?: string;
  wallet_id?: number;
  wallet_name?: string;
  to_wallet_id?: number;
  to_wallet_name?: string;
  transaction_date: string;
  source: "MANUAL" | "AI_CHAT" | "AI_RECEIPT";
}

interface CashflowSummary {
  total_income: number;
  total_expense: number;
  net_savings: number;
  total_cash_balance: number;
  category_breakdown: { category: string; amount: number; percentage: number }[];
}

interface WalletOption {
  id: number;
  name: string;
  cash_balance: number;
}

const CATEGORY_ICONS: Record<string, any> = {
  MAKANAN: Utensils,
  TRANSPORT: Car,
  GAJI: DollarSign,
  INVESTASI: TrendingUp,
  BELANJA: ShoppingBag,
  TAGIHAN: Receipt,
  HIBURAN: Tv,
  KESEHATAN: HeartPulse,
  PENDIDIKAN: GraduationCap,
  TRANSFER: ArrowLeftRight,
  LAINNYA: HelpCircle,
};

export default function CashflowPage() {
  const [transactions, setTransactions] = useState<CashflowTx[]>([]);
  const [summary, setSummary] = useState<CashflowSummary | null>(null);
  const [wallets, setWallets] = useState<WalletOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Period filtering: defaults to PREVIOUS (September 2026) to immediately show last month's expenses
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 10
  const currentYear = now.getFullYear();   // 2026
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1; // 9
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear; // 2026

  const [periodMode, setPeriodMode] = useState<"PREVIOUS" | "CURRENT" | "ALL">("PREVIOUS");

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal States
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<CashflowTx | null>(null);

  // Manual Form State
  const [formType, setFormType] = useState<"INCOME" | "EXPENSE" | "TRANSFER">("EXPENSE");
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState("MAKANAN");
  const [formWalletId, setFormWalletId] = useState<number | "">("");
  const [formToWalletId, setFormToWalletId] = useState<number | "">("");
  const [formDescription, setFormDescription] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Scan AI State
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanPreviewUrl, setScanPreviewUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3050/api";

  const fetchData = useCallback(async (targetMode: "PREVIOUS" | "CURRENT" | "ALL" = periodMode) => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      let sumUrl = `${API_BASE}/cashflow/summary`;
      if (targetMode === "CURRENT") {
        sumUrl += `?month=${currentMonth}&year=${currentYear}`;
      } else if (targetMode === "PREVIOUS") {
        sumUrl += `?month=${prevMonth}&year=${prevYear}`;
      }

      // Fetch summary
      const sumRes = await fetch(sumUrl, { headers });
      const sumJson = await sumRes.json();
      if (sumJson.status === "success") {
        setSummary(sumJson.data);
      }

      // Fetch transactions (fetch up to 100 recent)
      const txRes = await fetch(`${API_BASE}/cashflow?limit=100`, { headers });
      const txJson = await txRes.json();
      if (txJson.status === "success") {
        setTransactions(txJson.data.transactions || []);
      }

      // Fetch wallets
      const wRes = await fetch(`${API_BASE}/portfolio/wallets`, { headers });
      const wJson = await wRes.json();
      if (wJson.status === "success" && Array.isArray(wJson.data)) {
        setWallets(wJson.data);
        if (wJson.data.length > 0 && formWalletId === "") {
          setFormWalletId(wJson.data[0].id);
        }
      }
    } catch (err) {
      console.error("Gagal mengambil data arus kas:", err);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, token, formWalletId, periodMode, currentMonth, currentYear, prevMonth, prevYear]);

  const handlePeriodChange = (mode: "PREVIOUS" | "CURRENT" | "ALL") => {
    setPeriodMode(mode);
    fetchData(mode);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open Edit Modal
  const handleEdit = (tx: CashflowTx) => {
    setEditingTx(tx);
    setFormType(tx.type);
    setFormAmount(tx.amount.toString());
    setFormCategory(tx.category);
    setFormWalletId(tx.wallet_id || "");
    setFormToWalletId(tx.to_wallet_id || "");
    setFormDescription(tx.description || "");
    setFormDate(new Date(tx.transaction_date).toISOString().split("T")[0]);
    setIsManualModalOpen(true);
  };

  // Delete Transaction
  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus catatan transaksi ini? Saldo dompet akan disesuaikan kembali.")) {
      return;
    }
    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/cashflow/${id}`, {
        method: "DELETE",
        headers,
      });
      const json = await res.json();
      if (json.status === "success") {
        fetchData();
      } else {
        alert(json.message || "Gagal menghapus transaksi");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    }
  };

  // Submit Manual Form
  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formAmount);
    if (!amountNum || amountNum <= 0) {
      alert("Nominal harus berupa angka valid lebih besar dari 0");
      return;
    }

    setFormSubmitting(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const payload = {
        type: formType,
        amount: amountNum,
        category: formCategory,
        wallet_id: formWalletId ? Number(formWalletId) : undefined,
        to_wallet_id: formType === "TRANSFER" && formToWalletId ? Number(formToWalletId) : undefined,
        description: formDescription,
        transaction_date: formDate,
      };

      const url = editingTx
        ? `${API_BASE}/cashflow/${editingTx.id}`
        : `${API_BASE}/cashflow`;
      const method = editingTx ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.status === "success") {
        setIsManualModalOpen(false);
        setEditingTx(null);
        setFormAmount("");
        setFormDescription("");
        fetchData();
      } else {
        alert(json.message || "Gagal menyimpan transaksi");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Receipt Upload & AI Scanning
  const handleScanReceipt = async () => {
    if (!scanFile) return;
    setScanning(true);
    try {
      const formData = new FormData();
      formData.append("receipt", scanFile);

      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/cashflow/scan-receipt`, {
        method: "POST",
        headers,
        body: formData,
      });
      const json = await res.json();
      if (json.status === "success") {
        setScanResult(json.data);
      } else {
        alert(json.message || "AI gagal memindai struk");
      }
    } catch (err: any) {
      alert("Gagal memindai: " + err.message);
    } finally {
      setScanning(false);
    }
  };

  // Confirm and Save AI Scan Result
  const handleConfirmScanResult = async () => {
    if (!scanResult) return;
    setFormSubmitting(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // Find matching wallet or fallback
      let matchedWalletId = wallets[0]?.id;
      if (scanResult.suggested_wallet) {
        const found = wallets.find((w) =>
          w.name.toLowerCase().includes(scanResult.suggested_wallet.toLowerCase())
        );
        if (found) matchedWalletId = found.id;
      }

      const payload = {
        type: scanResult.type || "EXPENSE",
        amount: Number(scanResult.amount),
        category: scanResult.category || "LAINNYA",
        wallet_id: matchedWalletId,
        description: scanResult.merchant_or_notes || "Scan Struk AI",
        source: "AI_RECEIPT",
      };

      const res = await fetch(`${API_BASE}/cashflow`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.status === "success") {
        setIsScanModalOpen(false);
        setScanFile(null);
        setScanPreviewUrl(null);
        setScanResult(null);
        fetchData();
      } else {
        alert(json.message || "Gagal menyimpan hasil scan");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Filter transactions
  const filteredTxs = transactions.filter((tx) => {
    if (typeFilter !== "ALL" && tx.type !== typeFilter) return false;

    // Filter by period
    const txDate = new Date(tx.transaction_date);
    const txMonth = txDate.getMonth() + 1;
    const txYear = txDate.getFullYear();

    if (periodMode === "CURRENT") {
      if (txMonth !== currentMonth || txYear !== currentYear) return false;
    } else if (periodMode === "PREVIOUS") {
      if (txMonth !== prevMonth || txYear !== prevYear) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = tx.description?.toLowerCase().includes(q);
      const matchCat = tx.category.toLowerCase().includes(q);
      const matchWallet = tx.wallet_name?.toLowerCase().includes(q);
      return matchDesc || matchCat || matchWallet;
    }
    return true;
  });

  const periodLabel =
    periodMode === "PREVIOUS"
      ? "Bulan Kemarin (Sep 2026)"
      : periodMode === "CURRENT"
      ? "Bulan Ini (Okt 2026)"
      : "Akumulasi Semua";

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200/80 dark:border-[#30363d] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#3fb950] dark:text-[#3fb950] uppercase tracking-widest">
            <Wallet className="w-4 h-4" />
            Cashflow & Multi-Account Manager
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight mt-1">
            Pencatatan Keuangan & Arus Kas
          </h1>
          <p className="text-sm text-[#8b949e] dark:text-[#8b949e] mt-0.5">
            Pantau pemasukan, pengeluaran harian, dan saldo antar dompet secara manual atau otomatis via AI Gemini.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setScanFile(null);
              setScanPreviewUrl(null);
              setScanResult(null);
              setIsScanModalOpen(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] hover:text-[#f0f6fc] border border-[#30363d] text-xs font-semibold transition"
          >
            <Camera className="w-3.5 h-3.5 text-[#8b949e]" />
            <span>Scan Struk AI</span>
          </button>

          <button
            onClick={() => {
              setEditingTx(null);
              setFormType("EXPENSE");
              setFormAmount("");
              setFormDescription("");
              setIsManualModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-bold border border-[rgba(240,246,252,0.1)] shadow-[0_1px_0_rgba(27,31,36,0.1)] transition active:bg-[#238636]"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>+ Catat Manual</span>
          </button>
        </div>
      </div>

      {/* Period Selector Ribbon - GitHub Box Style */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 rounded-md bg-white dark:bg-[#161b22] border border-zinc-200 dark:border-[#30363d] shadow-[0_1px_0_rgba(27,31,36,0.04)]">
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-[#f0f6fc]">
          <Calendar className="w-4 h-4 text-[#3fb950]" />
          <span>Pilih Periode Laporan:</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { key: "PREVIOUS", label: "â®ï¸ Bulan Kemarin (Sep 2026)", badge: "9 Transaksi" },
            { key: "CURRENT", label: "ðŸ“… Bulan Ini (Okt 2026)", badge: "Bulan Baru" },
            { key: "ALL", label: "ðŸŒ Semua Waktu", badge: "Semua Data" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => handlePeriodChange(tab.key as any)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition whitespace-nowrap border ${
                periodMode === tab.key
                  ? "bg-[#238636] hover:bg-[#2ea043] text-white border-[rgba(240,246,252,0.1)] shadow-[0_1px_0_rgba(27,31,36,0.1)]"
                  : "bg-zinc-100 dark:bg-[#21262d] hover:dark:bg-[#30363d] text-zinc-700 dark:text-[#c9d1d9] hover:dark:text-[#f0f6fc] border-zinc-200 dark:border-[#30363d]"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-medium ${
                periodMode === tab.key ? "bg-[#0d1117] text-white" : "bg-zinc-200 dark:bg-[#30363d] text-[#6e7681] dark:text-[#8b949e]"
              }`}>
                {tab.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards - GitHub Box Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pemasukan */}
        <div className="p-4 rounded-md bg-white dark:bg-[#161b22] border border-zinc-200 dark:border-[#30363d] shadow-[0_1px_0_rgba(27,31,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] dark:text-[#8b949e]">Pemasukan {periodLabel}</span>
            <div className="w-7 h-7 rounded-md bg-[#238636]/15 border border-[#238636]/30 text-[#3fb950] flex items-center justify-center">
              <ArrowDownLeft className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-xl md:text-2xl font-bold font-mono tabular-nums text-[#3fb950] dark:text-[#3fb950]">
            Rp {(summary?.total_income || 0).toLocaleString("id-ID")}
          </div>
          <p className="text-[11px] text-[#8b949e] dark:text-[#8b949e] mt-1">Gaji, rezeki segar & kas masuk</p>
        </div>

        {/* Card 2: Pengeluaran */}
        <div className="p-4 rounded-md bg-white dark:bg-[#161b22] border border-zinc-200 dark:border-[#30363d] shadow-[0_1px_0_rgba(27,31,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] dark:text-[#8b949e]">Pengeluaran {periodLabel}</span>
            <div className="w-7 h-7 rounded-md bg-[#da3633]/15 border border-[#da3633]/30 text-[#f85149] flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-xl md:text-2xl font-bold font-mono tabular-nums text-[#f85149] dark:text-[#f85149]">
            Rp {(summary?.total_expense || 0).toLocaleString("id-ID")}
          </div>
          <p className="text-[11px] text-[#8b949e] dark:text-[#8b949e] mt-1">Investasi, langganan & kebutuhan</p>
        </div>

        {/* Card 3: Tabungan Bersih */}
        <div className="p-4 rounded-md bg-white dark:bg-[#161b22] border border-zinc-200 dark:border-[#30363d] shadow-[0_1px_0_rgba(27,31,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] dark:text-[#8b949e]">Sisa Tabungan Bersih</span>
            <div className="w-7 h-7 rounded-md bg-[#388bfd]/15 border border-[#388bfd]/30 text-[#58a6ff] flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className={`mt-2 text-xl md:text-2xl font-bold font-mono tabular-nums ${
            (summary?.net_savings || 0) >= 0 ? "text-[#58a6ff] dark:text-[#58a6ff]" : "text-[#f85149] dark:text-[#f85149]"
          }`}>
            Rp {(summary?.net_savings || 0).toLocaleString("id-ID")}
          </div>
          <p className="text-[11px] text-[#8b949e] dark:text-[#8b949e] mt-1">Pemasukan dikurangi pengeluaran</p>
        </div>

        {/* Card 4: Total Kas Dompet */}
        <div className="p-4 rounded-md bg-white dark:bg-[#161b22] border border-zinc-200 dark:border-[#30363d] shadow-[0_1px_0_rgba(27,31,36,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] dark:text-[#8b949e]">Total Saldo Kas Likuid</span>
            <div className="w-7 h-7 rounded-md bg-[#8957e5]/15 border border-[#8957e5]/30 text-[#a371f7] flex items-center justify-center">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-xl md:text-2xl font-bold font-mono tabular-nums text-[#a371f7] dark:text-[#a371f7]">
            Rp {(summary?.total_cash_balance || 0).toLocaleString("id-ID")}
          </div>
          <p className="text-[11px] text-[#8b949e] dark:text-[#8b949e] mt-1">BCA, Dompet Tunai, GoPay, DANA</p>
        </div>
      </div>

      {/* Liquid Cash Multi-Wallet Breakdown & Category Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Liquid Wallets Status */}
        <div className="lg:col-span-1 p-4 rounded-md bg-[#161b22] border border-[#30363d] shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-[#30363d] pb-2.5">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#3fb950]" />
              <span className="text-xs font-semibold text-[#f0f6fc] tracking-tight">
                Posisi Kas Likuid Riil
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-[#3fb950]">
              Rp {wallets.filter(w => !['ajaib', 'pluang'].includes(w.name.toLowerCase())).reduce((acc, curr) => acc + Number(curr.cash_balance), 0).toLocaleString("id-ID")}
            </span>
          </div>
          <div className="space-y-1.5 text-xs">
            {wallets.filter(w => !['ajaib', 'pluang'].includes(w.name.toLowerCase())).map((w) => (
              <div key={w.id} className="flex items-center justify-between p-2 rounded-md bg-[#0d1117] border border-[#30363d]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#3fb950]" />
                  <span className="font-medium text-[#c9d1d9]">{w.name}</span>
                </div>
                <span className="font-mono font-bold text-[#f0f6fc]">
                  Rp {Number(w.cash_balance).toLocaleString("id-ID")}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[#8b949e] text-center pt-1">
            Makan &amp; bensin aman ditanggung ortu. Kas operasional &amp; darurat aman terkunci.
          </p>
        </div>

        {/* Category Expense Breakdown */}
        <div className="lg:col-span-2 p-4 rounded-md bg-[#161b22] border border-[#30363d] shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-[#30363d] pb-2.5">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#a371f7]" />
              <span className="text-xs font-semibold text-[#f0f6fc] tracking-tight">
                Rincian Kategori Pengeluaran ({periodLabel})
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-[#f85149]">
              Total Rp {(summary?.total_expense || 0).toLocaleString("id-ID")}
            </span>
          </div>

          {(!summary?.category_breakdown || summary.category_breakdown.length === 0) ? (
            <div className="py-8 text-center text-[#8b949e] space-y-3">
              <p className="text-xs">Tidak ada data pengeluaran pada periode ini.</p>
              {periodMode === "CURRENT" && (
                <button
                  onClick={() => handlePeriodChange("PREVIOUS")}
                  className="px-3 py-1.5 rounded-md bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] text-xs font-medium transition inline-flex items-center gap-2"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-[#58a6ff]" />
                  <span>Lihat Rekap Pengeluaran Bulan Kemarin (September 2026)</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {summary.category_breakdown.map((item) => {
                const IconC = CATEGORY_ICONS[item.category] || HelpCircle;
                return (
                  <div key={item.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <IconC className="w-3.5 h-3.5 text-[#8b949e]" />
                        <span className="font-medium text-[#c9d1d9]">
                          {item.category === "INVESTASI"
                            ? "Investasi Ekuitas (VT ETF Pluang)"
                            : item.category === "TAGIHAN"
                            ? "Tagihan & Langganan (AI Google & Paket Data)"
                            : item.category === "KESEHATAN"
                            ? "Kesehatan & Grooming Diri"
                            : item.category === "MAKANAN"
                            ? "Konsumsi & Makanan"
                            : item.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#f0f6fc]">
                          Rp {item.amount.toLocaleString("id-ID")}
                        </span>
                        <span className="text-[11px] text-[#8b949e] font-mono">
                          ({item.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar (GitHub Language Breakdown Style) */}
                    <div className="w-full h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.category === "INVESTASI"
                            ? "bg-[#3fb950]"
                            : item.category === "TAGIHAN"
                            ? "bg-[#58a6ff]"
                            : item.category === "MAKANAN"
                            ? "bg-[#d29922]"
                            : "bg-[#a371f7]"
                        }`}
                        style={{ width: `${Math.min(item.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Filter & Search Toolbar (GitHub Primer Style) */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-[#161b22] p-3 rounded-md border border-[#30363d] shadow-sm">
        {/* Type Pill Tabs */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { key: "ALL", label: "Semua" },
            { key: "INCOME", label: "Pemasukan (+)" },
            { key: "EXPENSE", label: "Pengeluaran (-)" },
            { key: "TRANSFER", label: "Pindah Saldo (â‡„)" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTypeFilter(tab.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition whitespace-nowrap border ${
                typeFilter === tab.key
                  ? "bg-[#21262d] text-[#f0f6fc] border-[#8b949e] font-semibold"
                  : "bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:bg-[#21262d] hover:text-[#c9d1d9]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-[#8b949e] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari transaksi / keterangan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] rounded-md focus:outline-none focus:border-[#58a6ff]"
          />
        </div>
      </div>

      {/* Transactions Table (GitHub Primer Box) */}
      <div className="bg-[#0d1117] rounded-md border border-[#30363d] overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-[#8b949e] text-sm">
            Memuat data transaksi kas...
          </div>
        ) : filteredTxs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <FileText className="w-8 h-8 mx-auto text-[#8b949e]" />
            <p className="text-sm font-semibold text-[#f0f6fc]">Belum ada riwayat transaksi</p>
            <p className="text-xs text-[#8b949e]">
              Klik tombol "+ Catat Manual" atau "Scan Struk AI" untuk mulai mencatat.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#161b22] text-[#8b949e] border-b border-[#30363d] font-semibold uppercase tracking-wider text-[10px] font-mono">
                <tr>
                  <th className="px-4 py-2.5">Tanggal</th>
                  <th className="px-4 py-2.5">Tipe & Kategori</th>
                  <th className="px-4 py-2.5">Keterangan</th>
                  <th className="px-4 py-2.5">Dompet</th>
                  <th className="px-4 py-2.5 text-right">Nominal</th>
                  <th className="px-4 py-2.5 text-center">Sumber</th>
                  <th className="px-4 py-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#21262d]">
                {filteredTxs.map((tx) => {
                  const IconComp = CATEGORY_ICONS[tx.category] || HelpCircle;
                  const isIncome = tx.type === "INCOME";
                  const isExpense = tx.type === "EXPENSE";
                  const isTransfer = tx.type === "TRANSFER";

                  return (
                    <tr key={tx.id} className="hover:bg-zinc-50/60 dark:hover:bg-[#161b22] transition-colors">
                      {/* Tanggal */}
                      <td className="px-4 py-3 text-[#8b949e] whitespace-nowrap">
                        {new Date(tx.transaction_date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Tipe & Kategori */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-md flex items-center justify-center ${
                            isIncome
                              ? "bg-[#238636]/15 text-[#3fb950]"
                              : isExpense
                              ? "bg-[#da3633]/15 text-[#f85149]"
                              : "bg-[#388bfd]/15 text-[#58a6ff]"
                          }`}>
                            <IconComp className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-bold text-zinc-800 dark:text-[#c9d1d9] block">
                              {tx.category}
                            </span>
                            <span className={`text-[10px] font-bold ${
                              isIncome ? "text-[#3fb950]" : isExpense ? "text-[#f85149]" : "text-[#58a6ff]"
                            }`}>
                              {isIncome ? "Pemasukan" : isExpense ? "Pengeluaran" : "Transfer"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Keterangan */}
                      <td className="px-4 py-3 text-zinc-700 dark:text-[#c9d1d9]">
                        {tx.description || "-"}
                      </td>

                      {/* Dompet */}
                      <td className="px-4 py-3 whitespace-nowrap text-[#6e7681] dark:text-[#8b949e]">
                        {isTransfer ? (
                          <div className="flex items-center gap-1.5 font-medium">
                            <span>{tx.wallet_name || "Kas"}</span>
                            <ArrowLeftRight className="w-3 h-3 text-[#8b949e]" />
                            <span className="text-[#58a6ff] font-bold">{tx.to_wallet_name || "Tujuan"}</span>
                          </div>
                        ) : (
                          <span>{tx.wallet_name || "Kas Umum"}</span>
                        )}
                      </td>

                      {/* Nominal */}
                      <td className="px-4 py-3 text-right font-mono font-bold whitespace-nowrap">
                        <span className={`text-sm ${
                          isIncome
                            ? "text-[#3fb950]"
                            : isExpense
                            ? "text-[#f85149]"
                            : "text-zinc-900 dark:text-[#f0f6fc]"
                        }`}>
                          {isIncome ? "+" : isExpense ? "-" : ""}Rp {Number(tx.amount).toLocaleString("id-ID")}
                        </span>
                      </td>

                      {/* Sumber */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {tx.source === "AI_RECEIPT" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8957e5]/15 text-[#a371f7] border border-[#8957e5]/40">
                            ðŸ“¸ AI Scan
                          </span>
                        ) : tx.source === "AI_CHAT" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#388bfd]/15 text-[#58a6ff] border border-[#388bfd]/40">
                            ðŸ¤– AI Chat
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-500/10 text-[#8b949e] border border-zinc-500/20">
                            âœï¸ Manual
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(tx)}
                            className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-[#161b22] text-[#8b949e] hover:text-[#c9d1d9] transition"
                            title="Edit Transaksi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(tx.id)}
                            className="p-1.5 rounded-md hover:bg-[#da3633]/15 text-[#8b949e] hover:text-[#f85149] transition"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: FORM CATAT MANUAL / EDIT */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d1117] ">
          <div className="w-full max-w-md bg-white dark:bg-[#161b22] dark: rounded-md border border-zinc-200 dark:border-[#30363d] shadow-none p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-[#30363d] pb-3">
              <h3 className="text-base font-bold text-zinc-900 dark:text-[#f0f6fc] flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#3fb950]" />
                {editingTx ? "Edit Transaksi Kas" : "Catat Transaksi Manual"}
              </h3>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="p-1 rounded-md text-[#8b949e] hover:text-[#c9d1d9]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitManual} className="space-y-3.5 text-xs">
              {/* Type Switcher */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-100 dark:bg-[#0d1117] rounded-md">
                {[
                  { key: "EXPENSE", label: "Pengeluaran" },
                  { key: "INCOME", label: "Pemasukan" },
                  { key: "TRANSFER", label: "Pindah Saldo" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setFormType(tab.key as any)}
                    className={`py-2 rounded-md font-bold text-center transition ${
                      formType === tab.key
                        ? tab.key === "INCOME"
                          ? "bg-[#238636]/15 text-white"
                          : tab.key === "EXPENSE"
                          ? "bg-[#da3633]/15 text-white"
                          : "bg-[#388bfd]/15 text-white"
                        : "text-[#8b949e] hover:text-[#c9d1d9]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Nominal Input */}
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-[#c9d1d9] mb-1">
                  Nominal (Rp) <span className="text-[#f85149]">*</span>
                </label>
                <input
                  type="number"
                  placeholder="Contoh: 50000"
                  required
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-100 dark:bg-[#0d1117] border border-zinc-200 dark:border-[#30363d] rounded-md text-sm font-bold focus:outline-none focus:ring-1 focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
                />
                {/* Quick Chips */}
                <div className="flex items-center gap-1.5 mt-1.5">
                  {[20000, 50000, 100000, 500000, 1000000].map((quick) => (
                    <button
                      key={quick}
                      type="button"
                      onClick={() => setFormAmount(quick.toString())}
                      className="px-2 py-0.5 text-[10px] font-mono rounded bg-zinc-200/60 dark:bg-[#161b22] text-[#6e7681] dark:text-[#c9d1d9] hover:bg-zinc-300 dark:hover:bg-[#21262d]"
                    >
                      {quick >= 1000000 ? `${quick / 1000000}jt` : `${quick / 1000}rb`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dompet Asal */}
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-[#c9d1d9] mb-1">
                  {formType === "TRANSFER" ? "Dompet Asal (Sumber Dana)" : "Pilih Dompet / Rekening"}
                </label>
                <select
                  value={formWalletId}
                  onChange={(e) => setFormWalletId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-100 dark:bg-[#0d1117] border border-zinc-200 dark:border-[#30363d] rounded-md focus:outline-none focus:ring-1 focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} (Saldo: Rp {Number(w.cash_balance).toLocaleString("id-ID")})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dompet Tujuan (Khusus Transfer) */}
              {formType === "TRANSFER" && (
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-[#c9d1d9] mb-1">
                    Dompet Tujuan <span className="text-[#f85149]">*</span>
                  </label>
                  <select
                    value={formToWalletId}
                    onChange={(e) => setFormToWalletId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-100 dark:bg-[#0d1117] border border-zinc-200 dark:border-[#30363d] rounded-md focus:outline-none focus:ring-1 focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
                  >
                    <option value="">-- Pilih Dompet Tujuan --</option>
                    {wallets
                      .filter((w) => w.id !== Number(formWalletId))
                      .map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Kategori (Khusus Income & Expense) */}
              {formType !== "TRANSFER" && (
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-[#c9d1d9] mb-1">
                    Kategori Transaksi
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-100 dark:bg-[#0d1117] border border-zinc-200 dark:border-[#30363d] rounded-md focus:outline-none focus:ring-1 focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
                  >
                    <option value="MAKANAN">Makanan & Minuman</option>
                    <option value="TRANSPORT">Transportasi / Bensin</option>
                    <option value="GAJI">Gaji & Pemasukan Tetap</option>
                    <option value="INVESTASI">Investasi & Dividen</option>
                    <option value="BELANJA">Belanja Kebutuhan</option>
                    <option value="TAGIHAN">Tagihan & Langganan</option>
                    <option value="HIBURAN">Hiburan / Liburan</option>
                    <option value="KESEHATAN">Kesehatan & Medis</option>
                    <option value="PENDIDIKAN">Pendidikan & Buku</option>
                    <option value="LAINNYA">Lain-lain</option>
                  </select>
                </div>
              )}

              {/* Keterangan & Tanggal */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-[#c9d1d9] mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-100 dark:bg-[#0d1117] border border-zinc-200 dark:border-[#30363d] rounded-md focus:outline-none focus:ring-1 focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-[#c9d1d9] mb-1">Keterangan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Makan siang"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-100 dark:bg-[#0d1117] border border-zinc-200 dark:border-[#30363d] rounded-md focus:outline-none focus:ring-1 focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="w-full py-2.5 rounded-md bg-[#238636]/15 hover:bg-[#238636]/15 text-white font-bold text-xs transition shadow-md disabled:opacity-50"
                >
                  {formSubmitting ? "Menyimpan..." : editingTx ? "Simpan Perubahan" : "Simpan Transaksi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SCAN STRUK AI (GEMINI MULTIMODAL) */}
      {isScanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d1117] ">
          <div className="w-full max-w-md bg-white dark:bg-[#161b22] dark: rounded-md border border-zinc-200 dark:border-[#30363d] shadow-none p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-[#30363d] pb-3">
              <h3 className="text-base font-bold text-zinc-900 dark:text-[#f0f6fc] flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#a371f7]" />
                Scan Bukti Transfer / Struk AI
              </h3>
              <button
                onClick={() => setIsScanModalOpen(false)}
                className="p-1 rounded-md text-[#8b949e] hover:text-[#c9d1d9]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Dropzone / File Picker */}
              {!scanPreviewUrl ? (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-300 dark:border-[#30363d] hover:border-[#8957e5]/40 rounded-md p-8 cursor-pointer transition text-center space-y-2 bg-zinc-50 dark:bg-[#0d1117]">
                  <UploadCloud className="w-8 h-8 text-[#a371f7] animate-bounce" />
                  <span className="font-bold text-zinc-800 dark:text-[#c9d1d9]">
                    Upload Screenshot Struk / m-Banking
                  </span>
                  <span className="text-[11px] text-[#8b949e]">
                    Mendukung format PNG, JPG, JPEG (GoPay, m-BCA, ShopeePay, Nota)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setScanFile(f);
                        setScanPreviewUrl(URL.createObjectURL(f));
                      }
                    }}
                  />
                </label>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-md overflow-hidden border border-zinc-200 dark:border-[#30363d] max-h-48 flex items-center justify-center bg-[#0d1117]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={scanPreviewUrl} alt="Preview Struk" className="object-contain max-h-48" />
                    <button
                      onClick={() => {
                        setScanFile(null);
                        setScanPreviewUrl(null);
                        setScanResult(null);
                      }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-[#0d1117] text-white hover:bg-[#0d1117]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {!scanResult && (
                    <button
                      type="button"
                      disabled={scanning}
                      onClick={handleScanReceipt}
                      className="w-full py-2.5 rounded-md bg-[#8957e5]/15 hover:bg-[#8957e5]/15 text-white font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                      {scanning ? (
                        <>
                          <Sparkles className="w-4 h-4 animate-spin text-[#a371f7]" />
                          <span>Gemini AI sedang membaca struk...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-[#a371f7]" />
                          <span>Pindai Gambar dengan Gemini AI</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* AI Detection Result Confirmation Box */}
              {scanResult && (
                <div className="p-3.5 rounded-md bg-[#8957e5]/15 border border-[#8957e5]/40 space-y-2">
                  <div className="flex items-center gap-1.5 text-[#a371f7] font-bold uppercase tracking-wider text-[10px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Hasil Pembacaan Gemini AI
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#8b949e]">Total Terbaca:</span>
                      <span className="font-mono font-bold text-[#3fb950]">
                        Rp {Number(scanResult.amount).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8b949e]">Merchant / Info:</span>
                      <span className="font-semibold text-[#c9d1d9]">{scanResult.merchant_or_notes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8b949e]">Kategori:</span>
                      <span className="font-semibold text-[#c9d1d9]">{scanResult.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8b949e]">Perkiraan Dompet:</span>
                      <span className="font-semibold text-[#c9d1d9]">{scanResult.suggested_wallet || "Kas Umum"}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleConfirmScanResult}
                    disabled={formSubmitting}
                    className="w-full mt-2 py-2 rounded-md bg-[#238636]/15 hover:bg-[#238636]/15 text-white font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{formSubmitting ? "Menyimpan..." : "Konfirmasi & Simpan ke Kas"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


