"use client";

import type { MobileDashboardProps } from "@/types/mobile";
import Link from "next/link";
import {
  ROUTE_REMINDERS,
  ROUTE_AI_ASSISTANT,
  ROUTE_PLANTS,
  ROUTE_JOURNAL,
  ROUTE_ADMIN,
} from "@/lib/routes";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { DataCard } from "@/components/common/data-card";
import {
  Bell,
  Brain,
  Leaf,
  Calendar,
  Shield,
  Plus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { ADMIN_EMAIL } from "@/lib/constants";

function QuickActionButton({
  icon: Icon,
  label,
  href,
  isPremiumFeature = false,
  isPremium = false,
}: {
  icon: LucideIcon;
  label: string;
  href: string;
  isPremiumFeature?: boolean;
  isPremium?: boolean;
}) {
  return (
    <Link href={href}>
      <Button
        variant={isPremiumFeature && isPremium ? "default" : "outline"}
        size="lg"
        className={`w-full h-16 flex flex-col gap-1 ${
          isPremiumFeature && isPremium
            ? "bg-gradient-to-r from-emerald-500 via-green-600 to-teal-500 text-white"
            : ""
        }`}
      >
        <Icon className="h-5 w-5" />
        <span className="text-xs">{label}</span>
      </Button>
    </Link>
  );
}

export function MobileDashboard({
  plants,
  recentLogs,
  remindersCount,
  userEmail,
  isPremium,
}: MobileDashboardProps) {
  const { t } = useTranslation([
    "dashboard",
    "common",
    "journal",
    "reminders",
    "aiAssistant",
  ]);
  const isAdmin = userEmail?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  return (
    <div className="space-y-6 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {t("title", { ns: "dashboard" })}
        </h1>
      </div>

      {/* Stats grid - mobile first with 3 key metrics */}
      <div className="grid grid-cols-2 gap-4 pt-2">
        <DataCard
          label={t("yourPlants", { ns: "dashboard" })}
          value={plants.length}
          icon={Leaf}
          color="success"
          href={ROUTE_PLANTS}
        />
        <DataCard
          label={t("recentLogs", { ns: "journal" })}
          value={recentLogs.length}
          icon={Calendar}
          color="default"
          href={ROUTE_JOURNAL}
        />
        <div className="col-span-2">
          <DataCard
            label={t("title", { ns: "reminders" })}
            value={remindersCount}
            icon={Bell}
            color="default"
            href={ROUTE_REMINDERS}
          />
        </div>
      </div>

      {/* Quick actions - mobile optimized */}
      <div className="space-y-4 pt-2">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-1">
            {t("quickActions", { ns: "dashboard" })}
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {isPremium && (
            <QuickActionButton
              icon={Brain}
              label={t("title", { ns: "aiAssistant" })}
              href={ROUTE_AI_ASSISTANT}
              isPremiumFeature
              isPremium={isPremium}
            />
          )}
          <QuickActionButton
            icon={Leaf}
            label={t("yourPlants", { ns: "dashboard" })}
            href={ROUTE_PLANTS}
          />
          <QuickActionButton
            icon={Bell}
            label={t("reminders", { ns: "dashboard" })}
            href={ROUTE_REMINDERS}
          />
          <QuickActionButton
            icon={Calendar}
            label={t("recentLogs", { ns: "journal" })}
            href={ROUTE_JOURNAL}
          />
          {isAdmin && (
            <QuickActionButton icon={Shield} label="Admin" href={ROUTE_ADMIN} />
          )}
        </div>
      </div>

      {/* Empty state for new users */}
      {plants.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <Leaf className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="mb-2">
              {t("noPlants", { ns: "dashboard" })}
            </CardTitle>
            <CardDescription className="mb-6">
              {t("startGrowingJourney", { ns: "dashboard" })}
            </CardDescription>
            <Button asChild size="lg">
              <Link href="/plants/new">
                <Plus className="h-5 w-5 mr-2" />
                {t("addPlant", { ns: "dashboard" })}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
