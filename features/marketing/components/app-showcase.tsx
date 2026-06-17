"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bell, Brain, Camera, CalendarDays, Leaf, NotebookPen } from "lucide-react";

const proofItems = [
  { icon: Leaf, key: "plants" },
  { icon: NotebookPen, key: "journal" },
  { icon: Bell, key: "reminders" },
  { icon: Camera, key: "photoAi" },
] as const;

const flowItems = [
  { icon: Leaf, key: "plants" },
  { icon: NotebookPen, key: "journal" },
  { icon: CalendarDays, key: "care" },
] as const;

export function AppShowcase() {
  const { t } = useTranslation(["landing"]);

  return (
    <>
      <section className="px-4 py-8 md:px-6">
        <div className="mx-auto grid max-w-7xl gap-3 md:grid-cols-4">
          {proofItems.map(({ icon: Icon, key }) => (
            <div
              key={key}
              className="flex min-h-28 items-start gap-3 rounded-lg border bg-card p-4"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                <Icon aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-semibold">
                  {t(`proof.${key}.title`, { ns: "landing" })}
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  {t(`proof.${key}.description`, { ns: "landing" })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="px-4 py-14 md:px-6 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1fr] lg:items-center">
          <div className="flex flex-col gap-5">
            <Badge variant="secondary" className="w-fit">
              {t("flow.badge", { ns: "landing" })}
            </Badge>
            <div className="flex flex-col gap-3">
              <h2 className="max-w-[14ch] text-3xl font-bold leading-tight md:text-5xl">
                {t("flow.title", { ns: "landing" })}
              </h2>
              <p className="max-w-[62ch] text-base leading-7 text-muted-foreground">
                {t("flow.description", { ns: "landing" })}
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            {flowItems.map(({ icon: Icon, key }, index) => (
              <Card key={key} className="rounded-lg">
                <CardHeader className="grid grid-cols-[auto_1fr] gap-4">
                  <div className="flex size-11 items-center justify-center rounded-md bg-accent text-accent-foreground">
                    <Icon aria-hidden="true" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <span className="font-mono text-sm text-muted-foreground">
                        0{index + 1}
                      </span>
                      {t(`flow.steps.${key}.title`, { ns: "landing" })}
                    </CardTitle>
                    <CardDescription className="text-base leading-7">
                      {t(`flow.steps.${key}.description`, { ns: "landing" })}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="ai" className="px-4 py-14 md:px-6 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div className="rounded-lg border bg-card p-3 shadow-sm">
            <Image
              src="/illustrations/journal-reminders-notebook.svg"
              alt={t("flow.imageAlt", { ns: "landing" })}
              width={960}
              height={640}
              className="h-auto w-full rounded-md"
            />
          </div>

          <Card className="rounded-lg bg-secondary/60">
            <CardHeader>
              <Badge variant="outline" className="w-fit">
                <Brain aria-hidden="true" />
                {t("ai.badge", { ns: "landing" })}
              </Badge>
              <CardTitle className="text-3xl leading-tight md:text-4xl">
                {t("ai.title", { ns: "landing" })}
              </CardTitle>
              <CardDescription className="text-base leading-7">
                {t("ai.description", { ns: "landing" })}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border bg-background p-4">
                <h3 className="font-semibold">
                  {t("ai.freeTaste.title", { ns: "landing" })}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t("ai.freeTaste.description", { ns: "landing" })}
                </p>
              </div>
              <div className="rounded-md border bg-background p-4">
                <h3 className="font-semibold">
                  {t("ai.premiumChat.title", { ns: "landing" })}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t("ai.premiumChat.description", { ns: "landing" })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
