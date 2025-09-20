"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ResponsivePageHeader } from "@/components/common/responsive-page-header";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { ROUTE_LOGIN } from "@/lib/routes";

export default function ForgotPasswordPage() {
  const { t } = useTranslation(["auth", "common"]);
  const router = useRouter();

  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden min-h-screen ">
        <ResponsivePageHeader
          title={t("forgotPassword.title", { ns: "auth" })}
          description={t("forgotPassword.description", { ns: "auth" })}
          onBackClick={() => router.push(ROUTE_LOGIN)}
        />
        <div className="p-4">
          <ForgotPasswordForm />
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <div className="flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-6">
            <ResponsivePageHeader
              title={
                <span className="block text-center">
                  {t("forgotPassword.title", { ns: "auth" })}
                </span>
              }
              description={
                <span className="block text-center">
                  {t("forgotPassword.description", { ns: "auth" })}
                </span>
              }
              onBackClick={() => router.push(ROUTE_LOGIN)}
              className="text-center"
            />
            <ForgotPasswordForm />
          </div>
        </div>
      </div>
    </>
  );
}
