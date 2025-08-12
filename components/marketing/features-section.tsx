"use client";

import {
  Leaf,
  Calendar,
  Camera,
  BarChart3,
  List,
  NotebookPen,
} from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

interface FeaturesSectionProps {
  className?: string;
}

export function FeaturesSection({ className = "" }: FeaturesSectionProps) {
  const { t } = useTranslation();
  const growerFeatures: Feature[] = [
    {
      icon: Leaf,
      title: t("features.management.title"),
      description: t("features.management.desc"),
    },
    {
      icon: Calendar,
      title: t("features.journal.title"),
      description: t("features.journal.desc"),
    },
    {
      icon: BarChart3,
      title: t("features.monitoring.title"),
      description: t("features.monitoring.desc"),
    },
    {
      icon: Camera,
      title: t("features.gallery.title"),
      description: t("features.gallery.desc"),
    },
  ];

  const consumerFeatures: Feature[] = [
    {
      icon: Calendar,
      title: t("features.consumer.sessions.title"),
      description: t("features.consumer.sessions.desc"),
    },
    {
      icon: List,
      title: t("features.consumer.history.title"),
      description: t("features.consumer.history.desc"),
    },
    {
      icon: NotebookPen,
      title: t("features.consumer.notes.title"),
      description: t("features.consumer.notes.desc"),
    },
    {
      icon: Camera,
      title: t("features.consumer.photos.title"),
      description: t("features.consumer.photos.desc"),
    },
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${className}`}>
      {/* Grower section */}
      <section className="bg-white/95 dark:bg-gray-800/95 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
        <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
          {t("features.section.grower")}
        </h2>
        <div className="grid grid-cols-1 gap-3">
          {growerFeatures.map((feature, index) => (
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

      {/* Consumer section */}
      <section className="bg-white/95 dark:bg-gray-800/95 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
        <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
          {t("features.section.consumer")}
        </h2>
        <div className="grid grid-cols-1 gap-3">
          {consumerFeatures.map((feature, index) => (
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
    </div>
  );
}
