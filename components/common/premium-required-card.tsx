"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/use-translation";
import { ROUTE_PREMIUM } from "@/lib/routes";

export function PremiumRequiredCard(): React.ReactElement {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="text-lg font-medium">{t("premium.title")}</div>
        <div className="text-sm text-muted-foreground">
          {t("premium.analyzeDesc")}
        </div>
        <Button
          onClick={() => router.push(ROUTE_PREMIUM)}
          className="w-full"
          style={{ backgroundColor: "#228B22" }}
        >
          {t("premium.upgrade")}
        </Button>
      </CardContent>
    </Card>
  );
}
