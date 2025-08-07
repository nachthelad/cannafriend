"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";
import { AuthTabs } from "./auth-tabs";
import Link from "next/link";

interface LoginCardProps {
  className?: string;
}

export function LoginCard({ className = "" }: LoginCardProps) {
  const { t } = useTranslation();

  const renderTermsText = () => {
    const isEnglish = t("login.terms").includes("Terms of Service");
    if (isEnglish) {
      return (
        <>
          By continuing, you agree to our{" "}
          <Link
            href="/terms"
            className="text-green-600 dark:text-green-400 hover:underline"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="text-green-600 dark:text-green-400 hover:underline"
          >
            Privacy Policy
          </Link>
        </>
      );
    } else {
      return (
        <>
          Al continuar, aceptas nuestros{" "}
          <Link
            href="/terms"
            className="text-green-600 dark:text-green-400 hover:underline"
          >
            Términos de Servicio
          </Link>{" "}
          y{" "}
          <Link
            href="/privacy"
            className="text-green-600 dark:text-green-400 hover:underline"
          >
            Política de Privacidad
          </Link>
        </>
      );
    }
  };

  return (
    <Card
      className={`w-full max-w-md border-0 shadow-2xl dark:shadow-2xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm ${className}`}
    >
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          {t("app.name")}
        </CardTitle>
        <CardDescription className="text-center">
          {t("app.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AuthTabs />
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-xs text-center text-muted-foreground">
          {renderTermsText()}
        </p>
      </CardFooter>
    </Card>
  );
}
