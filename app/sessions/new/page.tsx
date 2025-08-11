"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { auth, db } from "@/lib/firebase";
import { addDoc, collection } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function NewSessionPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  const [strain, setStrain] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) setUserId(u.uid);
      else router.push("/login");
    });
    return () => unsub();
  }, [router]);

  const onSave = async () => {
    if (!userId || !strain.trim()) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("strains.required"),
      });
      return;
    }
    setIsSaving(true);
    try {
      const ref = collection(db, "users", userId, "sessions");
      await addDoc(ref, {
        strain,
        amount,
        method,
        notes,
        date: new Date().toISOString(),
      });
      toast({ title: t("strains.saved") });
      router.push("/strains");
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: e?.message || String(e),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{t("strains.addSession")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                {t("strains.strain")}
              </label>
              <Input
                value={strain}
                onChange={(e) => setStrain(e.target.value)}
                placeholder={t("strains.strainPlaceholder")}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">
                  {t("strains.method")}
                </label>
                <Input
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  placeholder={t("strains.methodPlaceholder")}
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  {t("strains.amount")}
                </label>
                <Input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={t("strains.amountPlaceholder")}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">
                {t("strains.notes")}
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("strains.notesPlaceholder")}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={onSave} disabled={isSaving}>
                {t("strains.save")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
