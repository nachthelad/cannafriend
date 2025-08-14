"use client";

import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { useRouter } from "next/navigation";
import { resolveHomePathForRoles } from "@/lib/routes";
import { useUserRoles } from "@/hooks/use-user-roles";

export default function PremiumPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { roles } = useUserRoles();
  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Premium</h1>
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="text-lg font-medium">{t("premium.wip")}</div>
            <div className="text-sm text-muted-foreground">
              {t("premium.mercadoPago")}
            </div>
            <Button onClick={() => router.push(resolveHomePathForRoles(roles))}>
              {t("premium.back")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
