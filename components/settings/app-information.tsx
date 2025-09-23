"use client";

export interface AppInformationLine {
  label: string;
  value: string;
}

interface AppInformationProps {
  title: string;
  // description?: string;
  versionLabel: string;
  version?: string | null;
  infoLines?: AppInformationLine[];
}

export function AppInformation({
  title,
  // description,
  versionLabel,
  version,
  infoLines = [],
}: AppInformationProps) {
  const hasAdditionalInfo = infoLines.length > 0;

  return (
    <div className="space-y-2">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {/* {description && <p className="text-sm text-muted-foreground">{description}</p>} */}
      </div>
      <div className="space-y-2 text-sm text-muted-foreground">
        {version ? (
          <div>
            {/* <span className="mr-2 font-small text-foreground">
              {versionLabel}
            </span> */}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs uppercase tracking-wide">
              {version}
            </code>
          </div>
        ) : null}

        {hasAdditionalInfo
          ? infoLines.map((line) => (
              <div key={line.label} className="flex items-center gap-2">
                <span className="font-medium text-foreground">
                  {line.label}:
                </span>
                <span>{line.value}</span>
              </div>
            ))
          : null}
      </div>
    </div>
  );
}
