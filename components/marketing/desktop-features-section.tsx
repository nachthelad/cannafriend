"use client";

import { Leaf, Calendar, Camera, BarChart3, Bell, Search } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

interface DesktopFeaturesSectionProps {
  className?: string;
}

export function DesktopFeaturesSection({
  className = "",
}: DesktopFeaturesSectionProps) {
  const { t } = useTranslation();

  const features: Feature[] = [
    {
      icon: Leaf,
      title: "Gestión de Plantas",
      description:
        "Registra y gestiona múltiples plantas con información detallada de cada una",
    },
    {
      icon: Calendar,
      title: "Diario de Cultivo",
      description:
        "Lleva un registro completo de todas las actividades: riego, fertilización, entrenamiento",
    },
    {
      icon: Camera,
      title: "Galería de Fotos",
      description:
        "Documenta el crecimiento de tus plantas con fotos organizadas por fecha",
    },
    {
      icon: BarChart3,
      title: "Monitoreo Ambiental",
      description:
        "Registra temperatura, humedad, pH y otros parámetros ambientales",
    },
    {
      icon: Bell,
      title: "Sistema de Recordatorios",
      description:
        "Recibe notificaciones para riego, fertilización y otras tareas importantes",
    },
    {
      icon: Search,
      title: "Búsqueda Avanzada",
      description:
        "Encuentra rápidamente plantas, registros y actividades específicas",
    },
  ];

  return (
    <div className={`${className}`}>
      <div className="grid grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <div
            key={index}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center">
                <feature.icon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-200">
                  {feature.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
