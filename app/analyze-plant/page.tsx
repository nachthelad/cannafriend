"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout";
import { Brain, Loader2, Trash2, History } from "lucide-react";
import { usePremium } from "@/hooks/use-premium";
import { useTranslation } from "@/hooks/use-translation";
import { useUserRoles } from "@/hooks/use-user-roles";
import ReactMarkdown from "react-markdown";
import { ImageUpload } from "@/components/common/image-upload";
import { PremiumRequiredCard } from "@/components/common/premium-required-card";
import { auth } from "@/lib/firebase";
import { addDoc, getDocs, query, orderBy } from "firebase/firestore";
import { analysesCol } from "@/lib/paths";

type JournalEntry = {
  id: string;
  createdAt: string; // ISO
  imageBase64?: string;
  imageUrl?: string;
  imageType?: string; // e.g. image/jpeg
  question: string;
  response: string;
};

// Remote-only listing; no localStorage fallback

export default function AnalyzePlantPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isPremium } = usePremium();
  const { t } = useTranslation();
  const { roles } = useUserRoles();

  const [selectedImage, setSelectedImage] = useState<string | null>(null); // data URL (base64)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedImageType, setSelectedImageType] = useState<string | null>(
    null
  );
  const [question, setQuestion] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [response, setResponse] = useState<string>("");
  const [remoteAnalyses, setRemoteAnalyses] = useState<JournalEntry[]>([]);

  const defaultPrompt = t("analyzePlant.defaultPrompt");

  // Avoid hydration mismatches: use stable, fixed-locale/timezone date formatting
  const dateFormatter = useMemo(
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
  const formatTimestamp = (iso: string) => dateFormatter.format(new Date(iso));

  // Redirect consumer-only users to AI Chat instead of image analysis
  useEffect(() => {
    if (isPremium && roles?.consumer && !roles.grower) {
      router.replace("/ai-consumer");
    }
  }, [isPremium, roles, router]);

  // Load analyses from Firestore (remote only)
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    (async () => {
      try {
        const q = query(analysesCol(uid), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const items: JournalEntry[] = [];
        snap.forEach((doc) => {
          const d = doc.data() as any;
          items.push({
            id: doc.id,
            createdAt: d.createdAt || new Date().toISOString(),
            imageUrl: d.imageUrl || undefined,
            imageType: d.imageType || "image/jpeg",
            question: d.question || "",
            response: d.response || "",
          });
        });
        setRemoteAnalyses(items);
      } catch (e) {
        console.warn("Failed to load analyses from Firestore", e);
      }
    })();
  }, []);

  // Removed localStorage journal saving; remote only

  const clearJournal = () => {
    setRemoteAnalyses([]);
    toast({ title: "Cleared", description: "AI Analysis Journal cleared." });
  };

  // No local back header; rely on shared Layout header

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Please select an image.",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSelectedImage(result);
      setSelectedImageType(file.type);
    };
    reader.onerror = () => {
      toast({
        variant: "destructive",
        title: "Read error",
        description: "Failed to read image file.",
      });
    };
    reader.readAsDataURL(file);
  };

  const extractBase64 = (dataUrl: string): string => {
    const idx = dataUrl.indexOf(",");
    return idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl;
  };

  const handleAnalyze = async () => {
    if (!selectedImage && !selectedImageUrl) {
      toast({
        variant: "destructive",
        title: "No image",
        description: "Please select or capture a plant photo.",
      });
      return;
    }
    setIsAnalyzing(true);
    setResponse("");
    try {
      const base64 = selectedImage ? extractBase64(selectedImage) : undefined;
      const imgType = selectedImageType || "image/jpeg";
      const q = (question || defaultPrompt).trim();

      const res = await fetch("/api/analyze-plant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          imageBase64: base64,
          imageUrl: selectedImageUrl || undefined,
          imageType: imgType,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "API error");
      }
      const data = await res.json();
      const answer = data?.content || "";
      setResponse(answer);

      // Persist in Firestore and localStorage
      const uid = auth.currentUser?.uid;
      let newId = `${Date.now()}`;
      if (uid) {
        try {
          const docRef = await addDoc(analysesCol(uid), {
            createdAt: new Date().toISOString(),
            imageType: imgType,
            imageUrl: selectedImageUrl,
            question: q,
            response: answer,
          });
          newId = docRef.id;
        } catch (e) {
          // fallback to local id
          console.warn("Failed to save analysis to Firestore", e);
        }
      }

      const entry: JournalEntry = {
        id: newId,
        createdAt: new Date().toISOString(),
        imageUrl: selectedImageUrl || undefined,
        imageType: imgType,
        question: q,
        response: answer,
      };
      setRemoteAnalyses((prev) => [entry, ...prev]);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Analysis failed",
        description: e?.message || "Unknown error",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Title rendered in-page

  return (
    <Layout>
      <div className="space-y-6">
        <div className="mb-6 flex items-center gap-3">
          <h1 className="text-3xl font-bold">{t("analyzePlant.title")}</h1>
        </div>

        {!isPremium ? (
          <PremiumRequiredCard />
        ) : (
          <>
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t("analyzePlant.uploadImage")}
                  </label>
                  <ImageUpload
                    onImagesChange={(urls) => {
                      const url = urls[0];
                      if (!url) return;
                      // Use Storage URL directly for preview and API (no fetch -> avoids CORS/permission issues)
                      setSelectedImageUrl(url);
                      setSelectedImage(null);
                      setSelectedImageType(null);
                    }}
                    maxImages={1}
                    buttonSize="default"
                  />
                  {selectedImageUrl && (
                    <div className="mt-3 rounded-lg overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedImageUrl}
                        alt="Preview"
                        className="w-full h-auto"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t("analyzePlant.askQuestion")}
                  </label>
                  <Textarea
                    placeholder={t("analyzePlant.questionPlaceholder")}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="h-28"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="flex-1 inline-flex items-center gap-2 h-12"
                    style={{ backgroundColor: "#228B22" }}
                  >
                    {isAnalyzing ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Brain className="h-5 w-5" />
                    )}
                    {t("analyzePlant.analyzeWithAI")}
                  </Button>
                </div>

                {response && (
                  <div className="mt-4 space-y-2">
                    <div className="text-sm font-medium">
                      {t("analyzePlant.analysisResult")}
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{response}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 text-base font-medium">
                    <History className="h-4 w-4" /> {t("analyzePlant.journal")}
                  </div>
                  {remoteAnalyses.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearJournal}
                      className="inline-flex items-center gap-2 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" /> {t("common.clear")}
                    </Button>
                  )}
                </div>

                {remoteAnalyses.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    {t("analyzePlant.noAnalyses")}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {remoteAnalyses.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-md border p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="w-full text-sm">
                            {/* Mobile: stacked to avoid stretching layout */}
                            <div className="md:hidden">
                              <div className="text-muted-foreground">
                                {new Intl.DateTimeFormat("en-CA", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                  timeZone: "UTC",
                                }).format(new Date(entry.createdAt))}
                              </div>
                              {entry.question ? (
                                <div className="">{entry.question}</div>
                              ) : null}
                            </div>
                            {/* Desktop: inline time + question with truncate */}
                            <div className="hidden md:flex min-w-0 items-center">
                              <span className="text-muted-foreground shrink-0">
                                {new Intl.DateTimeFormat("en-CA", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                  timeZone: "UTC",
                                }).format(new Date(entry.createdAt))}
                              </span>
                              {entry.question ? (
                                <span className="ml-2 truncate">
                                  {entry.question}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/analysis/${entry.id}`)}
                            className="flex-shrink-0"
                          >
                            {t("common.view")}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}
