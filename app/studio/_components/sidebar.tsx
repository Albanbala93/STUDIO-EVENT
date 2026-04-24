"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
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

const ICON_HISTORY = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ICON_DIAGNOSTIC = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 13h12M4 10v3M8 6v7M12 3v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ICON_SETTINGS = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="2.25" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M8 1.5v1.6M8 12.9v1.6M14.5 8h-1.6M3.1 8H1.5M12.6 3.4l-1.1 1.1M4.5 11.5l-1.1 1.1M12.6 12.6l-1.1-1.1M4.5 4.5L3.4 3.4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const NAV: NavItem[] = [
  { label: "Projets", href: "/studio", icon: ICON_DASHBOARD },
  { label: "Nouveau brief", href: "/studio/new", icon: ICON_PLUS },
  { label: "Historique", href: "/studio/history", icon: ICON_HISTORY },
  { label: "Diagnostics", href: "/momentum", icon: ICON_DIAGNOSTIC },
];

export function StudioSidebar() {
  const pathname = usePathname() ?? "/studio";

  return (
    <aside className="studio-sidebar" data-studio-sidebar>
      <div className="studio-sidebar-header">
        <div className="studio-sidebar-logo">
          <svg width="14" height="14" viewBox="0 0 13 13" fill="none">
            <path
              d="M2.5 3.5h5M2.5 6.5h8M2.5 9.5h6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="studio-sidebar-wordmark">
          <span className="studio-sidebar-brand">Stratly</span>
          <span className="studio-sidebar-product">Campaign Studio</span>
        </div>
      </div>

      <nav className="studio-sidebar-nav">
        <div className="studio-sidebar-section-label">Navigation</div>
        <ul>
          {NAV.map((item) => {
            const isActive =
              item.href === "/studio"
                ? pathname === "/studio"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={
                    "studio-sidebar-link" + (isActive ? " is-active" : "")
                  }
                >
                  <span className="studio-sidebar-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="studio-sidebar-footer">
        <div className="studio-sidebar-settings">
          <span className="studio-sidebar-icon">{ICON_SETTINGS}</span>
          <div className="studio-sidebar-settings-text">
            <div className="studio-sidebar-settings-title">Paramètres</div>
            <div className="studio-sidebar-settings-sub">Bientôt disponible</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
