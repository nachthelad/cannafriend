"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Thermometer, Droplets, Calendar, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { EnvironmentData, LogEntry } from "@/types";

interface PlantEnvironmentCardProps {
  environmentData: EnvironmentData[];
  lastEnvironmentFromLogs?: LogEntry;
}

export function PlantEnvironmentCard({
  environmentData,
  lastEnvironmentFromLogs,
}: PlantEnvironmentCardProps) {
  const { t } = useTranslation(["plants", "common"]);

  // Get latest environment reading (from dedicated collection or logs)
  const latestReading = environmentData[0] || lastEnvironmentFromLogs;

  const formatDate = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("default", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  };

  const getTemperatureColor = (temp: number) => {
    if (temp < 18) return "text-blue-600 bg-blue-50";
    if (temp > 28) return "text-red-600 bg-red-50";
    return "text-green-600 bg-green-50";
  };

  const getHumidityColor = (humidity: number) => {
    if (humidity < 40) return "text-orange-600 bg-orange-50";
    if (humidity > 70) return "text-blue-600 bg-blue-50";
    return "text-green-600 bg-green-50";
  };

  return (
    <div className="space-y-6">
      {latestReading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t("plantPage.currentEnvironment", { ns: "plants" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Temperature */}
              {latestReading.temperature !== undefined && (
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-orange-100">
                      <Thermometer className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t("environment.temperature", { ns: "plants" })}
                      </p>
                      <p className="text-2xl font-bold">
                        {latestReading.temperature}°C
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={getTemperatureColor(latestReading.temperature)}
                  >
                    {latestReading.temperature < 18
                      ? t("environment.cold", { ns: "plants" })
                      : latestReading.temperature > 28
                      ? t("environment.hot", { ns: "plants" })
                      : t("environment.optimal", { ns: "plants" })}
                  </Badge>
                </div>
              )}

              {/* Humidity */}
              {latestReading.humidity !== undefined && (
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-100">
                      <Droplets className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t("environment.humidity", { ns: "plants" })}
                      </p>
                      <p className="text-2xl font-bold">
                        {latestReading.humidity}%
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={getHumidityColor(latestReading.humidity)}
                  >
                    {latestReading.humidity < 40
                      ? t("environment.dry", { ns: "plants" })
                      : latestReading.humidity > 70
                      ? t("environment.humid", { ns: "plants" })
                      : t("environment.optimal", { ns: "plants" })}
                  </Badge>
                </div>
              )}
            </div>

            {/* Last Reading Time */}
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {t("environment.lastReading", { ns: "plants" })}:{" "}
              {formatDate(latestReading.date)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
