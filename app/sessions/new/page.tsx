"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import type React from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { auth } from "@/lib/firebase";
import { addDoc } from "firebase/firestore";
import { ROUTE_LOGIN, ROUTE_SESSIONS } from "@/lib/routes";
import { sessionsCol } from "@/lib/paths";
import { onAuthStateChanged } from "firebase/auth";
import {
  ImageUpload,
  type ImageUploadHandle,
} from "@/components/common/image-upload";
import { Calendar, Clock, Plus } from "lucide-react";
import { LocalizedCalendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, formatDateObjectWithLocale } from "@/lib/utils";
import { MobileDatePicker } from "@/components/ui/mobile-date-picker";
import { es, enUS } from "date-fns/locale";
import { ResponsivePageHeader } from "@/components/common/responsive-page-header";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function TimeField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const sanitize = (v: string) => {
    // allow only digits and one colon, up to 5 chars total
    const filtered = v.replace(/[^0-9:]/g, "");
    const parts = filtered.split(":");
    if (parts.length > 2) {
      // collapse extra colons
      const [a, b] = parts;
      return `${a}:${b}`.slice(0, 5);
    }
    return filtered.slice(0, 5);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(sanitize(e.target.value));
  };

  const handleBlur = () => {
    const raw = (value || "").trim();
    if (!raw) return;
    const onlyDigits = raw.replace(/\D/g, "");
    let hh = 0;
    let mm = 0;
    if (raw.includes(":")) {
      const [h, m = "0"] = raw.split(":");
      hh = Number.parseInt(h || "0", 10);
      mm = Number.parseInt(m || "0", 10);
    } else if (onlyDigits.length <= 2) {
      hh = Number.parseInt(onlyDigits || "0", 10);
      mm = 0;
    } else {
      const d = onlyDigits.padEnd(4, "0");
      hh = Number.parseInt(d.slice(0, 2), 10);
      mm = Number.parseInt(d.slice(2, 4), 10);
    }
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return;
    hh = Math.min(23, Math.max(0, hh));
    mm = Math.min(59, Math.max(0, mm));
    onChange(`${pad2(hh)}:${pad2(mm)}`);
  };

  return (
    <div className="flex items-center gap-2">
      <Clock className="h-4 w-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="HH:MM"
        inputMode="numeric"
        className="w-32"
      />
    </div>
  );
}

export default function NewSessionPage() {
  const { t } = useTranslation(["common", "strains"]);
  const { toast } = useToast();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const imageUploadRef = useRef<ImageUploadHandle | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleBack = () => {
    router.push(ROUTE_SESSIONS);
  };

  type SessionForm = {
    strain: string;
    method: string;
    amount: string;
    notes: string;
    date: Date;
    startTime: string;
    endTime: string;
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<SessionForm>({
    defaultValues: {
      strain: "",
      method: "",
      amount: "",
      notes: "",
      date: new Date(),
      startTime: "",
      endTime: "",
    },
  });

  const sessionDate = watch("date");
  const startTime = watch("startTime");
  const endTime = watch("endTime");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) setUserId(u.uid);
      else router.push(ROUTE_LOGIN);
    });
    return () => unsub();
  }, [router]);

  const onSave = async (data: SessionForm) => {
    if (!userId || !data.strain.trim()) {
      toast({
        variant: "destructive",
        title: t("error", { ns: "common" }),
        description: t("required", { ns: "sessions" }),
      });
      return;
    }
    setIsSaving(true);
    try {
      const ref = sessionsCol(userId);
      const buildDateTime = (base: Date, hhmm: string) => {
        if (!hhmm) return null;
        const [hh, mm] = hhmm.split(":").map((x) => Number.parseInt(x, 10));
        const d = new Date(base);
        d.setHours(
          Number.isFinite(hh) ? hh : 0,
          Number.isFinite(mm) ? mm : 0,
          0,
          0
        );
        return d.toISOString();
      };
      const startISO = buildDateTime(sessionDate, data.startTime);
      const endISO = buildDateTime(sessionDate, data.endTime);
      const dateISO =
        startISO ||
        new Date(
          sessionDate.getFullYear(),
          sessionDate.getMonth(),
          sessionDate.getDate()
        ).toISOString();
      await addDoc(ref, {
        strain: data.strain,
        amount: data.amount,
        method: data.method,
        notes: data.notes,
        startTime: startISO,
        endTime: endISO,
        photos: photos.length > 0 ? photos : null,
        date: dateISO,
      });
      toast({ title: t("saved", { ns: "sessions" }) });
      router.push(`${ROUTE_SESSIONS}?refresh=true`);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: t("error", { ns: "common" }),
        description: e?.message || String(e),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout>
      <ResponsivePageHeader
        title={t("addSession", { ns: "sessions" })}
        description={t("addSessionDesc", { ns: "sessions" })}
        onBackClick={handleBack}
      />

      {/* Form */}
      <form onSubmit={handleSubmit(onSave)} className="max-w-2xl px-4 md:px-6">
        <div className="space-y-6">
          <div className="space-y-3">
            <label htmlFor="strain" className="text-base font-medium">
              {t("strain", { ns: "sessions" })} *
            </label>
            <Input
              id="strain"
              {...register("strain", {
                required: t("required", { ns: "sessions" }) as any,
              })}
              placeholder={t("strainPlaceholder", { ns: "sessions" })}
              className="min-h-[48px] text-base"
            />
            {errors.strain && (
              <p className="text-xs text-destructive mt-1">
                {String(errors.strain.message)}
              </p>
            )}
          </div>
          <div className="space-y-3">
            <label className="text-base font-medium">
              {t("logForm.date", { ns: "sessions" })}
            </label>
            <div className="md:hidden">
              <MobileDatePicker
                selected={sessionDate}
                onSelect={(d) =>
                  d && setValue("date", d, { shouldDirty: true })
                }
                locale={t("language", { ns: "common" }) === "es" ? es : enUS}
              />
            </div>
            <div className="hidden md:block">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal min-h-[48px] text-base"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {formatDateObjectWithLocale(sessionDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={sessionDate}
                    onSelect={(d) =>
                      d && setValue("date", d, { shouldDirty: true })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-base font-medium">
                {t("startTime", { ns: "sessions" })}
              </label>
              <TimeField
                value={startTime}
                onChange={(v) =>
                  setValue("startTime", v, { shouldDirty: true })
                }
              />
            </div>
            <div className="space-y-3">
              <label className="text-base font-medium">
                {t("endTime", { ns: "sessions" })}
              </label>
              <TimeField
                value={endTime}
                onChange={(v) => setValue("endTime", v, { shouldDirty: true })}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label htmlFor="method" className="text-base font-medium">
                {t("method", { ns: "sessions" })}
              </label>
              <Input
                id="method"
                {...register("method")}
                placeholder={t("methodPlaceholder", { ns: "sessions" })}
                className="min-h-[48px] text-base"
              />
            </div>
            <div className="space-y-3">
              <label htmlFor="amount" className="text-base font-medium">
                {t("amount", { ns: "sessions" })}
              </label>
              <Input
                id="amount"
                {...register("amount")}
                placeholder={t("amountPlaceholder", { ns: "sessions" })}
                className="min-h-[48px] text-base"
              />
            </div>
          </div>
          <div className="space-y-3">
            <label htmlFor="notes" className="text-base font-medium">
              {t("notes", { ns: "sessions" })}
            </label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder={t("notesPlaceholder", { ns: "sessions" })}
              className="min-h-[100px] text-base resize-none"
            />
          </div>
          <div className="space-y-3">
            <label className="text-base font-medium">
              {t("photos", { ns: "sessions" })}
            </label>
            <Button
              type="button"
              variant="outline"
              onClick={() => imageUploadRef.current?.open()}
              className="w-full justify-center gap-2 sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              {t("imageUpload.addPhoto", { ns: "common" })}
            </Button>
            <ImageUpload
              ref={imageUploadRef}
              onImagesChange={(newUrls) =>
                setPhotos((prev) => [...prev, ...newUrls])
              }
              maxSizeMB={5}
              hideDefaultTrigger
            />
            {photos.length > 0 && (
              <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-2">
                {photos.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative w-full aspect-square overflow-hidden rounded-md border"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`photo ${idx + 1}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4 pb-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              className="flex-1 min-h-[48px] text-base"
            >
              {t("cancel", { ns: "common" })}
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="flex-1 min-h-[48px] text-base"
            >
              {isSaving
                ? t("saving", { ns: "common" })
                : t("save", { ns: "sessions" })}
            </Button>
          </div>
        </div>
      </form>
    </Layout>
  );
}
