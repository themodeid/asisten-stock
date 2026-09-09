"use client";

import { useMemo } from "react";

interface SparklineMiniChartProps {
  ticker: string;
  isPositive: boolean;
  points?: number[];
  width?: number;
  height?: number;
}

export default function SparklineMiniChart({
  ticker,
  isPositive,
  points,
  width = 72,
  height = 28,
}: SparklineMiniChartProps) {
  const { pathD, areaD, strokeColor, fillColor } = useMemo(() => {
    // Generate or use deterministic trend points
    let data = points;
    if (!data || data.length < 5) {
      // Deterministic pseudo-random seed from ticker characters
      let seed = 0;
      for (let i = 0; i < ticker.length; i++) {
        seed = (seed << 5) - seed + ticker.charCodeAt(i);
        seed |= 0;
      }
      const random = (s: number) => {
        const x = Math.sin(s) * 10000;
        return x - Math.floor(x);
      };

      const count = 8;
      const base = 100;
      data = [];
      let cur = base;
      for (let i = 0; i < count; i++) {
        const delta = (random(seed + i * 17) - 0.48) * 8;
        cur += delta;
        data.push(cur);
      }
      // Force end-point to align with isPositive
      if (isPositive && data[data.length - 1] <= data[0]) {
        data[data.length - 1] = data[0] + 12;
      } else if (!isPositive && data[data.length - 1] >= data[0]) {
        data[data.length - 1] = data[0] - 12;
      }
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = Math.max(1, max - min);

    const padY = 3;
    const padX = 2;
    const effectiveH = height - padY * 2;
    const effectiveW = width - padX * 2;

    const coords = data.map((val, idx) => {
      const x = padX + (idx / (data!.length - 1)) * effectiveW;
      const y = padY + effectiveH - ((val - min) / range) * effectiveH;
      return { x, y };
    });

    // Build smooth SVG path
    let d = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i];
      const p1 = coords[i + 1];
      const mx = (p0.x + p1.x) / 2;
      d += ` C ${mx.toFixed(1)} ${p0.y.toFixed(1)}, ${mx.toFixed(1)} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    }

    const lastX = coords[coords.length - 1].x.toFixed(1);
    const firstX = coords[0].x.toFixed(1);
    const area = `${d} L ${lastX} ${height} L ${firstX} ${height} Z`;

    const stroke = isPositive ? "#00D09C" : "#EF4444";
    const fill = isPositive ? "rgba(0, 208, 156, 0.12)" : "rgba(239, 68, 68, 0.12)";

    return { pathD: d, areaD: area, strokeColor: stroke, fillColor: fill };
  }, [ticker, isPositive, points, width, height]);

  return (
    <div className="flex items-center justify-center shrink-0">
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={`grad-${ticker}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#grad-${ticker})`} />
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
