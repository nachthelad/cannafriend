"use client";

import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { resolveHomePathForRoles } from "@/lib/routes";
import { useUserRoles } from "@/hooks/use-user-roles";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Crown, CreditCard, Banknote } from "lucide-react";

export default function PremiumPage() {
  const { t } = useTranslation(["common"]);
  const router = useRouter();
  const { roles } = useUserRoles();
  const { user } = useAuthUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleStripePayment = async () => {
    if (!user) return;
    
    setLoading('stripe');
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message || 'Failed to initialize payment',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleMercadoPagoPayment = async () => {
    if (!user) return;
    
    setLoading('mercadopago');
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/mercadopago/create-subscription', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success && data.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error(data.error || 'Failed to create subscription');
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message || 'Failed to initialize payment',
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
            <h1 className="text-3xl font-bold">Premium</h1>
          </div>
          <p className="text-muted-foreground">
            Upgrade to Premium and unlock the full power of Cannafriend's AI assistant
          </p>
        </div>

        {/* Premium Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Premium Features</CardTitle>
            <CardDescription>Everything you get with Premium access</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-medium">AI Plant Assistant</h4>
                  <p className="text-sm text-muted-foreground">Get expert advice and plant analysis</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-medium">Advanced Analytics</h4>
                  <p className="text-sm text-muted-foreground">Detailed growth tracking and insights</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-medium">Priority Support</h4>
                  <p className="text-sm text-muted-foreground">Get help when you need it most</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-medium">Premium Content</h4>
                  <p className="text-sm text-muted-foreground">Exclusive guides and resources</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Note */}
        <div className="text-center space-y-4">
          <div>
            <div className="text-2xl font-bold">Premium Subscription</div>
            <div className="text-muted-foreground">Choose your preferred payment method</div>
          </div>
        </div>

        {/* Payment Options */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Pay with Stripe</CardTitle>
              <CardDescription>Secure international payments</CardDescription>
              <div className="text-2xl font-bold text-primary mt-2">$9.99/month</div>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleStripePayment}
                disabled={loading === 'stripe'}
                className="w-full"
              >
                {loading === 'stripe' ? 'Processing...' : 'Subscribe with Stripe'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <Banknote className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>Pay with MercadoPago</CardTitle>
              <CardDescription>Popular in Latin America</CardDescription>
              <div className="text-2xl font-bold text-primary mt-2">$10,000 ARS/month</div>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleMercadoPagoPayment}
                disabled={loading === 'mercadopago'}
                className="w-full"
                variant="outline"
              >
                {loading === 'mercadopago' ? 'Processing...' : 'Subscribe with MercadoPago'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button 
            onClick={() => router.push(resolveHomePathForRoles(roles))}
            variant="ghost"
          >
            {t("premium.back", { ns: "common" })}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
