"use client";

import { useTranslation } from "@/hooks/use-translation";
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
  Zap
} from "lucide-react";

export function AppShowcase() {
  const { t } = useTranslation();

  const growerFeatures = [
    {
      icon: <Leaf className="h-8 w-8 text-green-600 dark:text-green-400" />,
      title: t("features.plantManagement.title"),
      description: t("features.plantManagement.desc"),
    },
    {
      icon: <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400" />,
      title: t("features.growJournal.title"),
      description: t("features.growJournal.desc"),
    },
    {
      icon: <Camera className="h-8 w-8 text-purple-600 dark:text-purple-400" />,
      title: t("features.photoGallery.title"),
      description: t("features.photoGallery.desc"),
    },
    {
      icon: <Thermometer className="h-8 w-8 text-red-600 dark:text-red-400" />,
      title: t("features.environmentControl.title"),
      description: t("features.environmentControl.desc"),
    },
    {
      icon: <Bell className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />,
      title: t("features.reminders.title"),
      description: t("features.reminders.desc"),
    },
    {
      icon: <Droplets className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />,
      title: t("features.nutrientMixes.title"),
      description: t("features.nutrientMixes.desc"),
    },
  ];

  const consumerFeatures = [
    {
      icon: <Users className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />,
      title: t("features.sessionTracking.title"),
      description: t("features.sessionTracking.desc"),
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-teal-600 dark:text-teal-400" />,
      title: t("features.consumptionHistory.title"),
      description: t("features.consumptionHistory.desc"),
    },
    {
      icon: <Heart className="h-8 w-8 text-pink-600 dark:text-pink-400" />,
      title: t("features.favoriteStrains.title"),
      description: t("features.favoriteStrains.desc"),
    },
    {
      icon: <Notebook className="h-8 w-8 text-orange-600 dark:text-orange-400" />,
      title: t("features.personalInventory.title"),
      description: t("features.personalInventory.desc"),
    },
  ];

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-800/50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            {t("showcase.title")}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {t("showcase.description")}
          </p>
        </div>

        {/* Grower Mode */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              <Leaf className="inline h-8 w-8 text-green-600 mr-3" />
              {t("showcase.growerMode")}
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t("showcase.growerModeDesc")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {growerFeatures.map((feature, index) => (
              <Card key={index} className="h-full hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {feature.icon}
                    </div>
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
              {t("showcase.consumerMode")}
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t("showcase.consumerModeDesc")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {consumerFeatures.map((feature, index) => (
              <Card key={index} className="h-full hover:shadow-lg transition-shadow duration-300">
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

        {/* AI Premium Section */}
        <div className="text-center" data-section="ai">
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-800">
            <CardContent className="p-12">
              <div className="flex items-center justify-center mb-6">
                <Brain className="h-16 w-16 text-purple-600 dark:text-purple-400 mr-4" />
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  {t("showcase.comingSoon")}
                </span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {t("showcase.aiTitle")}
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
                {t("showcase.aiDesc")}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    {t("showcase.autoDetection")}
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>{t("showcase.nutrientDeficiencies")}</li>
                    <li>{t("showcase.commonPests")}</li>
                    <li>{t("showcase.fungalDiseases")}</li>
                    <li>{t("showcase.phProblems")}</li>
                  </ul>
                </div>
                
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    {t("showcase.intelligentRecommendations")}
                  </h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>{t("showcase.fertilizationAdjustments")}</li>
                    <li>{t("showcase.organicTreatments")}</li>
                    <li>{t("showcase.wateringChanges")}</li>
                    <li>{t("showcase.environmentOptimization")}</li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>{t("showcase.whenAvailable")}</strong> {t("showcase.whenAvailableDesc")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}