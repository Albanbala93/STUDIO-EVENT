import "./v2.css";
import { Sidebar } from "./_components/sidebar";

export const metadata = {
  title: "Momentum · Stratly",
  description: "Performance de communication — restitution exécutive",
};

export default function V2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="v2-root min-h-screen bg-canvas text-ink">
      <Sidebar />
      <main className="ml-[240px] min-h-screen">{children}</main>
    </div>
  );
}
