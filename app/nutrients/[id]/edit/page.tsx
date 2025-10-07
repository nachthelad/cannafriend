"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { useFirebaseDocument } from "@/hooks";
import { Layout } from "@/components/layout";
import { FormSkeleton } from "@/components/skeletons/common-skeletons";
import { ROUTE_NUTRIENTS } from "@/lib/routes";
import type { NutrientMix as NutrientMixBase } from "@/types";
import { ResponsivePageHeader } from "@/components/common/responsive-page-header";

export default function EditNutrientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t } = useTranslation(["nutrients", "common"]);
  const router = useRouter();
  const { toast } = useToast();
  const { id: mixId } = use(params);

  type EditableNutrientMix = Omit<NutrientMixBase, "npk" | "notes"> & {
    npk?: string | null;
    notes?: string | null;
  };

  const {
    data: mix,
    loading,
    exists,
    update,
  } = useFirebaseDocument<EditableNutrientMix>(
    `users/{userId}/nutrientMixes/${mixId}`,
    { enabled: !!mixId }
  );

  const [name, setName] = useState("");
  const [npk, setNpk] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mix) {
      setName(mix.name || "");
      setNpk(mix.npk || "");
      setNotes(mix.notes || "");
    }
  }, [mix]);

  useEffect(() => {
    if (!loading && !exists) {
      router.push(ROUTE_NUTRIENTS);
    }
  }, [loading, exists, router]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await update({
        name: name.trim(),
        npk: npk.trim() || null,
        notes: notes.trim() || null,
      });
      toast({ title: t("updated"), description: t("updatedDesc") });
      router.push(ROUTE_NUTRIENTS);
    } catch (error) {
      console.error("Error updating nutrient mix:", error);
      toast({
        variant: "destructive",
        title: t("error", { ns: "common" }),
        description: t("updateError"),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 md:px-6">
          <FormSkeleton />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ResponsivePageHeader
        title={t("edit")}
        description={t("editDesc")}
        onBackClick={() => router.push(ROUTE_NUTRIENTS)}
      />

      {/* Form */}
      <div className="max-w-2xl px-4 md:px-6">
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
              {saving
                ? t("saving", { ns: "common" })
                : t("save", { ns: "common" })}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
