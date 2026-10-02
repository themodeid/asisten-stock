"use client";

import Link from "next/link";
import {
  PlusCircle,
  Camera,
  Scale,
  BookmarkCheck,
  Globe,
  Bot,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

interface QuickActionItem {
  name: string;
  desc: string;
  href: string;
  icon: any;
}

const actions: QuickActionItem[] = [
  {
    name: "Catat Transaksi",
    desc: "Beli / Jual Multi-Aset",
    href: "/portfolio",
    icon: PlusCircle,
  },
  {
    name: "Scan Struk (OCR)",
    desc: "Auto-Catat Portofolio",
    href: "/portfolio",
    icon: Camera,
  },
  {
    name: "AI Rebalancing",
    desc: "Optimasi Alokasi Kas",
    href: "/portfolio",
    icon: Scale,
  },
  {
    name: "Radar Diskon",
    desc: "AI Dip Screener 52W",
    href: "/watchlist",
    icon: BookmarkCheck,
  },
  {
    name: "AI Analyst & Riset",
    desc: "Prediksi & Sinyal Pasar",
    href: "/analytics",
    icon: TrendingUp,
  },
  {
    name: "Tanya Asisten",
    desc: "Konsultasi Finansial",
    href: "/playground",
    icon: Bot,
  },
];

export default function QuickActionHub() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-[#8b949e]">
          Aksi Cepat Portofolio
        </h3>
        <span className="text-[11px] text-zinc-500 dark:text-[#8b949e]">Pintasan Fitur</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.name}
              href={act.href}
              className="group p-3 rounded-md bg-white dark:bg-[#161b22] border border-zinc-200 dark:border-[#30363d] hover:border-zinc-300 dark:hover:border-[#8b949e] hover:bg-zinc-50 dark:hover:bg-[#21262d] transition-colors flex flex-col justify-between shadow-[0_1px_0_rgba(27,31,36,0.04)]"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-[#21262d] border border-zinc-200 dark:border-[#30363d] flex items-center justify-center text-zinc-700 dark:text-[#c9d1d9]">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400 dark:text-[#6e7681] group-hover:text-zinc-700 dark:group-hover:text-[#c9d1d9] transition-colors" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-900 dark:text-[#f0f6fc] group-hover:text-zinc-900 dark:group-hover:text-[#f0f6fc] transition-colors leading-snug">
                  {act.name}
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-[#8b949e] mt-0.5 leading-tight line-clamp-1">
                  {act.desc}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
