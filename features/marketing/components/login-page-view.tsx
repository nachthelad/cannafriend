"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDoc } from "firebase/firestore";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

import { AuthTabs } from "@/components/auth/auth-tabs";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import { ThemeToggle } from "@/components/common/theme-toggle";
import ThemeLogo from "@/components/common/theme-logo";
import { Button } from "@/components/ui/button";
import { useAuthUser } from "@/hooks/use-auth-user";
import { getPostAuthRedirect } from "@/lib/auth-redirect";
import { userDoc } from "@/lib/paths";
import {
  ROUTE_DASHBOARD,
  ROUTE_HOME,
  ROUTE_PRIVACY,
  ROUTE_TERMS,
} from "@/lib/routes";
import type { UserProfile } from "@/types";

export function LoginPageView() {
  const router = useRouter();
  const { t } = useTranslation(["auth", "common"]);
  const { user, isLoading: authLoading } = useAuthUser();

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    let isActive = true;

    const redirectAuthenticatedUser = async () => {
      try {
        const snap = await getDoc(userDoc<UserProfile>(user.uid));

        if (!isActive) {
          return;
        }

        router.replace(getPostAuthRedirect(snap.exists() ? snap.data() : null));
      } catch {
        if (isActive) {
          router.replace(ROUTE_DASHBOARD);
        }
      }
    };

    void redirectAuthenticatedUser();

    return () => {
      isActive = false;
    };
  }, [authLoading, router, user]);

  const isLoading = authLoading || Boolean(user);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.12fr)_minmax(420px,0.88fr)]">
        <section className="relative hidden overflow-hidden bg-black lg:block">
          <Image
            src="/login-hero.png"
            alt=""
            fill
            priority
            sizes="60vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,7,5,0.56),rgba(3,7,5,0.18)_48%,rgba(3,7,5,0.72))]" />
          <div className="absolute inset-0 flex flex-col justify-between p-14 text-white">
            <Link href={ROUTE_HOME} className="flex w-fit items-center gap-3">
              <ThemeLogo size={44} className="text-primary" />
              <span className="text-2xl font-semibold">
                {t("app.name", { ns: "common" })}
              </span>
            </Link>

            <div className="max-w-xl pb-8">
              <p className="mb-5 text-sm font-semibold uppercase tracking-[0.28em] text-primary">
                Grow journal
              </p>
              <h1 className="text-5xl font-semibold leading-[1.04]">
                Registrá cada cultivo con una vista clara y profesional.
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-white/78">
                Cannafriend centraliza plantas, sesiones, alarmas y
                seguimiento para que tu bitácora esté siempre lista.
              </p>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen flex-col px-5 py-5 sm:px-8 lg:px-14">
          <header className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild>
              <Link href={ROUTE_HOME}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("back", { ns: "common" })}
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </header>

          <div className="flex flex-1 items-center justify-center py-10">
            <div className="w-full max-w-[420px]">
              <div className="mb-8 text-center">
                <ThemeLogo
                  size={48}
                  className="mx-auto mb-5 text-primary"
                />
                <h2 className="text-3xl font-semibold tracking-tight">
                  {t("login.title", { ns: "auth" })}
                </h2>
              </div>

              {isLoading ? (
                <div className="flex h-72 flex-col items-center justify-center gap-4 rounded-lg border bg-card">
                  <ThemeLogo size={48} className="text-primary" />
                  <p className="text-sm text-muted-foreground">
                    {t("pleaseWait", { ns: "auth" })}
                  </p>
                </div>
              ) : (
                <AuthTabs />
              )}
            </div>
          </div>

          <footer className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <Link href={ROUTE_PRIVACY} className="hover:text-primary">
              {t("privacy.title", { ns: "common" })}
            </Link>
            <Link href={ROUTE_TERMS} className="hover:text-primary">
              {t("terms.title", { ns: "common" })}
            </Link>
          </footer>
        </section>
      </div>
    </main>
  );
}
