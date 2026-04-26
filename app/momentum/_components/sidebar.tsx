"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  Rocket,
  Settings,
  ChevronUp,
} from "lucide-react";

import { cn } from "../../../lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV: NavItem[] = [
  { label: "Diagnostics", href: "/momentum", icon: LayoutDashboard },
  { label: "Nouveau diagnostic", href: "/momentum/diagnostic", icon: PlusCircle },
  { label: "Campaign", href: "/studio", icon: Rocket },
];

export function Sidebar() {
  const pathname = usePathname() ?? "/momentum";

  return (
    <aside
      data-momentum-sidebar
      className="fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col border-r border-border bg-white"
    >
      <div className="flex h-16 items-center gap-2 px-5 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-navy text-white font-bold text-sm shadow-card">
          S
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] font-semibold text-navy">Stratly</span>
          <span className="text-[10px] uppercase tracking-[0.14em] text-ink-muted">
            Pilot
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4">
        <div className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
          Navigation
        </div>
        <ul className="flex flex-col gap-0.5">
          {NAV.map((item) => {
            const isActive =
              item.href === "/momentum"
                ? pathname === "/momentum" ||
                  pathname.startsWith("/momentum/projects")
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent-50 text-accent-700"
                      : "text-ink-muted hover:bg-canvas hover:text-ink",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive ? "text-accent" : "text-ink-muted",
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-sm px-3 py-2 opacity-60">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-canvas text-ink-muted">
            <Settings className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium text-ink leading-tight">
              Paramètres
            </div>
            <div className="text-[11px] text-ink-muted">Bientôt disponible</div>
          </div>
          <ChevronUp className="h-4 w-4 text-ink-muted" />
        </div>
      </div>
    </aside>
  );
}
