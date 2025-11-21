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
import { useUserRoles } from "@/hooks/use-user-roles";
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
  const { roles } = useUserRoles();
  const isAdmin = userEmail?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const [showOverdueAlert, setShowOverdueAlert] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("overdue_alert_dismissed");
    if (!dismissed) {
      setShowOverdueAlert(true);
    }
  }, []);

  const handleDismissAlert = () => {
    setShowOverdueAlert(false);
    localStorage.setItem("overdue_alert_dismissed", "true");
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
      {/* Overdue reminders banner - mobile optimized */}
      {hasOverdue && showOverdueAlert && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div className="flex-1">
                <p className="font-medium text-orange-800 dark:text-orange-200">
                  {t("overdue", { ns: "reminders" })}
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-300">
                  {t("overdueRemindersDesc", { ns: "dashboard" })}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-orange-200 text-orange-700 hover:bg-orange-100"
                onClick={handleDismissAlert}
              >
                Ok
              </Button>
            </div>
          </CardContent>
        </Card>
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
        {roles?.grower && (
          <div className="col-span-2">
            <DataCard
              label={t("title", { ns: "reminders" })}
              value={remindersCount}
              icon={Bell}
              color={hasOverdue ? "warning" : "default"}
              href={ROUTE_REMINDERS}
            />
          </div>
        )}
      </div>

      {/* Quick actions - mobile optimized */}
      <div className="space-y-4 pt-2">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-1">
            {t("quickActions", { ns: "dashboard" })}
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {roles?.grower && (
            <>
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
            </>
          )}
          {roles?.consumer && (
            <QuickActionButton
              icon={FilePen}
              label={t("title", { ns: "sessions" })}
              href={ROUTE_SESSIONS}
            />
          )}
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

      {/* Reminder system - only overdue for mobile dashboard */}
      <ReminderSystem plants={plants} showOnlyOverdue reminders={reminders} />
    </div>
  );
}
