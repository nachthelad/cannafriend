"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthUser } from "@/hooks/use-auth-user";
import { getDocs, query } from "firebase/firestore";
import { ROUTE_LOGIN, resolveHomePathForRoles } from "@/lib/routes";
import { useUserRoles } from "@/hooks/use-user-roles";
import { plantsCol } from "@/lib/paths";
import { ReminderSystem } from "@/components/plant/reminder-system";
import { MobileReminders } from "@/components/mobile/mobile-reminders";
import { useTranslation } from "react-i18next";
import type { Plant } from "@/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getSuspenseResource } from "@/lib/suspense-utils";

interface RemindersData {
  plants: Plant[];
}

async function fetchRemindersData(userId: string): Promise<RemindersData> {
  const remindersQuery = query(plantsCol(userId));
  const snapshot = await getDocs(remindersQuery);
  const plants: Plant[] = [];

  snapshot.forEach((doc) => {
    plants.push({ id: doc.id, ...doc.data() } as Plant);
  });

  return { plants };
}

function RemindersContent({ userId }: { userId: string }) {
  const { t } = useTranslation(["reminders", "common", "dashboard"]);
  const router = useRouter();
  const { roles } = useUserRoles();

  const cacheKey = `reminders-${userId}`;
  const resource = getSuspenseResource(cacheKey, () =>
    fetchRemindersData(userId)
  );
  const { plants } = resource.read();

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden mb-4 p-4">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.replace(resolveHomePathForRoles(roles))}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">
              {t("reminders", { ns: "dashboard" })}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("pageDescription", { ns: "reminders" })}
            </p>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
        <MobileReminders userId={userId} initialPlants={plants} showHeader={false} />
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        {/* Desktop Header */}
        <div className="hidden md:block mb-6 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.replace(resolveHomePathForRoles(roles))}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("back", { ns: "common" })}
            </Button>
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              {t("reminders", { ns: "dashboard" })}
            </h1>
            <p className="text-muted-foreground">
              {t("pageDescription", { ns: "reminders" })}
            </p>
          </div>
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
    </>
  );
}

export default function RemindersPage() {
  const { user, isLoading: authLoading } = useAuthUser();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user) {
      router.push(ROUTE_LOGIN);
    }
  }, [authLoading, user, router]);

  const fallback = (
    <div className="p-4 md:p-6">
      <RemindersSkeleton />
    </div>
  );

  if (authLoading || !user) {
    return (
      <Layout>
        {fallback}
      </Layout>
    );
  }

  return (
    <Layout>
      <Suspense fallback={fallback}>
        <RemindersContent userId={user.uid} />
      </Suspense>
    </Layout>
  );
}

function RemindersSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}

