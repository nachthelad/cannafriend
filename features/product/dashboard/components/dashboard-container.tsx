"use client";

import { Suspense, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { getDocs, query, orderBy, limit, collectionGroup, where } from "firebase/firestore";
import { addDays, differenceInCalendarDays } from "date-fns";
import type { TFunction } from "i18next";

import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { DataErrorBoundary } from "@/components/common/data-error-boundary";
import { auth, db } from "@/lib/firebase";
import { getSuspenseResource } from "@/lib/suspense-utils";
import { logsCol, plantsCol, remindersCol } from "@/lib/paths";
import { ROUTE_AI_ASSISTANT, ROUTE_JOURNAL_NEW, ROUTE_PREMIUM, ROUTE_REMINDERS, ROUTE_PLANTS } from "@/lib/routes";
import { calculateAgeInDays, formatDateObjectWithLocale } from "@/lib/utils";
import { isPlantGrowing, normalizePlant } from "@/lib/plant-utils";
import { hasLocalPremiumOverride, resolvePremiumState } from "@/lib/premium-state";
import { LOG_TYPES, type LogType } from "@/lib/log-config";
import { getNextAlarmOccurrence } from "@/lib/alarm-schedule";
import { getDashboardPlantStage } from "@/lib/dashboard-plant-stage";
import type {
  DashboardActivityItem,
  DashboardAiPromoState,
  DashboardContainerProps,
  DashboardData,
  DashboardPlantPreview,
  DashboardQuickAction,
  DashboardReminderPreview,
  DashboardStat,
  LogEntry,
  Plant,
  Reminder,
} from "@/types";

import { DashboardDesktopContent } from "@/features/product/dashboard/components/dashboard-desktop-content";
import { MobileDashboard } from "@/components/mobile/mobile-dashboard";

const dashboardLogTypeMap: Partial<Record<LogType, string>> = {
  watering: "logType.watering",
  feeding: "logType.feeding",
  training: "logType.training",
  transplant: "logType.transplant",
  environment: "logType.environment",
  flowering: "logType.flowering",
  note: "logType.note",
  endCycle: "logType.endCycle",
};

function getNextReminderTimestamp(reminder: Reminder): number | null {
  if (Array.isArray(reminder.daysOfWeek) && reminder.daysOfWeek.length > 0 && reminder.timeOfDay) {
    const nextOccurrence = getNextAlarmOccurrence(
      reminder.daysOfWeek,
      reminder.timeOfDay,
    );
    if (nextOccurrence !== null) {
      return nextOccurrence;
    }
  }

  return null;
}

function getReminderType(reminder: Reminder): DashboardReminderPreview["reminderType"] {
  if (reminder.type === "watering" || reminder.type === "feeding" || reminder.type === "training") {
    return reminder.type;
  }

  const haystack = `${reminder.label} ${reminder.title ?? ""}`.toLowerCase();

  if (haystack.includes("rieg") || haystack.includes("water")) {
    return "watering";
  }
  if (haystack.includes("fert") || haystack.includes("feed") || haystack.includes("nutri")) {
    return "feeding";
  }
  if (haystack.includes("poda") || haystack.includes("train")) {
    return "training";
  }

  return "custom";
}

function formatActivityMoment(isoDate: string, language: string, t: TFunction): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const timeLabel = formatDateObjectWithLocale(date, "p", language);
  const diff = differenceInCalendarDays(date, new Date());

  if (diff === 0) {
    return `${t("today", { ns: "dashboard" })}, ${timeLabel}`;
  }
  if (diff === -1) {
    return `${t("yesterday", { ns: "dashboard" })}, ${timeLabel}`;
  }
  if (diff > -6 && diff < 0) {
    return `${t("daysAgo", { ns: "dashboard", count: Math.abs(diff) })}, ${timeLabel}`;
  }

  return `${formatDateObjectWithLocale(date, "PPP", language)}, ${timeLabel}`;
}

function formatReminderDueLabel(timestamp: number | null, language: string, t: TFunction): string {
  if (timestamp === null) {
    return t("reminderNoSchedule", { ns: "dashboard" });
  }

  const date = new Date(timestamp);
  const diff = differenceInCalendarDays(date, new Date());

  if (diff === 0) {
    return t("today", { ns: "dashboard" });
  }
  if (diff === 1) {
    return t("tomorrow", { ns: "dashboard" });
  }
  if (diff <= 6) {
    return t("inDays", { ns: "dashboard", count: diff });
  }

  return formatDateObjectWithLocale(date, "PPP", language);
}

function getPlantStageLabel(
  plant: Plant,
  hasFloweringLog: boolean,
  t: TFunction,
): string {
  const stage = getDashboardPlantStage(plant, hasFloweringLog);
  if (stage === "flowering") {
    return t("newPlant.flowering", { ns: "plants" });
  }
  return stage === "seedling"
    ? t("seedling", { ns: "dashboard" })
    : t("newPlant.vegetative", { ns: "plants" });
}

function buildDashboardViewModel({
  plants,
  floweringPlantIds,
  recentLogs,
  reminders,
  isPremium,
  logsCount,
  t,
  language,
}: Omit<DashboardData, "stats" | "plantsPreview" | "recentActivity" | "upcomingReminders" | "quickActions" | "aiPromo"> & {
  t: TFunction;
  language: string;
}): Pick<
  DashboardData,
  "stats" | "plantsPreview" | "recentActivity" | "upcomingReminders" | "quickActions" | "aiPromo"
> {
  const oneWeekAgo = addDays(new Date(), -7).getTime();
  const reminderMeta = reminders.map((reminder) => {
    const nextTimestamp = getNextReminderTimestamp(reminder);
    return {
      reminder,
      nextTimestamp,
      reminderType: getReminderType(reminder),
    };
  });

  const plantsCreatedThisWeek = plants.filter((plant) => {
    const timestamp = new Date(plant.createdAt).getTime();
    return !Number.isNaN(timestamp) && timestamp >= oneWeekAgo;
  }).length;

  const logsThisWeek = recentLogs.filter((log) => {
    const timestamp = new Date(log.date).getTime();
    return !Number.isNaN(timestamp) && timestamp >= oneWeekAgo;
  }).length;

  const activeReminderCount = reminderMeta.filter(
    ({ reminder }) => reminder.isActive,
  ).length;

  const stats: DashboardStat[] = [
    {
      id: "plants",
      label: t("yourPlants", { ns: "dashboard" }),
      value: plants.length,
      deltaLabel:
        plantsCreatedThisWeek > 0
          ? t("statPlantsDelta", { ns: "dashboard", count: plantsCreatedThisWeek })
          : undefined,
      helperLabel:
        plantsCreatedThisWeek === 0 ? t("statPlantsSteady", { ns: "dashboard" }) : undefined,
      tone: "success",
    },
    {
      id: "logs",
      label: t("recentLogs", { ns: "journal" }),
      value: logsCount,
      deltaLabel:
        logsThisWeek > 0
          ? t("statLogsDelta", { ns: "dashboard", count: logsThisWeek })
          : undefined,
      helperLabel:
        logsThisWeek === 0 ? t("statLogsSteady", { ns: "dashboard" }) : undefined,
      tone: "success",
    },
    {
      id: "reminders",
      label: t("reminders", { ns: "dashboard" }),
      value: activeReminderCount,
      helperLabel: t("statAlarmsActive", {
        ns: "dashboard",
        count: activeReminderCount,
      }),
      tone: "info",
    },
  ];

  const plantsPreview: DashboardPlantPreview[] = plants.slice(0, 3).map((plant) => {
    return {
      id: plant.id,
      name: plant.name,
      href: `${ROUTE_PLANTS}/${plant.id}`,
      imageUrl: plant.coverPhoto || plant.photos?.[0],
      dayLabel: t("plantDay", { ns: "dashboard", count: calculateAgeInDays(plant.plantingDate) }),
      stageLabel: getPlantStageLabel(
        plant,
        floweringPlantIds.has(plant.id),
        t,
      ),
    };
  });

  const recentActivity: DashboardActivityItem[] = recentLogs.slice(0, 5).map((log) => ({
    id: log.id,
    type: log.type,
    title: t(dashboardLogTypeMap[log.type] ?? "logType.note", { ns: "journal" }),
    plantName: log.plantName,
    occurredAtLabel: formatActivityMoment(log.date, language, t),
  }));

  const upcomingReminders: DashboardReminderPreview[] = reminderMeta
    .filter(({ reminder }) => reminder.isActive)
    .sort((a, b) => {
      if (a.nextTimestamp === null) return 1;
      if (b.nextTimestamp === null) return -1;
      return a.nextTimestamp - b.nextTimestamp;
    })
    .slice(0, 3)
    .map(({ reminder, nextTimestamp, reminderType }) => ({
      id: reminder.id,
      href: ROUTE_REMINDERS,
      label: reminder.label || reminder.title || t("reminderFallback", { ns: "dashboard" }),
      dueLabel: formatReminderDueLabel(nextTimestamp, language, t),
      tone:
        nextTimestamp !== null && nextTimestamp < Date.now()
          ? "warning"
          : reminderType === "watering"
            ? "info"
            : "neutral",
      reminderType,
    }));

  const quickActions: DashboardQuickAction[] = [
    {
      id: "watering",
      label: t("actionWatering", { ns: "dashboard" }),
      href: `${ROUTE_JOURNAL_NEW}?returnTo=dashboard&logType=${LOG_TYPES.WATERING}`,
      kind: "link",
    },
    {
      id: "feeding",
      label: t("actionFeeding", { ns: "dashboard" }),
      href: `${ROUTE_JOURNAL_NEW}?returnTo=dashboard&logType=${LOG_TYPES.FEEDING}`,
      kind: "link",
    },
    {
      id: "photo",
      label: t("actionPhoto", { ns: "dashboard" }),
      href: ROUTE_PLANTS,
      kind: "link",
    },
    {
      id: "training",
      label: t("actionTraining", { ns: "dashboard" }),
      href: `${ROUTE_JOURNAL_NEW}?returnTo=dashboard&logType=${LOG_TYPES.TRAINING}`,
      kind: "link",
    },
    {
      id: "notes",
      label: t("actionNotes", { ns: "dashboard" }),
      href: `${ROUTE_JOURNAL_NEW}?returnTo=dashboard&logType=${LOG_TYPES.NOTE}`,
      kind: "link",
    },
  ];

  const aiPromo: DashboardAiPromoState = {
    href: isPremium ? ROUTE_AI_ASSISTANT : ROUTE_PREMIUM,
    badgeLabel: t("newBadge", { ns: "dashboard" }),
    ctaLabel: t("startAnalysis", { ns: "dashboard" }),
  };

  return {
    stats,
    plantsPreview,
    recentActivity,
    upcomingReminders,
    quickActions,
    aiPromo,
  };
}

async function fetchDashboardData(userId: string): Promise<Omit<DashboardData, "stats" | "plantsPreview" | "recentActivity" | "upcomingReminders" | "quickActions" | "aiPromo">> {
  const plantsQuery = query(plantsCol(userId));
  const plantsPromise = getDocs(plantsQuery);

  const logsQuery = query(
    collectionGroup(db, "logs"),
    where("userId", "==", userId),
    orderBy("date", "desc"),
    limit(50),
  );
  const logsPromise = getDocs(logsQuery);

  const remindersQuery = query(remindersCol(userId));
  const remindersPromise = getDocs(remindersQuery);

  const tokenPromise = auth.currentUser
    ? auth.currentUser.getIdTokenResult()
    : Promise.resolve(null);

  const plantsSnapshot = await plantsPromise;

  const plants: Plant[] = [];
  const allLogs: LogEntry[] = [];
  const plantMap: Record<string, string> = {};

  for (const plantDoc of plantsSnapshot.docs) {
    const plantData = normalizePlant(plantDoc.data(), plantDoc.id);

    if (!isPlantGrowing(plantData)) {
      continue;
    }

    plants.push(plantData);
    plantMap[plantData.id] = plantData.name;
  }

  const floweringPlantIdsPromise = Promise.all(
    plants.slice(0, 3).map(async (plant) => {
      try {
        const floweringSnapshot = await getDocs(
          query(
            logsCol(userId, plant.id),
            where("type", "==", LOG_TYPES.FLOWERING),
            limit(1),
          ),
        );
        return floweringSnapshot.empty ? null : plant.id;
      } catch (error) {
        console.error("Error fetching flowering stage:", error);
        return null;
      }
    }),
  ).then(
    (plantIds) =>
      new Set(plantIds.filter((plantId): plantId is string => plantId !== null)),
  );

  try {
    const logsSnapshot = await logsPromise;
    const fetchedLogs = logsSnapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        ...data,
        plantName: data.plantId ? plantMap[data.plantId] : undefined,
      };
    }) as LogEntry[];

    allLogs.push(...fetchedLogs);

  } catch (error) {
    console.error("Error fetching dashboard logs:", error);
  }

  const sortedLogs = allLogs.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  let remindersCount = 0;
  let reminders: Reminder[] = [];

  try {
    const remindersSnapshot = await remindersPromise;
    reminders = remindersSnapshot.docs.map((docSnapshot) => ({
      id: docSnapshot.id,
      ...docSnapshot.data(),
    })) as Reminder[];

    remindersCount = reminders.filter((reminder) => reminder.isActive).length;
  } catch {
    reminders = [];
  }

  const floweringPlantIds = await floweringPlantIdsPromise;

  let isPremium = false;
  try {
    const localOverride = hasLocalPremiumOverride();
    if (localOverride) {
      isPremium = true;
    } else if (auth.currentUser) {
      const token = await tokenPromise;
      if (token) {
        isPremium = resolvePremiumState(token.claims as any, localOverride).isPremium;
      }
    }
  } catch {
    isPremium = false;
  }

  return {
    plants,
    floweringPlantIds,
    recentLogs: sortedLogs.slice(0, 10),
    logsCount: sortedLogs.length,
    remindersCount,
    reminders,
    isPremium,
  };
}

function DashboardContent({
  userId,
  userEmail,
}: DashboardContainerProps) {
  const { t, i18n } = useTranslation([
    "dashboard",
    "common",
    "reminders",
    "journal",
    "nav",
    "aiAssistant",
    "plants",
  ]);

  const resource = getSuspenseResource(`dashboard-${userId}`, () =>
    fetchDashboardData(userId),
  );
  const rawData = resource.read();

  const viewModel = useMemo(
    () => ({
      ...rawData,
      ...buildDashboardViewModel({
        ...rawData,
        t,
        language: i18n.language,
      }),
    }),
    [rawData, t, i18n.language],
  );

  return (
    <>
      <div className="md:hidden">
        <MobileDashboard
          plants={rawData.plants}
          recentLogs={rawData.recentLogs.slice(0, 5)}
          userEmail={userEmail}
          remindersCount={rawData.remindersCount}
          isPremium={rawData.isPremium}
        />
      </div>

      <DashboardDesktopContent
        data={viewModel}
      />
    </>
  );
}

export function DashboardContainer({
  userId,
  userEmail,
}: DashboardContainerProps) {
  return (
    <div className="flex min-h-full flex-col md:h-full">
      <DataErrorBoundary>
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent
            userId={userId}
            userEmail={userEmail}
          />
        </Suspense>
      </DataErrorBoundary>
    </div>
  );
}
