import type { ReactNode } from "react";
import { StudioSidebar } from "./_components/sidebar";

export default function StudioLayout({ children }: { children: ReactNode }) {
    return (
        <div className="studio-shell" data-studio-shell>
            <StudioSidebar />
            <main className="studio-main" data-studio-main>
                {children}
            </main>
        </div>
    );
}
