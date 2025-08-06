"use client";

import { useTranslation } from "@/hooks/use-translation";
import type { LogEntry } from "@/types";
import { formatDateWithLocale } from "@/lib/utils";
import {
  Droplet,
  Leaf,
  Scissors,
  Thermometer,
  FileText,
  Flower,
} from "lucide-react";

interface JournalEntriesProps {
  logs: LogEntry[];
  showPlantName?: boolean;
}

export function JournalEntries({
  logs,
  showPlantName = false,
}: JournalEntriesProps) {
  const { t, language } = useTranslation();

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{t("journal.noEntries")}</p>
        <p className="text-sm">{t("journal.noEntriesDesc")}</p>
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
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLogTitle = (log: LogEntry) => {
    switch (log.type) {
      case "watering":
        return `${t("logType.watering")} - ${log.amount}ml (${t(
          `watering.${log.method}`
        )})`;
      case "feeding":
        return `${t("logType.feeding")} - ${log.npk} (${log.amount}ml/L)`;
      case "training":
        return `${t("logType.training")} - ${t(`training.${log.method}`)}`;
      case "environment":
        return `${t("logType.environment")} - ${log.temperature}°C, ${
          log.humidity
        }%, pH ${log.ph}`;
      case "flowering":
        return t("logType.flowering");
      default:
        return t("logType.note");
    }
  };

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <div key={log.id} className="border-b pb-4 last:border-0 last:pb-0">
          <div className="flex items-center gap-2 mb-1">
            {getLogIcon(log.type)}
            <span className="font-medium">{getLogTitle(log)}</span>
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
