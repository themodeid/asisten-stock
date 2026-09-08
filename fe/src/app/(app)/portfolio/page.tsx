"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFxRate } from "@/services/fxRate";
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
  Trash2,
  Wallet,
  Building2,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { AssetType } from "@/types";
import PortfolioChartCard from "@/components/portfolio/PortfolioChartCard";

export default function PortfolioPage() {
  const { user } = useAuth();
  const { rate: fxRate } = useFxRate();
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
  const [rebalanceStrategy, setRebalanceStrategy] = useState<string>("STATELESS_GLOBAL");
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

    // Multi-Dompet State
  const [wallets, setWallets] = useState<any[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<number | "all">("all");
  const [isAddWalletModalOpen, setIsAddWalletModalOpen] = useState(false);
  const [newWalletName, setNewWalletName] = useState("");
  const [newWalletCash, setNewWalletCash] = useState("");
  const [walletSubmitting, setWalletSubmitting] = useState(false);
  const [walletMsg, setWalletMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Smart Holding Calibration & PnL Calculator State
  const [calibMode, setCalibMode] = useState<"QUICK" | "EXACT">("QUICK");
  const [calibPnlPercent, setCalibPnlPercent] = useState<string>("-18.87");
  const [calibTargetWalletId, setCalibTargetWalletId] = useState<number>(1);

  // Manual Holding Calibration & Ground Zero Initial Asset State
  const [isCalibrateModalOpen, setIsCalibrateModalOpen] = useState(false);
  const [calibratingHolding, setCalibratingHolding] = useState<any>(null);
  const [calibTicker, setCalibTicker] = useState<string>("BTC");
  const [calibCompanyName, setCalibCompanyName] = useState<string>("Bitcoin");
  const [calibAssetType, setCalibAssetType] = useState<AssetType>("CRYPTO");
  const [calibFetchingQuote, setCalibFetchingQuote] = useState(false);
  const [calibInvested, setCalibInvested] = useState<string>("");
  const [calibCurrentVal, setCalibCurrentVal] = useState<string>("");
  const [calibQty, setCalibQty] = useState<string>("");
  const [calibUnitPrice, setCalibUnitPrice] = useState<number>(0);
  const [calibSubmitting, setCalibSubmitting] = useState(false);
  const [calibMsg, setCalibMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // FX Dual-Return Analytics State
  const [fxData, setFxData] = useState<any>(null);
  const [fxLoading, setFxLoading] = useState<boolean>(false);

  const fetchAllPortfolioData = async (targetWId = selectedWalletId) => {
    try {
      setLoading(true);
      const [sumRes, walletsRes, healthRes, divRes] = await Promise.allSettled([
        api.get(targetWId === "all" || targetWId === 0 ? "/portfolio/summary/all" : `/portfolio/summary/${targetWId}`),
        api.get("/portfolio/wallets"),
        api.get(`/portfolio/health/${user?.id || 1}`),
        api.get(`/portfolio/dividends/${user?.id || 1}`),
      ]);

      if (sumRes.status === "fulfilled" && sumRes.value.data?.data) {
        setPortfolio(sumRes.value.data.data);
      }
      if (walletsRes.status === "fulfilled" && walletsRes.value.data?.data) {
        setWallets(walletsRes.value.data.data);
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
        portfolio_id: selectedWalletId === "all" ? 0 : selectedWalletId,
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
    fetchAllPortfolioData(selectedWalletId);

    // Auto update realtime setiap 1 menit (ringan & sesuai harga pasar)
    const interval = setInterval(() => {
      fetchAllPortfolioData(selectedWalletId);
      if (mainTab === "FX") fetchFxData();
    }, 60000);

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

    return () => clearInterval(interval);
  }, [mainTab, selectedWalletId]);

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
      const priceIdr = h.currency === "USD" ? (h.current_price || h.avg_buy_price || 85000) * fxRate : (h.current_price || h.avg_buy_price || 1400000);
      setTaxSellPrice(String(priceIdr));
    }
  };

    const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletName.trim()) return;
    setWalletSubmitting(true);
    setWalletMsg(null);
    try {
      const res = await api.post("/portfolio/wallets", {
        name: newWalletName.trim(),
        cash_balance: Number(newWalletCash) || 0,
      });
      if (res.data?.success || res.status === 200) {
        setWalletMsg({ type: "success", text: `Dompet ${newWalletName} berhasil dibuat!` });
        setNewWalletName("");
        setNewWalletCash("");
        await fetchAllPortfolioData(res.data.data?.id || selectedWalletId);
        if (res.data.data?.id) setSelectedWalletId(res.data.data.id);
        setTimeout(() => {
          setIsAddWalletModalOpen(false);
          setWalletMsg(null);
        }, 1200);
      }
    } catch (err: any) {
      setWalletMsg({ type: "error", text: err.response?.data?.message || "Gagal membuat dompet baru." });
    } finally {
      setWalletSubmitting(false);
    }
  };

  const handleDeleteWallet = async (walletId: number, walletName: string) => {
    if (!confirm(`Hapus dompet "${walletName}" beserta aset di dalamnya?`)) return;
    try {
      await api.delete(`/portfolio/wallets/${walletId}`);
      setSelectedWalletId("all");
      fetchAllPortfolioData("all");
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menghapus dompet.");
    }
  };

  const getAutoDetectedAssetType = (sym: string): AssetType => {
    let clean = sym.trim().toUpperCase();
    if (clean.endsWith("-USD")) clean = clean.replace(/-USD$/, "");
    if (["VT", "VOO", "VTI", "SPY", "QQQ", "IVV", "SCHD", "ARKK", "GLD"].includes(clean)) return "ETF";
    if (["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "SUI", "NEAR", "USDT", "USDC"].includes(clean)) return "CRYPTO";
    if (clean.includes("EMAS") || clean.includes("GOLD") || clean.includes("ANTAM") || clean.includes("UBS")) return "GOLD";
    if (clean.endsWith(".JK") || ["BBCA", "BBRI", "BMRI", "BBNI", "TLKM", "ASII", "GOTO", "ANTM"].includes(clean)) return "STOCK";
    return "STOCK";
  };

  const fetchQuoteForCalib = async (sym: string, typeHint?: AssetType) => {
    if (!sym) return;
    let clean = sym.trim().toUpperCase();
    if (clean.endsWith("-USD")) {
      const base = clean.replace(/-USD$/, "");
      if (["VT", "VOO", "VTI", "SPY", "QQQ", "IVV", "SCHD"].includes(base)) {
        clean = base;
        setCalibTicker(clean);
      }
    }
    const detected = typeHint || getAutoDetectedAssetType(clean);
    setCalibAssetType(detected);
    setCalibFetchingQuote(true);
    try {
      const res = await api.get(`/market/quote/${encodeURIComponent(clean)}`);
      const q = res.data?.data;
      if (q) {
        const rawP = Number(q.regularMarketPrice || 0);
        const isUSD = q.currency === "USD" || clean.includes("BTC") || clean.includes("ETH") || ["VT", "VOO", "VTI", "SPY", "QQQ"].includes(clean) || detected === "ETF";
        const priceIdr = isUSD ? rawP * fxRate : rawP;
        setCalibUnitPrice(priceIdr);
        setCalibCompanyName(q.name || clean);
        if (q.assetType) setCalibAssetType(q.assetType);
        
        // If current value is already entered, auto-compute quantity
        if (calibCurrentVal && Number(calibCurrentVal) > 0 && priceIdr > 0) {
          setCalibQty(String(Number((Number(calibCurrentVal) / priceIdr).toFixed(8))));
        }
      }
    } catch {
      // fallback if quote fetch fails
    } finally {
      setCalibFetchingQuote(false);
    }
  };

  const handleOpenAddInitialAsset = (defaultWalletId?: number) => {
    setCalibratingHolding(null);
    setCalibTicker("BTC");
    setCalibCompanyName("Bitcoin");
    setCalibAssetType("CRYPTO");
    const targetW = defaultWalletId || (selectedWalletId !== "all" ? Number(selectedWalletId) : (wallets[0]?.id || 1));
    setCalibTargetWalletId(targetW);
    setCalibInvested("");
    setCalibCurrentVal("");
    setCalibQty("");
    setCalibPnlPercent("");
    setCalibMode("QUICK");
    setCalibMsg(null);
    setIsCalibrateModalOpen(true);
    fetchQuoteForCalib("BTC", "CRYPTO");
  };

  const handleOpenCalibrate = (h: any) => {
    setCalibratingHolding(h);
    let sym = h.ticker;
    if (sym.endsWith("-USD")) {
      const base = sym.replace(/-USD$/, "");
      if (["VT", "VOO", "VTI", "SPY", "QQQ", "IVV", "SCHD"].includes(base)) {
        sym = base;
      }
    }
    const aType = (["VT", "VOO", "VTI", "SPY", "QQQ", "IVV", "SCHD"].includes(sym)) ? "ETF" : (h.asset_type || "STOCK");
    setCalibTicker(sym);
    setCalibCompanyName(h.company_name || sym);
    setCalibAssetType(aType);
    const investedIdr = Math.round(
      h.total_invested_idr ?? (h.currency === "USD" ? h.total_invested * fxRate : h.total_invested)
    );
    const marketValIdr = Math.round(
      h.market_value_idr ?? (h.currency === "USD" ? (h.market_value || h.total_invested) * fxRate : h.market_value || h.total_invested)
    );
    const qtyNum = Number(h.quantity || h.total_shares) || 1;
    const unitPrice = marketValIdr > 0 && qtyNum > 0 ? marketValIdr / qtyNum : 1;
    setCalibUnitPrice(unitPrice);
    setCalibInvested(String(investedIdr || 0));
    setCalibCurrentVal(String(marketValIdr || 0));
    setCalibQty(String(qtyNum));
    const diff = marketValIdr - investedIdr;
    const pnlPct = investedIdr > 0 ? Number(((diff / investedIdr) * 100).toFixed(2)) : 0;
    setCalibPnlPercent(String(pnlPct));
    setCalibTargetWalletId(h.portfolio_id || 1);
    setCalibMode("QUICK");
    setCalibMsg(null);
    setIsCalibrateModalOpen(true);
    fetchQuoteForCalib(sym, aType);
  };

  const handleDeleteHoldingFromCalib = async () => {
    if (!calibratingHolding) return;
    if (!confirm(`Hapus posisi aset ${calibratingHolding.ticker} dari portofolio Anda?`)) return;
    setCalibSubmitting(true);
    try {
      await api.put("/portfolio/calibrate", {
        holding_id: calibratingHolding.id,
        delete_holding: true,
        quantity: 0,
      });
      setCalibMsg({ type: "success", text: `Aset ${calibratingHolding.ticker} berhasil dihapus dari portofolio!` });
      fetchAllPortfolioData();
      setTimeout(() => setIsCalibrateModalOpen(false), 1000);
    } catch (err: any) {
      setCalibMsg({ type: "error", text: err.response?.data?.message || "Gagal menghapus aset." });
    } finally {
      setCalibSubmitting(false);
    }
  };

  const handleSaveCalibrate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCalibSubmitting(true);
    setCalibMsg(null);
    try {
      let cleanTicker = calibratingHolding ? calibratingHolding.ticker : calibTicker.trim().toUpperCase();
      if (cleanTicker.endsWith("-USD")) {
        const base = cleanTicker.replace(/-USD$/, "");
        if (["VT", "VOO", "VTI", "SPY", "QQQ", "IVV", "SCHD"].includes(base)) {
          cleanTicker = base;
        }
      }
      const finalAssetType = (["VT", "VOO", "VTI", "SPY", "QQQ", "IVV", "SCHD"].includes(cleanTicker))
        ? "ETF"
        : (calibratingHolding ? (calibratingHolding.ticker.startsWith("VT") ? "ETF" : calibratingHolding.asset_type) : calibAssetType);

      const payload: any = {
        target_portfolio_id: calibTargetWalletId,
        portfolio_id: calibTargetWalletId,
        ticker: cleanTicker,
        asset_type: finalAssetType,
        total_invested_idr: Math.round(Number(calibInvested)),
        quantity: Number(calibQty),
        current_value_idr: Number(calibCurrentVal),
        pnl_percent: Number(calibPnlPercent),
      };
      if (calibratingHolding?.id) {
        payload.holding_id = calibratingHolding.id;
      }

      const res = await api.put("/portfolio/calibrate", payload);
      if (res.data?.success || res.status === 200) {
        setCalibMsg({ 
          type: "success", 
          text: calibratingHolding 
            ? "Posisi aset berhasil dikalibrasi presisi!" 
            : "Saldo awal aset berhasil dicatat tanpa transaksi rekayasa!" 
        });
        fetchAllPortfolioData();
        setTimeout(() => setIsCalibrateModalOpen(false), 1200);
      }
    } catch (err: any) {
      setCalibMsg({ type: "error", text: err.response?.data?.message || "Gagal menyimpan saldo aset." });
    } finally {
      setCalibSubmitting(false);
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

    if (type === "SELL") {
      const owned = portfolio?.holdings?.find(
        (h: any) =>
          h.ticker.toUpperCase() === ticker.toUpperCase() ||
          h.ticker.toUpperCase() === `${ticker.toUpperCase()}-USD` ||
          h.ticker.toUpperCase() === `${ticker.toUpperCase()}.JK`
      );
      const isStock = assetType === "STOCK";
      const availableUnits = owned ? Number(isStock ? owned.total_lots || (owned.total_shares / 100) : owned.quantity) : 0;
      const requestedUnits = Number(quantity);

      if (!owned || requestedUnits > availableUnits || availableUnits <= 0) {
        alert(
          `Penjualan Ditolak: Anda hanya memiliki ${availableUnits} ${isStock ? "lot" : "unit"} dari ${ticker}. Kepemilikan aset tidak boleh minus!`
        );
        return;
      }
    }

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

  const currentPortfolio = portfolio;

  const filteredHoldings = (currentPortfolio?.holdings || []).filter((h: any) => {
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
              {currentPortfolio?.portfolio_name || "Portofolio Utama"}
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-normal border border-zinc-700">
                {currentPortfolio?.holdings_count || 3} Instrumen
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Total Investasi: <span className="text-zinc-200 font-semibold">{formatIDR(currentPortfolio?.total_invested || 0)}</span> | Nilai Live: <span className="text-emerald-400 font-semibold">{formatIDR(currentPortfolio?.total_market_value ?? currentPortfolio?.total_value ?? 0)}</span> | Kas: <span className="text-zinc-200 font-medium">{formatIDR(currentPortfolio?.cash_balance || 0)}</span>
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

            {/* Masukkan Nilai Awal Aset Button */}
            <button
              onClick={() => handleOpenAddInitialAsset()}
              className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition flex items-center gap-1.5 active:scale-[0.98]"
              title="Catat saldo awal aset dari Ajaib/Indodax dengan uang saat ini dan PnL%"
            >
              <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
              + Nilai Awal Aset
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
        {/* Multi-Dompet Modern Segmented Bar */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3 sm:p-4 backdrop-blur-md shadow-lg shadow-black/20">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                  Multi-Dompet & Akun Platform
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-400 font-normal">
                    {wallets.length} Dompet
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Kelola dan pisahkan aset Anda di berbagai exchange/sekuritas (Indodax, Tokocrypto, Pluang, dll.)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setWalletMsg(null);
                setIsAddWalletModalOpen(true);
              }}
              className="text-xs px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-semibold flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Dompet
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {/* Pill: Semua Dompet (Total Konsolidasi) */}
            <button
              type="button"
              onClick={() => setSelectedWalletId("all")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition shrink-0 ${
                selectedWalletId === "all"
                  ? "bg-zinc-100 text-zinc-950 border-zinc-200 shadow-md font-bold ring-2 ring-zinc-100/20"
                  : "bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>Semua Dompet</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-medium">
                Total Konsolidasi
              </span>
            </button>

            {/* Individual Wallets */}
            {wallets.map((w: any) => {
              const isSelected = selectedWalletId === w.id;
              const isPnlUp = (w.floating_pnl || 0) >= 0;
              return (
                <div key={w.id} className="relative group shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedWalletId(w.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition ${
                      isSelected
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-md ring-2 ring-emerald-500/20"
                        : "bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                    }`}
                  >
                    <Building2 className={`w-3.5 h-3.5 ${isSelected ? "text-emerald-400" : "text-zinc-500"}`} />
                    <span>{w.name}</span>
                    <span className={`text-[11px] font-bold ${isPnlUp ? "text-emerald-400" : "text-red-400"}`}>
                      {formatIDR(w.total_market_value || w.total_net_worth || 0)}
                    </span>
                    {w.floating_pnl_percent !== 0 && (
                      <span className={`text-[9px] px-1 py-0.2 rounded ${isPnlUp ? "bg-emerald-950 text-emerald-400 border border-emerald-800/40" : "bg-red-950 text-red-400 border border-red-800/40"}`}>
                        {isPnlUp ? "+" : ""}{w.floating_pnl_percent}%
                      </span>
                    )}
                  </button>
                  {wallets.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWallet(w.id, w.name);
                      }}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-zinc-800 hover:bg-red-600 text-zinc-400 hover:text-white items-center justify-center hidden group-hover:flex text-[9px] border border-zinc-700 transition"
                      title={`Hapus dompet ${w.name}`}
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <PortfolioChartCard
          portfolioId={selectedWalletId}
          totalNetWorth={currentPortfolio?.total_market_value ?? currentPortfolio?.total_value ?? 0}
          totalInvested={currentPortfolio?.total_invested || 0}
          cashBalance={currentPortfolio?.cash_balance || 0}
          holdings={currentPortfolio?.holdings}
        />

        {/* Primary View Switcher - Premium Pluang Glass Segmented Bar */}
        <div className="relative">
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#0c0e14]/90 backdrop-blur-md border border-white/5 overflow-x-auto no-scrollbar scroll-smooth shadow-lg shadow-black/40">
            <button
              onClick={() => setMainTab("HOLDINGS")}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 flex items-center gap-2 whitespace-nowrap outline-none focus:outline-none shrink-0 ${
                mainTab === "HOLDINGS"
                  ? "bg-zinc-800 text-zinc-100 border border-white/10 shadow-sm font-semibold"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] border border-transparent"
              }`}
            >
              <Layers className={`w-4 h-4 ${mainTab === "HOLDINGS" ? "text-white" : "text-zinc-400"}`} />
              Portofolio & Aset
            </button>

            <button
              onClick={() => setMainTab("REBALANCE")}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 flex items-center gap-2 whitespace-nowrap outline-none focus:outline-none shrink-0 ${
                mainTab === "REBALANCE"
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm font-semibold"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] border border-transparent"
              }`}
            >
              <Scale className={`w-4 h-4 ${mainTab === "REBALANCE" ? "text-emerald-400" : "text-emerald-500/70"}`} />
              AI Rebalancing
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold border ${
                mainTab === "REBALANCE" 
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" 
                  : "bg-emerald-950/60 text-emerald-400 border-emerald-800/50"
              }`}>
                Inflow AI
              </span>
            </button>

            <button
              onClick={() => setMainTab("FX")}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 flex items-center gap-2 whitespace-nowrap outline-none focus:outline-none shrink-0 ${
                mainTab === "FX"
                  ? "bg-blue-500/15 text-blue-300 border border-blue-500/30 shadow-sm font-semibold"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] border border-transparent"
              }`}
            >
              <Globe className={`w-4 h-4 ${mainTab === "FX" ? "text-blue-400" : "text-blue-500/70"}`} />
              Analisis Kurs
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold border ${
                mainTab === "FX" 
                  ? "bg-blue-500/20 text-blue-300 border-blue-500/40" 
                  : "bg-blue-950/60 text-blue-400 border-blue-800/50"
              }`}>
                USD/IDR
              </span>
            </button>

            <button
              onClick={() => setMainTab("TAX")}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 flex items-center gap-2 whitespace-nowrap outline-none focus:outline-none shrink-0 ${
                mainTab === "TAX"
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm font-semibold"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] border border-transparent"
              }`}
            >
              <Receipt className={`w-4 h-4 ${mainTab === "TAX" ? "text-amber-400" : "text-amber-500/70"}`} />
              Pajak & SPT
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold border ${
                mainTab === "TAX" 
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40" 
                  : "bg-amber-950/60 text-amber-400 border-amber-800/50"
              }`}>
                PPh Final
              </span>
            </button>

            <button
              onClick={() => setMainTab("HEALTH")}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 flex items-center gap-2 whitespace-nowrap outline-none focus:outline-none shrink-0 ${
                mainTab === "HEALTH"
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm font-semibold"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] border border-transparent"
              }`}
            >
              <Activity className={`w-4 h-4 ${mainTab === "HEALTH" ? "text-emerald-400" : "text-emerald-500/70"}`} />
              Health Score
              {healthData?.health_score !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold border ${
                  healthData.health_score >= 70 
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" 
                    : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                }`}>
                  {healthData.health_score}
                </span>
              )}
            </button>

            <button
              onClick={() => setMainTab("DIVIDENDS")}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 flex items-center gap-2 whitespace-nowrap outline-none focus:outline-none shrink-0 ${
                mainTab === "DIVIDENDS"
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm font-semibold"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] border border-transparent"
              }`}
            >
              <Calendar className={`w-4 h-4 ${mainTab === "DIVIDENDS" ? "text-amber-400" : "text-amber-500/70"}`} />
              Kalender Dividen
            </button>
          </div>
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
                      <th className="py-3 px-4">HARGA SAAT INI</th>
                      <th className="py-3 px-4">TOTAL MODAL</th>
                      <th className="py-3 px-4">NILAI ASET SAAT INI</th>
                      <th className="py-3 px-4">FLOATING P/L</th>
                      <th className="py-3 px-6 text-right">BOBOT</th>
                      <th className="py-3 px-4 text-center">KALIBRASI</th>
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
                          (h.currency === "USD" ? h.total_invested * fxRate : h.total_invested);
                        const marketValIdr =
                          h.market_value_idr ??
                          (h.currency === "USD"
                            ? (h.market_value || h.total_invested) * fxRate
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
                                {selectedWalletId !== "all" && h.portfolio_name && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-400 border border-emerald-800/40 font-medium">
                                    {h.portfolio_name}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-zinc-400 truncate max-w-[200px] mt-0.5">
                                {h.company_name}
                              </div>

                              {/* Multi-Exchange Detailed Breakdown & Direct Navigation Pill Hub */}
                              {selectedWalletId === "all" && h.wallet_breakdown && h.wallet_breakdown.length > 0 && (
                                <div className="mt-2.5 pt-2 border-t border-zinc-800/60 space-y-1.5">
                                  <div className="text-[10px] font-medium text-zinc-400 flex items-center gap-1">
                                    <Building2 className="w-3 h-3 text-emerald-400" />
                                    <span>Tersedia di {h.wallet_breakdown.length} exchange (klik untuk buka dompet):</span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {h.wallet_breakdown.map((wb: any) => {
                                      const isWbPnlUp = (wb.floating_pnl || 0) >= 0;
                                      return (
                                        <button
                                          key={wb.wallet_id}
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedWalletId(wb.wallet_id);
                                          }}
                                          className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-950/90 hover:bg-emerald-950/70 border border-zinc-800 hover:border-emerald-500/50 text-[11px] transition shadow-sm cursor-pointer active:scale-95 text-left"
                                          title={`Klik untuk langsung menuju dompet ${wb.wallet_name}`}
                                        >
                                          <span className="font-bold text-zinc-100 group-hover:text-emerald-300 capitalize">
                                            {wb.wallet_name}:
                                          </span>
                                          <span className="font-mono text-zinc-300 group-hover:text-emerald-200">
                                            {isStock
                                              ? `${wb.total_lots || 0} Lot`
                                              : `${Number(wb.quantity).toLocaleString(undefined, { maximumFractionDigits: 8 })} unit`}
                                          </span>
                                          <span className="text-zinc-500 text-[10px] font-mono">
                                            ({formatIDR(wb.market_value_idr || wb.market_value || 0)})
                                          </span>
                                          {wb.floating_pnl_percent !== undefined && (
                                            <span
                                              className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                                                isWbPnlUp
                                                  ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/40"
                                                  : "bg-red-950/80 text-red-400 border border-red-800/40"
                                              }`}
                                            >
                                              {isWbPnlUp ? "+" : ""}
                                              {wb.floating_pnl_percent}%
                                            </span>
                                          )}
                                          <ExternalLink className="w-2.5 h-2.5 text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition shrink-0" />
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
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
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-zinc-100">
                              {formatIDR(marketValIdr)}
                              {h.currency === "USD" && (
                                <div className="text-[10px] text-zinc-500 font-normal">
                                  ${Number(h.market_value || (marketValIdr / fxRate)).toLocaleString(undefined, {
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
                                  {formatIDR(h.floating_pnl || 0)}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {selectedWalletId === "all" ? (
                                h.wallet_breakdown && h.wallet_breakdown.length > 1 ? (
                                  <div className="flex flex-col gap-1 items-center">
                                    <span className="text-[10px] text-zinc-400 font-medium">Buka dompet:</span>
                                    <div className="flex flex-wrap gap-1 justify-center max-w-[150px]">
                                      {h.wallet_breakdown.map((wb: any) => (
                                        <button
                                          key={wb.wallet_id}
                                          type="button"
                                          onClick={() => setSelectedWalletId(wb.wallet_id)}
                                          className="px-2 py-1 rounded-lg bg-zinc-800/80 hover:bg-emerald-950/60 text-zinc-300 hover:text-emerald-300 border border-zinc-700/60 hover:border-emerald-700/60 text-[10px] font-semibold transition capitalize flex items-center gap-1 shadow-sm active:scale-95"
                                          title={`Buka dompet ${wb.wallet_name}`}
                                        >
                                          <span>{wb.wallet_name}</span>
                                          <ArrowRight className="w-2.5 h-2.5" />
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const targetW = wallets.find(
                                        (w) =>
                                          w.name === h.portfolio_name ||
                                          w.id === h.portfolio_id ||
                                          (h.wallet_breakdown && h.wallet_breakdown[0]?.wallet_id === w.id)
                                      );
                                      if (targetW) {
                                        setSelectedWalletId(targetW.id);
                                      } else if (wallets.length > 0) {
                                        setSelectedWalletId(wallets[0].id);
                                      }
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-zinc-800/60 hover:bg-emerald-950/40 text-zinc-300 hover:text-emerald-300 border border-zinc-700/60 hover:border-emerald-700/60 text-[11px] font-medium transition flex items-center gap-1.5 mx-auto active:scale-95"
                                    title={`Buka dompet ${h.portfolio_name || "spesifik"} untuk mengatur modal & saldo`}
                                  >
                                    <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                                    <span>
                                      {h.wallet_breakdown && h.wallet_breakdown[0]
                                        ? `Buka di ${h.wallet_breakdown[0].wallet_name}`
                                        : "Buka di Dompet"}
                                    </span>
                                  </button>
                                )
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenCalibrate(h)}
                                  className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60 hover:border-emerald-500/50 text-[11px] font-medium transition flex items-center gap-1.5 mx-auto"
                                  title={`Atur Modal & Saldo Riil di dompet ${currentPortfolio?.portfolio_name || "ini"}`}
                                >
                                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Kalibrasi</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={9} className="py-12 px-4">
                          <div className="max-w-md mx-auto text-center space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                              <Sparkles className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-zinc-200">
                                {loading ? "Memuat data portofolio..." : "Belum Ada Aset Tercatat di Dompet Ini"}
                              </h4>
                              <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                                Punya aset di Ajaib, Indodax, atau Pluang? Cukup masukkan saldo uang saat ini & persentase untung/rugi secara langsung tanpa perlu repot mencatat transaksi beli masa lalu!
                              </p>
                            </div>
                            {!loading && (
                              <button
                                type="button"
                                onClick={() => handleOpenAddInitialAsset()}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition active:scale-[0.98]"
                              >
                                <Sparkles className="w-4 h-4" />
                                + Masukkan Nilai Awal (Ajaib / Indodax)
                              </button>
                            )}
                          </div>
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
                    <div className="text-sm font-bold text-emerald-400">1 USD = Rp {fxRate.toLocaleString('id-ID')}</div>
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
                      <th className="py-3 px-4">NILAI SAAT INI (USD)</th>
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
                      id: "STATELESS_GLOBAL",
                      name: "Stateless Global Macro",
                      desc: "60% ETF Global (VT), 20% Emas, 20% Bitcoin. 0% Keterikatan Saham Lokal.",
                      tag: "Bebas Risiko Negara",
                    },
                    {
                      id: "ALL_WEATHER_GLOBAL",
                      name: "Classic All-Weather Global",
                      desc: "50% ETF Global (VT), 30% Emas Logam Mulia, 15% Bitcoin, 5% Saham Pilihan.",
                      tag: "Tahan Segala Siklus",
                    },
                    {
                      id: "HIGH_ALPHA_GLOBAL",
                      name: "Aggressive Global Alpha",
                      desc: "55% ETF Global (VT), 35% Bitcoin & Kripto, 10% Emas. 0% Saham Domestik.",
                      tag: "Maksimal Pertumbuhan",
                    },
                    {
                      id: "CAPITAL_DEFENSE",
                      name: "Global Capital Preservation",
                      desc: "45% Emas Logam Mulia, 40% ETF Global (VT), 10% Kripto, 5% Saham.",
                      tag: "Pelindung Nilai Inflasi",
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
                        <div className="text-[10px] text-zinc-400">Total Nilai Aset Saat Ini</div>
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
                      <th className="py-3 px-4">NILAI ASET SAAT INI</th>
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
                    ASISTEN+STOCK WEALTH & FAMILY OFFICE
                  </span>
                  <h2 className="text-xl font-black text-zinc-100 print:text-black mt-0.5">
                    EXECUTIVE PORTFOLIO FACTSHEET
                  </h2>
                  <div className="text-[11px] text-zinc-400 print:text-zinc-600 mt-1">
                    Pemilik Portofolio: <strong className="text-zinc-200 print:text-black">Adam (Asisten+Stock User)</strong> | Per Tanggal: <strong className="text-zinc-200 print:text-black">{new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</strong>
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
                  <span>Daftar Instrumen & Nilai Aset Saat Ini</span>
                  <span className="text-[10px] font-normal text-zinc-500">Harga Terakhir Real-time</span>
                </div>

                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="text-zinc-400 border-b border-zinc-800 pb-2 font-semibold print:text-black print:border-black">
                      <th className="pb-1.5">SIMBOL & KELAS</th>
                      <th className="pb-1.5">KUANTITAS</th>
                      <th className="pb-1.5 text-right">HARGA BELI</th>
                      <th className="pb-1.5 text-right">NILAI SAAT INI (RP)</th>
                      <th className="pb-1.5 text-right">FLOATING P/L</th>
                      <th className="pb-1.5 text-right">BOBOT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 print:divide-zinc-300">
                    {(portfolio?.holdings || []).map((h: any, idx: number) => {
                      const isUp = (h.floating_pnl || 0) >= 0;
                      const marketVal = h.currency === "USD" ? (h.market_value || h.total_invested) * fxRate : h.market_value || h.total_invested;

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
                <span>Dihasilkan secara otomatis oleh Asisten+Stock AI Wealth Advisory System</span>
                <span>Kerahasiaan Dokumen: Sangat Rahasia (Private)</span>
              </div>
            </div>
          </div>
        </Modal>

        
        {/* MODAL KALIBRASI POSISI PORTOFOLIO & GROUND ZERO NILAI AWAL */}
        <Modal
          isOpen={isCalibrateModalOpen}
          onClose={() => setIsCalibrateModalOpen(false)}
          title={
            calibratingHolding
              ? `Kalibrasi Posisi: ${calibratingHolding.ticker}`
              : "Masukkan Saldo Awal Aset (Ajaib / Indodax / Pluang)"
          }
        >
          <form onSubmit={handleSaveCalibrate} className="space-y-4 text-xs sm:text-sm">
            {/* Header Identity Card */}
            {calibratingHolding ? (
              /* Editing existing holding */
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-semibold border border-zinc-700/60">
                    {calibratingHolding.asset_type || "ASET"}
                  </span>
                  <div className="font-bold text-sm text-zinc-100 mt-1">
                    {calibratingHolding.ticker}
                  </div>
                  <div className="text-[11px] text-zinc-400 truncate max-w-[200px]">
                    {calibratingHolding.company_name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-zinc-500">Harga Bursa Saat Ini</div>
                  <div className="font-semibold text-emerald-400">
                    {formatIDR(calibUnitPrice || 0)}
                  </div>
                </div>
              </div>
            ) : (
              /* Adding brand new initial asset */
              <div className="space-y-3 p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200">
                    PILIH INSTRUMEN / ASET YANG DIMILIKI
                  </span>
                  {calibFetchingQuote ? (
                    <span className="text-[10px] text-emerald-400 animate-pulse flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Mengambil harga live...
                    </span>
                  ) : calibUnitPrice > 0 ? (
                    <span className="text-[10px] text-emerald-400 font-medium">
                      Harga Live: {formatIDR(calibUnitPrice)}
                    </span>
                  ) : null}
                </div>

                {/* Ticker Input & Live Quote Trigger */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={calibTicker}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setCalibTicker(val);
                        const detected = getAutoDetectedAssetType(val);
                        setCalibAssetType(detected);
                      }}
                      onBlur={() => fetchQuoteForCalib(calibTicker, calibAssetType)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          fetchQuoteForCalib(calibTicker, calibAssetType);
                        }
                      }}
                      placeholder="Ketik simbol, misal: BTC, ETH, BBCA, VT"
                      required
                      className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-zinc-100 font-bold text-xs uppercase focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchQuoteForCalib(calibTicker, calibAssetType)}
                    className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition shrink-0"
                  >
                    Cek Harga
                  </button>
                </div>

                {/* Asset Class Selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-zinc-400 font-medium">Kelas Aset:</span>
                  {[
                    { type: "CRYPTO" as AssetType, label: "Kripto" },
                    { type: "ETF" as AssetType, label: "ETF Global" },
                    { type: "STOCK" as AssetType, label: "Saham IDX" },
                    { type: "GOLD" as AssetType, label: "Emas" },
                  ].map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => {
                        setCalibAssetType(item.type);
                        fetchQuoteForCalib(calibTicker, item.type);
                      }}
                      className={`text-[10px] px-2.5 py-0.5 rounded-lg border transition ${
                        calibAssetType === item.type
                          ? "bg-emerald-500/20 text-emerald-300 font-bold border-emerald-500/50 shadow-sm"
                          : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Quick Asset Pills */}
                <div>
                  <div className="text-[10px] text-zinc-400 mb-1.5">Pilihan Cepat Populer:</div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { sym: "BTC", type: "CRYPTO" as AssetType, label: "BTC (Bitcoin)" },
                      { sym: "ETH", type: "CRYPTO" as AssetType, label: "ETH (Ethereum)" },
                      { sym: "SOL", type: "CRYPTO" as AssetType, label: "SOL (Solana)" },
                      { sym: "BBCA", type: "STOCK" as AssetType, label: "BBCA (BCA)" },
                      { sym: "BBRI", type: "STOCK" as AssetType, label: "BBRI (BRI)" },
                      { sym: "VT", type: "ETF" as AssetType, label: "VT (Global ETF)" },
                      { sym: "EMAS", type: "GOLD" as AssetType, label: "Emas (Antam)" },
                    ].map((item) => (
                      <button
                        key={item.sym}
                        type="button"
                        onClick={() => {
                          setCalibTicker(item.sym);
                          setCalibAssetType(item.type);
                          fetchQuoteForCalib(item.sym, item.type);
                        }}
                        className={`text-[10px] px-2 py-1 rounded-lg border transition ${
                          calibTicker === item.sym
                            ? "bg-emerald-500 text-zinc-950 font-bold border-emerald-400"
                            : "bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {calibCompanyName && (
                  <div className="text-[11px] text-zinc-400 flex items-center justify-between border-t border-zinc-800/60 pt-2">
                    <span>Nama: <strong className="text-zinc-200">{calibCompanyName}</strong></span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                      Kelas: {calibAssetType}
                    </span>
                  </div>
                )}
              </div>
            )}

            {calibMsg && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                calibMsg.type === "success"
                  ? "bg-emerald-950/30 border-emerald-800/60 text-emerald-300"
                  : "bg-red-950/30 border-red-800/60 text-red-300"
              }`}>
                <span>{calibMsg.text}</span>
              </div>
            )}

            {/* Target Wallet / Platform Selection */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                SIMPAN DI DOMPET / PLATFORM EXCHANGE
              </label>
              <select
                value={calibTargetWalletId}
                onChange={(e) => setCalibTargetWalletId(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-zinc-100 text-xs focus:outline-none"
              >
                {wallets.map((w: any) => (
                  <option key={w.id} value={w.id}>
                    {w.name} (Saldo Kas: {formatIDR(w.cash_balance || 0)})
                  </option>
                ))}
              </select>
              <div className="text-[10px] text-zinc-500 mt-1">
                Pilih di dompet mana aset ini berada (misal: Ajaib, Indodax, Pluang, Tokocrypto).
              </div>
            </div>

            {/* Mode Toggle: Mode Cepat vs Mode Standar */}
            <div className="p-1 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCalibMode("QUICK")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                  calibMode === "QUICK"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Mode Cepat (Uang Saat Ini + PnL %)
              </button>
              <button
                type="button"
                onClick={() => setCalibMode("EXACT")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                  calibMode === "EXACT"
                    ? "bg-zinc-800 text-zinc-200 border border-zinc-700 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Mode Standar (Modal Riil & Unit)
              </button>
            </div>

            {calibMode === "QUICK" ? (
              /* === MODE CEPAT: UANG SAAT INI + PNL % === */
              <div className="space-y-3.5 p-3.5 rounded-xl bg-emerald-950/10 border border-emerald-800/30">
                <div>
                  <label className="block text-xs font-semibold text-zinc-200 mb-1">
                    1. UANG / SALDO ASET SAAT INI (IDR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">
                      Rp
                    </span>
                    <input
                      type="number"
                      value={calibCurrentVal}
                      onChange={(e) => {
                        const vStr = e.target.value;
                        setCalibCurrentVal(vStr);
                        const curV = Number(vStr);
                        const pPct = Number(calibPnlPercent);
                        if (!isNaN(curV) && !isNaN(pPct)) {
                          const calculatedModal = pPct !== -100 ? curV / (1 + pPct / 100) : curV;
                          setCalibInvested(String(Math.round(calculatedModal)));
                          if (calibUnitPrice > 0) {
                            setCalibQty(String(Number((curV / calibUnitPrice).toFixed(8))));
                          }
                        }
                      }}
                      placeholder="4300000"
                      required
                      min={0}
                      className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-lg pl-9 pr-3 py-2 text-zinc-100 text-xs font-bold focus:outline-none"
                    />
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1">
                    Masukkan nilai saldo saat ini di aplikasi Anda (misal: Ajaib/Indodax).
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-zinc-200">
                      2. PERSENTASE UNTUNG / RUGI (PNL %)
                    </label>
                    <span className="text-[10px] text-zinc-400">Gunakan minus (-) jika rugi</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={calibPnlPercent}
                      onChange={(e) => {
                        const pStr = e.target.value;
                        setCalibPnlPercent(pStr);
                        const pPct = Number(pStr);
                        const curV = Number(calibCurrentVal);
                        if (!isNaN(curV) && !isNaN(pPct)) {
                          const calculatedModal = pPct !== -100 ? curV / (1 + pPct / 100) : curV;
                          setCalibInvested(String(Math.round(calculatedModal)));
                          if (calibUnitPrice > 0) {
                            setCalibQty(String(Number((curV / calibUnitPrice).toFixed(8))));
                          }
                        }
                      }}
                      placeholder="-18.87"
                      required
                      className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-lg pr-9 pl-3 py-2 text-zinc-100 text-xs font-bold focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">
                      %
                    </span>
                  </div>

                  {/* Quick Helper Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-zinc-500">Pilihan Cepat:</span>
                    {["-25", "-20", "-18.87", "-15", "-10", "-5", "0", "+10", "+25"].map((pctStr) => (
                      <button
                        key={pctStr}
                        type="button"
                        onClick={() => {
                          setCalibPnlPercent(pctStr);
                          const pPct = Number(pctStr);
                          const curV = Number(calibCurrentVal);
                          if (!isNaN(curV) && !isNaN(pPct)) {
                            const calculatedModal = pPct !== -100 ? curV / (1 + pPct / 100) : curV;
                            setCalibInvested(String(Math.round(calculatedModal)));
                            if (calibUnitPrice > 0) {
                              setCalibQty(String(Number((curV / calibUnitPrice).toFixed(8))));
                            }
                          }
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded border transition ${
                          calibPnlPercent === pctStr
                            ? "bg-emerald-500 text-zinc-950 font-bold border-emerald-400"
                            : "bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        }`}
                      >
                        {pctStr}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Auto-Math Preview Card */}
                {Number(calibCurrentVal) > 0 && (
                  <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2">
                    <div className="text-[10px] uppercase font-bold text-zinc-400 flex items-center justify-between">
                      <span>Hasil Perhitungan Otomatis Sistem:</span>
                      <span className="text-emerald-400">Bebas Hitung Manual</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                        <div className="text-[10px] text-zinc-500">Modal Ditanam (Otomatis)</div>
                        <div className="font-bold text-zinc-100 text-sm mt-0.5">
                          {formatIDR(Math.round(Number(calibInvested)) || 0)}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                        <div className="text-[10px] text-zinc-500">Estimasi Untung/Rugi</div>
                        <div className={`font-bold text-sm mt-0.5 ${
                          Number(calibCurrentVal) - Number(calibInvested) >= 0 ? "text-emerald-400" : "text-red-400"
                        }`}>
                          {Number(calibCurrentVal) - Number(calibInvested) >= 0 ? "+" : ""}
                          {formatIDR(Number(calibCurrentVal) - Number(calibInvested))}
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      🪙 Kuantitas koin desimal otomatis dihitung: <strong className="text-zinc-200">{calibQty} unit</strong> (berdasarkan harga bursa terkini).
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* === MODE STANDAR: MODAL RIIL & UNIT === */
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    TOTAL MODAL BELI RIIL (INVESTED CAPITAL - IDR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-500">
                      Rp
                    </span>
                    <input
                      type="number"
                      value={calibInvested}
                      onChange={(e) => setCalibInvested(e.target.value)}
                      required
                      min={1}
                      className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-lg pl-9 pr-3 py-2 text-zinc-100 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    UANG / SALDO ASET SAAT INI (IDR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-500">
                      Rp
                    </span>
                    <input
                      type="number"
                      value={calibCurrentVal}
                      onChange={(e) => {
                        const vStr = e.target.value;
                        setCalibCurrentVal(vStr);
                        const vNum = Number(vStr);
                        if (calibUnitPrice > 0 && !isNaN(vNum)) {
                          setCalibQty(String(Number((vNum / calibUnitPrice).toFixed(8))));
                        }
                      }}
                      min={0}
                      className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-lg pl-9 pr-3 py-2 text-zinc-100 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    KUANTITAS / UNIT RIIL YANG DIMILIKI
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={calibQty}
                    onChange={(e) => {
                      const qStr = e.target.value;
                      setCalibQty(qStr);
                      const qNum = Number(qStr);
                      if (calibUnitPrice > 0 && !isNaN(qNum)) {
                        setCalibCurrentVal(String(Math.round(qNum * calibUnitPrice)));
                      }
                    }}
                    required
                    min="0.00000001"
                    className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-zinc-100 text-xs focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between gap-2">
              {calibratingHolding ? (
                <button
                  type="button"
                  onClick={handleDeleteHoldingFromCalib}
                  disabled={calibSubmitting}
                  className="px-3 py-2 rounded-lg bg-red-950/30 hover:bg-red-900/50 border border-red-800/50 text-red-400 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                  title="Hapus aset ini jika Anda sebenarnya tidak memilikinya"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Aset Ini
                </button>
              ) : (
                <div className="text-[11px] text-zinc-500 hidden sm:block">
                  ⚡ Tercatat instan tanpa transaksi beli palsu
                </div>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsCalibrateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={calibSubmitting}
                  className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {calibSubmitting
                    ? "Menyimpan..."
                    : calibratingHolding
                    ? "Simpan Perubahan"
                    : "Simpan Saldo Awal Aset"}
                </button>
              </div>
            </div>
          </form>
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

            {/* Hint Saldo Tersedia saat JUAL */}
            {type === "SELL" && (() => {
              const owned = portfolio?.holdings?.find(
                (h: any) =>
                  h.ticker.toUpperCase() === ticker.toUpperCase() ||
                  h.ticker.toUpperCase() === `${ticker.toUpperCase()}-USD` ||
                  h.ticker.toUpperCase() === `${ticker.toUpperCase()}.JK`
              );
              const isStock = assetType === "STOCK";
              const avail = owned ? Number(isStock ? owned.total_lots || (owned.total_shares / 100) : owned.quantity) : 0;
              const isExceed = Number(quantity || 0) > avail;

              return (
                <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                  avail > 0 ? (isExceed ? "bg-red-950/30 border-red-800/60 text-red-300" : "bg-amber-950/30 border-amber-800/60 text-amber-300") : "bg-red-950/30 border-red-800/60 text-red-300"
                }`}>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Status Kepemilikan:</span>
                    <span>Tersedia: <strong>{avail} {isStock ? "Lot" : "Unit"}</strong></span>
                    {isExceed && (
                      <div className="text-[11px] text-red-400 font-semibold mt-0.5">
                        Jumlah melebihi saldo! Kepemilikan aset tidak boleh minus.
                      </div>
                    )}
                  </div>
                  {avail > 0 && (
                    <button
                      type="button"
                      onClick={() => setQuantity(String(avail))}
                      className="px-2.5 py-1 rounded-lg bg-amber-900/60 hover:bg-amber-800 text-amber-200 border border-amber-700/60 text-[10px] font-bold"
                    >
                      Jual Semua (100%)
                    </button>
                  )}
                </div>
              );
            })()}

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
      
        {/* MODAL TAMBAH DOMPET / AKUN PLATFORM BARU */}
        <Modal
          isOpen={isAddWalletModalOpen}
          onClose={() => setIsAddWalletModalOpen(false)}
          title="Tambah Dompet / Akun Platform Baru"
        >
          <form onSubmit={handleCreateWallet} className="space-y-4 text-xs sm:text-sm">
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-zinc-100">Buat Kantong Akun Baru</h4>
                <p className="text-[11px] text-zinc-400">
                  Pisahkan pencatatan portofolio per exchange atau sekuritas (misal: Indodax, Tokocrypto, Pluang, Ajaib).
                </p>
              </div>
            </div>

            {walletMsg && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                walletMsg.type === "success"
                  ? "bg-emerald-950/30 border-emerald-800/60 text-emerald-300"
                  : "bg-red-950/30 border-red-800/60 text-red-300"
              }`}>
                <span>{walletMsg.text}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                NAMA DOMPET / EXCHANGE *
              </label>
              <input
                type="text"
                placeholder="Contoh: Indodax, Tokocrypto, Pluang, Ajaib"
                value={newWalletName}
                onChange={(e) => setNewWalletName(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-zinc-100 text-xs focus:outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                SISA KAS TUNAI / SALDO RDN MENGENDAP (OPSIONAL - IDR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-500">
                  Rp
                </span>
                <input
                  type="number"
                  placeholder="0"
                  value={newWalletCash}
                  onChange={(e) => setNewWalletCash(e.target.value)}
                  min={0}
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-lg pl-9 pr-3 py-2 text-zinc-100 text-xs focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">
                💡 <em>Bukan nilai aset/koin.</em> Isi <strong>0</strong> jika semua uang di platform ini sudah terbelanjakan menjadi koin/saham.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddWalletModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={walletSubmitting || !newWalletName.trim()}
                className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {walletSubmitting ? "Menyimpan..." : "Buat Dompet"}
              </button>
            </div>
          </form>
        </Modal>

      </main>
    </div>
  );
}
