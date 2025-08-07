"use client";

import { Leaf, Calendar, Camera, BarChart3, Bell, Search } from "lucide-react";

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

interface FeaturesSectionProps {
  className?: string;
}

export function FeaturesSection({ className = "" }: FeaturesSectionProps) {
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
    <div className={`grid grid-cols-1 gap-4 ${className}`}>
      {features.map((feature, index) => (
        <div
          key={index}
          className="bg-white/95 dark:bg-gray-800/95 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 backdrop-blur-sm"
        >
          <div className="flex items-start space-x-3">
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
  );
}
