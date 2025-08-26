"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "@/hooks/use-translation";
import { auth } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { analysisDoc } from "@/lib/paths";

type JournalEntry = {
  id: string;
  createdAt: string;
  imageBase64?: string;
  imageUrl?: string;
  imageType?: string;
  question: string;
  response: string;
};

const STORAGE_KEY = "cf_ai_analysis_journal";

export default function AnalysisDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const [entry, setEntry] = useState<JournalEntry | null>(null);

  const formatDate = useMemo(
    () =>
      new Intl.DateTimeFormat("en-CA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "UTC",
      }),
    []
  );

  useEffect(() => {
    (async () => {
      const { id } = await params;
      // Try Firestore first if logged in
      const uid = auth.currentUser?.uid;
      if (uid) {
        try {
          const snap = await getDoc(analysisDoc(uid, id));
          if (snap.exists()) {
            const d = snap.data() as any;
            setEntry({
              id: snap.id,
              createdAt: d.createdAt || new Date().toISOString(),
              imageUrl: d.imageUrl || undefined,
              imageType: d.imageType || "image/jpeg",
              question: d.question || "",
              response: d.response || "",
            });
            return;
          }
        } catch {
          // fallback to localStorage
        }
      }
      // Fallback to localStorage
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const list: JournalEntry[] = raw ? JSON.parse(raw) : [];
        const found = list.find((e) => e.id === id) || null;
        setEntry(found);
      } catch {
        setEntry(null);
      }
    })();
  }, [params]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">{t("analyzePlant.title")}</h1>
        </div>

        {!entry ? (
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">
                {t("analysis.notFound")}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="text-xs text-muted-foreground">
                  {formatDate.format(new Date(entry.createdAt))}
                </div>
                {(entry as any).imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={(entry as any).imageUrl}
                    alt="Analyzed"
                    className="w-full rounded"
                    loading="lazy"
                  />
                )}
                <div className="text-sm">
                  {entry.question || t("analyzePlant.defaultQuestion")}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="inline-flex items-center gap-2 text-base font-medium">
                  <Brain className="h-4 w-4" />{" "}
                  {t("analyzePlant.analysisResult")}
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{entry.response}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}
