"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

import { ResponsivePageHeader } from "@/components/common/responsive-page-header";
import { Button } from "@/components/ui/button";
import { DEV_EMAIL } from "@/lib/constants";
import { ROUTE_DASHBOARD } from "@/lib/routes";

const PROHIBITED_KEYS = ["illegal", "abuse", "security", "scraping"] as const;

export default function TermsPage() {
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
            title={t("terms.title")}
            description={`${t("terms.lastUpdated")}: ${formattedDate}`}
            backHref={ROUTE_DASHBOARD}
            sticky={false}
            className="border-none bg-background px-0"
            showDesktopBackButton
          />

          <div className="space-y-16">
            <Section
              title={t("terms.acceptance")}
              description={t("terms.acceptanceDesc")}
            />

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {t("terms.use")}
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                {t("terms.useDesc")}
              </p>
              <ul className="list-disc space-y-2 pl-6 text-base text-muted-foreground sm:text-lg">
                {PROHIBITED_KEYS.map((key) => (
                  <li key={key}>{t(`terms.prohibited.${key}`)}</li>
                ))}
              </ul>
            </section>

            <Section
              title={t("terms.eligibility.title")}
              description={t("terms.eligibility.desc")}
            />

            <Section
              title={t("terms.medical.title")}
              description={t("terms.medical.desc")}
            />

            <Section
              title={t("terms.account")}
              description={t("terms.accountDesc")}
            />

            <Section
              title={t("terms.userContent.title")}
              description={t("terms.userContent.desc")}
            />

            <Section
              title={t("terms.subscriptions.title")}
              description={t("terms.subscriptions.desc")}
            />

            <Section
              title={t("terms.privacy")}
              description={t("terms.privacyDesc")}
            />

            <Section
              title={t("terms.ip.title")}
              description={t("terms.ip.desc")}
            />

            <Section
              title={t("terms.disclaimers.title")}
              description={t("terms.disclaimers.desc")}
            />

            <Section
              title={t("terms.liability.title")}
              description={t("terms.liability.desc")}
            />

            <Section
              title={t("terms.termination")}
              description={t("terms.terminationDesc")}
            />

            <Section
              title={t("terms.changes")}
              description={t("terms.changesDesc")}
            />

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {t("terms.contact")}
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                {t("terms.contactDesc")}{" "}
                <a
                  href={`mailto:${DEV_EMAIL}`}
                  className="text-primary hover:underline"
                >
                  {DEV_EMAIL}
                </a>
              </p>
            </section>
          </div>

          <div className="flex justify-start">
            <Button
              variant="ghost"
              asChild
              className="gap-2 px-0 text-base font-medium"
            >
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

function Section({ title, description }: SectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h2>
      <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
        {description}
      </p>
    </section>
  );
}
