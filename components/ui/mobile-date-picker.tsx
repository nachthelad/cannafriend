"use client";

import type React from "react";
import { useState } from "react";
import { useTranslation } from "@/hooks/use-translation";
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
  const { t, language } = useTranslation();

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
                : t("logForm.selectDate")}
            </Button>
          </DialogTrigger>
          <DialogContent
            showCloseButton={false}
            className="bg-transparent border-0 shadow-none p-0 fixed top-0 left-0 translate-x-0 translate-y-0 h-screen w-screen max-w-none"
          >
            <DialogTitle className="hidden"></DialogTitle>
            <div className="mx-auto h-full w-full max-w-md sm:max-w-lg flex items-center justify-center p-4">
              <Calendar
                mode="single"
                selected={selected}
                onSelect={(d) => handleSelect(d)}
                className="rounded-lg border p-4 [--cell-size:3rem] sm:[--cell-size:3rem]"
                locale={locale}
                // marker function removed due to React attribute constraints
              />
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
