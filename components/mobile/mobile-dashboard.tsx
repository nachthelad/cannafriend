"use client";

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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { ReminderSystem } from "@/components/plant/reminder-system";
import {
  Plus,
  AlertTriangle,
  Bell,
  Brain,
  Leaf,
  Calendar,
  FlaskConical,
  ArrowRight,
  TrendingUp,
  Shield,
  Box,
} from "lucide-react";
import { useUserRoles } from "@/hooks/use-user-roles";
import type { Plant, LogEntry } from "@/types";
import { ADMIN_EMAIL } from "@/lib/constants";

interface MobileDashboardProps {
  plants: Plant[];
  recentLogs: LogEntry[];
  remindersCount: number;
  hasOverdue: boolean;
  userEmail?: string;
  reminders: any[];
  isPremium: boolean;
}

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

  // Mobile-optimized stats cards
  const StatCard = ({
    icon: Icon,
    label,
    value,
    href,
    color = "text-muted-foreground",
    bgColor = "bg-muted/20",
  }: {
    icon: any;
    label: string;
    value: string | number;
    href?: string;
    color?: string;
    bgColor?: string;
  }) => {
    const content = (
      <div
        className={`rounded-xl p-4 ${bgColor} transition-all active:scale-95`}
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        {href && (
          <div className="flex items-center mt-2 text-xs text-primary">
            {t("view", { ns: "common" })}{" "}
            <ArrowRight className="h-3 w-3 ml-1" />
          </div>
        )}
      </div>
    );

    return href ? (
      <Link href={href} className="block">
        {content}
      </Link>
    ) : (
      content
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
      {/* Overdue reminders banner - mobile optimized */}
      {hasOverdue && (
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
                asChild
                variant="outline"
                size="sm"
                className="border-orange-200 text-orange-700 hover:bg-orange-100"
              >
                <Link href={ROUTE_REMINDERS}>
                  {t("view", { ns: "common" })}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats grid - mobile first */}
      <div className="grid grid-cols-2 gap-4 pt-2">
        <StatCard
          icon={Leaf}
          label={t("yourPlants", { ns: "dashboard" })}
          value={plants.length}
          href={ROUTE_PLANTS}
          color="text-green-600"
          bgColor="bg-green-50 dark:bg-green-950/20"
        />
        <StatCard
          icon={Calendar}
          label={t("recentLogs", { ns: "journal" })}
          value={recentLogs.length}
          href={ROUTE_JOURNAL}
          color="text-blue-600"
          bgColor="bg-blue-50 dark:bg-blue-950/20"
        />
        {roles?.grower && (
          <StatCard
            icon={Bell}
            label={t("title", { ns: "reminders" })}
            value={remindersCount}
            href={ROUTE_REMINDERS}
            color="text-purple-600"
            bgColor="bg-purple-50 dark:bg-purple-950/20"
          />
        )}
        <StatCard
          icon={TrendingUp}
          label={t("growth", { ns: "dashboard" })}
          value={t("active", { ns: "dashboard" })}
          color="text-emerald-600"
          bgColor="bg-emerald-50 dark:bg-emerald-950/20"
        />
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
            </>
          )}
          {roles?.consumer && (
            <QuickActionButton
              icon={Leaf}
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
