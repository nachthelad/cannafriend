"use client";

import { useEffect, useRef, useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare } from "lucide-react";
import { AnimatedLogo } from "@/components/common/animated-logo";
import { usePremium } from "@/hooks/use-premium";
import { useUserRoles } from "@/hooks/use-user-roles";
import { useRouter } from "next/navigation";
import { ROUTE_ANALYZE_PLANT } from "@/lib/routes";
import { auth } from "@/lib/firebase";
import {
  addDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { consumerChatsCol } from "@/lib/paths";
import { ROUTE_CONSUMER_CHAT } from "@/lib/routes";
import { useTranslation } from "@/hooks/use-translation";
import { PremiumRequiredCard } from "@/components/common/premium-required-card";

type ChatMsg = { role: "user" | "assistant"; content: string };

export default function AIConsumerPage() {
  const { t } = useTranslation();
  const { isPremium } = usePremium();
  const { roles } = useUserRoles();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isPremium && roles?.grower && !roles.consumer) {
      // Growers should use image analysis instead
      router.replace(ROUTE_ANALYZE_PLANT);
    }
  }, [isPremium, roles, router]);

  const send = async () => {
    const q = input.trim();
    if (!q) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setLoading(true);
    try {
      const res = await fetch("/api/ai-consumer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: q }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "request_failed");
      const answer = data.content || "";
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);

      // Persist entry
      const uid = auth.currentUser?.uid;
      if (uid) {
        try {
          await addDoc(consumerChatsCol(uid), {
            createdAt: serverTimestamp(),
            messages: [
              ...messages,
              { role: "user", content: q },
              { role: "assistant", content: answer },
            ],
          });
        } catch {}
      }
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: e?.message || "Something went wrong" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="mb-6 flex items-center gap-3">
          <h1 className="text-3xl font-bold inline-flex items-center gap-2">
            {t("aiConsumer.title")}
          </h1>
        </div>
        {!isPremium ? (
          <PremiumRequiredCard />
        ) : (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="text-sm text-muted-foreground">
                {t("aiConsumer.intro")}
              </div>
              {/* The chat is on this page already; the gradient CTA is shown on Strains instead. */}
              <div className="min-h-[300px] max-h-[50vh] overflow-auto border rounded-md p-3 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    {t("aiConsumer.tryPrompt")}
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
                <div ref={endRef} />
              </div>
              <div className="flex gap-3">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t("aiConsumer.placeholder")}
                  className="min-h-[80px]"
                />
                <Button onClick={send} disabled={loading} className="h-12">
                  {loading ? (
                    <AnimatedLogo size={20} className="text-primary" duration={1.2} />
                  ) : (
                    t("aiConsumer.send")
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        {isPremium && (
          <>
            <PreviousChats />
            <div className="text-right">
              <a href={ROUTE_CONSUMER_CHAT} className="text-sm underline">
                {t("aiConsumer.viewAll")}
              </a>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

function PreviousChats() {
  const { t } = useTranslation();
  const [items, setItems] = useState<
    Array<{ id: string; preview: string; createdAt: string }>
  >([]);
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    (async () => {
      try {
        const q = query(consumerChatsCol(uid), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const rows: Array<{ id: string; preview: string; createdAt: string }> =
          [];
        snap.forEach((doc) => {
          const d = doc.data() as any;
          const last = Array.isArray(d.messages)
            ? d.messages[d.messages.length - 1]?.content
            : "";
          rows.push({
            id: doc.id,
            preview: String(last || ""),
            createdAt: d.createdAt?.toDate
              ? d.createdAt.toDate().toISOString()
              : d.createdAt || new Date().toISOString(),
          });
        });
        setItems(rows);
      } catch {}
    })();
  }, []);
  if (items.length === 0) return null;
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="text-base font-medium">{t("aiConsumer.recent")}</div>
        <div className="space-y-2">
          {items.map((it) => (
            <a
              key={it.id}
              href={`/consumer-chat/${it.id}`}
              className="block rounded-md border p-3 text-sm hover:bg-accent hover:text-accent-foreground"
            >
              {it.preview}
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
