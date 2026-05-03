"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  Rocket,
  Settings,
} from "lucide-react";

import { Logo } from "../../../components/brand/logo";

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

/**
 * Sidebar Pilot — alignée sur le langage visuel du Studio sidebar
 * (.pilot-sidebar-* en miroir de .studio-sidebar-*) avec :
 *   - Surface claire (bg-white) cohérente avec les pages Pilot
 *   - Accent violet (Hi-Fi Pilot) sur le label module + active state
 *   - Même typographie / spacing / footer settings
 */
export function Sidebar() {
  const pathname = usePathname() ?? "/momentum";

  return (
    <aside className="pilot-sidebar" data-momentum-sidebar>
      <div className="pilot-sidebar-header">
        <Logo variant="mark" size={32} href="/" ariaLabel="Stratly — accueil" />
        <div className="pilot-sidebar-wordmark">
          <span className="pilot-sidebar-brand">Stratly</span>
          <span className="pilot-sidebar-product">Pilot</span>
        </div>
      </div>

      <nav className="pilot-sidebar-nav">
        <div className="pilot-sidebar-section-label">Navigation</div>
        <ul>
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
                  className={
                    "pilot-sidebar-link" + (isActive ? " is-active" : "")
                  }
                >
                  <Icon className="pilot-sidebar-icon" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="pilot-sidebar-footer">
        <div className="pilot-sidebar-settings">
          <span className="pilot-sidebar-settings-icon">
            <Settings className="h-4 w-4" />
          </span>
          <div className="pilot-sidebar-settings-text">
            <div className="pilot-sidebar-settings-title">Paramètres</div>
            <div className="pilot-sidebar-settings-sub">Bientôt disponible</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
