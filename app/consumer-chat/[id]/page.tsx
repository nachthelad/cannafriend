"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { auth } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useTranslation } from "@/hooks/use-translation";
import { usePremium } from "@/hooks/use-premium";
import { PremiumRequiredCard } from "@/components/common/premium-required-card";

export default function ConsumerChatDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { user, isLoading } = useAuthUser();
  const { t } = useTranslation();
  const { isPremium } = usePremium();
  const [messages, setMessages] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const [createdAt, setCreatedAt] = useState<string>("");

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
      const uid = user?.uid || auth.currentUser?.uid;
      if (!uid) return;
      try {
        const snap = await getDoc(doc(db, "users", uid, "consumerChats", id));
        if (snap.exists()) {
          const d = snap.data() as any;
          const list = Array.isArray(d.messages) ? d.messages : [];
          setMessages(list);
          const ts = d.createdAt?.toDate
            ? d.createdAt.toDate().toISOString()
            : d.createdAt || new Date().toISOString();
          setCreatedAt(ts);
        } else {
          setMessages([]);
        }
      } catch {
        setMessages([]);
      }
    })();
  }, [params, user?.uid, isLoading]);

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
          <h1 className="text-3xl font-bold inline-flex items-center gap-2">
            {t("consumerChat.detail.title")}
          </h1>
        </div>

        {!isPremium ? (
          <PremiumRequiredCard />
        ) : (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="text-xs text-muted-foreground">
                {createdAt ? formatDate.format(new Date(createdAt)) : null}
              </div>
              <div className="space-y-2">
                {messages.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    {t("consumerChat.detail.empty")}
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <div
                      key={i}
                      className={m.role === "user" ? "text-right" : "text-left"}
                    >
                      <div
                        className={
                          "inline-block max-w-[90%] rounded-md px-3 py-2 " +
                          (m.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-accent text-accent-foreground")
                        }
                      >
                        {m.content}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
