"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ResponsivePageHeader } from "@/components/common/responsive-page-header";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { ROUTE_LOGIN } from "@/lib/routes";

function ResetPasswordContent() {
  const { t } = useTranslation(["auth", "common"]);
  const router = useRouter();

  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <ResponsivePageHeader
          title={t("resetPassword.title", { ns: "auth" })}
          description={t("resetPassword.description", { ns: "auth" })}
          onBackClick={() => router.push(ROUTE_LOGIN)}
        />
        <div className="p-4">
          <ResetPasswordForm />
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-6">
            <ResponsivePageHeader
              title={
                <span className="block text-center">
                  {t("resetPassword.title", { ns: "auth" })}
                </span>
              }
              description={
                <span className="block text-center">
                  {t("resetPassword.description", { ns: "auth" })}
                </span>
              }
              onBackClick={() => router.push(ROUTE_LOGIN)}
              className="text-center"
            />
            <ResetPasswordForm />
          </div>
        </div>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
