"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

import { ResponsivePageHeader } from "@/components/common/responsive-page-header";
import { Button } from "@/components/ui/button";
import { DEV_EMAIL } from "@/lib/constants";
import { ROUTE_DASHBOARD } from "@/lib/routes";

const DATA_KEYS = ["account", "profile", "content", "images", "device", "payments", "storage"] as const;
const USAGE_KEYS = ["provide", "improve", "support", "security", "comms", "compliance"] as const;
const LEGAL_KEYS = ["contract", "consent", "legitInterest", "legalObligation"] as const;
const THIRD_PARTY_KEYS = ["firebase", "payments", "auth"] as const;
const COOKIE_KEYS = ["auth", "prefs", "pwa"] as const;
const RIGHTS_KEYS = ["access", "rectify", "delete", "portability", "restrict", "object"] as const;

export default function PrivacyPage() {
  const { t, i18n } = useTranslation(["common"]);
  const backLabel = t("back", { ns: "common" });
  const locale = (i18n.language || "en").split("-")[0];
  const formattedDate = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "2-digit",
  }).format(new Date());

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-4xl space-y-12">
          <ResponsivePageHeader
            title={t("privacy.title")}
            description={`${t("privacy.lastUpdated")}: ${formattedDate}`}
            backHref={ROUTE_DASHBOARD}
            sticky={false}
            className="border-none bg-background px-0"
            showDesktopBackButton
          />

          <div className="space-y-16">
            <Section title={t("privacy.intro")} description={t("privacy.introDesc")} />

            <ListSection
              title={t("privacy.collection")}
              description={t("privacy.collectionDesc")}
              items={DATA_KEYS.map((key) => t(`privacy.data.${key}`))}
            />

            <ListSection
              title={t("privacy.usage")}
              description={t("privacy.usageDesc")}
              items={USAGE_KEYS.map((key) => t(`privacy.usageItems.${key}`))}
            />

            <ListSection
              title={t("privacy.legalBases.title")}
              description={t("privacy.legalBases.desc")}
              items={LEGAL_KEYS.map((key) => t(`privacy.legalBases.${key}`))}
            />

            <ListSection
              title={t("privacy.sharing")}
              description={t("privacy.sharingDesc")}
              items={THIRD_PARTY_KEYS.map((key) => t(`privacy.thirdParties.${key}`))}
            />

            <Section
              title={t("privacy.security")}
              description={t("privacy.securityDesc")}
            />

            <ListSection
              title={t("privacy.cookies")}
              description={t("privacy.cookiesDesc")}
              items={COOKIE_KEYS.map((key) => t(`privacy.cookiesItems.${key}`))}
            />

            <Section title={t("privacy.push.title")} description={t("privacy.push.desc")} />

            <Section title={t("privacy.ai.title")} description={t("privacy.ai.desc")} />

            <Section title={t("privacy.retention.title")} description={t("privacy.retention.desc")} />

            <Section title={t("privacy.advertising")} description={t("privacy.advertisingDesc")} />

            <ListSection
              title={t("privacy.rights")}
              description={t("privacy.rightsDesc")}
              items={RIGHTS_KEYS.map((key) => t(`privacy.rightsList.${key}`))}
            />

            <Section title={t("privacy.children.title")} description={t("privacy.children.desc")} />

            <Section title={t("privacy.changes")} description={t("privacy.changesDesc")} />

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {t("privacy.contact")}
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                {t("privacy.contactDesc")} {" "}
                <a href={`mailto:${DEV_EMAIL}`} className="text-primary hover:underline">
                  {DEV_EMAIL}
                </a>
              </p>
            </section>
          </div>

          <div className="flex justify-start">
            <Button variant="ghost" asChild className="gap-2 px-0 text-base font-medium">
              <Link href={ROUTE_DASHBOARD}>{backLabel}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  description: string;
}

interface ListSectionProps extends SectionProps {
  items: string[];
}

function Section({ title, description }: SectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">{description}</p>
    </section>
  );
}

function ListSection({ title, description, items }: ListSectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">{description}</p>
      <ul className="list-disc space-y-2 pl-6 text-base text-muted-foreground sm:text-lg">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
