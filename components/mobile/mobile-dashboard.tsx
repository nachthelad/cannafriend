"use client";

import { useState, useEffect } from "react";
import type { MobileDashboardProps } from "@/types/mobile";
import Link from "next/link";
import {
  ROUTE_SESSIONS,
  ROUTE_REMINDERS,
  ROUTE_AI_ASSISTANT,
  ROUTE_PLANTS,
  ROUTE_JOURNAL,
  ROUTE_NUTRIENTS,
  ROUTE_ADMIN,
  ROUTE_STASH,
} from "@/lib/routes";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { ReminderSystem } from "@/components/plant/reminder-system";
import { DataCard } from "@/components/common/data-card";
import {
  Plus,
  AlertTriangle,
  Bell,
  Brain,
  Leaf,
  Calendar,
  Shield,
  Box,
  FilePen,
  NotebookPen,
} from "lucide-react";

import type { Plant, LogEntry } from "@/types";
import { ADMIN_EMAIL } from "@/lib/constants";
import { FastLogAction } from "@/components/dashboard/fast-log-action";

export function MobileDashboard({
  plants,
  recentLogs,
  remindersCount,
  hasOverdue,
  userEmail,
  reminders,
  isPremium,
}: MobileDashboardProps) {
  const { t } = useTranslation([
    "dashboard",
    "common",
    "nutrients",
    "journal",
    "nav",
    "reminders",
    "sessions",
    "aiAssistant",
  ]);
  const isAdmin = userEmail?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!hasOverdue) return;

    const dismissedData = localStorage.getItem("overdue_alert_dismissed_data");
    if (dismissedData) {
      try {
        const { timestamp } = JSON.parse(dismissedData);
        // Check if there are any overdue reminders newer than the dismissal timestamp
        const hasNewerOverdue = reminders.some((r: any) => {
          if (!r.nextReminder || !r.isActive) return false;
          const nextDate = new Date(r.nextReminder).getTime();
          return nextDate <= Date.now() && nextDate > timestamp;
        });

        if (!hasNewerOverdue) {
          setIsDismissed(true);
        }
      } catch (e) {
        console.error("Error parsing dismissal data:", e);
      }
    }
  }, [hasOverdue, reminders]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(
      "overdue_alert_dismissed_data",
      JSON.stringify({ timestamp: Date.now() })
    );
  };

  // Quick action buttons for mobile
  const QuickActionButton = ({
    icon: Icon,
    label,
    href,
    isPremiumFeature = false,
  }: {
    icon: any;
    label: string;
    href: string;
    isPremiumFeature?: boolean;
  }) => (
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

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {t("title", { ns: "dashboard" })}
        </h1>
      </div>

      {/* Simple Overdue Alert (Mobile) */}
      {hasOverdue && !isDismissed && (
        <Link href={ROUTE_REMINDERS} onClick={handleDismiss}>
          <div className="bg-orange-100 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 p-3 rounded-lg flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-semibold text-orange-800 dark:text-orange-200">
              {t("overdue", { ns: "reminders" })}:{" "}
              {t("overdueRemindersDesc", { ns: "dashboard" })}
            </span>
          </div>
        </Link>
      )}

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
            color={hasOverdue ? "warning" : "default"}
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
            />
          )}
          <QuickActionButton
            icon={Box}
            label={t("stash", { ns: "nav" })}
            href={ROUTE_STASH}
          />
          {/* <QuickActionButton
            icon={FlaskConical}
            label={t("title", { ns: "nutrients" })}
            href={ROUTE_NUTRIENTS}
          /> */}
          <QuickActionButton
            icon={Bell}
            label={t("reminders", { ns: "dashboard" })}
            href={ROUTE_REMINDERS}
          />
          <FastLogAction
            plants={plants}
            renderTrigger={({ onClick, disabled }) => (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full h-16 flex flex-col gap-1"
                onClick={onClick}
                disabled={disabled}
              >
                <NotebookPen className="h-5 w-5" />
                <span className="text-xs">
                  {t("fastLogTitle", { ns: "dashboard" })}
                </span>
              </Button>
            )}
          />
          <QuickActionButton
            icon={FilePen}
            label={t("title", { ns: "sessions" })}
            href={ROUTE_SESSIONS}
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
