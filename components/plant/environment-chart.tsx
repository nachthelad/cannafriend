"use client";

import { useState } from "react";
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
  const [activeTab, setActiveTab] = useState("temperature");

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{t("environment.noData")}</p>
        <p className="text-sm">{t("environment.noDataDesc")}</p>
      </div>
    );
  }

  // Format data for charts
  const chartData = data.map((item) => ({
    date: formatDateWithLocale(item.date, "MM/dd", language),
    temperature: item.temperature,
    humidity: item.humidity,
    ph: item.ph,
  }));

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="temperature" className="gap-2">
            <Thermometer className="h-5 w-5" />
            <span className="hidden sm:inline">
              {t("environment.temperature")}
            </span>
            <span className="sm:hidden">Temp</span>
          </TabsTrigger>
          <TabsTrigger value="humidity" className="gap-2">
            <Droplets className="h-5 w-5" />
            <span className="hidden sm:inline">
              {t("environment.humidity")}
            </span>
            <span className="sm:hidden">Hum</span>
          </TabsTrigger>
          <TabsTrigger value="ph" className="gap-2">
            <span className="font-medium">pH</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="temperature" className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              {/* Hide legend on small screens to avoid overlap */}
              <Legend wrapperStyle={{ display: "none" }} />
              <Line
                type="monotone"
                dataKey="temperature"
                stroke="#ef4444"
                name={t("environment.temperature")}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="humidity" className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend wrapperStyle={{ display: "none" }} />
              <Line
                type="monotone"
                dataKey="humidity"
                stroke="#3b82f6"
                name={t("environment.humidity")}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="ph" className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend wrapperStyle={{ display: "none" }} />
              <Line
                type="monotone"
                dataKey="ph"
                stroke="#8b5cf6"
                name={t("environment.ph")}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>
    </div>
  );
}
