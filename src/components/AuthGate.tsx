"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useAppStore((s) => s.hydrated);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const setHydrated = useAppStore((s) => s.setHydrated);
  const syncSession = useAppStore((s) => s.syncSession);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!hydrated) {
      const t = setTimeout(() => setHydrated(true), 50);
      return () => clearTimeout(t);
    }
  }, [hydrated, setHydrated]);

  useEffect(() => {
    if (!hydrated) return;
    void (async () => {
      const ok = await syncSession();
      setChecking(false);
      if (!ok && pathname?.startsWith("/app")) {
        router.replace("/connexion");
      }
    })();
  }, [hydrated, syncSession, pathname, router]);

  if (!hydrated || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        Chargement de votre espace…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        Redirection…
      </div>
    );
  }

  return <>{children}</>;
}
