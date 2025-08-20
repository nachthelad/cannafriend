"use client";

import { useMemo } from "react";
import { useTranslation } from "@/hooks/use-translation";
import type { EnvironmentData } from "@/types";
import { formatDateWithLocale } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Thermometer, Droplets } from "lucide-react";

interface EnvironmentChartProps {
  data: EnvironmentData[];
}

export function EnvironmentChart({ data }: EnvironmentChartProps) {
  const { t, language } = useTranslation();

  const latest = useMemo(
    () => (data.length > 0 ? data[data.length - 1] : null),
    [data]
  );

  const chartData = useMemo(
    () =>
      data.map((item) => ({
        date: formatDateWithLocale(item.date, "MM/dd", language),
        temperature: item.temperature,
        humidity: item.humidity,
        ph: item.ph,
      })),
    [data, language]
  );

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="rounded-md border p-3">
          <div className="text-muted-foreground">
            {t("environment.temperature")}
          </div>
          <div className="text-base font-semibold">
            {latest ? `${latest.temperature ?? "-"}°C` : "-"}
          </div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-muted-foreground">
            {t("environment.humidity")}
          </div>
          <div className="text-base font-semibold">
            {latest ? `${latest.humidity ?? "-"}%` : "-"}
          </div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-muted-foreground">{t("environment.ph")}</div>
          <div className="text-base font-semibold">
            {latest ? latest.ph ?? "-" : "-"}
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>{t("environment.noData")}</p>
          <p className="text-sm">{t("environment.noDataDesc")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-2 pr-2">{t("logForm.date")}</th>
                <th className="text-left py-2 pr-2">
                  {t("environment.temperature")}
                </th>
                <th className="text-left py-2 pr-2">
                  {t("environment.humidity")}
                </th>
                <th className="text-left py-2">{t("environment.ph")}</th>
              </tr>
            </thead>
            <tbody>
              {data
                .slice()
                .reverse()
                .slice(0, 2)
                .map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2 pr-2 text-muted-foreground">
                      {formatDateWithLocale(item.date, "PP", language)}
                    </td>
                    <td className="py-2 pr-2">{item.temperature ?? "-"}°C</td>
                    <td className="py-2 pr-2">{item.humidity ?? "-"}%</td>
                    <td className="py-2">{item.ph ?? "-"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
