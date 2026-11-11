"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useAppStore((s) => s.hydrated);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const setHydrated = useAppStore((s) => s.setHydrated);

  useEffect(() => {
    // Si le persist n'a pas encore hydraté (SSR), on force après mount
    if (!hydrated) {
      const t = setTimeout(() => setHydrated(true), 50);
      return () => clearTimeout(t);
    }
  }, [hydrated, setHydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated && pathname?.startsWith("/app")) {
      router.replace("/connexion");
    }
  }, [hydrated, isAuthenticated, pathname, router]);

  if (!hydrated) {
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
