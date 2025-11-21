"use client";

import { useTranslation } from "react-i18next";
import type { JournalEntriesProps, LogEntry } from "@/types";
import { formatDateWithLocale } from "@/lib/utils";
import {
  Droplet,
  Leaf,
  Scissors,
  Thermometer,
  FileText,
  Flower,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function JournalEntries({
  logs,
  showPlantName = false,
  onDelete,
}: JournalEntriesProps) {
  const { t, i18n } = useTranslation(["journal", "common", "plants"]);
  const language = i18n.language;

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl bg-muted/20">
        <div className="p-4 rounded-full bg-muted/50 mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium">
          {t("noEntries", { ns: "journal" })}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("noEntriesDesc", { ns: "journal" })}
        </p>
      </div>
    );
  }

  const getLogConfig = (type: string) => {
    switch (type) {
      case "watering":
        return {
          icon: Droplet,
          color: "text-blue-600 dark:text-blue-400",
          bg: "bg-blue-100 dark:bg-blue-950/50",
          border: "border-blue-200 dark:border-blue-900",
        };
      case "feeding":
        return {
          icon: Leaf,
          color: "text-green-600 dark:text-green-400",
          bg: "bg-green-100 dark:bg-green-950/50",
          border: "border-green-200 dark:border-green-900",
        };
      case "training":
        return {
          icon: Scissors,
          color: "text-amber-600 dark:text-amber-400",
          bg: "bg-amber-100 dark:bg-amber-950/50",
          border: "border-amber-200 dark:border-amber-900",
        };
      case "environment":
        return {
          icon: Thermometer,
          color: "text-red-600 dark:text-red-400",
          bg: "bg-red-100 dark:bg-red-950/50",
          border: "border-red-200 dark:border-red-900",
        };
      case "flowering":
        return {
          icon: Flower,
          color: "text-pink-600 dark:text-pink-400",
          bg: "bg-pink-100 dark:bg-pink-950/50",
          border: "border-pink-200 dark:border-pink-900",
        };
      case "endCycle":
        return {
          icon: CheckCircle2,
          color: "text-emerald-600 dark:text-emerald-400",
          bg: "bg-emerald-100 dark:bg-emerald-950/50",
          border: "border-emerald-200 dark:border-emerald-900",
        };
      default:
        return {
          icon: FileText,
          color: "text-gray-600 dark:text-gray-400",
          bg: "bg-gray-100 dark:bg-gray-800",
          border: "border-gray-200 dark:border-gray-700",
        };
    }
  };

  const getLogTitle = (log: LogEntry) => {
    switch (log.type) {
      case "watering":
        return (
          <span className="flex items-center gap-2">
            <span>{t("logType.watering", { ns: "journal" })}</span>
            <span className="text-muted-foreground font-normal">•</span>
            <span className="font-normal text-muted-foreground">
              {log.amount}
              {log.unit ? log.unit : "ml"} (
              {t(`watering.${log.method}`, { ns: "journal" })})
            </span>
          </span>
        );
      case "feeding":
        return (
          <span className="flex items-center gap-2">
            <span>{t("logType.feeding", { ns: "journal" })}</span>
            <span className="text-muted-foreground font-normal">•</span>
            <span className="font-normal text-muted-foreground">
              {log.npk} ({log.amount}
              {log.unit ? log.unit : "ml/L"})
            </span>
          </span>
        );
      case "training":
        return (
          <span className="flex items-center gap-2">
            <span>{t("logType.training", { ns: "journal" })}</span>
            <span className="text-muted-foreground font-normal">•</span>
            <span className="font-normal text-muted-foreground">
              {t(`training.${log.method}`, { ns: "journal" })}
            </span>
          </span>
        );
      case "environment":
        return (
          <span className="flex items-center gap-2">
            <span>{t("logType.environment", { ns: "journal" })}</span>
            <span className="text-muted-foreground font-normal">•</span>
            <span className="font-normal text-muted-foreground">
              {log.temperature}°C, {log.humidity}%, pH {log.ph}
            </span>
          </span>
        );
      case "flowering":
        return log.lightSchedule ? (
          <span className="flex items-center gap-2">
            <span>{t("logType.flowering", { ns: "journal" })}</span>
            <span className="text-muted-foreground font-normal">•</span>
            <span className="font-normal text-muted-foreground">
              {t("newPlant.lightSchedule", { ns: "plants" })}:{" "}
              {log.lightSchedule}
            </span>
          </span>
        ) : (
          t("logType.flowering", { ns: "journal" })
        );
      case "endCycle":
        return t("logType.endCycle", { ns: "journal" });
      default:
        return t("logType.note", { ns: "journal" });
    }
  };

  return (
    <div className="space-y-6 relative pl-4">
      {/* Timeline Line */}
      <div className="absolute left-8 top-4 bottom-4 w-px bg-border/50" />

      {logs.map((log) => {
        const config = getLogConfig(log.type);
        const Icon = config.icon;

        return (
          <div key={log.id} className="relative pl-12 group">
            {/* Timeline Dot */}
            <div
              className={`absolute left-0 top-4 h-8 w-8 rounded-full flex items-center justify-center border-2 bg-background z-10 ${config.border} ${config.color}`}
            >
              <Icon className="h-4 w-4" />
            </div>

            <div className="bg-card rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-semibold text-base flex flex-wrap items-center gap-x-2">
                    {getLogTitle(log)}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/80">
                      {log.date &&
                        formatDateWithLocale(log.date, "PPP", language)}
                    </span>
                    <span>•</span>
                    <span>
                      {log.date &&
                        formatDateWithLocale(log.date, "p", language)}
                    </span>
                    {showPlantName && (log as any).plantName && (
                      <>
                        <span className="hidden sm:inline">•</span>
                        <span className="text-primary font-medium text-xs sm:text-sm mt-1 sm:mt-0 block sm:inline">
                          {(log as any).plantName}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive -mr-2 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Delete log"
                    onClick={() => onDelete(log)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {log.notes && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {log.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
