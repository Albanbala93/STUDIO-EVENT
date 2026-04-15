import Link from "next/link";
import type { ReactNode } from "react";

export default function StudioLayout({ children }: { children: ReactNode }) {
    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <nav className="topnav">
                <div className="topnav-inner">
                    <Link href="/studio" className="topnav-logo">
                        <span className="topnav-logo-mark">CS</span>
                        <span>Campaign Studio</span>
                    </Link>
                    <div className="topnav-links">
                        <Link href="/studio" className="topnav-link">Dashboard</Link>
                        <Link href="/studio/history" className="topnav-link">Historique</Link>
                    </div>
                    <Link href="/studio/new" className="btn btn-primary btn-sm">
                        + Nouveau dispositif
                    </Link>
                </div>
            </nav>
            <div style={{ flex: 1 }}>
                {children}
            </div>
        </div>
    );
}
