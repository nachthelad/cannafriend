"use client";

import type React from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LocalizedCalendar as Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { formatDateObjectWithLocale } from "@/lib/utils";

type MobileDatePickerProps = {
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  locale: any; // date-fns locale
};

export function MobileDatePicker({
  selected,
  onSelect,
  locale,
}: MobileDatePickerProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const { t, i18n } = useTranslation(["common", "journal"]);
  const language = i18n.language;

  const handleSelect = (date?: Date) => {
    onSelect(date);
    setOpen(false);
  };

  return (
    <>
      {/* Mobile: trigger + dialog */}
      <div className="md:hidden">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="justify-start">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selected
                ? formatDateObjectWithLocale(
                    selected,
                    "PPP",
                    locale?.code ?? "en"
                  )
                : t("logForm.selectDate", { ns: "journal" })}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("logForm.selectDate", { ns: "journal" })}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Calendar
                mode="single"
                selected={selected}
                onSelect={(d) => handleSelect(d)}
                className="rounded-md border w-full"
                locale={locale}
              />
              {selected && (
                <div className="flex gap-2">
                  <Button
                    variant="outline" 
                    onClick={() => handleSelect(undefined)}
                    className="flex-1"
                  >
                    <X className="mr-2 h-4 w-4" />
                    {t("clear", { ns: "common" })}
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Desktop: inline calendar */}
      <div className="hidden md:block">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={onSelect}
          className="rounded-md border"
          locale={locale}
          // marker function removed due to React attribute constraints
        />
      </div>
    </>
  );
}
