import "./momentum.css";
import { AppSidebar } from "../../components/app-sidebar";
import { MomentumCloudSync } from "../../components/momentum-cloud-sync";

export const metadata = {
  title: "Pilot · Stratly",
  description: "Performance de communication — restitution exécutive",
};

export default function MomentumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="momentum-root min-h-screen bg-canvas text-ink">
      <AppSidebar />
      <main
        data-momentum-main
        className="ml-[240px] min-h-screen"
      >
        <MomentumCloudSync>{children}</MomentumCloudSync>
      </main>
    </div>
  );
}
