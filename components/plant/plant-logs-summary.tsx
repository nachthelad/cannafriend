"use client";

import type {
  PlantLogsSummaryProps,
  LastActivitiesSummaryProps,
} from "@/types/plants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Droplets,
  Leaf,
  Scissors,
  Flower,
  Plus,
  Calendar,
  Clock,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { ROUTE_JOURNAL } from "@/lib/routes";
import { JournalEntries } from "@/components/journal/journal-entries";
import Link from "next/link";

export function LastActivitiesSummary({
  lastWatering,
  lastFeeding,
  lastTraining,
  lastFlowering,
}: LastActivitiesSummaryProps) {
  const { t } = useTranslation(["plants", "journal", "common"]);

  const formatRelativeTime = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t("today", { ns: "common" });
    if (diffDays === 1) return t("yesterday", { ns: "common" });
    if (diffDays < 7) return t("daysAgo", { ns: "common", count: diffDays });
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return t("weeksAgo", { ns: "common", count: weeks });
    }
    const months = Math.floor(diffDays / 30);
    return t("monthsAgo", { ns: "common", count: months });
  };

  const getDaysAgo = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  };

  const getActivityColor = (type: string, daysAgo: number) => {
    switch (type) {
      case "watering":
        if (daysAgo > 5) return "bg-red-100 text-red-700";
        if (daysAgo > 3) return "bg-yellow-100 text-yellow-700";
        return "bg-blue-100 text-blue-700";
      case "feeding":
        if (daysAgo > 14) return "bg-red-100 text-red-700";
        if (daysAgo > 7) return "bg-yellow-100 text-yellow-700";
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {t("plantPage.lastActivities", { ns: "plants" })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Last Watering */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100">
                <Droplets className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("logType.watering", { ns: "journal" })}
                </p>
                {lastWatering ? (
                  <p className="font-medium">
                    {formatRelativeTime(lastWatering.date)}
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    {t("never", { ns: "common" })}
                  </p>
                )}
              </div>
            </div>
            {lastWatering && (
              <Badge
                variant="secondary"
                className={getActivityColor(
                  "watering",
                  getDaysAgo(lastWatering.date)
                )}
              >
                {getDaysAgo(lastWatering.date) === 0
                  ? t("today", { ns: "common" })
                  : `${getDaysAgo(lastWatering.date)}d`}
              </Badge>
            )}
          </div>

          {/* Last Feeding */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100">
                <Leaf className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("logType.feeding", { ns: "journal" })}
                </p>
                {lastFeeding ? (
                  <p className="font-medium">
                    {formatRelativeTime(lastFeeding.date)}
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    {t("never", { ns: "common" })}
                  </p>
                )}
              </div>
            </div>
            {lastFeeding && (
              <Badge
                variant="secondary"
                className={getActivityColor(
                  "feeding",
                  getDaysAgo(lastFeeding.date)
                )}
              >
                {getDaysAgo(lastFeeding.date) === 0
                  ? t("today", { ns: "common" })
                  : `${getDaysAgo(lastFeeding.date)}d`}
              </Badge>
            )}
          </div>

          {/* Last Training */}
          {lastTraining && (
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-100">
                  <Scissors className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("logType.training", { ns: "journal" })}
                  </p>
                  <p className="font-medium">
                    {formatRelativeTime(lastTraining.date)}
                  </p>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="bg-purple-100 text-purple-700"
              >
                {getDaysAgo(lastTraining.date) === 0
                  ? t("today", { ns: "common" })
                  : `${getDaysAgo(lastTraining.date)}d`}
              </Badge>
            </div>
          )}

          {/* Last Flowering */}
          {lastFlowering && (
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-pink-100">
                  <Flower className="h-5 w-5 text-pink-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("logType.flowering", { ns: "journal" })}
                  </p>
                  <p className="font-medium">
                    {formatRelativeTime(lastFlowering.date)}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-pink-100 text-pink-700">
                {getDaysAgo(lastFlowering.date) === 0
                  ? t("today", { ns: "common" })
                  : `${getDaysAgo(lastFlowering.date)}d`}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Plant Logs List Component
// Plant Logs List Component

// ... (imports)

export function PlantLogsSummary({
  plantId,
  logs,
  lastWatering,
  lastFeeding,
  lastTraining,
  lastFlowering,
  onDeleteLog,
}: PlantLogsSummaryProps) {
  const { t } = useTranslation(["plants", "journal", "common"]);

  const addLogHref = `${ROUTE_JOURNAL}/new?plantId=${plantId}&returnTo=plant`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>{t("plantPage.recentLogs", { ns: "plants" })}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("plantPage.recentLogsDesc", { ns: "plants" })}
          </p>
        </div>
        <Button asChild>
          <Link href={addLogHref}>
            <Plus className="h-4 w-4 mr-2" />
            {t("addLog", { ns: "journal" })}
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {logs.length > 0 ? (
          <JournalEntries
            logs={logs.slice(0, 10)} // Show last 10 logs
            onDelete={(log) => onDeleteLog(log.id!)}
          />
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {t("noLogs", { ns: "journal" })}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {t("noLogsDesc", { ns: "journal" })}
            </p>
            <Button className="mt-4" asChild>
              <Link href={addLogHref}>
                <Plus className="h-4 w-4 mr-2" />
                {t("addFirstLog", { ns: "journal" })}
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
