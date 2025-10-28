"use client";

import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { resolveHomePathForRoles } from "@/lib/routes";
import { useUserRoles } from "@/hooks/use-user-roles";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Crown, CreditCard, Banknote } from "lucide-react";

export default function PremiumPage() {
  const { t } = useTranslation(["premium", "common"]);
  const router = useRouter();
  const { roles } = useUserRoles();
  const { user } = useAuthUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  // After returning from MercadoPago, force-sync custom claims and refresh token
  useEffect(() => {
    const search =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null;
    const status = search?.get("status");
    if (status === "completed" && user) {
      (async () => {
        try {
          const token = await user.getIdToken();
          await fetch("/api/mercadopago/sync-claims", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          // Force refresh local token to pick up latest claims
          await user.getIdToken(true);
        } catch {
          // no-op; hook will eventually pick up claim via normal refresh
        }
      })();
    }
  }, [user]);

  const handleStripePayment = async () => {
    if (!user) return;

    setLoading("stripe");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else if (data.error === "already_premium") {
        toast({
          variant: "destructive",
          title: t("error", { ns: "common" }),
          description: "You already have an active premium subscription.",
        });
        return;
      } else {
        throw new Error(data.error || "Failed to create checkout session");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("error", { ns: "common" }),
        description: error.message || "Failed to initialize payment",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleMercadoPagoPayment = async () => {
    if (!user) return;

    setLoading("mercadopago");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/mercadopago/create-subscription", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success && (data.checkout_url || data.init_point)) {
        window.location.href = data.checkout_url || data.init_point;
      } else if (data.error === "already_premium") {
        toast({
          variant: "destructive",
          title: t("error", { ns: "common" }),
          description: "You already have an active premium subscription.",
        });
        return;
      } else {
        const detail =
          typeof data?.details === "string"
            ? ` (${data.details.slice(0, 180)})`
            : "";
        throw new Error(
          (data.error || "Failed to create subscription") + detail
        );
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("error", { ns: "common" }),
        description: error.message || "Failed to initialize payment",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Crown className="h-8 w-8 text-yellow-500" />
            <h1 className="text-3xl font-bold">
              {t("title", { ns: "premium" })}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {t("subtitle", { ns: "premium" })}
          </p>
        </div>

        {/* Premium Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {t("featuresTitle", { ns: "premium" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-medium">
                    {t("features.aiAssistant.title", { ns: "premium" })}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t("features.aiAssistant.description", { ns: "premium" })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-medium">
                    {t("features.analytics.title", { ns: "premium" })}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t("features.analytics.description", { ns: "premium" })}
                  </p>
                </div>
              </div>
              {/* <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-medium">
                    {t("features.support.title", { ns: "premium" })}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t("features.support.description", { ns: "premium" })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-medium">
                    {t("features.content.title", { ns: "premium" })}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t("features.content.description", { ns: "premium" })}
                  </p>
                </div>
              </div> */}
            </div>
          </CardContent>
        </Card>

        {/* Pricing Note */}
        <div className="text-center space-y-4">
          <div>
            <div className="text-2xl font-bold">
              {t("subscription.title", { ns: "premium" })}
            </div>
            <div className="text-muted-foreground">
              {t("subscription.subtitle", { ns: "premium" })}
            </div>
          </div>
        </div>

        {/* Payment Options */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <Banknote className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>
                {t("payment.mercadoPago.title", { ns: "premium" })}
              </CardTitle>
              <CardDescription>
                {t("payment.mercadoPago.description", { ns: "premium" })}
              </CardDescription>
              <div className="text-2xl font-bold text-primary mt-2">
                {t("payment.mercadoPago.price", { ns: "premium" })}
              </div>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleMercadoPagoPayment}
                disabled={loading === "mercadopago"}
                className="w-full"
              >
                {loading === "mercadopago"
                  ? t("payment.mercadoPago.processing", { ns: "premium" })
                  : t("payment.mercadoPago.button", { ns: "premium" })}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>
                {t("payment.stripe.title", { ns: "premium" })}
              </CardTitle>
              <CardDescription>
                {t("payment.stripe.description", { ns: "premium" })}
              </CardDescription>
              <div className="text-2xl font-bold text-primary mt-2">
                {t("payment.stripe.price", { ns: "premium" })}
              </div>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleStripePayment}
                disabled={loading === "stripe"}
                className="w-full"
              >
                {loading === "stripe"
                  ? t("payment.stripe.processing", { ns: "premium" })
                  : t("payment.stripe.button", { ns: "premium" })}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button
            onClick={() => router.push(resolveHomePathForRoles(roles))}
            variant="ghost"
          >
            {t("back", { ns: "premium" })}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
