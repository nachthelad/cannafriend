"use client";

import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { resolveHomePathForRoles } from "@/lib/routes";
import { useUserRoles } from "@/hooks/use-user-roles";

export default function PremiumPage() {
  const { t } = useTranslation(["common"]);
  const router = useRouter();
  const { roles } = useUserRoles();
  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Premium</h1>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{t("premium.wip", { ns: "common" })}</h2>
          <p className="text-muted-foreground">
            {t("premium.mercadoPago", { ns: "common" })}
          </p>
          <Button 
            onClick={() => router.push(resolveHomePathForRoles(roles))}
            variant="outline"
          >
            {t("premium.back", { ns: "common" })}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
