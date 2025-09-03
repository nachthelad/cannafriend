"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { buildNutrientMixesPath } from "@/lib/firebase-config";
import { Layout } from "@/components/layout";
import { ArrowLeft } from "lucide-react";
import { AnimatedLogo } from "@/components/common/animated-logo";
import { ROUTE_NUTRIENTS } from "@/lib/routes";

export default function NewNutrientPage() {
  const { t } = useTranslation(["nutrients", "common"]);
  const router = useRouter();
  const { user } = useAuthUser();
  const { toast } = useToast();
  const userId = user?.uid ?? null;

  const [name, setName] = useState("");
  const [npk, setNpk] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!userId || !name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        npk: npk.trim() || undefined,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, buildNutrientMixesPath(userId)), payload);
      toast({
        title: t("added"),
        description: t("addedDesc"),
      });
      router.push(ROUTE_NUTRIENTS);
    } catch (error) {
      console.error("Error adding nutrient mix:", error);
      toast({
        variant: "destructive",
        title: t("error", { ns: "common" }),
        description: t("addError"),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      {/* Mobile Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="sm" 
            onClick={() => router.push(ROUTE_NUTRIENTS)}
            className="flex items-center gap-2 min-h-[48px] px-3"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="md:inline hidden">{t("back", { ns: "common" })}</span>
          </Button>
        </div>
        <h1 className="text-3xl font-bold">{t("new")}</h1>
        <p className="text-muted-foreground">{t("newDesc")}</p>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <div className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="mix-name" className="text-base font-medium">
              {t("name")}
            </Label>
            <Input
              id="mix-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              className="min-h-[48px] text-base"
              type="text"
              autoComplete="off"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="mix-npk" className="text-base font-medium">
              {t("npk")}
            </Label>
            <Input
              id="mix-npk"
              value={npk}
              onChange={(e) => setNpk(e.target.value)}
              placeholder={t("npkPlaceholder")}
              className="min-h-[48px] text-base"
              type="text"
              autoComplete="off"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="mix-notes" className="text-base font-medium">
              {t("notes")}
            </Label>
            <Textarea
              id="mix-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("notesPlaceholder")}
              rows={4}
              className="text-base resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(ROUTE_NUTRIENTS)}
              className="min-h-[48px] w-full sm:w-auto text-base font-medium"
              disabled={saving}
            >
              {t("cancel", { ns: "common" })}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!name.trim() || saving}
              className="min-h-[48px] w-full sm:w-auto text-base font-medium"
            >
              {saving ? (
                <>
                  <AnimatedLogo size={16} className="mr-2" duration={1.2} />
                  {t("saving", { ns: "common" })}
                </>
              ) : (
                t("save", { ns: "common" })
              )}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}