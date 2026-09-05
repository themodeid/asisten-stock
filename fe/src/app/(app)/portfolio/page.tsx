"use client";

import { useEffect, useState, useRef } from "react";
import Header from "@/components/layout/Header";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { api, formatIDR, formatPercent } from "@/services/api";
import {
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  Download,
  Printer,
  Camera,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Coins,
  Layers,
  Activity,
  Calendar,
  PieChart,
  Scale,
  Receipt,
  Info,
  Sliders,
  Check,
  Globe,
  DollarSign,
  FileText,
  ShieldAlert,
} from "lucide-react";
import { AssetType } from "@/types";
import PortfolioChartCard from "@/components/portfolio/PortfolioChartCard";

export default function PortfolioPage() {
  const [mainTab, setMainTab] = useState<"HOLDINGS" | "FX" | "REBALANCE" | "TAX" | "HEALTH" | "DIVIDENDS">("HOLDINGS");
  const [portfolio, setPortfolio] = useState<any>(null);
  const [healthData, setHealthData] = useState<any>(null);
  const [dividendData, setDividendData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filter tab for holdings
  const [activeAssetFilter, setActiveAssetFilter] = useState<"ALL" | AssetType>("ALL");

  // Modals
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Form state for manual transaction
  const [assetType, setAssetType] = useState<AssetType>("STOCK");
  const [ticker, setTicker] = useState("");
  const [type, setType] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<"IDR" | "USD">("IDR");
  const [notes, setNotes] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 16));
  const [submitting, setSubmitting] = useState(false);

  // OCR state
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrPreview, setOcrPreview] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Rebalance State
  const [rebalanceStrategy, setRebalanceStrategy] = useState<string>("BALANCED_GROWTH");
  const [freshCapitalInput, setFreshCapitalInput] = useState<string>("2000000");
  const [rebalancePlan, setRebalancePlan] = useState<any>(null);
  const [rebalanceLoading, setRebalanceLoading] = useState(false);

  // Tax Simulation State
  const [taxSelectedTicker, setTaxSelectedTicker] = useState<string>("BTC");
  const [taxAssetType, setTaxAssetType] = useState<AssetType>("CRYPTO");
  const [taxQuantity, setTaxQuantity] = useState<string>("0.002");
  const [taxSellPrice, setTaxSellPrice] = useState<string>("1450000000");
  const [taxIsRegistered, setTaxIsRegistered] = useState<boolean>(true);
  const [taxHasNpwp, setTaxHasNpwp] = useState<boolean>(true);
  const [taxSimResult, setTaxSimResult] = useState<any>(null);
  const [taxSummary, setTaxSummary] = useState<any>(null);
  const [taxSimLoading, setTaxSimLoading] = useState<boolean>(false);

  // FX Dual-Return Analytics State
  const [fxData, setFxData] = useState<any>(null);
  const [fxLoading, setFxLoading] = useState<boolean>(false);

  const fetchAllPortfolioData = async () => {
    try {
      setLoading(true);
      const [sumRes, healthRes, divRes] = await Promise.allSettled([
        api.get("/portfolio/summary/1"),
        api.get("/portfolio/health/1"),
        api.get("/portfolio/dividends/1"),
      ]);

      if (sumRes.status === "fulfilled" && sumRes.value.data?.data) {
        setPortfolio(sumRes.value.data.data);
      }
      if (healthRes.status === "fulfilled" && healthRes.value.data?.data) {
        setHealthData(healthRes.value.data.data);
      }
      if (divRes.status === "fulfilled" && divRes.value.data?.data) {
        setDividendData(divRes.value.data.data);
      }
    } catch (err) {
      console.warn("Failed fetching portfolio data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRebalanceData = async (strat = rebalanceStrategy, cash = Number(freshCapitalInput) || 2000000) => {
    try {
      setRebalanceLoading(true);
      const res = await api.post("/portfolio/rebalance", {
        portfolio_id: 1,
        strategy_name: strat,
        fresh_capital_idr: cash,
      });
      if (res.data?.data) {
        setRebalancePlan(res.data.data);
      }
    } catch (err) {
      console.warn("Failed fetching rebalance plan:", err);
    } finally {
      setRebalanceLoading(false);
    }
  };

  const fetchTaxSummary = async () => {
    try {
      const res = await api.get("/portfolio/tax-summary/1");
      if (res.data?.data) {
        setTaxSummary(res.data.data);
      }
    } catch (err) {
      console.warn("Failed fetching tax summary:", err);
    }
  };

  const runTaxSimulation = async () => {
    try {
      setTaxSimLoading(true);
      const res = await api.post("/portfolio/tax-simulate", {
        portfolio_id: 1,
        ticker: taxSelectedTicker,
        asset_type: taxAssetType,
        sell_quantity: Number(taxQuantity) || undefined,
        sell_price: Number(taxSellPrice) || undefined,
        is_registered_exchanger: taxIsRegistered,
        has_npwp: taxHasNpwp,
      });
      if (res.data?.data) {
        setTaxSimResult(res.data.data);
      }
    } catch (err) {
      console.warn("Failed simulating tax:", err);
    } finally {
      setTaxSimLoading(false);
    }
  };

  const fetchFxData = async () => {
    try {
      setFxLoading(true);
      const res = await api.get("/portfolio/fx-analytics/1");
      if (res.data?.data) {
        setFxData(res.data.data);
      }
    } catch (err) {
      console.warn("Failed fetching FX analytics:", err);
    } finally {
      setFxLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPortfolioData();

    // Check URL query parameters
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "fx") setMainTab("FX");
      if (tabParam === "rebalance") setMainTab("REBALANCE");
      if (tabParam === "tax") setMainTab("TAX");
      if (tabParam === "health") setMainTab("HEALTH");
      if (tabParam === "dividends") setMainTab("DIVIDENDS");
    }
  }, []);

  useEffect(() => {
    if (mainTab === "FX") {
      fetchFxData();
    } else if (mainTab === "REBALANCE") {
      fetchRebalanceData();
    } else if (mainTab === "TAX") {
      fetchTaxSummary();
      runTaxSimulation();
    }
  }, [mainTab]);

  const handleSelectHoldingForTax = (h: any) => {
    setTaxSelectedTicker(h.ticker);
    setTaxAssetType(h.asset_type || "STOCK");
    if (h.asset_type === "STOCK") {
      setTaxQuantity(String(h.total_lots || 1));
      setTaxSellPrice(String(h.current_price || h.avg_buy_price || 9500));
    } else {
      setTaxQuantity(String(h.quantity || 0.001));
      const priceIdr = h.currency === "USD" ? (h.current_price || h.avg_buy_price || 85000) * 15800 : (h.current_price || h.avg_buy_price || 1400000);
      setTaxSellPrice(String(priceIdr));
    }
  };

  const handleAssetTypeChange = (newType: AssetType) => {
    setAssetType(newType);
    if (newType === "CRYPTO" || newType === "ETF") {
      setCurrency("USD");
    } else {
      setCurrency("IDR");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker || !quantity || !price) return;

    try {
      setSubmitting(true);
      const isStock = assetType === "STOCK";
      await api.post("/transactions", {
        portfolio_id: portfolio?.portfolio_id || 1,
        ticker,
        asset_type: assetType,
        type,
        lots: isStock ? Number(quantity) : undefined,
        quantity: isStock ? undefined : Number(quantity),
        price_per_share: Number(price),
        currency,
        notes,
        transaction_date: txDate ? new Date(txDate).toISOString() : undefined,
      });
      setIsTxModalOpen(false);
      setTicker("");
      setQuantity("");
      setPrice("");
      setNotes("");
      fetchAllPortfolioData();
      if (mainTab === "FX") fetchFxData();
      if (mainTab === "REBALANCE") fetchRebalanceData();
      if (mainTab === "TAX") {
        fetchTaxSummary();
        runTaxSimulation();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal mencatat transaksi");
    } finally {
      setSubmitting(false);
    }
  };

  // OCR Upload handler
  const handleOcrFileSelect = (file: File) => {
    setOcrFile(file);
    setOcrResult(null);
    const reader = new FileReader();
    reader.onload = () => {
      setOcrPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleOcrProcess = async () => {
    if (!ocrFile) return;
    try {
      setOcrLoading(true);
      const formData = new FormData();
      formData.append("image", ocrFile);
      formData.append("portfolio_id", "1");

      const res = await api.post("/gemini/ocr-transaction", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.data) {
        setOcrResult(res.data.data);
        fetchAllPortfolioData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal memproses struk transaksi dengan AI.");
    } finally {
      setOcrLoading(false);
    }
  };

  const handleExportCsv = () => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3050/api";
    window.open(`${backendUrl}/portfolio/export/1?format=csv`, "_blank");
  };

  const filteredHoldings = (portfolio?.holdings || []).filter((h: any) => {
    if (activeAssetFilter === "ALL") return true;
    return (h.asset_type || "STOCK") === activeAssetFilter;
  });

  const getUnitLabel = (type: AssetType) => {
    switch (type) {
      case "STOCK":
        return "JUMLAH LOT (1 Lot = 100 lembar)";
      case "CRYPTO":
        return "JUMLAH UNIT / KOIN (misal: 0.05 BTC)";
      case "GOLD":
        return "BERAT (GRAM)";
      case "BOND":
        return "NOMINAL / UNIT (Rp)";
      case "ETF":
      case "MUTUAL_FUND":
        return "JUMLAH UNIT PENYERTAAN";
      default:
        return "JUMLAH KUANTITAS";
    }
  };

  const getTickerPlaceholder = (type: AssetType) => {
    switch (type) {
      case "STOCK":
        return "Contoh: BBCA, BBRI, AAPL";
      case "CRYPTO":
        return "Contoh: BTC, ETH, SOL, USDT";
      case "GOLD":
        return "Contoh: EMAS, ANTAM, UBS";
      case "BOND":
        return "Contoh: ORI024, SR019, FR0096";
      case "ETF":
        return "Contoh: SPY, QQQ, VOO, VT";
      case "MUTUAL_FUND":
        return "Contoh: RDPU SUCOR, RDPT MANULIFE";
      default:
        return "Kode Simbol / Nama Aset";
    }
  };

  const formatPriceVal = (val: number, cur?: string) => {
    if (cur === "USD") return `$${Number(val || 0).toLocaleString()}`;
    return formatIDR(val || 0);
  };

  return (
    <div className="flex-1 flex flex-col">
      <Header title="Pusat Portofolio & Wealth Management" />

      <main className="p-3.5 sm:p-5 md:p-8 space-y-5 sm:space-y-6 max-w-7xl w-full mx-auto">
        {/* Top Header Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              {portfolio?.portfolio_name || "Portofolio Utama"}
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-normal border border-zinc-700">
                {portfolio?.holdings_count || 0} Instrumen
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Total Investasi: <span className="text-zinc-200 font-semibold">{formatIDR(portfolio?.total_invested || 0)}</span> | Nilai Live: <span className="text-emerald-400 font-semibold">{formatIDR(portfolio?.total_market_value ?? portfolio?.total_value ?? 0)}</span> | Kas: <span className="text-zinc-200 font-medium">{formatIDR(portfolio?.cash_balance || 0)}</span>
            </p>
          </div>

          {/* Action Hub */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                fetchAllPortfolioData();
                if (mainTab === "FX") fetchFxData();
                if (mainTab === "REBALANCE") fetchRebalanceData();
                if (mainTab === "TAX") {
                  fetchTaxSummary();
                  runTaxSimulation();
                }
              }}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border border-zinc-700 transition"
              title="Refresh Data & Quotes"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            {/* OCR Struk Button */}
            <button
              onClick={() => {
                setOcrFile(null);
                setOcrPreview(null);
                setOcrResult(null);
                setIsOcrModalOpen(true);
              }}
              className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700 text-xs font-medium transition flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5 text-zinc-300" />
              Scan Struk (OCR)
            </button>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCsv}
              className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700 text-xs font-medium transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-zinc-300" />
              Export CSV
            </button>

            {/* Executive Factsheet Button */}
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="px-3 py-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/80 text-xs font-semibold transition flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-300" />
              Factsheet Eksekutif (PDF)
            </button>

            {/* Catat Transaksi Button */}
            <button
              onClick={() => setIsTxModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold text-xs shadow-sm transition flex items-center gap-1.5 active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 text-zinc-900" />
              Catat Transaksi
            </button>
          </div>
        </div>

        {/* Reku-Style Glowing Line Portfolio Chart */}
        <PortfolioChartCard
          portfolioId={portfolio?.portfolio_id || 1}
          totalNetWorth={portfolio?.total_market_value ?? portfolio?.total_value ?? 0}
          totalInvested={portfolio?.total_invested || 0}
          cashBalance={portfolio?.cash_balance || 0}
        />

        {/* Primary View Switcher */}
        <div className="flex border-b border-zinc-800 gap-2 sm:gap-6 text-xs sm:text-sm font-medium overflow-x-auto pb-0.5">
          <button
            onClick={() => setMainTab("HOLDINGS")}
            className={`pb-3 flex items-center gap-1.5 sm:gap-2 border-b-2 transition whitespace-nowrap ${
              mainTab === "HOLDINGS"
                ? "border-zinc-100 text-zinc-100 font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Layers className="w-4 h-4" />
            Daftar Aset & Alokasi
          </button>

          <button
            onClick={() => setMainTab("FX")}
            className={`pb-3 flex items-center gap-1.5 sm:gap-2 border-b-2 transition whitespace-nowrap ${
              mainTab === "FX"
                ? "border-zinc-100 text-zinc-100 font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Globe className="w-4 h-4 text-blue-400" />
            Analisis Kurs USD/IDR
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 font-bold border border-blue-800/60">
              Double Gain
            </span>
          </button>

          <button
            onClick={() => setMainTab("REBALANCE")}
            className={`pb-3 flex items-center gap-1.5 sm:gap-2 border-b-2 transition whitespace-nowrap ${
              mainTab === "REBALANCE"
                ? "border-zinc-100 text-zinc-100 font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Scale className="w-4 h-4 text-emerald-400" />
            Kalkulator Rebalancing & Modal Baru
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-800/60">
              Inflow AI
            </span>
          </button>

          <button
            onClick={() => setMainTab("TAX")}
            className={`pb-3 flex items-center gap-1.5 sm:gap-2 border-b-2 transition whitespace-nowrap ${
              mainTab === "TAX"
                ? "border-zinc-100 text-zinc-100 font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Receipt className="w-4 h-4 text-amber-400" />
            Kalkulator Pajak Indonesia
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 font-bold border border-amber-800/60">
              PPh Final & SPT
            </span>
          </button>

          <button
            onClick={() => setMainTab("HEALTH")}
            className={`pb-3 flex items-center gap-1.5 sm:gap-2 border-b-2 transition whitespace-nowrap ${
              mainTab === "HEALTH"
                ? "border-zinc-100 text-zinc-100 font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            Health Score
            {healthData?.health_score !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                healthData.health_score >= 70 ? "bg-emerald-950 text-emerald-300" : "bg-amber-950 text-amber-300"
              }`}>
                {healthData.health_score}
              </span>
            )}
          </button>

          <button
            onClick={() => setMainTab("DIVIDENDS")}
            className={`pb-3 flex items-center gap-1.5 sm:gap-2 border-b-2 transition whitespace-nowrap ${
              mainTab === "DIVIDENDS"
                ? "border-zinc-100 text-zinc-100 font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-400" />
            Kalender Dividen
          </button>
        </div>

        {/* TAB 1: HOLDINGS & ALLOCATION */}
        {mainTab === "HOLDINGS" && (
          <div className="space-y-6">
            {/* Asset Class Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              {[
                { key: "ALL", label: "SEMUA ASET" },
                { key: "STOCK", label: "SAHAM (IDX)" },
                { key: "CRYPTO", label: "KRIPTO" },
                { key: "ETF", label: "ETF" },
                { key: "BOND", label: "OBLIGASI / SBN" },
                { key: "GOLD", label: "EMAS" },
                { key: "MUTUAL_FUND", label: "REKSADANA" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveAssetFilter(tab.key as any)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
                    activeAssetFilter === tab.key
                      ? "bg-zinc-100 text-zinc-900 font-semibold shadow-sm"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Holdings Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-850 border-b border-zinc-800 text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-6">KELAS ASET & SIMBOL</th>
                      <th className="py-3 px-4">KUANTITAS / UNIT</th>
                      <th className="py-3 px-4">AVG BUY</th>
                      <th className="py-3 px-4">HARGA PASAR</th>
                      <th className="py-3 px-4">TOTAL MODAL</th>
                      <th className="py-3 px-4">NILAI PASAR</th>
                      <th className="py-3 px-4">FLOATING P/L</th>
                      <th className="py-3 px-6 text-right">BOBOT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80">
                    {filteredHoldings.length > 0 ? (
                      filteredHoldings.map((h: any) => {
                        const isUp = (h.floating_pnl || 0) >= 0;
                        const aType = h.asset_type || "STOCK";
                        const isStock = aType === "STOCK";
                        const investedIdr =
                          h.total_invested_idr ??
                          (h.currency === "USD" ? h.total_invested * 15800 : h.total_invested);
                        const marketValIdr =
                          h.market_value_idr ??
                          (h.currency === "USD"
                            ? (h.market_value || h.total_invested) * 15800
                            : h.market_value || h.total_invested);

                        return (
                          <tr
                            key={`${h.ticker}-${aType}`}
                            className="hover:bg-zinc-800/40 transition"
                          >
                            <td className="py-3.5 px-6">
                              <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                                  {aType}
                                </span>
                                <div className="font-semibold text-zinc-100 text-sm">
                                  {h.ticker}
                                </div>
                              </div>
                              <div className="text-[11px] text-zinc-400 truncate max-w-[180px] mt-0.5">
                                {h.company_name}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-zinc-200">
                              {isStock ? (
                                <>
                                  {h.total_lots} Lot
                                  <div className="text-[10px] text-zinc-500 font-normal">
                                    {h.total_shares || h.quantity} lembar
                                  </div>
                                </>
                              ) : (
                                <>
                                  {h.quantity}{" "}
                                  <span className="text-zinc-500 font-normal">
                                    {aType === "GOLD" ? "gram" : "unit"}
                                  </span>
                                </>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-zinc-300">
                              {formatPriceVal(h.avg_buy_price, h.currency)}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-zinc-100">
                              {formatPriceVal(h.current_price || h.avg_buy_price, h.currency)}
                            </td>
                            <td className="py-3.5 px-4 text-zinc-200 font-medium">
                              {formatIDR(investedIdr)}
                              {h.currency === "USD" && (
                                <div className="text-[10px] text-zinc-500 font-normal">
                                  ${Number(h.total_invested).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-zinc-100">
                              {formatIDR(marketValIdr)}
                              {h.currency === "USD" && (
                                <div className="text-[10px] text-zinc-500 font-normal">
                                  ${Number(h.market_value || h.total_invested).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col">
                                <Badge variant={isUp ? "success" : "danger"}>
                                  {isUp ? "+" : ""}
                                  {h.floating_pnl_percent}%
                                </Badge>
                                <span className="text-[10px] text-zinc-400 mt-1">
                                  {formatIDR(
                                    h.currency === "USD" ? (h.floating_pnl || 0) * 15800 : h.floating_pnl || 0
                                  )}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-6 text-right font-medium text-zinc-200">
                              {h.weight_percent ? `${h.weight_percent}%` : "-"}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-zinc-500">
                          {loading
                            ? "Memuat data portofolio..."
                            : "Tidak ada aset di kategori ini. Catat transaksi atau upload struk pertama Anda!"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FX DUAL-RETURN & CURRENCY HEDGE ANALYTICS */}
        {mainTab === "FX" && (
          <div className="space-y-6">
            {/* Top FX Banner */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
                <div>
                  <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-400" />
                    Analisis Keuntungan Ganda Kurs USD/IDR (FX Dual-Return)
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-3xl leading-relaxed">
                    Dekomposisi transparan antara laba murni aset global (Capital Gain dalam USD) dan keuntungan tambahan dari depresiasi Rupiah / apresiasi Dollar AS (FX Hedge).
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center gap-3 shrink-0">
                  <div>
                    <div className="text-[10px] text-zinc-400 uppercase font-semibold">Kurs Acuan Pasar</div>
                    <div className="text-sm font-bold text-emerald-400">1 USD = Rp 16.250</div>
                  </div>
                  <div className="h-6 w-px bg-zinc-800" />
                  <div>
                    <div className="text-[10px] text-zinc-400 uppercase font-semibold">Kurs Masuk Rata-rata</div>
                    <div className="text-sm font-bold text-zinc-300">1 USD = Rp 15.650</div>
                  </div>
                </div>
              </div>

              {/* 3 Major Stats Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-zinc-850 border border-zinc-800">
                  <div className="text-xs text-zinc-400 uppercase font-semibold">Total Nilai Aset USD</div>
                  <div className="text-xl font-black text-zinc-100 mt-1">
                    ${fxData?.total_foreign_value_usd?.toLocaleString() || "0"}
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    {formatIDR(fxData?.total_foreign_value_idr || 0)} (Alokasi: {fxData?.foreign_allocation_percent || 0}%)
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-850 border border-zinc-800">
                  <div className="text-xs text-zinc-400 uppercase font-semibold">Laba Kenaikan Harga Aset (USD)</div>
                  <div className={`text-xl font-black mt-1 ${
                    (fxData?.total_pure_asset_gain_idr || 0) >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {(fxData?.total_pure_asset_gain_idr || 0) >= 0 ? "+" : ""}
                    {formatIDR(fxData?.total_pure_asset_gain_idr || 0)}
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    Return murni instrumen tanpa efek kurs
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/60">
                  <div className="text-xs text-emerald-400 uppercase font-semibold flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" /> Laba Apresiasi Kurs Dollar (IDR)
                  </div>
                  <div className="text-xl font-black text-emerald-300 mt-1">
                    +{formatIDR(fxData?.total_fx_currency_gain_idr || 0)}
                  </div>
                  <div className="text-xs text-emerald-400/80 mt-0.5">
                    Keuntungan lindung nilai terhadap Rupiah
                  </div>
                </div>
              </div>

              {/* Hedging Summary Box */}
              {fxData?.hedging_summary && (
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-3 text-xs text-zinc-300 leading-relaxed">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-zinc-100 block mb-0.5">Diagnostik Lindung Nilai (Currency Hedge):</strong>
                    {fxData.hedging_summary}
                  </div>
                </div>
              )}
            </div>

            {/* Holdings FX Breakdown Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 bg-zinc-850/60 border-b border-zinc-800">
                <h4 className="font-bold text-sm text-zinc-100">
                  Rincian Komposisi Return per Aset Berbasis Dollar
                </h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-850 border-b border-zinc-800 text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-6">INSTRUMEN</th>
                      <th className="py-3 px-4">KUANTITAS</th>
                      <th className="py-3 px-4">HARGA BELI & LIVE (USD)</th>
                      <th className="py-3 px-4">NILAI PASAR (USD)</th>
                      <th className="py-3 px-4">LABA MURNI ASET</th>
                      <th className="py-3 px-4 bg-emerald-950/20 text-emerald-300 font-bold">LABA KURS USD</th>
                      <th className="py-3 px-6 text-right">TOTAL RETURN RIIL (IDR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80">
                    {fxData?.items && fxData.items.length > 0 ? (
                      fxData.items.map((item: any) => {
                        const isPureUp = item.pure_asset_gain_usd >= 0;
                        const isNetUp = item.total_net_gain_idr >= 0;

                        return (
                          <tr key={item.ticker} className="hover:bg-zinc-800/40 transition">
                            <td className="py-4 px-6">
                              <div className="font-bold text-zinc-100 text-sm">{item.ticker}</div>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                                {item.asset_type}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-zinc-300 font-medium">
                              {item.quantity}
                            </td>
                            <td className="py-4 px-4 text-zinc-300">
                              <div>${item.current_price_usd}</div>
                              <div className="text-[10px] text-zinc-500">Buy: ${item.entry_price_usd}</div>
                            </td>
                            <td className="py-4 px-4 font-semibold text-zinc-100">
                              ${item.current_market_value_usd}
                            </td>
                            <td className="py-4 px-4">
                              <div className={`font-bold ${isPureUp ? "text-emerald-400" : "text-red-400"}`}>
                                {isPureUp ? "+" : ""}{item.pure_asset_gain_percent}%
                              </div>
                              <div className="text-[10px] text-zinc-400 mt-0.5">
                                {formatIDR(item.pure_asset_gain_idr)}
                              </div>
                            </td>
                            <td className="py-4 px-4 bg-emerald-950/20">
                              <div className="font-bold text-emerald-300">
                                +{item.fx_gain_percent}%
                              </div>
                              <div className="text-[10px] text-emerald-400/80 font-semibold mt-0.5">
                                +{formatIDR(item.fx_gain_idr)}
                              </div>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className={`text-sm font-black ${isNetUp ? "text-emerald-400" : "text-red-400"}`}>
                                {isNetUp ? "+" : ""}{formatIDR(item.total_net_gain_idr)}
                              </div>
                              <div className="text-[10px] text-zinc-400 font-medium">
                                {isNetUp ? "+" : ""}{item.total_net_gain_percent}%
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-zinc-500">
                          {fxLoading ? "Menghitung analisis kurs..." : "Tidak ada aset berbasis USD di portofolio Anda."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: REBALANCE & NEW CAPITAL ALLOCATION ADVISOR */}
        {mainTab === "REBALANCE" && (
          <div className="space-y-6">
            {/* Strategy & Capital Inflow Controls Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
                <div>
                  <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-emerald-400" />
                    Kalkulator Rebalancing & Alokasi Modal Baru (Inflow Routing)
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Pilih target strategi risiko dan masukkan nominal dana segar (Rp). AI akan menghitung alokasi optimal agar aset portofolio seimbang secara organik tanpa harus menjual aset floating loss.
                  </p>
                </div>

                <button
                  onClick={() => fetchRebalanceData()}
                  disabled={rebalanceLoading}
                  className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold text-xs transition flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-zinc-900" />
                  {rebalanceLoading ? "Menghitung Alokasi..." : "Hitung Alokasi Uang Baru"}
                </button>
              </div>

              {/* Strategy Presets */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  1. Pilih Model Portofolio Target
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    {
                      id: "BALANCED_GROWTH",
                      name: "Pertumbuhan Seimbang",
                      desc: "45% Saham IDX, 25% ETF VT, 15% Emas, 15% BTC",
                      tag: "Direkomendasikan",
                    },
                    {
                      id: "ALL_WEATHER",
                      name: "All-Weather Ray Dalio",
                      desc: "25% Saham, 40% SBN/Obligasi, 15% Emas, 20% Kripto",
                      tag: "Tahan Segala Siklus",
                    },
                    {
                      id: "CONSERVATIVE",
                      name: "Konservatif & Capital Defense",
                      desc: "10% Saham, 50% SBN, 30% Emas, 10% Kripto",
                      tag: "Rendah Volatilitas",
                    },
                    {
                      id: "HIGH_ALPHA",
                      name: "High-Alpha Aggressive",
                      desc: "40% Saham IDX, 30% Kripto, 20% ETF Global, 10% Emas",
                      tag: "Maksimal Pertumbuhan",
                    },
                  ].map((strat) => {
                    const isSelected = rebalanceStrategy === strat.id;
                    return (
                      <button
                        key={strat.id}
                        type="button"
                        onClick={() => {
                          setRebalanceStrategy(strat.id);
                          fetchRebalanceData(strat.id);
                        }}
                        className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                          isSelected
                            ? "bg-emerald-950/30 border-emerald-500/70 shadow-sm ring-1 ring-emerald-500/40"
                            : "bg-zinc-850/60 border-zinc-800 hover:border-zinc-700 text-zinc-400"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold ${isSelected ? "text-emerald-300" : "text-zinc-200"}`}>
                              {strat.name}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                            {strat.desc}
                          </p>
                        </div>
                        <span className="text-[9px] mt-3 font-semibold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 w-fit">
                          {strat.tag}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fresh Capital Inflow Input with Quick Chips */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  2. Masukkan Nominal Modal Baru (Dana Masuk / Gajian)
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400">
                      Rp
                    </span>
                    <input
                      type="number"
                      value={freshCapitalInput}
                      onChange={(e) => setFreshCapitalInput(e.target.value)}
                      placeholder="2000000"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-sm font-semibold text-zinc-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { label: "+1 Jt", val: 1000000 },
                      { label: "+2 Jt", val: 2000000 },
                      { label: "+5 Jt", val: 5000000 },
                      { label: "+10 Jt", val: 10000000 },
                      { label: "+25 Jt", val: 25000000 },
                    ].map((chip) => (
                      <button
                        key={chip.val}
                        type="button"
                        onClick={() => {
                          setFreshCapitalInput(String(chip.val));
                          fetchRebalanceData(rebalanceStrategy, chip.val);
                        }}
                        className={`px-3 py-2 rounded-lg text-xs font-medium border transition ${
                          Number(freshCapitalInput) === chip.val
                            ? "bg-zinc-100 text-zinc-900 font-bold border-zinc-100"
                            : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Inflow Summary Banner Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 shadow-sm">
                <div className="text-xs text-zinc-400 uppercase font-semibold">Nilai Portofolio Saat Ini</div>
                <div className="text-xl font-bold text-zinc-100 mt-1">
                  {formatIDR(rebalancePlan?.current_total_value_idr || portfolio?.total_market_value || 0)}
                </div>
                <div className="text-[11px] text-zinc-500 mt-1">
                  Total valuasi real live market
                </div>
              </div>

              <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 shadow-sm">
                <div className="text-xs text-zinc-400 uppercase font-semibold">Modal Baru yang Dialokasikan</div>
                <div className="text-xl font-bold text-emerald-400 mt-1">
                  {formatIDR(rebalancePlan?.fresh_capital_idr || Number(freshCapitalInput) || 0)}
                </div>
                <div className="text-[11px] text-zinc-500 mt-1">
                  Dana segar siap belanja instrumen
                </div>
              </div>

              <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 shadow-sm">
                <div className="text-xs text-zinc-400 uppercase font-semibold">Estimasi Portofolio Pasca-Inflow</div>
                <div className="text-xl font-bold text-zinc-100 mt-1">
                  {formatIDR(rebalancePlan?.projected_total_value_idr || 0)}
                </div>
                <div className="text-[11px] text-zinc-500 mt-1">
                  Model: {rebalancePlan?.strategy_name || "Balanced Growth"}
                </div>
              </div>
            </div>

            {/* Rebalance Plan Allocation Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 bg-zinc-850/60 border-b border-zinc-800">
                <h4 className="font-bold text-sm text-zinc-100">
                  Rincian Alokasi Dana Masuk ke Setiap Kelas Aset
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Distribusi dana masuk dihitung proporsional untuk menutup defisit bobot tanpa memaksa penjualan aset.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-850 border-b border-zinc-800 text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-6">KELAS ASET & TARGET INSTRUMEN</th>
                      <th className="py-3 px-4">NILAI SAAT INI</th>
                      <th className="py-3 px-4">BOBOT AKTUAL</th>
                      <th className="py-3 px-4">TARGET STRATEGI</th>
                      <th className="py-3 px-4">STATUS BOBOT</th>
                      <th className="py-3 px-6 bg-emerald-950/20 text-emerald-300 font-bold">
                        ALOKASI MODAL BARU (RP)
                      </th>
                      <th className="py-3 px-6 text-right">PROYEKSI AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80">
                    {rebalancePlan?.items && rebalancePlan.items.length > 0 ? (
                      rebalancePlan.items.map((item: any) => {
                        const isUnder = item.status === "UNDERWEIGHT";
                        const isOver = item.status === "OVERWEIGHT";
                        return (
                          <tr key={item.asset_type} className="hover:bg-zinc-800/40 transition">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                                  {item.asset_type}
                                </span>
                                <div className="font-bold text-zinc-100 text-sm">
                                  {item.label}
                                </div>
                              </div>
                              <div className="text-[11px] text-emerald-400 mt-0.5 font-medium">
                                Instrumen Rekomendasi: {item.representative_ticker}
                              </div>
                            </td>
                            <td className="py-4 px-4 font-semibold text-zinc-200">
                              {formatIDR(item.current_value_idr)}
                            </td>
                            <td className="py-4 px-4 font-bold text-zinc-300">
                              {item.current_weight_percent}%
                            </td>
                            <td className="py-4 px-4 font-bold text-zinc-100">
                              {item.target_weight_percent}%
                            </td>
                            <td className="py-4 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isUnder
                                    ? "bg-emerald-950 text-emerald-300 border border-emerald-800/60"
                                    : isOver
                                    ? "bg-amber-950 text-amber-300 border border-amber-800/60"
                                    : "bg-zinc-800 text-zinc-300"
                                }`}
                              >
                                {isUnder ? "KURANG BOBOT" : isOver ? "OVERWEIGHT" : "SEIMBANG"}
                              </span>
                            </td>
                            <td className="py-4 px-6 bg-emerald-950/20">
                              <div className="text-sm font-black text-emerald-300">
                                {formatIDR(item.recommended_inflow_idr)}
                              </div>
                              {item.recommended_inflow_percent > 0 && (
                                <div className="text-[10px] text-emerald-400/80 font-semibold">
                                  {item.recommended_inflow_percent}% dari dana masuk
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="text-xs font-semibold text-zinc-200">
                                {item.recommended_action}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-zinc-500">
                          {rebalanceLoading ? "Menghitung skema rebalancing..." : "Klik Hitung Alokasi untuk melihat rekomendasi."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI Advisor Guidance Note */}
            {rebalancePlan?.summary_advice && (
              <div className="p-4 rounded-xl bg-zinc-850/80 border border-zinc-700/80 flex items-start gap-3 text-xs leading-relaxed text-zinc-300">
                <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-zinc-100 block mb-1">Panduan Eksekusi AI Portofolio Advisor:</strong>
                  {rebalancePlan.summary_advice}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: INDONESIAN TAX SIMULATOR & REALIZED P/L */}
        {mainTab === "TAX" && (
          <div className="space-y-6">
            {/* Header / Intro Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-amber-400" />
                    Kalkulator Pajak Indonesia & Realisasi Keuntungan (PPh Final & SPT)
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-3xl leading-relaxed">
                    Hitung simulasi potongan pajak resmi Republik Indonesia saat menjual aset portofolio (Kripto PMK 68 PPh Final 0.1%, Saham BEI PP 41 PPh Final 0.1%, Emas Batangan PPh 22 1.5%, dan US Withholding Tax 15% Form W-8BEN), estimasi fee transaksi, serta panduan pelaporan SPT Tahunan 1770/1770S.
                  </p>
                </div>

                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold transition flex items-center gap-1.5 shrink-0"
                >
                  <Printer className="w-3.5 h-3.5 text-zinc-300" />
                  Format Lampiran SPT
                </button>
              </div>
            </div>

            {/* Interactive Calculator Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Simulation Inputs */}
              <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4 shadow-sm">
                <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-800 pb-3">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  Parameter Simulasi Penjualan
                </h4>

                {/* Quick Pick Holding */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1.5">
                    Pilih Aset dari Portofolio Anda
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                    {(portfolio?.holdings || []).map((h: any) => (
                      <button
                        key={`${h.ticker}-${h.asset_type}`}
                        type="button"
                        onClick={() => handleSelectHoldingForTax(h)}
                        className={`p-2 rounded-lg text-left border transition text-xs ${
                          taxSelectedTicker === h.ticker
                            ? "bg-amber-950/40 border-amber-500 text-zinc-100 font-semibold"
                            : "bg-zinc-850 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        <div className="font-bold text-zinc-100">{h.ticker}</div>
                        <div className="text-[10px] text-zinc-400 truncate">
                          {h.asset_type === "STOCK" ? `${h.total_lots} Lot` : `${h.quantity} Unit`}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Asset Type Selector */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1.5">
                    Kelas Regulasi Pajak
                  </label>
                  <select
                    value={taxAssetType}
                    onChange={(e) => setTaxAssetType(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="CRYPTO">Kripto (PMK 68/2022 - PPh Final 0.1% / 0.2%)</option>
                    <option value="STOCK">Saham BEI (PP 41/1994 - PPh Final 0.1%)</option>
                    <option value="GOLD">Emas Batangan (PMK 34/2017 - PPh 22 1.5%)</option>
                    <option value="ETF">Global ETF / Saham US (W-8BEN 15% / PPh 17)</option>
                    <option value="BOND">Obligasi / SBN (PP 91/2021 - PPh Final 10%)</option>
                  </select>
                </div>

                {/* Sell Quantity */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1.5">
                    Jumlah Unit / Kuantitas yang Dijual
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={taxQuantity}
                    onChange={(e) => setTaxQuantity(e.target.value)}
                    placeholder="0.001"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Sell Price (IDR) */}
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1.5">
                    Harga Jual Per Unit (IDR)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={taxSellPrice}
                    onChange={(e) => setTaxSellPrice(e.target.value)}
                    placeholder="1450000000"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Tax Options Checkboxes */}
                <div className="space-y-2 pt-1 border-t border-zinc-800">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                    <input
                      type="checkbox"
                      checked={taxIsRegistered}
                      onChange={(e) => setTaxIsRegistered(e.target.checked)}
                      className="rounded bg-zinc-950 border-zinc-700 text-amber-500 focus:ring-0"
                    />
                    <span>Exchanger Terdaftar di Bappebti / OJK (Reku, Indodax, Tokocrypto, Pintu)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                    <input
                      type="checkbox"
                      checked={taxHasNpwp}
                      onChange={(e) => setTaxHasNpwp(e.target.checked)}
                      className="rounded bg-zinc-950 border-zinc-700 text-amber-500 focus:ring-0"
                    />
                    <span>Memiliki NPWP / NIK Terdaftar Pajak</span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={runTaxSimulation}
                  disabled={taxSimLoading}
                  className="w-full py-2.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold text-xs transition shadow-sm disabled:opacity-50"
                >
                  {taxSimLoading ? "Menghitung Pajak & Net..." : "Hitung Realisasi & Pajak"}
                </button>
              </div>

              {/* Right Column: Tax Breakdown & SPT Guide */}
              <div className="lg:col-span-7 space-y-4">
                {taxSimResult ? (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6 shadow-sm">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                          Hasil Perhitungan Pajak & Kas Bersih
                        </span>
                        <span className="text-xs font-semibold text-zinc-300">
                          {taxSimResult.ticker} ({taxSimResult.asset_type})
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 mt-1">
                        Rujukan Hukum: <strong className="text-zinc-200">{taxSimResult.regulation_reference}</strong> ({taxSimResult.tax_type})
                      </div>
                    </div>

                    {/* Big Summary Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-lg bg-zinc-850 border border-zinc-800">
                        <div className="text-[10px] text-zinc-400 uppercase font-semibold">Nilai Jual Kotor</div>
                        <div className="text-sm font-bold text-zinc-100 mt-1">
                          {formatIDR(taxSimResult.gross_sell_amount_idr)}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-lg bg-zinc-850 border border-zinc-800">
                        <div className="text-[10px] text-zinc-400 uppercase font-semibold">Potongan PPh Final ({taxSimResult.tax_rate_percent}%)</div>
                        <div className="text-sm font-bold text-red-400 mt-1">
                          -{formatIDR(taxSimResult.estimated_tax_withheld_idr)}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-lg bg-zinc-850 border border-zinc-800">
                        <div className="text-[10px] text-zinc-400 uppercase font-semibold">Estimasi Biaya Transaksi</div>
                        <div className="text-sm font-bold text-zinc-300 mt-1">
                          -{formatIDR(taxSimResult.estimated_exchange_fee_idr)}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-lg bg-zinc-850 border border-zinc-800">
                        <div className="text-[10px] text-zinc-400 uppercase font-semibold">Modal Pokok (Cost Basis)</div>
                        <div className="text-sm font-bold text-zinc-200 mt-1">
                          {formatIDR(taxSimResult.estimated_cost_basis_idr)}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60">
                        <div className="text-[10px] text-emerald-400 uppercase font-semibold">Kas Bersih Diterima</div>
                        <div className="text-base font-black text-emerald-300 mt-0.5">
                          {formatIDR(taxSimResult.net_cash_received_idr)}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-lg bg-zinc-850 border border-zinc-800">
                        <div className="text-[10px] text-zinc-400 uppercase font-semibold">Profit / Rugi Bersih Realisasi</div>
                        <div className={`text-sm font-black mt-1 ${
                          taxSimResult.net_realized_profit_idr >= 0 ? "text-emerald-400" : "text-red-400"
                        }`}>
                          {taxSimResult.net_realized_profit_idr >= 0 ? "+" : ""}
                          {formatIDR(taxSimResult.net_realized_profit_idr)}
                          <span className="text-[10px] ml-1 font-normal text-zinc-400">
                            ({taxSimResult.pnl_percentage}%)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* SPT Guidance Box */}
                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                      <div className="flex items-center gap-2 font-bold text-amber-300">
                        <CheckCircle2 className="w-4 h-4" />
                        Panduan Pengisian SPT Tahunan (Form 1770 / 1770S)
                      </div>
                      <div className="text-zinc-300 leading-relaxed">
                        {taxSimResult.spt_reporting_guide}
                      </div>
                      <div className="text-[11px] text-zinc-500 pt-1">
                        Kode Akun Harta / Pajak SPT: <strong className="text-zinc-300">{taxSimResult.spt_reporting_code}</strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center text-zinc-500 text-xs">
                    Pilih instrumen dan klik &quot;Hitung Realisasi & Pajak&quot; untuk menampilkan rincian.
                  </div>
                )}

                {/* Portfolio-Wide Exit Tax Summary */}
                {taxSummary && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3 shadow-sm">
                    <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center justify-between">
                      <span>Estimasi Beban Pajak Likuidasi Portofolio Penuh</span>
                      <span className="text-[10px] text-zinc-400 font-normal">
                        Jika seluruh portofolio dijual saat ini
                      </span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-zinc-850 border border-zinc-800">
                        <div className="text-[10px] text-zinc-400">Total Nilai Pasar Portofolio</div>
                        <div className="text-sm font-bold text-zinc-100 mt-0.5">
                          {formatIDR(taxSummary.total_portfolio_market_value_idr)}
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-zinc-850 border border-zinc-800">
                        <div className="text-[10px] text-zinc-400">Total Estimasi Pajak Terutang</div>
                        <div className="text-sm font-bold text-amber-400 mt-0.5">
                          {formatIDR(taxSummary.total_potential_exit_tax_idr)}
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-zinc-850 border border-zinc-800">
                        <div className="text-[10px] text-zinc-400">Estimasi Bersih Setelah Pajak & Fee</div>
                        <div className="text-sm font-bold text-emerald-400 mt-0.5">
                          {formatIDR(taxSummary.total_net_cash_after_tax_idr)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: HEALTH SCORE */}
        {mainTab === "HEALTH" && (
          <div className="space-y-6">
            {/* Top Score Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Score Gauge Card */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-2">
                  Indeks Kesehatan Portofolio
                </span>
                <div className="relative flex items-center justify-center my-3">
                  <div className={`text-6xl font-black ${
                    (healthData?.health_score || 0) >= 70
                      ? "text-emerald-400"
                      : (healthData?.health_score || 0) >= 50
                      ? "text-amber-400"
                      : "text-red-400"
                  }`}>
                    {healthData?.health_score ?? "--"}
                  </div>
                  <span className="text-sm text-zinc-500 font-bold ml-1 self-end mb-2">/100</span>
                </div>
                <Badge variant={(healthData?.health_score || 0) >= 70 ? "success" : "danger"}>
                  {healthData?.rating || "Analisis"}
                </Badge>
                <p className="text-xs text-zinc-400 mt-3 max-w-xs">
                  Profil Risiko: <strong className="text-zinc-200">{healthData?.risk_profile}</strong>
                </p>
              </div>

              {/* Metrics & Diagnostic Details */}
              <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col justify-between shadow-sm">
                <div>
                  <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Diagnostik & Distribusi Risiko
                  </h3>
                  <p className="text-xs text-zinc-400 mb-4">
                    {healthData?.summary}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-zinc-850 border border-zinc-800">
                      <div className="text-[10px] text-zinc-400 uppercase font-semibold">Konsentrasi Tertinggi</div>
                      <div className="text-sm font-bold text-amber-300 mt-0.5">
                        {healthData?.metrics?.top_holding_concentration?.ticker || "-"} (
                        {healthData?.metrics?.top_holding_concentration?.weight_percent || 0}%)
                      </div>
                      <div className="text-[10px] text-zinc-500">Maksimal ideal: &lt; 30%</div>
                    </div>

                    <div className="p-3 rounded-lg bg-zinc-850 border border-zinc-800">
                      <div className="text-[10px] text-zinc-400 uppercase font-semibold">Safe Haven & Kas</div>
                      <div className="text-sm font-bold text-emerald-400 mt-0.5">
                        {healthData?.metrics?.safe_haven_percentage || 0}%
                      </div>
                      <div className="text-[10px] text-zinc-500">Bantalan Emas/SBN/Kas (min. 10%)</div>
                    </div>

                    <div className="p-3 rounded-lg bg-zinc-850 border border-zinc-800">
                      <div className="text-[10px] text-zinc-400 uppercase font-semibold">Aset Volatil / Growth</div>
                      <div className="text-sm font-bold text-blue-400 mt-0.5">
                        {healthData?.metrics?.high_growth_percentage || 0}%
                      </div>
                      <div className="text-[10px] text-zinc-500">Saham + Kripto eksposur</div>
                    </div>
                  </div>
                </div>

                {/* Warnings / Strengths Check */}
                <div className="mt-4 pt-4 border-t border-zinc-800 space-y-1.5">
                  {healthData?.warnings?.map((w: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-amber-300/90">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{w}</span>
                    </div>
                  ))}
                  {healthData?.strengths?.map((s: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-emerald-300/90">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Rebalancing Plan */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-emerald-400" />
                    Rekomendasi Penyesuaian Bobot Portofolio
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Langkah-langkah strategis untuk mengembalikan rasio portofolio Anda ke tingkat risiko optimal.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {healthData?.rebalancing_actions && healthData.rebalancing_actions.length > 0 ? (
                  healthData.rebalancing_actions.map((act: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-lg bg-zinc-850 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                          act.action === "REDUCE"
                            ? "bg-amber-950/60 text-amber-300 border border-amber-800/60"
                            : "bg-emerald-950/60 text-emerald-300 border border-emerald-800/60"
                        }`}>
                          {act.action === "REDUCE" ? "TRIM" : "ADD"}
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-zinc-200 flex items-center gap-2">
                            <span>{act.action === "REDUCE" ? "Kurangi Bobot" : "Tambah Alokasi"}: {act.asset_type}</span>
                            <span className="text-[10px] text-zinc-500">
                              (Saat ini {act.current_weight_percent}% &rarr; Target {act.target_weight_percent}%)
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                            {act.reason}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs text-zinc-400">Nominal Penyesuaian</div>
                        <div className="text-sm font-bold text-zinc-100 mt-0.5">
                          {formatIDR(act.recommended_amount_idr || 0)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs text-zinc-500">
                    Portofolio Anda sudah dalam kondisi prima dan seimbang!
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: DIVIDENDS & PASSIVE INCOME */}
        {mainTab === "DIVIDENDS" && (
          <div className="space-y-6">
            {/* Top Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 shadow-sm">
                <div className="text-xs text-zinc-400 uppercase font-semibold">Total Dividen Tahunan (Est.)</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">
                  {formatIDR(dividendData?.annual_passive_income_idr || 0)}
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  Portfolio Yield: {dividendData?.portfolio_dividend_yield_percent || 0}% / tahun
                </div>
              </div>

              <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 shadow-sm">
                <div className="text-xs text-zinc-400 uppercase font-semibold">Rata-rata Cash Flow Bulanan</div>
                <div className="text-2xl font-bold text-zinc-100 mt-1">
                  {formatIDR(dividendData?.average_monthly_income_idr || 0)}
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  Dapat di-reinvestasikan otomatis (DRIP)
                </div>
              </div>

              <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 shadow-sm">
                <div className="text-xs text-zinc-400 uppercase font-semibold">Aset Penghasil Dividen</div>
                <div className="text-2xl font-bold text-amber-300 mt-1">
                  {dividendData?.holdings?.length || 0} Instrumen
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  Saham Dividen, ETF Global, Obligasi
                </div>
              </div>
            </div>

            {/* 12-Month Distribution Timeline Bar Chart */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    Proyeksi Kalender Dividen Bulanan (Januari - Desember)
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Distribusi estimasi dividen tunai & kupon yang akan masuk ke rekening Anda tiap bulan.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {(dividendData?.monthly_projections || []).map((m: any) => {
                  const hasPayout = m.estimated_income_idr > 0;
                  return (
                    <div
                      key={m.month}
                      className={`p-3 rounded-lg border flex flex-col justify-between transition ${
                        hasPayout
                          ? "bg-zinc-850 border-emerald-800/40 text-zinc-100"
                          : "bg-zinc-950/40 border-zinc-800/60 text-zinc-500"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                          <span>{m.month_name}</span>
                          {hasPayout && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          )}
                        </div>
                        <div className={`text-sm font-bold mt-2 ${hasPayout ? "text-emerald-400" : "text-zinc-600"}`}>
                          {formatIDR(m.estimated_income_idr)}
                        </div>
                      </div>

                      <div className="text-[10px] text-zinc-400 mt-2 truncate">
                        {m.tickers?.length > 0 ? m.tickers.join(", ") : "-"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dividend Yield Holdings List */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-base font-semibold text-zinc-100 mb-3">
                Rincian Aset Penghasil Dividen
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-850 border-b border-zinc-800 text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">SIMBOL & NAMA</th>
                      <th className="py-3 px-4">KELAS ASET</th>
                      <th className="py-3 px-4">NILAI PASAR</th>
                      <th className="py-3 px-4">DIVIDEND YIELD</th>
                      <th className="py-3 px-4">ESTIMASI DIVIDEN / THN</th>
                      <th className="py-3 px-4">JADWAL PEMBAGIAN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80">
                    {dividendData?.holdings && dividendData.holdings.length > 0 ? (
                      dividendData.holdings.map((h: any) => (
                        <tr key={h.ticker} className="hover:bg-zinc-800/40 transition">
                          <td className="py-3 px-4 font-semibold text-zinc-100">
                            {h.ticker}
                            <div className="text-[10px] text-zinc-400 font-normal">{h.name}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                              {h.asset_type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-zinc-200">
                            {formatIDR(h.market_value_idr)}
                          </td>
                          <td className="py-3 px-4 text-emerald-400 font-bold">
                            {h.dividend_yield_percent}%
                          </td>
                          <td className="py-3 px-4 font-semibold text-zinc-100">
                            {formatIDR(h.annual_dividend_income_idr)}
                          </td>
                          <td className="py-3 px-4 text-zinc-300">
                            {h.distribution_months?.map((m: number) => {
                              const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
                              return months[m - 1];
                            }).join(", ")}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-zinc-500">
                          Belum ada aset penghasil dividen dalam portofolio Anda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 1: Upload Struk OCR */}
        <Modal
          isOpen={isOcrModalOpen}
          onClose={() => setIsOcrModalOpen(false)}
          title="Scan Bukti Transaksi AI (Gemini Vision OCR)"
        >
          <div className="space-y-4 text-xs">
            <p className="text-zinc-400 leading-relaxed">
              Unggah screenshot order fill / bukti transaksi dari Ajaib, Stockbit, Indodax, Binance, IPOT, Bibit, dsb. AI akan mengekstrak simbol, lot/unit, harga beli, dan mencatatnya otomatis.
            </p>

            {/* Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl p-6 text-center cursor-pointer bg-zinc-950/50 hover:bg-zinc-900/50 transition flex flex-col items-center justify-center gap-2"
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleOcrFileSelect(e.target.files[0]);
                }}
              />
              <UploadCloud className="w-8 h-8 text-zinc-400" />
              <div className="font-semibold text-zinc-200">
                {ocrFile ? ocrFile.name : "Klik atau seret file gambar screenshot di sini"}
              </div>
              <div className="text-[10px] text-zinc-500">
                Format PNG, JPG, JPEG (Max 10MB)
              </div>
            </div>

            {/* Preview */}
            {ocrPreview && (
              <div className="rounded-lg overflow-hidden border border-zinc-800 max-h-48 flex justify-center bg-black/50">
                <img src={ocrPreview} alt="Receipt Preview" className="h-48 object-contain" />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleOcrProcess}
                disabled={!ocrFile || ocrLoading}
                className="flex-1 py-2.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold text-xs transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-zinc-900" />
                {ocrLoading ? "Menganalisis Gambar dengan AI..." : "Ekstrak & Simpan Transaksi"}
              </button>
            </div>

            {/* Success Result Confirmation */}
            {ocrResult && (
              <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                  <CheckCircle2 className="w-4 h-4" />
                  Transaksi Berhasil Terverifikasi!
                </div>
                <div>Aset: <strong>{ocrResult.parsed_data?.symbol}</strong> ({ocrResult.parsed_data?.asset_type})</div>
                <div>Jumlah: <strong>{ocrResult.parsed_data?.quantity} {ocrResult.parsed_data?.asset_type === "STOCK" ? "Lot" : "Unit"}</strong> @ {formatIDR(ocrResult.parsed_data?.price_per_unit)}</div>
                <div>Total Realisasi: <strong>{formatIDR(ocrResult.parsed_data?.total_amount)}</strong></div>
              </div>
            )}
          </div>
        </Modal>

        {/* MODAL 2: Lembar Fakta Portofolio Eksekutif (Executive Factsheet & PDF Export) */}
        <Modal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          title="Lembar Fakta Eksekutif Portofolio (Executive Factsheet)"
        >
          <div className="space-y-4 text-xs max-h-[80vh] overflow-y-auto pr-1">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <p className="text-zinc-400">
                Format laporan komprehensif berstandar manajer investasi profesional untuk arsip dan evaluasi kekayaan.
              </p>
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition flex items-center gap-1.5 shrink-0 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Cetak / Simpan PDF
              </button>
            </div>

            {/* Printable Factsheet Document Container */}
            <div id="executive-factsheet" className="p-6 rounded-xl bg-zinc-950 border border-zinc-800 space-y-6 print:bg-white print:text-black print:p-0 print:border-none">
              {/* Factsheet Header */}
              <div className="border-b-2 border-emerald-500 pb-4 flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 print:text-emerald-700">
                    JARVIS WEALTH & FAMILY OFFICE
                  </span>
                  <h2 className="text-xl font-black text-zinc-100 print:text-black mt-0.5">
                    EXECUTIVE PORTFOLIO FACTSHEET
                  </h2>
                  <div className="text-[11px] text-zinc-400 print:text-zinc-600 mt-1">
                    Pemilik Portofolio: <strong className="text-zinc-200 print:text-black">Adam (Jarvis User)</strong> | Per Tanggal: <strong className="text-zinc-200 print:text-black">{new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</strong>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700 print:border-black print:text-black">
                    Laporan Resmi Berkala
                  </span>
                  <div className="text-[10px] text-zinc-500 print:text-zinc-600 mt-1 font-mono">
                    ID Portofolio: #0001-ALPHA
                  </div>
                </div>
              </div>

              {/* Key Metrics Executive Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 print:border-zinc-300 print:bg-zinc-50">
                  <div className="text-[10px] text-zinc-400 uppercase font-semibold">Total Kekayaan Bersih</div>
                  <div className="text-base font-black text-zinc-100 print:text-black mt-0.5">
                    {formatIDR((portfolio?.total_market_value || 0) + (portfolio?.cash_balance || 0))}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 print:border-zinc-300 print:bg-zinc-50">
                  <div className="text-[10px] text-zinc-400 uppercase font-semibold">Total Nilai Investasi</div>
                  <div className="text-base font-black text-emerald-400 print:text-emerald-700 mt-0.5">
                    {formatIDR(portfolio?.total_market_value || 0)}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 print:border-zinc-300 print:bg-zinc-50">
                  <div className="text-[10px] text-zinc-400 uppercase font-semibold">Modal Pokok Disetor</div>
                  <div className="text-base font-black text-zinc-200 print:text-black mt-0.5">
                    {formatIDR(portfolio?.total_invested || 0)}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 print:border-zinc-300 print:bg-zinc-50">
                  <div className="text-[10px] text-zinc-400 uppercase font-semibold">Indeks Kesehatan AI</div>
                  <div className="text-base font-black text-blue-400 print:text-blue-700 mt-0.5">
                    {healthData?.health_score || "--"}/100 ({healthData?.rating || "Prima"})
                  </div>
                </div>
              </div>

              {/* Holdings Breakdown Table */}
              <div className="space-y-2">
                <div className="font-bold text-xs uppercase tracking-wider text-zinc-300 print:text-black flex items-center justify-between">
                  <span>Daftar Instrumen & Nilai Pasar</span>
                  <span className="text-[10px] font-normal text-zinc-500">Harga Terakhir Real-time</span>
                </div>

                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="text-zinc-400 border-b border-zinc-800 pb-2 font-semibold print:text-black print:border-black">
                      <th className="pb-1.5">SIMBOL & KELAS</th>
                      <th className="pb-1.5">KUANTITAS</th>
                      <th className="pb-1.5 text-right">HARGA BELI</th>
                      <th className="pb-1.5 text-right">NILAI PASAR (RP)</th>
                      <th className="pb-1.5 text-right">FLOATING P/L</th>
                      <th className="pb-1.5 text-right">BOBOT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 print:divide-zinc-300">
                    {(portfolio?.holdings || []).map((h: any, idx: number) => {
                      const isUp = (h.floating_pnl || 0) >= 0;
                      const marketVal = h.currency === "USD" ? (h.market_value || h.total_invested) * 16250 : h.market_value || h.total_invested;

                      return (
                        <tr key={idx} className="py-2">
                          <td className="py-2 font-semibold text-zinc-200 print:text-black">
                            {h.ticker} <span className="text-[10px] text-zinc-500 print:text-zinc-600 font-normal">({h.asset_type})</span>
                          </td>
                          <td className="py-2 text-zinc-300 print:text-black">
                            {h.asset_type === "STOCK" ? `${h.total_lots} Lot` : `${h.quantity} Unit`}
                          </td>
                          <td className="py-2 text-right text-zinc-300 print:text-black">
                            {formatPriceVal(h.avg_buy_price, h.currency)}
                          </td>
                          <td className="py-2 text-right font-semibold text-zinc-100 print:text-black">
                            {formatIDR(marketVal)}
                          </td>
                          <td className={`py-2 text-right font-bold ${isUp ? "text-emerald-400 print:text-emerald-700" : "text-red-400 print:text-red-700"}`}>
                            {isUp ? "+" : ""}{h.floating_pnl_percent}%
                          </td>
                          <td className="py-2 text-right text-zinc-300 print:text-black font-semibold">
                            {h.weight_percent ? `${h.weight_percent}%` : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Tax & SPT Reporting Section */}
              <div className="space-y-2 pt-2 border-t border-zinc-800 print:border-black">
                <div className="font-bold text-xs uppercase tracking-wider text-zinc-300 print:text-black flex items-center justify-between">
                  <span>Format Pelaporan SPT Tahunan Pribadi (Form 1770 / 1770S)</span>
                  <span className="text-[10px] font-normal text-zinc-500">Kolom Daftar Harta Akhir Tahun</span>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 print:bg-white print:border-zinc-300 space-y-2 text-[10px]">
                  <div className="grid grid-cols-3 gap-2 font-semibold text-zinc-400 print:text-zinc-600">
                    <div>Kode Harta SPT</div>
                    <div>Klasifikasi Aset</div>
                    <div className="text-right">Aturan Pemajakan Indonesia</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-zinc-300 print:text-black border-t border-zinc-800/80 pt-1.5">
                    <div>039 - Aset Kripto</div>
                    <div>Bitcoin (BTC-USD), Tether (USDT)</div>
                    <div className="text-right">PMK 68/2022 (PPh Final 0.1%)</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-zinc-300 print:text-black border-t border-zinc-800/80 pt-1.5">
                    <div>031 - Saham BEI / Luar Negeri</div>
                    <div>Vanguard Total World ETF (VT)</div>
                    <div className="text-right">W-8BEN (US WHT 15% / SPT 17)</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-zinc-300 print:text-black border-t border-zinc-800/80 pt-1.5">
                    <div>011 - Uang Tunai / Kas</div>
                    <div>Kas Tersedia di Rekening RDN/Bank</div>
                    <div className="text-right">Bukan Objek Pajak Tambahan</div>
                  </div>
                </div>
              </div>

              {/* Factsheet Footer */}
              <div className="border-t border-zinc-800 print:border-black pt-3 flex items-center justify-between text-[10px] text-zinc-500 print:text-zinc-600">
                <span>Dihasilkan secara otomatis oleh Jarvis AI Wealth Advisory System</span>
                <span>Kerahasiaan Dokumen: Sangat Rahasia (Private)</span>
              </div>
            </div>
          </div>
        </Modal>

        {/* MODAL 3: Entry Transaksi Multi-Aset Manual */}
        <Modal
          isOpen={isTxModalOpen}
          onClose={() => setIsTxModalOpen(false)}
          title="Catat Transaksi Multi-Aset"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
            {/* Asset Class Selection */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">
                PILIH KELAS ASET
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { key: "STOCK", label: "Saham" },
                    { key: "CRYPTO", label: "Kripto" },
                    { key: "ETF", label: "ETF" },
                    { key: "BOND", label: "Obligasi / SBN" },
                    { key: "GOLD", label: "Emas" },
                    { key: "MUTUAL_FUND", label: "Reksadana" },
                  ] as const
                ).map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => handleAssetTypeChange(a.key)}
                    className={`py-1.5 rounded-lg text-xs font-medium border transition ${
                      assetType === a.key
                        ? "bg-zinc-100 text-zinc-900 font-semibold border-zinc-200"
                        : "bg-zinc-850 border-zinc-700/80 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Transaction Type Radio */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">
                JENIS TRANSAKSI
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType("BUY")}
                  className={`py-2 rounded-lg font-medium text-xs border flex items-center justify-center gap-2 transition ${
                    type === "BUY"
                      ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300 font-semibold"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700"
                  }`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5" /> BELI (BUY)
                </button>
                <button
                  type="button"
                  onClick={() => setType("SELL")}
                  className={`py-2 rounded-lg font-medium text-xs border flex items-center justify-center gap-2 transition ${
                    type === "SELL"
                      ? "bg-red-950/40 border-red-800/60 text-red-300 font-semibold"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700"
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" /> JUAL (SELL)
                </button>
              </div>
            </div>

            {/* Ticker and Currency */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  KODE SIMBOL / TICKER
                </label>
                <input
                  type="text"
                  placeholder={getTickerPlaceholder(assetType)}
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  required
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-zinc-400 uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  MATA UANG
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-zinc-400"
                >
                  <option value="IDR">IDR (Rp)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>

            {/* Quantity and Price */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  {getUnitLabel(assetType)}
                </label>
                <input
                  type="number"
                  placeholder={assetType === "STOCK" ? "10" : "0.05"}
                  min="0.00000001"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-zinc-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  HARGA / UNIT ({currency})
                </label>
                <input
                  type="number"
                  placeholder={currency === "USD" ? "64500" : "9850"}
                  min="0.00000001"
                  step="any"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-zinc-400"
                />
              </div>
            </div>

            {/* Transaction Date & Time */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                TANGGAL & WAKTU TRANSAKSI
              </label>
              <input
                type="datetime-local"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-zinc-400"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                CATATAN (OPSIONAL)
              </label>
              <input
                type="text"
                placeholder="Misal: DCA bulanan, rebalancing, target yield 6%, dll"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:border-zinc-400"
              />
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold text-xs shadow-sm transition disabled:opacity-50 active:scale-[0.98]"
              >
                {submitting ? "Menyimpan Transaksi..." : "Simpan Transaksi Multi-Aset"}
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
}
