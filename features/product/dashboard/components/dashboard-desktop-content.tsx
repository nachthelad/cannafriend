"use client";

import { useTranslation } from "react-i18next";
import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  Brain,
  Calendar,
  Camera,
  ChevronRight,
  Droplet,
  FileText,
  FlaskConical,
  Leaf,
  Plus,
  Scissors,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { FastLogAction } from "@/features/product/dashboard/components/fast-log-action";
import {
  ROUTE_JOURNAL,
  ROUTE_PLANTS,
  ROUTE_REMINDERS,
} from "@/lib/routes";
import { cn } from "@/lib/utils";
import type {
  DashboardAiPromoState,
  DashboardData,
  DashboardQuickAction,
} from "@/types";

const panelClass =
  "rounded-[22px] border border-[var(--dashboard-border)] bg-[var(--dashboard-panel)] shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_12px_30px_rgba(0,0,0,0.28)]";

function getQuickActionIcon(actionId: DashboardQuickAction["id"]) {
  switch (actionId) {
    case "watering":
      return Droplet;
    case "feeding":
      return FlaskConical;
    case "photo":
      return Camera;
    case "training":
      return Scissors;
    case "notes":
      return FileText;
    default:
      return Plus;
  }
}

function getStatIcon(statId: DashboardData["stats"][number]["id"]) {
  switch (statId) {
    case "plants":
      return Leaf;
    case "logs":
      return Calendar;
    case "reminders":
      return Bell;
    default:
      return Leaf;
  }
}

function getActivityIcon(type: DashboardData["recentActivity"][number]["type"]) {
  switch (type) {
    case "watering":
      return Droplet;
    case "feeding":
      return FlaskConical;
    case "training":
      return Scissors;
    case "environment":
      return Calendar;
    case "flowering":
      return Leaf;
    case "endCycle":
      return Sparkles;
    case "transplant":
      return Leaf;
    case "note":
    default:
      return Camera;
  }
}

function getReminderIcon(
  type: DashboardData["upcomingReminders"][number]["reminderType"],
) {
  switch (type) {
    case "watering":
      return Droplet;
    case "feeding":
      return FlaskConical;
    case "training":
      return Scissors;
    case "custom":
    default:
      return Bell;
  }
}

function StatCard({
  stat,
}: {
  stat: DashboardData["stats"][number];
}) {
  const Icon = getStatIcon(stat.id);
  const iconTone =
    stat.tone === "warning"
      ? "text-[var(--dashboard-amber)] bg-[rgba(242,180,41,0.12)]"
      : stat.tone === "info"
        ? "text-[var(--dashboard-cyan)] bg-[rgba(102,217,255,0.1)]"
        : "text-[var(--dashboard-green)] bg-[var(--dashboard-green-soft)]";
  const helperTone =
    stat.tone === "warning"
      ? "text-[var(--dashboard-amber)]"
      : "text-[var(--dashboard-green)]";

  return (
    <div className={cn(panelClass, "flex min-h-[112px] items-center justify-between p-4")}>
      <div className="space-y-2">
        <p className="text-[0.92rem] font-medium text-white">{stat.label}</p>
        <div className="text-[2.85rem] font-semibold leading-none tracking-[-0.04em] text-white">
          {stat.value}
        </div>
        {stat.deltaLabel ? (
          <p className={cn("text-[0.85rem] font-medium", helperTone)}>
            {stat.deltaLabel}
          </p>
        ) : null}
        {stat.helperLabel ? (
          <p className={cn("text-[0.85rem] font-medium", helperTone)}>
            {stat.helperLabel}
          </p>
        ) : null}
      </div>
      <div
        className={cn(
          "flex h-[56px] w-[56px] items-center justify-center rounded-[16px]",
          iconTone,
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );
}

function PlantRow({
  plant,
}: {
  plant: DashboardData["plantsPreview"][number];
}) {
  const statusClasses =
    plant.statusTone === "warning"
      ? "bg-[rgba(242,180,41,0.14)] text-[var(--dashboard-amber)]"
      : plant.statusTone === "neutral"
        ? "bg-white/6 text-slate-300"
        : "bg-[var(--dashboard-green-soft)] text-[var(--dashboard-green)]";

  return (
    <Link
      href={plant.href}
      className="group flex items-center gap-3 rounded-[18px] border border-white/5 bg-[var(--dashboard-panel-2)]/90 p-3 transition-[border-color,transform] hover:-translate-y-0.5 hover:border-white/10"
    >
      <div className="relative h-[68px] w-[58px] shrink-0 overflow-hidden rounded-[14px] bg-black/30">
        {plant.imageUrl ? (
          <Image
            src={plant.imageUrl}
            alt={plant.name}
            fill
            sizes="58px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[linear-gradient(180deg,rgba(69,209,86,0.3),rgba(7,12,9,0.9))]">
            <Leaf className="h-6 w-6 text-[var(--dashboard-green)]" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-[0.96rem] font-semibold text-white">
          {plant.name}
        </p>
        <p className="text-[0.84rem] text-[var(--dashboard-muted)]">
          {plant.dayLabel} <span className="px-1.5 text-white/30">•</span>{" "}
          {plant.stageLabel}
        </p>
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-1 text-[0.68rem] font-medium",
            statusClasses,
          )}
        >
          {plant.statusLabel}
        </span>
      </div>

      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/45 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

function ActivityList({
  items,
}: {
  items: DashboardData["recentActivity"];
}) {
  const { t } = useTranslation(["journal"]);

  if (items.length === 0) {
    return (
      <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-[var(--dashboard-muted)]">
        {t("noEntriesDesc", { ns: "journal" })}
      </div>
    );
  }

  return (
    <div className="relative space-y-4 pl-1">
      <div className="absolute bottom-3 left-[16px] top-3 w-px bg-[linear-gradient(180deg,rgba(102,217,255,0.35),rgba(255,255,255,0.06))]" />
      {items.map((item) => {
        const Icon = getActivityIcon(item.type);

        return (
          <div key={item.id} className="relative flex gap-3">
            <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[var(--dashboard-panel-2)] text-[var(--dashboard-cyan)] shadow-[0_0_0_4px_rgba(5,8,6,0.75)]">
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="space-y-1 pt-0.5">
              <p className="text-[0.94rem] font-medium text-white">
                {item.title}
                {item.plantName ? (
                  <span className="font-normal text-white/35"> • </span>
                ) : null}
                {item.plantName ? (
                  <span className="font-medium text-white/90">
                    {item.plantName}
                  </span>
                ) : null}
              </p>
              <p className="text-[0.82rem] text-[var(--dashboard-muted)]">
                {item.occurredAtLabel}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReminderList({
  items,
}: {
  items: DashboardData["upcomingReminders"];
}) {
  const { t } = useTranslation(["dashboard"]);

  if (items.length === 0) {
    return (
      <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-[var(--dashboard-muted)]">
        {t("noUpcomingReminders", { ns: "dashboard" })}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((item) => {
        const Icon = getReminderIcon(item.reminderType);
        const toneClasses =
          item.tone === "warning"
            ? "text-[var(--dashboard-amber)]"
            : item.tone === "info"
              ? "text-[var(--dashboard-cyan)]"
              : "text-white/80";

        return (
          <Link
            key={item.id}
            href={item.href}
            className="flex items-center gap-3 rounded-[16px] border border-white/6 bg-[var(--dashboard-panel-2)]/90 px-3.5 py-3 transition-[border-color,transform] hover:-translate-y-0.5 hover:border-white/10"
          >
            <div className={cn("rounded-full bg-black/30 p-2", toneClasses)}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[0.94rem] font-medium text-white">
                {item.label}
              </p>
              <p className="text-[0.82rem] text-[var(--dashboard-muted)]">
                {item.dueLabel}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function QuickActionButton({
  action,
}: {
  action: DashboardQuickAction;
}) {
  const Icon = getQuickActionIcon(action.id);

  return (
    <Link
      href={action.href}
      className="flex min-h-[56px] items-center gap-2.5 rounded-[15px] border border-white/8 bg-[var(--dashboard-panel-2)]/80 px-4 text-[0.88rem] text-white transition-[border-color,transform,background-color] hover:-translate-y-0.5 hover:border-white/12 hover:bg-[rgba(255,255,255,0.05)]"
    >
      <Icon className="h-3.5 w-3.5 text-white/85" />
      <span className="truncate">{action.label}</span>
    </Link>
  );
}

function AIPromoCard({ aiPromo }: { aiPromo: DashboardAiPromoState }) {
  const { t } = useTranslation(["dashboard"]);

  return (
    <div
      className={cn(
        panelClass,
        "overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(69,209,86,0.22),transparent_40%),linear-gradient(180deg,#0c1710,#09110d)] p-4",
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h3 className="text-[1.2rem] font-semibold text-white">
              {t("analysisWithAi", { ns: "dashboard" })}
            </h3>
            {aiPromo.badgeLabel ? (
              <span className="rounded-full bg-[var(--dashboard-green-soft)] px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--dashboard-green)]">
                {aiPromo.badgeLabel}
              </span>
            ) : null}
          </div>
          <p className="max-w-[24ch] text-[0.9rem] leading-7 text-[var(--dashboard-muted)]">
            {t("aiPromoDescription", { ns: "dashboard" })}
          </p>
        </div>
        <div className="rounded-[16px] bg-[rgba(69,209,86,0.12)] p-3 text-[var(--dashboard-green)]">
          <Brain className="h-9 w-9" />
        </div>
      </div>

      <Button
        asChild
        size="lg"
        className="h-10 w-full rounded-[16px] border-0 bg-[linear-gradient(90deg,#3cb84b,#26c4c8)] text-[0.92rem] font-semibold text-white shadow-none hover:brightness-105"
      >
        <Link href={aiPromo.href}>
          <Sparkles className="h-4 w-4" />
          {aiPromo.ctaLabel}
        </Link>
      </Button>
    </div>
  );
}

export function DashboardDesktopContent({
  data,
}: {
  data: DashboardData;
}) {
  const { t } = useTranslation(["dashboard"]);

  return (
    <div className="hidden h-full text-white md:block">
      <div className="grid h-full w-full grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-3">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-[2.15rem] font-semibold tracking-[-0.06em] text-white">
                {t("title", { ns: "dashboard" })}
              </h1>
              <FastLogAction
                plants={data.plants}
                renderTrigger={({ onClick, disabled }) => (
                  <Button
                    type="button"
                    size="lg"
                    onClick={onClick}
                    disabled={disabled}
                    className="h-10 rounded-[15px] bg-[linear-gradient(180deg,#58d458,#41b848)] px-4.5 text-[0.88rem] font-semibold text-[#06110a] shadow-[0_12px_22px_rgba(61,170,64,0.18)] hover:brightness-105"
                  >
                    <Plus className="h-3.5 w-3.5 text-[#06110a]" />
                    {t("addLog", { ns: "dashboard" })}
                  </Button>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {data.stats.map((stat) => (
                <StatCard key={stat.id} stat={stat} />
              ))}
            </div>

            <div className="grid min-h-0 grid-cols-3 grid-rows-2 gap-3">
              <section className={cn(panelClass, "row-span-2 flex min-h-0 flex-col p-3.5")}>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-[1.3rem] font-semibold text-white">
                    {t("myPlants", { ns: "dashboard" })}
                  </h2>
                  <Link
                    href={ROUTE_PLANTS}
                    className="text-[0.86rem] font-medium text-[var(--dashboard-green)] hover:text-white"
                  >
                    {t("viewAll", { ns: "dashboard" })}
                  </Link>
                </div>

                <div className="flex-1 space-y-2.5">
                  {data.plantsPreview.length > 0 ? (
                    data.plantsPreview.map((plant) => (
                      <PlantRow key={plant.id} plant={plant} />
                    ))
                  ) : (
                    <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-[var(--dashboard-muted)]">
                      {t("startGrowingJourney", { ns: "dashboard" })}
                    </div>
                  )}
                </div>

                <Button
                  asChild
                  variant="ghost"
                  className="mt-3 h-10 justify-between rounded-[15px] border border-white/8 bg-[var(--dashboard-panel-2)] px-4 text-[0.86rem] font-medium text-white hover:bg-white/[0.04]"
                >
                  <Link href={ROUTE_PLANTS}>
                    {t("viewAllPlants", { ns: "dashboard" })}
                    <ChevronRight className="h-4 w-4 text-white/60" />
                  </Link>
                </Button>
              </section>

              <section className={cn(panelClass, "row-span-2 flex min-h-0 flex-col p-3.5")}>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-[1.3rem] font-semibold text-white">
                    {t("recentActivityTitle", { ns: "dashboard" })}
                  </h2>
                  <Link
                    href={ROUTE_JOURNAL}
                    className="text-[0.86rem] font-medium text-[var(--dashboard-green)] hover:text-white"
                  >
                    {t("viewAll", { ns: "dashboard" })}
                  </Link>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                  <ActivityList items={data.recentActivity} />
                </div>

                <Button
                  asChild
                  variant="ghost"
                  className="mt-3 h-10 justify-between rounded-[15px] border border-white/8 bg-[var(--dashboard-panel-2)] px-4 text-[0.86rem] font-medium text-white hover:bg-white/[0.04]"
                >
                  <Link href={ROUTE_JOURNAL}>
                    {t("viewAllLogs", { ns: "dashboard" })}
                    <ChevronRight className="h-4 w-4 text-white/60" />
                  </Link>
                </Button>
              </section>

              <section className={cn(panelClass, "flex min-h-0 flex-col p-3.5")}>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <h2 className="max-w-[10ch] text-[1.3rem] font-semibold text-white">
                      {t("upcomingRemindersTitle", { ns: "dashboard" })}
                    </h2>
                    <Link
                      href={ROUTE_REMINDERS}
                      className="pt-1 text-[0.86rem] font-medium text-[var(--dashboard-green)] hover:text-white"
                    >
                      {t("viewAll", { ns: "dashboard" })}
                    </Link>
                  </div>

                  <div className="flex-1">
                    <ReminderList items={data.upcomingReminders} />
                  </div>
              </section>

              <AIPromoCard aiPromo={data.aiPromo} />
            </div>

            <section className={cn(panelClass, "p-3.5")}>
              <h2 className="mb-3 text-[1.3rem] font-semibold text-white">
                {t("quickActions", { ns: "dashboard" })}
              </h2>
              <div className="grid grid-cols-5 gap-2.5">
                {data.quickActions.map((action) => (
                  <QuickActionButton key={action.id} action={action} />
                ))}
              </div>
            </section>
      </div>
    </div>
  );
}
