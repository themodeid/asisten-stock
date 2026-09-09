"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { api, formatIDR } from "@/services/api";
import { ChevronUp, ChevronDown, Info, ArrowUpRight, ArrowDownRight, RefreshCw, Layers } from "lucide-react";
import { calculatePortfolioHistoricalPoints, ChartPoint } from "@/services/portfolioHistoricalEngine";

type TimeframeOption = "1W" | "1M" | "3M" | "YTD" | "1Y" | "ALL";

interface AnchorPoint {
  x: number;
  y: number;
  val: number;
  date: string;
}

interface RenderedPoint {
  x: number;
  y: number;
  point: ChartPoint;
}

interface PortfolioChartCardProps {
  portfolioId?: number | string;
  totalNetWorth?: number;
  totalInvested?: number;
  cashBalance?: number;
  holdings?: any[];
  isPrivate?: boolean;
  headerRightSlot?: React.ReactNode;
  quickActionsSlot?: React.ReactNode;
}

export default function PortfolioChartCard({
  portfolioId = "all",
  totalNetWorth,
  totalInvested,
  cashBalance,
  holdings,
  isPrivate = false,
  headerRightSlot,
  quickActionsSlot,
}: PortfolioChartCardProps) {
  const [timeframe, setTimeframe] = useState<TimeframeOption>("ALL");
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>(() => {
    return new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  });

  const svgRef = useRef<SVGSVGElement | null>(null);

  const fetchChart = async (tf: TimeframeOption = timeframe) => {
    try {
      setLoading(true);
      const targetPid = (portfolioId === "all" || portfolioId === 0 || !portfolioId) ? "all" : portfolioId;
      const res = await api.get(`/portfolio/chart/${targetPid}?timeframe=${tf}`);
      if (res.data?.data) {
        setChartData(res.data.data);
      }
    } catch (err) {
      console.warn("Failed fetching chart data:", err);
      setChartData(null);
    } finally {
      setLoading(false);
      setLastUpdated(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
    }
  };

  useEffect(() => {
    setChartData(null);
    fetchChart(timeframe);

    // Auto-refresh realtime setiap 1 menit (ringan & hemat CPU)
    const interval = setInterval(() => {
      fetchChart(timeframe);
    }, 60000);

    return () => clearInterval(interval);
  }, [timeframe, portfolioId]);

  // Mathematically computed portfolio history tied directly to actual owned assets
  const computedHistory = useMemo(() => {
    return calculatePortfolioHistoricalPoints(timeframe, holdings, cashBalance || 0);
  }, [timeframe, holdings, cashBalance]);

  const points: ChartPoint[] = (chartData?.points && chartData.points.length >= 2)
    ? chartData.points
    : computedHistory.points;

  const activeStartVal = chartData?.start_value ?? (timeframe === "ALL" ? (totalInvested || 0) : computedHistory.start_value);
  const activeCurrentVal = chartData?.current_value ?? (totalNetWorth || computedHistory.current_value || 0);
  const activeChangeNominal = chartData?.change_nominal ?? (activeCurrentVal - activeStartVal);
  const activeChangePercent = chartData?.change_percent ?? (activeStartVal > 0 ? (activeChangeNominal / activeStartVal) * 100 : 0);

  const {
    pathD,
    areaD,
    minPoint,
    maxPoint,
    renderedPoints,
  } = useMemo<{
    pathD: string;
    areaD: string;
    minPoint: AnchorPoint | null;
    maxPoint: AnchorPoint | null;
    renderedPoints: RenderedPoint[];
  }>(() => {
    if (points.length === 0) {
      return { pathD: "", areaD: "", minPoint: null, maxPoint: null, renderedPoints: [] };
    }

    const W = 620;
    const H = 220;
    const padX = 16;
    const padY = 32;

    if (points.length === 1) {
      const p = points[0];
      const y = H / 2;
      const coords: RenderedPoint[] = [
        { x: padX, y, point: p },
        { x: W - padX, y, point: p },
      ];
      const d = `M ${padX} ${y} L ${W - padX} ${y}`;
      const area = `${d} L ${W - padX} ${H} L ${padX} ${H} Z`;
      return {
        pathD: d,
        areaD: area,
        minPoint: { x: W / 2, y, val: p.value, date: p.date },
        maxPoint: null,
        renderedPoints: coords,
      };
    }

    const values = points.map((p) => p.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = Math.max(1, maxVal - minVal);

    let minPt: { x: number; y: number; val: number; date: string } | null = null;
    let maxPt: { x: number; y: number; val: number; date: string } | null = null;

    const coords = points.map((p, i) => {
      const x = padX + (i / (points.length - 1)) * (W - 2 * padX);
      const y = H - padY - ((p.value - minVal) / range) * (H - 2 * padY);

      if (!minPt || p.value < minPt.val) {
        minPt = { x, y, val: p.value, date: p.date };
      }
      if (!maxPt || p.value > maxPt.val) {
        maxPt = { x, y, val: p.value, date: p.date };
      }

      return { x, y, point: p };
    });

    // Generate smooth or crisp line path
    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1];
      const curr = coords[i];
      // Slight smooth cubic curve
      const cp1x = prev.x + (curr.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = prev.x + (curr.x - prev.x) / 2;
      const cp2y = curr.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
    }

    const lastX = coords[coords.length - 1].x;
    const firstX = coords[0].x;
    const area = `${d} L ${lastX} ${H} L ${firstX} ${H} Z`;

    return {
      pathD: d,
      areaD: area,
      minPoint: minPt,
      maxPoint: maxPt,
      renderedPoints: coords,
    };
  }, [points]);

  // Handle Mouse Move for hover interaction
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || renderedPoints.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 620;

    // Find closest point by x
    let closest = renderedPoints[0];
    let minDist = Math.abs(renderedPoints[0].x - mouseX);

    for (let i = 1; i < renderedPoints.length; i++) {
      const dist = Math.abs(renderedPoints[i].x - mouseX);
      if (dist < minDist) {
        minDist = dist;
        closest = renderedPoints[i];
      }
    }

    setHoveredPoint(closest.point);
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  // Values display
  const displayValue = hoveredPoint
    ? hoveredPoint.value
    : activeCurrentVal;

  const changeNominal = hoveredPoint
    ? hoveredPoint.value - activeStartVal
    : activeChangeNominal;

  const changePercent = hoveredPoint
    ? ((changeNominal / Math.max(1, activeStartVal)) * 100).toFixed(2)
    : Number(activeChangePercent).toFixed(2);

  const isPositive = Number(changeNominal) >= 0;

  // Dynamic Theme Colors: Green for Profit/Gain, Neon Red/Rose for Loss
  const primaryColor = isPositive ? "#22c55e" : "#ef4444";
  const glowColor = isPositive ? "#22c55e" : "#ef4444";
  const activePillClass = isPositive
    ? "bg-[#c6f022] text-zinc-950 shadow-sm"
    : "bg-red-500 text-white shadow-md shadow-red-500/40";

  const formattedNominal = isPositive
    ? `+${formatIDR(Math.abs(changeNominal))}`
    : `-${formatIDR(Math.abs(changeNominal))}`;
  const formattedPercent = isPositive
    ? `+${Math.abs(Number(changePercent)).toFixed(2)}%`
    : `-${Math.abs(Number(changePercent)).toFixed(2)}%`;

  return (
    <div className="bg-black text-white rounded-2xl p-5 md:p-6 border border-zinc-850 shadow-2xl space-y-4 select-none">
      {/* 1. Header Label & Updated Clock */}
      <div className="flex items-center justify-between text-xs gap-3">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 font-semibold tracking-wide">Nilai Portofolio</span>
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live 1 mnt
          </span>
        </div>
        <div className="flex items-center gap-2">
          {headerRightSlot}
          <span className="text-zinc-400 font-mono text-[11px] hidden sm:inline">
            Diperbarui {chartData?.updated_at || lastUpdated}
          </span>
        </div>
      </div>

      {/* 2. Big Live Amount & Profit/Loss Subtitle */}
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white break-words">
            {isPrivate ? "Rp ••••••••" : formatIDR(displayValue)}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            <span className={`flex items-center gap-0.5 font-bold ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
              {isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              {isPrivate ? "••••" : `${formattedNominal} (${formattedPercent})`}
            </span>
            <span className="text-zinc-400 font-normal">
              {hoveredPoint ? `• ${hoveredPoint.date}` : timeframe === "ALL" ? "Semua" : timeframe}
            </span>
          </div>
        </div>

        {/* Real asset breakdown indicator on hover */}
        {hoveredPoint && hoveredPoint.btc_value !== undefined && (
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-zinc-300 bg-zinc-900/90 border border-zinc-800 rounded-lg px-2.5 py-1 mt-1 w-fit shadow-md animate-in fade-in duration-150">
            <span>BTC: <strong className="text-amber-400 font-semibold">{formatIDR(hoveredPoint.btc_value)}</strong></span>
            <span className="text-zinc-600">•</span>
            <span>VT: <strong className="text-emerald-400 font-semibold">{formatIDR(hoveredPoint.vt_value || 0)}</strong></span>
            <span className="text-zinc-600">•</span>
            <span>USDT: <strong className="text-cyan-400 font-semibold">{formatIDR(hoveredPoint.usdt_value || 0)}</strong></span>
          </div>
        )}

        {/* Quick Actions Slot (Opsi 2: Action bar di bawah angka saldo) */}
        {quickActionsSlot && (
          <div className="pt-1">
            {quickActionsSlot}
          </div>
        )}
      </div>

      {/* 3. The Interactive SVG Chart */}
      <div className="relative w-full overflow-hidden pt-2">
        <svg
          ref={svgRef}
          viewBox="0 0 620 220"
          className="w-full h-44 sm:h-52 md:h-56 overflow-visible cursor-crosshair touch-pan-y"
          style={{ touchAction: "manipulation" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onTouchStart={(e) => {
            if (e.touches[0] && svgRef.current && renderedPoints.length > 0) {
              const rect = svgRef.current.getBoundingClientRect();
              const mouseX = ((e.touches[0].clientX - rect.left) / rect.width) * 620;
              let closest = renderedPoints[0];
              let minDist = Math.abs(renderedPoints[0]?.x - mouseX);
              for (let i = 1; i < renderedPoints.length; i++) {
                const dist = Math.abs(renderedPoints[i].x - mouseX);
                if (dist < minDist) {
                  minDist = dist;
                  closest = renderedPoints[i];
                }
              }
              if (closest) setHoveredPoint(closest.point);
            }
          }}
          onTouchMove={(e) => {
            if (e.touches[0] && svgRef.current && renderedPoints.length > 0) {
              const rect = svgRef.current.getBoundingClientRect();
              const mouseX = ((e.touches[0].clientX - rect.left) / rect.width) * 620;
              let closest = renderedPoints[0];
              let minDist = Math.abs(renderedPoints[0]?.x - mouseX);
              for (let i = 1; i < renderedPoints.length; i++) {
                const dist = Math.abs(renderedPoints[i].x - mouseX);
                if (dist < minDist) {
                  minDist = dist;
                  closest = renderedPoints[i];
                }
              }
              if (closest) setHoveredPoint(closest.point);
            }
          }}
          onTouchEnd={() => setHoveredPoint(null)}
        >
          <defs>
            {/* Dynamic Area Gradient: Green for profit, Red for loss */}
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={primaryColor} stopOpacity="0.28" />
              <stop offset="65%" stopColor={primaryColor} stopOpacity="0.06" />
              <stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
            </linearGradient>

            {/* Glowing neon filter */}
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor={glowColor} floodOpacity="0.65" />
            </filter>
          </defs>

          {/* Background area fill */}
          {areaD && <path d={areaD} fill="url(#chartGradient)" />}

          {/* Main glowing line */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={primaryColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#neonGlow)"
            />
          )}

          {/* Max Value Label (Anchored near highest point, like in screenshot) */}
          {maxPoint && (
            <g transform={`translate(${Math.min(500, Math.max(70, maxPoint.x))}, ${Math.max(20, maxPoint.y - 10)})`}>
              <text
                x="0"
                y="0"
                fill="#a1a1aa"
                fontSize="11"
                fontFamily="sans-serif"
                textAnchor="middle"
                className="select-none font-mono"
              >
                {isPrivate ? "••••" : formatIDR(maxPoint.val)}
              </text>
            </g>
          )}

          {/* Min Value Label (Anchored near lowest point, like in screenshot) */}
          {minPoint && (
            <g transform={`translate(${Math.min(520, Math.max(60, minPoint.x))}, ${Math.min(210, minPoint.y + 20)})`}>
              <text
                x="0"
                y="0"
                fill="#71717a"
                fontSize="10"
                fontFamily="sans-serif"
                textAnchor="middle"
                className="select-none font-mono"
              >
                {isPrivate ? "••••" : formatIDR(minPoint.val)}
              </text>
            </g>
          )}

          {/* Hover Crosshair / Cursor Indicator */}
          {hoveredPoint && (
            (() => {
              const matched = renderedPoints.find((p) => p.point.timestamp === hoveredPoint.timestamp);
              if (!matched) return null;
              return (
                <g>
                  {/* Vertical dashed crosshair line */}
                  <line
                    x1={matched.x}
                    y1={0}
                    x2={matched.x}
                    y2={220}
                    stroke={primaryColor}
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                    opacity="0.85"
                  />
                  {/* Outer glowing pulsing circle */}
                  <circle
                    cx={matched.x}
                    cy={matched.y}
                    r="6"
                    fill={primaryColor}
                    opacity="0.4"
                  />
                  {/* Inner solid circle */}
                  <circle
                    cx={matched.x}
                    cy={matched.y}
                    r="3.5"
                    fill="#ffffff"
                    stroke={primaryColor}
                    strokeWidth="2"
                  />
                </g>
              );
            })()
          )}
        </svg>
      </div>

      {/* 4. Timeframe Selector Pills (Styled identical to the uploaded screenshot) */}
      <div className="flex items-center justify-between gap-1 pt-2">
        {(["1W", "1M", "3M", "YTD", "1Y", "ALL"] as const).map((tf) => {
          const isActive = timeframe === tf;
          return (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={`flex-1 py-1.5 px-2 rounded-full text-xs font-bold transition text-center ${
                isActive
                  ? activePillClass
                  : "bg-zinc-900/90 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
              }`}
            >
              {tf}
            </button>
          );
        })}
      </div>

      {/* 5. Bottom Summary Collapsible Card (Matching screenshot) */}
      <div className="rounded-xl bg-zinc-900/90 border border-zinc-800/80 overflow-hidden text-xs mt-3">
        <button
          type="button"
          onClick={() => setIsDetailsOpen(!isDetailsOpen)}
          className="w-full p-4 flex items-center justify-between hover:bg-zinc-850/50 transition text-left"
        >
          <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
            <span>Nilai Aset Bersih</span>
            <Info className="w-3.5 h-3.5 text-zinc-500" />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">
              {isPrivate ? "Rp ••••••••" : formatIDR(displayValue)}
            </span>
            {isDetailsOpen ? (
              <ChevronUp className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            )}
          </div>
        </button>

        {isDetailsOpen && (
          <div className="px-4 pb-4 pt-1 border-t border-zinc-800/60 space-y-2.5">
            <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800/70 flex items-center justify-between text-xs">
              <span className="text-zinc-400">Jumlah Investasi</span>
              <span className="font-bold text-zinc-200">
                {isPrivate ? "••••" : formatIDR(totalInvested || 0)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
