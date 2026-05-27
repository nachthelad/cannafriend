"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutEverywhere } from "@/lib/auth-session";
import { ROUTE_DASHBOARD, ROUTE_LOGIN } from "@/lib/routes";
import { ADMIN_NAV_ITEMS } from "@/features/shared/navigation/admin-nav";

type AdminShellProps = {
  children: React.ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOutEverywhere();
      router.replace(ROUTE_LOGIN);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Panel de administración</h1>
                <p className="text-sm text-muted-foreground">
                  Superficie operativa separada del dashboard del usuario.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" asChild>
                <Link href={ROUTE_DASHBOARD}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al producto
                </Link>
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </Button>
            </div>
          </div>

          <nav className="flex flex-wrap gap-2">
            {ADMIN_NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        {children}
      </main>
    </div>
  );
}
