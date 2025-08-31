"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ROUTE_STRAINS,
  ROUTE_REMINDERS,
  ROUTE_ANALYZE_PLANT,
  ROUTE_PLANTS,
  ROUTE_JOURNAL,
  ROUTE_NUTRIENTS,
} from "@/lib/routes";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { useAuthUser } from "@/hooks/use-auth-user";
import { ROUTE_LOGIN } from "@/lib/routes";
import { plantsCol, logsCol, remindersCol } from "@/lib/paths";
import { query, getDocs, orderBy } from "firebase/firestore";
import { ReminderSystem } from "@/components/plant/reminder-system";
import { PlantCard } from "@/components/plant/plant-card";
import { JournalEntries } from "@/components/journal/journal-entries";
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
} from "lucide-react";
import { AnimatedLogo } from "@/components/common/animated-logo";
import { useUserRoles } from "@/hooks/use-user-roles";
import { usePremium } from "@/hooks/use-premium";
import type { Plant, LogEntry } from "@/types";
import { db } from "@/lib/firebase";
import { collection } from "firebase/firestore";
import { buildNutrientMixesPath } from "@/lib/firebase-config";

interface MobileDashboardProps {
  plants: Plant[];
  recentLogs: LogEntry[];
  nutrientMixesCount: number;
  hasOverdue: boolean;
  isLoading: boolean;
}

export function MobileDashboard({
  plants,
  recentLogs,
  nutrientMixesCount,
  hasOverdue,
  isLoading,
}: MobileDashboardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { roles } = useUserRoles();
  const { isPremium } = usePremium();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <AnimatedLogo size={32} className="text-primary" duration={1.5} />
      </div>
    );
  }

  // Mobile-optimized stats cards
  const StatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    href, 
    color = "text-muted-foreground",
    bgColor = "bg-muted/20"
  }: {
    icon: any;
    label: string;
    value: string | number;
    href?: string;
    color?: string;
    bgColor?: string;
  }) => {
    const content = (
      <div className={`rounded-xl p-4 ${bgColor} transition-all active:scale-95`}>
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
            View all <ArrowRight className="h-3 w-3 ml-1" />
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
    isPremiumFeature = false 
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
      {/* Overdue reminders banner - mobile optimized */}
      {hasOverdue && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div className="flex-1">
                <p className="font-medium text-orange-800 dark:text-orange-200">
                  {t("reminders.overdue")}
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-300">
                  You have overdue reminders
                </p>
              </div>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-orange-200 text-orange-700 hover:bg-orange-100"
              >
                <Link href={ROUTE_REMINDERS}>View</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats grid - mobile first */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={Leaf}
          label={t("dashboard.yourPlants")}
          value={plants.length}
          href={ROUTE_PLANTS}
          color="text-green-600"
          bgColor="bg-green-50 dark:bg-green-950/20"
        />
        <StatCard
          icon={Calendar}
          label="Recent Logs"
          value={recentLogs.length}
          href={ROUTE_JOURNAL}
          color="text-blue-600"
          bgColor="bg-blue-50 dark:bg-blue-950/20"
        />
        {roles?.grower && (
          <StatCard
            icon={FlaskConical}
            label={t("nutrients.title")}
            value={nutrientMixesCount}
            href={ROUTE_NUTRIENTS}
            color="text-purple-600"
            bgColor="bg-purple-50 dark:bg-purple-950/20"
          />
        )}
        <StatCard
          icon={TrendingUp}
          label="Growth"
          value="Active"
          color="text-emerald-600"
          bgColor="bg-emerald-50 dark:bg-emerald-950/20"
        />
      </div>

      {/* Quick actions - mobile optimized */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Frequently used features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {roles?.grower && (
              <>
                <QuickActionButton
                  icon={Plus}
                  label={t("nav.addPlant")}
                  href="/plants/new"
                />
                <QuickActionButton
                  icon={Calendar}
                  label={t("nav.journal")}
                  href={ROUTE_JOURNAL}
                />
                <QuickActionButton
                  icon={Bell}
                  label={t("dashboard.reminders")}
                  href={ROUTE_REMINDERS}
                />
                {isPremium && (
                  <QuickActionButton
                    icon={Brain}
                    label={t("analyzePlant.title")}
                    href={ROUTE_ANALYZE_PLANT}
                    isPremiumFeature
                  />
                )}
              </>
            )}
            {roles?.consumer && (
              <QuickActionButton
                icon={Leaf}
                label={t("strains.title")}
                href={ROUTE_STRAINS}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent plants - mobile card layout */}
      {plants.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>{t("dashboard.yourPlants")}</CardTitle>
              <CardDescription>
                {plants.length} plants growing
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href={ROUTE_PLANTS}>
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {plants.slice(0, 2).map((plant) => (
              <div key={plant.id} className="border rounded-lg overflow-hidden">
                <PlantCard plant={plant} compact />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent journal entries - mobile optimized */}
      {recentLogs.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>{t("journal.recentLogs")}</CardTitle>
              <CardDescription>
                Latest activity from your plants
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href={ROUTE_JOURNAL}>
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <JournalEntries logs={recentLogs.slice(0, 3)} showPlantName={true} />
          </CardContent>
        </Card>
      )}

      {/* Empty state for new users */}
      {plants.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <Leaf className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="mb-2">{t("dashboard.noPlants")}</CardTitle>
            <CardDescription className="mb-6">
              Start your growing journey by adding your first plant
            </CardDescription>
            <Button asChild size="lg">
              <Link href="/plants/new">
                <Plus className="h-5 w-5 mr-2" />
                {t("dashboard.addPlant")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reminder system - only overdue for mobile dashboard */}
      <ReminderSystem plants={plants} showOnlyOverdue />
    </div>
  );
}