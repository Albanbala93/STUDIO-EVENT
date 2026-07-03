"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./brand/logo";
import { AccountFooter } from "./account-footer";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  isActive: (pathname: string) => boolean;
};

const ICON_DASHBOARD = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const ICON_PLUS = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 5v6M5 8h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ICON_DIAGNOSTIC = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 13h12M4 10v3M8 6v7M12 3v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/**
 * Barre latérale unique de l'application (Lot 2 UX).
 * Un seul vocabulaire, une seule navigation pour tous les modules.
 */
const NAV: NavItem[] = [
  {
    label: "Mes projets",
    href: "/studio",
    icon: ICON_DASHBOARD,
    isActive: (p) => p === "/studio" || /^\/studio\/(?!new)[^/]+/.test(p),
  },
  {
    label: "Nouvelle campagne",
    href: "/studio/new",
    icon: ICON_PLUS,
    isActive: (p) => p.startsWith("/studio/new"),
  },
  {
    label: "Diagnostics",
    href: "/momentum",
    icon: ICON_DIAGNOSTIC,
    isActive: (p) =>
      p === "/momentum" || p.startsWith("/momentum/projects"),
  },
  {
    label: "Nouveau diagnostic",
    href: "/momentum/diagnostic",
    icon: ICON_PLUS,
    isActive: (p) => p.startsWith("/momentum/diagnostic"),
  },
];

export function AppSidebar() {
  const pathname = usePathname() ?? "/studio";

  return (
    <aside className="studio-sidebar" data-studio-sidebar>
      <div className="studio-sidebar-header">
        <Logo variant="mark" size={28} href="/" ariaLabel="Stratly — accueil" />
        <div className="studio-sidebar-wordmark">
          <span className="studio-sidebar-brand">Stratly</span>
        </div>
      </div>

      <nav className="studio-sidebar-nav">
        <div className="studio-sidebar-section-label">Navigation</div>
        <ul>
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={
                  "studio-sidebar-link" +
                  (item.isActive(pathname) ? " is-active" : "")
                }
              >
                <span className="studio-sidebar-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="studio-sidebar-footer">
        <AccountFooter />
      </div>
    </aside>
  );
}
