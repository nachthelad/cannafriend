"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { ROUTE_PRIVACY } from "@/lib/routes";
import { X } from "lucide-react";

export function CookieConsent() {
  const { t } = useTranslation(["common"]);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already given consent
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("cookie-consent-changed", { detail: "accepted" })
      );
    }
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "declined");
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("cookie-consent-changed", { detail: "declined" })
      );
    }
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:max-w-md">
      <Card className="shadow-lg border">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-sm">{t("cookies.title")}</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1 -mr-1"
              onClick={handleDecline}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {t("cookies.description")}{" "}
            <Link href={ROUTE_PRIVACY} className="text-primary hover:underline">
              {t("cookies.learnMore")}
            </Link>
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAccept} className="flex-1">
              {t("cookies.accept")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDecline}
              className="flex-1"
            >
              {t("cookies.decline")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
