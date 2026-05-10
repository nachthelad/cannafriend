import Link from "next/link";

import { ResponsivePageHeader } from "@/components/common/responsive-page-header";
import { Button } from "@/components/ui/button";
import { DEV_EMAIL } from "@/lib/constants";
import { formatLegalEffectiveDate } from "@/lib/legal";
import { getLegalPageCopy } from "@/lib/legal-page-copy";
import { ROUTE_SETTINGS } from "@/lib/routes";

const DATA_KEYS = [
  "account",
  "profile",
  "content",
  "images",
  "device",
  "notifications",
  "analytics",
  "payments",
  "storage",
] as const;
const USAGE_KEYS = ["provide", "improve", "support", "security", "comms", "billing", "ads", "compliance"] as const;
const LEGAL_KEYS = ["contract", "consent", "legitInterest", "legalObligation"] as const;
const THIRD_PARTY_KEYS = ["firebase", "google", "payments", "ai", "analytics", "ads"] as const;
const COOKIE_KEYS = ["auth", "prefs", "consent", "analytics", "pwa"] as const;
const RIGHTS_KEYS = ["info", "access", "rectify", "update", "delete", "withdrawConsent", "complaint"] as const;

export default async function PrivacyPage() {
  const { locale, common } = await getLegalPageCopy();
  const { privacy, back } = common;
  const formattedDate = formatLegalEffectiveDate(locale);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-4xl space-y-12">
          <ResponsivePageHeader
            title={privacy.title}
            description={`${privacy.lastUpdated}: ${formattedDate}`}
            backHref={ROUTE_SETTINGS}
            sticky={false}
            className="border-none bg-background px-0"
            showDesktopBackButton
          />

          <div className="space-y-16">
            <Section title={privacy.intro} description={privacy.introDesc} />

            <ListSection
              title={privacy.collection}
              description={privacy.collectionDesc}
              items={DATA_KEYS.map((key) => privacy.data[key])}
            />

            <Section title={privacy.sensitive.title} description={privacy.sensitive.desc} />

            <ListSection
              title={privacy.usage}
              description={privacy.usageDesc}
              items={USAGE_KEYS.map((key) => privacy.usageItems[key])}
            />

            <ListSection
              title={privacy.legalBases.title}
              description={privacy.legalBases.desc}
              items={LEGAL_KEYS.map((key) => privacy.legalBases[key])}
            />

            <ListSection
              title={privacy.sharing}
              description={privacy.sharingDesc}
              items={THIRD_PARTY_KEYS.map((key) => privacy.thirdParties[key])}
            />

            <Section
              title={privacy.internationalTransfers.title}
              description={privacy.internationalTransfers.desc}
            />

            <Section
              title={privacy.security}
              description={privacy.securityDesc}
            />

            <ListSection
              title={privacy.cookies}
              description={privacy.cookiesDesc}
              items={COOKIE_KEYS.map((key) => privacy.cookiesItems[key])}
            />

            <Section title={privacy.push.title} description={privacy.push.desc} />

            <Section title={privacy.ai.title} description={privacy.ai.desc} />

            <Section title={privacy.retention.title} description={privacy.retention.desc} />

            <Section title={privacy.advertising} description={privacy.advertisingDesc} />

            <ListSection
              title={privacy.rights}
              description={privacy.rightsDesc}
              items={RIGHTS_KEYS.map((key) => privacy.rightsList[key])}
            />

            <Section title={privacy.argentina.title} description={privacy.argentina.desc} />

            <Section title={privacy.children.title} description={privacy.children.desc} />

            <Section title={privacy.changes} description={privacy.changesDesc} />

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {privacy.contact}
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                {privacy.contactDesc}{" "}
                <a href={`mailto:${DEV_EMAIL}`} className="text-primary hover:underline">
                  {DEV_EMAIL}
                </a>
              </p>
            </section>
          </div>

          <div className="flex justify-start">
            <Button variant="ghost" asChild className="gap-2 px-0 text-base font-medium">
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
