"use client";

import type { PreferencesFormProps } from "@/types";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TimezoneSelect } from "@/components/common/timezone-select";
import { LanguageSelect } from "@/components/common/language-select";

export function PreferencesForm({
  title,
  // description,
  languageLabel,
  timezoneLabel,
  timezonePlaceholder,
  timezoneValue,
  onTimezoneChange,
  darkModeLabel,
  darkModeChecked,
  onDarkModeChange,
}: PreferencesFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {/* <p className="text-sm text-muted-foreground">{description}</p> */}
      </div>
      <div className="space-y-6">
        <div className="space-y-2 max-w-sm">
          <Label htmlFor="language" className="text-sm font-medium">
            {languageLabel}
          </Label>
          <LanguageSelect />
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone" className="text-sm font-medium">
            {timezoneLabel}
          </Label>
          <TimezoneSelect
            placeholder={timezonePlaceholder}
            value={timezoneValue}
            onChange={onTimezoneChange}
          />
        </div>

        <div className="flex items-center gap-3 max-w-sm">
          <Label htmlFor="dark-mode" className="text-sm font-medium">
            {darkModeLabel}
          </Label>
          <Switch
            id="dark-mode"
            checked={darkModeChecked}
            onCheckedChange={onDarkModeChange}
          />
        </div>
      </div>
    </div>
  );
}
