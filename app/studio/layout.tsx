import type { ReactNode } from "react";
import { AppSidebar } from "../../components/app-sidebar";
import { CloudSync } from "../../components/studio/cloud-sync";

export default function StudioLayout({ children }: { children: ReactNode }) {
    return (
        <div className="studio-shell" data-studio-shell>
            <AppSidebar />
            <main className="studio-main" data-studio-main>
                <CloudSync>{children}</CloudSync>
            </main>
        </div>
    );
}
