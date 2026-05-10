import Link from "next/link";

import { ResponsivePageHeader } from "@/components/common/responsive-page-header";
import { Button } from "@/components/ui/button";
import { DEV_EMAIL } from "@/lib/constants";
import { formatLegalEffectiveDate } from "@/lib/legal";
import { getLegalPageCopy } from "@/lib/legal-page-copy";
import { ROUTE_SETTINGS } from "@/lib/routes";

const PROHIBITED_KEYS = ["illegal", "abuse", "security", "scraping"] as const;

export default async function TermsPage() {
  const { locale, common } = await getLegalPageCopy();
  const { terms, back } = common;
  const formattedDate = formatLegalEffectiveDate(locale);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-4xl space-y-12">
          <ResponsivePageHeader
            title={terms.title}
            description={`${terms.lastUpdated}: ${formattedDate}`}
            backHref={ROUTE_SETTINGS}
            sticky={false}
            className="border-none bg-background px-0"
            showDesktopBackButton
          />

          <div className="space-y-16">
            <Section
              title={terms.acceptance}
              description={terms.acceptanceDesc}
            />

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {terms.use}
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                {terms.useDesc}
              </p>
              <ul className="list-disc space-y-2 pl-6 text-base text-muted-foreground sm:text-lg">
                {PROHIBITED_KEYS.map((key) => (
                  <li key={key}>{terms.prohibited[key]}</li>
                ))}
              </ul>
            </section>

            <Section
              title={terms.eligibility.title}
              description={terms.eligibility.desc}
            />

            <Section
              title={terms.medical.title}
              description={terms.medical.desc}
            />

            <Section
              title={terms.emergency.title}
              description={terms.emergency.desc}
            />

            <Section
              title={terms.ai.title}
              description={terms.ai.desc}
            />

            <Section
              title={terms.account}
              description={terms.accountDesc}
            />

            <Section
              title={terms.userContent.title}
              description={terms.userContent.desc}
            />

            <Section
              title={terms.subscriptions.title}
              description={terms.subscriptions.desc}
            />

            <Section
              title={terms.privacy}
              description={terms.privacyDesc}
            />

            <Section
              title={terms.ip.title}
              description={terms.ip.desc}
            />

            <Section
              title={terms.disclaimers.title}
              description={terms.disclaimers.desc}
            />

            <Section
              title={terms.liability.title}
              description={terms.liability.desc}
            />

            <Section
              title={terms.localLaw.title}
              description={terms.localLaw.desc}
            />

            <Section
              title={terms.termination}
              description={terms.terminationDesc}
            />

            <Section
              title={terms.changes}
              description={terms.changesDesc}
            />

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {terms.contact}
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                {terms.contactDesc}{" "}
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
              <Link href={ROUTE_SETTINGS}>{back}</Link>
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
