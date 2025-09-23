"use client";

import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import {
  Brain,
  Camera,
  Calendar,
  BarChart3,
  Bell,
  Users,
  Leaf,
  Droplets,
  Thermometer,
  Notebook,
  Heart,
  Zap,
} from "lucide-react";

export function AppShowcase() {
  const { t } = useTranslation(["landing", "common"]);

  const growerFeatures = [
    {
      icon: <Leaf className="h-8 w-8 text-green-600 dark:text-green-400" />,
      title: t("features.plantManagement.title", { ns: "landing" }),
      description: t("features.plantManagement.desc", { ns: "landing" }),
    },
    {
      icon: <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400" />,
      title: t("features.growJournal.title", { ns: "landing" }),
      description: t("features.growJournal.desc", { ns: "landing" }),
    },
    {
      icon: <Thermometer className="h-8 w-8 text-red-600 dark:text-red-400" />,
      title: t("features.environmentControl.title", { ns: "landing" }),
      description: t("features.environmentControl.desc", { ns: "landing" }),
    },
    {
      icon: <Bell className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />,
      title: t("features.reminders.title", { ns: "landing" }),
      description: t("features.reminders.desc", { ns: "landing" }),
    },
    {
      icon: <Droplets className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />,
      title: t("features.nutrientMixes.title", { ns: "landing" }),
      description: t("features.nutrientMixes.desc", { ns: "landing" }),
    },
  ];

  const consumerFeatures = [
    {
      icon: <Users className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />,
      title: t("features.sessionTracking.title", { ns: "landing" }),
      description: t("features.sessionTracking.desc", { ns: "landing" }),
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-teal-600 dark:text-teal-400" />,
      title: t("features.consumptionHistory.title", { ns: "landing" }),
      description: t("features.consumptionHistory.desc", { ns: "landing" }),
    },
    {
      icon: <Heart className="h-8 w-8 text-pink-600 dark:text-pink-400" />,
      title: t("features.favoriteStrains.title", { ns: "landing" }),
      description: t("features.favoriteStrains.desc", { ns: "landing" }),
    },
    {
      icon: (
        <Notebook className="h-8 w-8 text-orange-600 dark:text-orange-400" />
      ),
      title: t("features.personalInventory.title", { ns: "landing" }),
      description: t("features.personalInventory.desc", { ns: "landing" }),
    },
  ];

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-800/50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            {t("showcase.title", { ns: "landing" })}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {t("showcase.description", { ns: "landing" })}
          </p>
        </div>

        {/* Grower Mode */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              <Leaf className="inline h-8 w-8 text-green-600 mr-3" />
              {t("showcase.growerMode", { ns: "landing" })}
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t("showcase.growerModeDesc", { ns: "landing" })}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {growerFeatures.map((feature, index) => (
              <Card
                key={index}
                className="h-full hover:shadow-lg transition-shadow duration-300"
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">{feature.icon}</div>
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {feature.title}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Consumer Mode */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              <Users className="inline h-8 w-8 text-indigo-600 mr-3" />
              {t("showcase.consumerMode", { ns: "landing" })}
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t("showcase.consumerModeDesc", { ns: "landing" })}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {consumerFeatures.map((feature, index) => (
              <Card
                key={index}
                className="h-full hover:shadow-lg transition-shadow duration-300"
              >
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      {feature.icon}
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {feature.title}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* AI Section */}
        <div className="text-center" data-section="ai">
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-800">
            <CardContent className="p-12">
              <div className="flex items-center justify-center mb-6">
                <Brain className="h-16 w-16 text-purple-600 dark:text-purple-400 mr-4" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {t("showcase.aiTitle", { ns: "landing" })}
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
                {t("showcase.aiDesc", { ns: "landing" })}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    {t("showcase.autoDetection", { ns: "landing" })}
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>
                      {t("showcase.nutrientDeficiencies", { ns: "landing" })}
                    </li>
                    <li>{t("showcase.commonPests", { ns: "landing" })}</li>
                    <li>{t("showcase.fungalDiseases", { ns: "landing" })}</li>
                    <li>{t("showcase.phProblems", { ns: "landing" })}</li>
                  </ul>
                </div>

                <div className="text-left">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    {t("showcase.intelligentRecommendations", {
                      ns: "landing",
                    })}
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>
                      {t("showcase.fertilizationAdjustments", {
                        ns: "landing",
                      })}
                    </li>
                    <li>
                      {t("showcase.organicTreatments", { ns: "landing" })}
                    </li>
                    <li>{t("showcase.wateringChanges", { ns: "landing" })}</li>
                    <li>
                      {t("showcase.environmentOptimization", { ns: "landing" })}
                    </li>
                  </ul>
                </div>
              </div>

              {/* Availability note removed since AI is implemented */}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
