"use client";

import { useEffect, useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { resolveHomePathForRoles } from "@/lib/routes";
import { useUserRoles } from "@/hooks/use-user-roles";
import { auth } from "@/lib/firebase";
import { getDocs, orderBy, query, onSnapshot } from "firebase/firestore";
import { consumerChatsCol } from "@/lib/paths";
import { useAuthUser } from "@/hooks/use-auth-user";
import { AnimatedLogo } from "@/components/common/animated-logo";
import { useTranslation } from "@/hooks/use-translation";
import { consumerChatDetailPath } from "@/lib/routes";
import { usePremium } from "@/hooks/use-premium";
import { PremiumRequiredCard } from "@/components/common/premium-required-card";

export default function ConsumerChatListPage() {
  const { t } = useTranslation();
  const { user } = useAuthUser();
  const { isPremium } = usePremium();
  const router = useRouter();
  const { roles } = useUserRoles();
  const [items, setItems] = useState<
    Array<{ id: string; preview: string; createdAt: string }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    const qy = query(consumerChatsCol(user.uid), orderBy("createdAt", "desc"));
    setLoading(true);
    const unsub = onSnapshot(qy, (snap) => {
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
      setLoading(false);
    });
    return () => unsub();
  }, [user?.uid]);

  return (
    <Layout>
      <div className="space-y-6">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.push(resolveHomePathForRoles(roles))}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("common.back")}
        </Button>
        {!isPremium ? (
          <PremiumRequiredCard />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{t("consumerChat.list.title")}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {loading ? (
                <div className="flex justify-center items-center py-8 text-muted-foreground">
                  <AnimatedLogo size={20} className="text-primary" duration={1.5} />
                </div>
              ) : items.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  {t("consumerChat.list.empty")}
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((it) => (
                    <a
                      key={it.id}
                      href={consumerChatDetailPath(it.id)}
                      className="block rounded-md border p-3 text-sm hover:bg-accent hover:text-accent-foreground"
                    >
                      {it.preview}
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
