import { AuthGate } from "@/components/AuthGate";
import { MobileNav } from "@/components/MobileNav";
import { Sidebar } from "@/components/Sidebar";
import { SkipLink } from "@/components/ui";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <SkipLink />
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Sidebar />
        <div className="min-h-0 flex-1 lg:h-screen lg:overflow-auto">
          {children}
        </div>
      </div>
      <MobileNav />
    </AuthGate>
  );
}
