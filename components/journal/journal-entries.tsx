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
      <div className="text-center py-8 text-muted-foreground">
        <p>{t("noEntries", { ns: "journal" })}</p>
        <p className="text-sm">{t("noEntriesDesc", { ns: "journal" })}</p>
      </div>
    );
  }

  const getLogIcon = (type: string) => {
    switch (type) {
      case "watering":
        return <Droplet className="h-4 w-4 text-blue-500" />;
      case "feeding":
        return <Leaf className="h-4 w-4 text-green-500" />;
      case "training":
        return <Scissors className="h-4 w-4 text-amber-500" />;
      case "environment":
        return <Thermometer className="h-4 w-4 text-red-500" />;
      case "flowering":
        return <Flower className="h-4 w-4 text-pink-500" />;
      case "endCycle":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLogTitle = (log: LogEntry) => {
    switch (log.type) {
      case "watering":
        return `${t("logType.watering", { ns: "journal" })} - ${log.amount}${log.unit ? log.unit : "ml"} (${t(
          `watering.${log.method}`, { ns: "journal" }
        )})`;
      case "feeding":
        return `${t("logType.feeding", { ns: "journal" })} - ${log.npk} (${log.amount}${log.unit ? log.unit : "ml/L"})`;
      case "training":
        return `${t("logType.training", { ns: "journal" })} - ${t(`training.${log.method}`, { ns: "journal" })}`;
      case "environment":
        return `${t("logType.environment", { ns: "journal" })} - ${log.temperature}°C, ${
          log.humidity
        }%, pH ${log.ph}`;
      case "flowering":
        return log.lightSchedule
          ? `${t("logType.flowering", { ns: "journal" })} - ${t("newPlant.lightSchedule", { ns: "plants" })}: ${
              log.lightSchedule
            }`
          : t("logType.flowering", { ns: "journal" });
      case "endCycle":
        return t("logType.endCycle", { ns: "journal" });
      default:
        return t("logType.note", { ns: "journal" });
    }
  };

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <div key={log.id} className="border-b pb-4 last:border-0 last:pb-0">
          <div className="flex items-center gap-2 mb-1 justify-between">
            <div className="flex items-center gap-2">
              {getLogIcon(log.type)}
              <span className="font-medium">{getLogTitle(log)}</span>
            </div>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete log"
                onClick={() => onDelete(log)}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            )}
          </div>
          <div className="text-xs text-muted-foreground mb-1">
            {log.date && formatDateWithLocale(log.date, "PPP p", language)}
            {showPlantName && (log as any).plantName && (
              <span className="ml-2 text-primary">
                • {(log as any).plantName}
              </span>
            )}
          </div>
          {log.notes && <p className="text-sm mt-1">{log.notes}</p>}
        </div>
      ))}
    </div>
  );
}
