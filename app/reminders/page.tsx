"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AnimatedLogo } from "@/components/common/animated-logo";
import { db } from "@/lib/firebase";
import { useAuthUser } from "@/hooks/use-auth-user";
import { collection, getDocs, query } from "firebase/firestore";
import { ROUTE_LOGIN } from "@/lib/routes";
import { plantsCol } from "@/lib/paths";
import { ReminderSystem } from "@/components/plant/reminder-system";
import { MobileReminders } from "@/components/mobile/mobile-reminders";
import { useTranslation } from "react-i18next";
import type { Plant } from "@/types";

export default function RemindersPage() {
  const { t } = useTranslation(["reminders", "common"]);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [plants, setPlants] = useState<Plant[]>([]);
  const { user, isLoading: authLoading } = useAuthUser();
  const userId = user?.uid ?? null;

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push(ROUTE_LOGIN);
  }, [authLoading, user, router]);

  useEffect(() => {
    const fetchPlants = async () => {
      if (!userId) return;
      try {
        const q = query(plantsCol(userId));
        const snap = await getDocs(q);
        const list: Plant[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Plant));
        setPlants(list);
      } finally {
        setIsLoading(false);
      }
    };
    if (userId) void fetchPlants();
  }, [userId]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <AnimatedLogo size={32} className="text-primary" duration={1.5} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Mobile View */}
      <div className="md:hidden">
        <MobileReminders />
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">
            {t("reminders", { ns: "dashboard" })}
          </h1>
          <p className="text-muted-foreground">
            {t("pageDescription", { ns: "reminders" })}
          </p>
        </div>

        {plants.length > 0 ? (
          <ReminderSystem plants={plants} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{t("noPlants", { ns: "dashboard" })}</CardTitle>
              <CardDescription>
                {t("noPlantDesc", { ns: "dashboard" })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("noPlantsHint", { ns: "reminders" })}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
