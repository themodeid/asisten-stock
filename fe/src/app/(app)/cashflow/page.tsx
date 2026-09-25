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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // Fetch summary
      const sumRes = await fetch(`${API_BASE}/cashflow/summary`, { headers });
      const sumJson = await sumRes.json();
      if (sumJson.status === "success") {
        setSummary(sumJson.data);
      }

      // Fetch transactions
      const txRes = await fetch(`${API_BASE}/cashflow`, { headers });
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
  }, [API_BASE, token, formWalletId]);

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
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = tx.description?.toLowerCase().includes(q);
      const matchCat = tx.category.toLowerCase().includes(q);
      const matchWallet = tx.wallet_name?.toLowerCase().includes(q);
      return matchDesc || matchCat || matchWallet;
    }
    return true;
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200/80 dark:border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest">
            <Wallet className="w-4 h-4" />
            Cashflow & Multi-Account Manager
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight mt-1">
            Pencatatan Keuangan & Arus Kas
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
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
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30 text-xs md:text-sm font-bold transition shadow-sm"
          >
            <Camera className="w-4 h-4 text-purple-500" />
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs md:text-sm font-bold transition shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>+ Catat Manual</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pemasukan */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c101d]/60 dark:backdrop-blur-2xl border border-zinc-200 dark:border-white/[0.08] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Pemasukan Bulan Ini</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            Rp {(summary?.total_income || 0).toLocaleString("id-ID")}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Gaji, dividen & kas masuk</p>
        </div>

        {/* Card 2: Pengeluaran */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c101d]/60 dark:backdrop-blur-2xl border border-zinc-200 dark:border-white/[0.08] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Pengeluaran Bulan Ini</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl md:text-2xl font-black text-rose-600 dark:text-rose-400">
            Rp {(summary?.total_expense || 0).toLocaleString("id-ID")}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Kebutuhan harian & belanja</p>
        </div>

        {/* Card 3: Tabungan Bersih */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c101d]/60 dark:backdrop-blur-2xl border border-zinc-200 dark:border-white/[0.08] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Sisa Tabungan Bersih</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className={`mt-2 text-xl md:text-2xl font-black ${
            (summary?.net_savings || 0) >= 0 ? "text-blue-600 dark:text-blue-400" : "text-rose-500"
          }`}>
            Rp {(summary?.net_savings || 0).toLocaleString("id-ID")}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Pemasukan dikurangi pengeluaran</p>
        </div>

        {/* Card 4: Total Kas Dompet */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c101d]/60 dark:backdrop-blur-2xl border border-zinc-200 dark:border-white/[0.08] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Saldo Kas (Dompet)</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl md:text-2xl font-black text-purple-600 dark:text-purple-400">
            Rp {(summary?.total_cash_balance || 0).toLocaleString("id-ID")}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">Akumulasi seluruh bank & e-wallet</p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white dark:bg-[#0c101d]/60 dark:backdrop-blur-2xl p-3 rounded-2xl border border-zinc-200 dark:border-white/[0.08]">
        {/* Type Pill Tabs */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { key: "ALL", label: "Semua" },
            { key: "INCOME", label: "Pemasukan (+)" },
            { key: "EXPENSE", label: "Pengeluaran (-)" },
            { key: "TRANSFER", label: "Pindah Saldo (⇄)" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTypeFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                typeFilter === tab.key
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari deskripsi / kategori / dompet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/[0.08] rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-[#0c101d]/60 dark:backdrop-blur-2xl rounded-2xl border border-zinc-200 dark:border-white/[0.08] overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 text-sm animate-pulse">
            Memuat data transaksi kas...
          </div>
        ) : filteredTxs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <FileText className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-600" />
            <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">Belum ada riwayat transaksi</p>
            <p className="text-xs text-zinc-400">
              Klik tombol "+ Catat Manual" atau "Scan Struk AI" untuk mulai mencatat.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-900/40 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-white/[0.08] font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Tipe & Kategori</th>
                  <th className="px-4 py-3">Keterangan</th>
                  <th className="px-4 py-3">Dompet</th>
                  <th className="px-4 py-3 text-right">Nominal</th>
                  <th className="px-4 py-3 text-center">Sumber</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-white/[0.06]">
                {filteredTxs.map((tx) => {
                  const IconComp = CATEGORY_ICONS[tx.category] || HelpCircle;
                  const isIncome = tx.type === "INCOME";
                  const isExpense = tx.type === "EXPENSE";
                  const isTransfer = tx.type === "TRANSFER";

                  return (
                    <tr key={tx.id} className="hover:bg-zinc-50/60 dark:hover:bg-white/[0.03] transition-colors">
                      {/* Tanggal */}
                      <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                        {new Date(tx.transaction_date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Tipe & Kategori */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            isIncome
                              ? "bg-emerald-500/10 text-emerald-500"
                              : isExpense
                              ? "bg-rose-500/10 text-rose-500"
                              : "bg-blue-500/10 text-blue-500"
                          }`}>
                            <IconComp className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-bold text-zinc-800 dark:text-zinc-200 block">
                              {tx.category}
                            </span>
                            <span className={`text-[10px] font-bold ${
                              isIncome ? "text-emerald-500" : isExpense ? "text-rose-500" : "text-blue-500"
                            }`}>
                              {isIncome ? "Pemasukan" : isExpense ? "Pengeluaran" : "Transfer"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Keterangan */}
                      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                        {tx.description || "-"}
                      </td>

                      {/* Dompet */}
                      <td className="px-4 py-3 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                        {isTransfer ? (
                          <div className="flex items-center gap-1.5 font-medium">
                            <span>{tx.wallet_name || "Kas"}</span>
                            <ArrowLeftRight className="w-3 h-3 text-zinc-400" />
                            <span className="text-blue-400 font-bold">{tx.to_wallet_name || "Tujuan"}</span>
                          </div>
                        ) : (
                          <span>{tx.wallet_name || "Kas Umum"}</span>
                        )}
                      </td>

                      {/* Nominal */}
                      <td className="px-4 py-3 text-right font-mono font-bold whitespace-nowrap">
                        <span className={`text-sm ${
                          isIncome
                            ? "text-emerald-500"
                            : isExpense
                            ? "text-rose-500"
                            : "text-zinc-900 dark:text-zinc-100"
                        }`}>
                          {isIncome ? "+" : isExpense ? "-" : ""}Rp {Number(tx.amount).toLocaleString("id-ID")}
                        </span>
                      </td>

                      {/* Sumber */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {tx.source === "AI_RECEIPT" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                            📸 AI Scan
                          </span>
                        ) : tx.source === "AI_CHAT" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                            🤖 AI Chat
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                            ✏️ Manual
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(tx)}
                            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
                            title="Edit Transaksi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(tx.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-[#0c101d]/90 dark:backdrop-blur-2xl rounded-2xl border border-zinc-200 dark:border-white/[0.12] shadow-2xl p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.08] pb-3">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-500" />
                {editingTx ? "Edit Transaksi Kas" : "Catat Transaksi Manual"}
              </h3>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitManual} className="space-y-3.5 text-xs">
              {/* Type Switcher */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl">
                {[
                  { key: "EXPENSE", label: "Pengeluaran" },
                  { key: "INCOME", label: "Pemasukan" },
                  { key: "TRANSFER", label: "Pindah Saldo" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setFormType(tab.key as any)}
                    className={`py-2 rounded-lg font-bold text-center transition ${
                      formType === tab.key
                        ? tab.key === "INCOME"
                          ? "bg-emerald-600 text-white"
                          : tab.key === "EXPENSE"
                          ? "bg-rose-600 text-white"
                          : "bg-blue-600 text-white"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Nominal Input */}
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Nominal (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="Contoh: 50000"
                  required
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/[0.08] rounded-xl text-sm font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {/* Quick Chips */}
                <div className="flex items-center gap-1.5 mt-1.5">
                  {[20000, 50000, 100000, 500000, 1000000].map((quick) => (
                    <button
                      key={quick}
                      type="button"
                      onClick={() => setFormAmount(quick.toString())}
                      className="px-2 py-0.5 text-[10px] font-mono rounded bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700"
                    >
                      {quick >= 1000000 ? `${quick / 1000000}jt` : `${quick / 1000}rb`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dompet Asal */}
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  {formType === "TRANSFER" ? "Dompet Asal (Sumber Dana)" : "Pilih Dompet / Rekening"}
                </label>
                <select
                  value={formWalletId}
                  onChange={(e) => setFormWalletId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/[0.08] rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Dompet Tujuan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formToWalletId}
                    onChange={(e) => setFormToWalletId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/[0.08] rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Kategori Transaksi
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/[0.08] rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/[0.08] rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Keterangan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Makan siang"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/[0.08] rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-[#0c101d]/90 dark:backdrop-blur-2xl rounded-2xl border border-zinc-200 dark:border-white/[0.12] shadow-2xl p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.08] pb-3">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Camera className="w-4 h-4 text-purple-500" />
                Scan Bukti Transfer / Struk AI
              </h3>
              <button
                onClick={() => setIsScanModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Dropzone / File Picker */}
              {!scanPreviewUrl ? (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-300 dark:border-white/[0.15] hover:border-purple-500 rounded-2xl p-8 cursor-pointer transition text-center space-y-2 bg-zinc-50 dark:bg-zinc-900/40">
                  <UploadCloud className="w-8 h-8 text-purple-400 animate-bounce" />
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    Upload Screenshot Struk / m-Banking
                  </span>
                  <span className="text-[11px] text-zinc-400">
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
                  <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-white/[0.1] max-h-48 flex items-center justify-center bg-zinc-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={scanPreviewUrl} alt="Preview Struk" className="object-contain max-h-48" />
                    <button
                      onClick={() => {
                        setScanFile(null);
                        setScanPreviewUrl(null);
                        setScanResult(null);
                      }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {!scanResult && (
                    <button
                      type="button"
                      disabled={scanning}
                      onClick={handleScanReceipt}
                      className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                      {scanning ? (
                        <>
                          <Sparkles className="w-4 h-4 animate-spin text-purple-200" />
                          <span>Gemini AI sedang membaca struk...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-purple-200" />
                          <span>Pindai Gambar dengan Gemini AI</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* AI Detection Result Confirmation Box */}
              {scanResult && (
                <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-2">
                  <div className="flex items-center gap-1.5 text-purple-400 font-bold uppercase tracking-wider text-[10px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Hasil Pembacaan Gemini AI
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Total Terbaca:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        Rp {Number(scanResult.amount).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Merchant / Info:</span>
                      <span className="font-semibold text-zinc-200">{scanResult.merchant_or_notes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Kategori:</span>
                      <span className="font-semibold text-zinc-200">{scanResult.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Perkiraan Dompet:</span>
                      <span className="font-semibold text-zinc-200">{scanResult.suggested_wallet || "Kas Umum"}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleConfirmScanResult}
                    disabled={formSubmitting}
                    className="w-full mt-2 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
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
