import { AuthGate } from "@/components/AuthGate";
import { Sidebar } from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Sidebar />
        <div className="min-h-0 flex-1 lg:h-screen lg:overflow-hidden">
          {children}
        </div>
      </div>
    </AuthGate>
  );
}
