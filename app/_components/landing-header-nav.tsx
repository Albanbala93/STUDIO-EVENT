"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  ChevronDown,
  Leaf,
  Menu,
  Sparkles,
  X,
} from "lucide-react";

import type { ReactNode } from "react";

type ModuleItem = {
  icon: ReactNode;
  title: string;
  subtitle: string;
  href: string;
};

const MODULES: ModuleItem[] = [
  {
    icon: <Sparkles size={16} strokeWidth={1.7} />,
    title: "Campaign",
    subtitle: "Concevez vos campagnes et dispositifs",
    href: "/studio",
  },
  {
    icon: <BarChart3 size={16} strokeWidth={1.7} />,
    title: "Pilot",
    subtitle: "Mesurez, analysez et pilotez vos performances",
    href: "/momentum",
  },
  {
    icon: <Leaf size={16} strokeWidth={1.7} />,
    title: "Impact",
    subtitle: "Évaluez et structurez votre impact RSE",
    href: "/momentum",
  },
];

export function LandingHeaderNav() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDropdownOpen(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  return (
    <>
      <nav className="landing-nav" aria-label="Navigation principale">
        <div
          ref={dropdownRef}
          className={
            "landing-nav-dropdown" + (dropdownOpen ? " is-open" : "")
          }
          onMouseEnter={() => setDropdownOpen(true)}
          onMouseLeave={() => setDropdownOpen(false)}
        >
          <button
            type="button"
            className="landing-nav-trigger"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            onClick={() => setDropdownOpen((open) => !open)}
          >
            Modules
            <ChevronDown
              size={14}
              strokeWidth={2}
              className="landing-nav-trigger-chevron"
            />
          </button>

          <div className="landing-nav-panel" role="menu">
            <p className="landing-nav-panel-label">
              Trois modules · Une plateforme
            </p>
            {MODULES.map((m) => (
              <Link
                key={m.title}
                href={m.href}
                className="landing-nav-panel-item"
                role="menuitem"
                onClick={() => setDropdownOpen(false)}
              >
                <span className="landing-nav-panel-icon">{m.icon}</span>
                <span className="landing-nav-panel-text">
                  <span className="landing-nav-panel-title">{m.title}</span>
                  <span className="landing-nav-panel-sub">{m.subtitle}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>

        <Link href="/pricing" className="landing-nav-link">
          Tarifs
        </Link>

        <Link href="#cta-final" className="landing-nav-link">
          Démarrer
        </Link>
      </nav>

      <Link href="/studio/new" className="landing-header-cta">
        Essayer gratuitement
      </Link>

      <button
        type="button"
        className="landing-mobile-trigger"
        aria-label="Ouvrir le menu"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={22} strokeWidth={1.8} />
      </button>

      {mobileOpen && (
        <div
          className="landing-mobile-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Menu Stratly"
        >
          <button
            type="button"
            className="landing-mobile-overlay-bg"
            aria-label="Fermer le menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="landing-mobile-panel">
            <div className="landing-mobile-panel-head">
              <span className="landing-logo-text">Stratly</span>
              <button
                type="button"
                className="landing-mobile-close"
                aria-label="Fermer"
                onClick={() => setMobileOpen(false)}
              >
                <X size={20} strokeWidth={1.8} />
              </button>
            </div>

            <div className="landing-mobile-panel-body">
              <p className="landing-mobile-section-label">Modules</p>
              {MODULES.map((m) => (
                <Link
                  key={m.title}
                  href={m.href}
                  className="landing-mobile-link"
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="landing-nav-panel-icon">{m.icon}</span>
                  <span className="landing-nav-panel-text">
                    <span className="landing-nav-panel-title">{m.title}</span>
                    <span className="landing-nav-panel-sub">{m.subtitle}</span>
                  </span>
                </Link>
              ))}

              <p className="landing-mobile-section-label landing-mobile-section-label-alt">
                Plateforme
              </p>
              <Link
                href="/pricing"
                className="landing-mobile-link landing-mobile-link-simple"
                onClick={() => setMobileOpen(false)}
              >
                Tarifs
              </Link>
              <Link
                href="#cta-final"
                className="landing-mobile-link landing-mobile-link-simple"
                onClick={() => setMobileOpen(false)}
              >
                Démarrer
              </Link>
            </div>

            <div className="landing-mobile-panel-foot">
              <Link
                href="/studio/new"
                className="landing-cta-primary"
                onClick={() => setMobileOpen(false)}
              >
                Essayer gratuitement
                <ArrowRight size={14} strokeWidth={2} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
