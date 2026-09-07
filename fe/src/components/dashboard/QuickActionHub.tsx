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
  Sparkles,
} from "lucide-react";

interface QuickActionItem {
  name: string;
  desc: string;
  href: string;
  icon: any;
  color: string;
  bgGradient: string;
}

const actions: QuickActionItem[] = [
  {
    name: "Catat Transaksi",
    desc: "Beli / Jual Multi-Aset",
    href: "/portfolio",
    icon: PlusCircle,
    color: "text-emerald-400",
    bgGradient: "from-emerald-500/20 to-emerald-700/5 border-emerald-500/30",
  },
  {
    name: "Scan Struk (OCR)",
    desc: "Auto-Catat Lewat AI",
    href: "/portfolio",
    icon: Camera,
    color: "text-blue-400",
    bgGradient: "from-blue-500/20 to-blue-700/5 border-blue-500/30",
  },
  {
    name: "AI Rebalancing",
    desc: "Optimasi Alokasi Kas",
    href: "/portfolio",
    icon: Scale,
    color: "text-teal-400",
    bgGradient: "from-teal-500/20 to-teal-700/5 border-teal-500/30",
  },
  {
    name: "Radar Diskon",
    desc: "AI Dip Screener 52W",
    href: "/watchlist",
    icon: BookmarkCheck,
    color: "text-amber-400",
    bgGradient: "from-amber-500/20 to-amber-700/5 border-amber-500/30",
  },
  {
    name: "Analisis Kurs USD",
    desc: "Dual Return & Hedging",
    href: "/portfolio",
    icon: Globe,
    color: "text-indigo-400",
    bgGradient: "from-indigo-500/20 to-indigo-700/5 border-indigo-500/30",
  },
  {
    name: "Tanya Asisten+Stock",
    desc: "Konsultasi Finansial",
    href: "/playground",
    icon: Bot,
    color: "text-purple-400",
    bgGradient: "from-purple-500/20 to-purple-700/5 border-purple-500/30",
  },
];

export default function QuickActionHub() {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Aksi Cepat Portofolio
          </h3>
        </div>
        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Pintasan Fitur Unggulan</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.name}
              href={act.href}
              className="group p-3.5 rounded-2xl bg-white/90 dark:bg-zinc-900/70 hover:bg-zinc-50 dark:hover:bg-zinc-850/90 border border-zinc-200/80 dark:border-white/[0.06] hover:border-zinc-300 dark:hover:border-white/[0.15] transition-all duration-200 shadow-sm flex flex-col justify-between active:scale-[0.98] glass-card-hover"
            >
              <div className="flex items-start justify-between mb-2.5">
                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-br ${act.bgGradient} border flex items-center justify-center ${act.color} transition-transform group-hover:scale-110`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all opacity-0 group-hover:opacity-100" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-white transition-colors leading-snug">
                  {act.name}
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-tight line-clamp-1">
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
