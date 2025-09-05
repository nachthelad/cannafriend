"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ROUTE_PREMIUM } from "@/lib/routes";

export function PremiumRequiredCard(): React.ReactElement {
  const router = useRouter();
  const { t } = useTranslation(["common"]);

  return (
    <div className="text-center space-y-6">
      <div className="space-y-3">
        <h2 className="text-2xl font-bold">{t("premium.title", { ns: "common" })}</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          {t("premium.analyzeDesc", { ns: "common" })}
        </p>
      </div>
      <Button
        onClick={() => router.push(ROUTE_PREMIUM)}
        className="w-full max-w-xs"
        style={{ backgroundColor: "#228B22" }}
      >
        {t("premium.upgrade", { ns: "common" })}
      </Button>
    </div>
  );
}
