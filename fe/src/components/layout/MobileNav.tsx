"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PieChart,
  History,
  Newspaper,
  Bot,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Portofolio", href: "/portfolio", icon: PieChart },
  { name: "Riwayat", href: "/transactions", icon: History },
  { name: "Berita", href: "/news", icon: Newspaper },
  { name: "Tanya AI", href: "/playground", icon: Bot, highlight: true },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#090b10]/95 backdrop-blur-xl border-t border-zinc-200/80 dark:border-white/[0.08] lg:hidden px-2 py-1.5 shadow-2xl safe-area-bottom transition-colors duration-200">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative select-none ${
                isActive
                  ? "text-emerald-600 dark:text-emerald-400 font-semibold scale-105"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 active:scale-95"
              }`}
            >
              {item.highlight ? (
                <div
                  className={`p-1.5 rounded-lg transition-all ${
                    isActive
                      ? "bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              ) : (
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                  )}
                </div>
              )}
              <span className="text-[10px] tracking-tight mt-1 font-medium">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
