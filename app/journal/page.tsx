"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { useAuthUser } from "@/hooks/use-auth-user";
import {
  ROUTE_LOGIN,
  ROUTE_JOURNAL_NEW,
  resolveHomePathForRoles,
} from "@/lib/routes";
import { Layout } from "@/components/layout";
import { JournalGrid } from "@/components/journal/journal-grid";
import { MobileDatePicker } from "@/components/ui/mobile-date-picker";
import { MobileJournal } from "@/components/mobile/mobile-journal";
import { Filter, Plus } from "lucide-react";
import { es, enUS } from "date-fns/locale";
import { ResponsivePageHeader } from "@/components/common/responsive-page-header";
import { useUserRoles } from "@/hooks/use-user-roles";

export default function JournalPage() {
  const { t, i18n } = useTranslation(["journal", "common"]);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthUser();
  const userId = user?.uid ?? null;
  const { roles } = useUserRoles();
  const homePath = resolveHomePathForRoles(roles);

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push(ROUTE_LOGIN);
  }, [authLoading, user, router]);

  const getCalendarLocale = () => (i18n.language === "es" ? es : enUS);

  return (
    <Layout>
      <ResponsivePageHeader
        title={t("title", { ns: "journal" })}
        description={t("description", { ns: "journal" })}
        backHref={homePath}
        mobileActions={
          <Button
            size="icon"
            aria-label={t("addLog", { ns: "journal", defaultValue: "Add Log" })}
            onClick={() => router.push(ROUTE_JOURNAL_NEW)}
          >
            <Plus className="h-5 w-5" />
          </Button>
        }
        desktopActions={
          <Button onClick={() => router.push(ROUTE_JOURNAL_NEW)}>
            <Plus className="h-4 w-4 mr-2" />
            {t("addLog", { ns: "journal", defaultValue: "Add Log" })}
          </Button>
        }
      />
      {/* Mobile Journal */}
      <div className="md:hidden">
        {userId && <MobileJournal userId={userId} language={i18n.language} />}
      </div>

      {/* Desktop Journal */}
      <div className="hidden md:block">
        <div className="grid gap-6 md:grid-cols-[320px_1fr]">
          {/* Left column: Filters + calendar */}
          <Card className="md:sticky md:top-4 h-fit">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                {t("filters.title", { ns: "journal" })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <MobileDatePicker
                  selected={undefined}
                  onSelect={() => {}}
                  locale={getCalendarLocale()}
                />
              </div>
            </CardContent>
          </Card>
          {/* Right column: Logs List */}
          <Card>
            <CardHeader>
              <CardTitle>{t("recentLogs", { ns: "journal" })}</CardTitle>
            </CardHeader>
            <CardContent>
              {userId && <JournalGrid userId={userId} />}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
