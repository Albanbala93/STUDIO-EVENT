import "./momentum.css";
import { Sidebar } from "./_components/sidebar";

export const metadata = {
  title: "Momentum · Stratly",
  description: "Performance de communication — restitution exécutive",
};

export default function MomentumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="momentum-root min-h-screen bg-canvas text-ink">
      <Sidebar />
      <main
        data-momentum-main
        className="ml-[240px] min-h-screen"
      >
        {children}
      </main>
    </div>
  );
}
