"use client";

import type { Feature, FeaturesSectionProps } from "@/types/marketing";
import {
  Leaf,
  Calendar,
  Camera,
  BarChart3,
  Bell,
  Brain,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export function FeaturesSection({ className = "" }: FeaturesSectionProps) {
  const { t } = useTranslation(["landing"]);
  const features: Feature[] = [
    {
      icon: Leaf,
      title: t("features.plantManagement.title", { ns: "landing" }),
      description: t("features.plantManagement.desc", { ns: "landing" }),
    },
    {
      icon: Calendar,
      title: t("features.growJournal.title", { ns: "landing" }),
      description: t("features.growJournal.desc", { ns: "landing" }),
    },
    {
      icon: BarChart3,
      title: t("features.environmentControl.title", { ns: "landing" }),
      description: t("features.environmentControl.desc", { ns: "landing" }),
    },
    {
      icon: Camera,
      title: t("features.photoGallery.title", { ns: "landing" }),
      description: t("features.photoGallery.desc", { ns: "landing" }),
    },
    {
      icon: Bell,
      title: t("features.reminders.title", { ns: "landing" }),
      description: t("features.reminders.desc", { ns: "landing" }),
    },
    {
      icon: Brain,
      title: t("showcase.aiTitle", { ns: "landing" }),
      description: t("showcase.aiDesc", { ns: "landing" }),
    },
  ];

  return (
    <section className="col-span-1 md:col-span-2 bg-white/95 dark:bg-gray-800/95 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
      <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
        {t("features.title", { defaultValue: "Features" })}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {features.map((feature, index) => (
          <div
            key={index}
            className="rounded-md border border-gray-200 dark:border-gray-700 p-3 min-h-24"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                <feature.icon className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-200">
                  {feature.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
