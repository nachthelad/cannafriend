import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MobilePlantPage } from "@/components/mobile/mobile-plant-page";
import type { Plant, LogEntry } from "@/types";

// ── Mocks ──────────────────────────────────────────────────────────────────

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

jest.mock("firebase/firestore", () => ({
  updateDoc: jest.fn().mockResolvedValue(undefined),
  doc: jest.fn(),
}));

jest.mock("@/lib/paths", () => ({
  plantDoc: jest.fn(() => ({})),
}));

jest.mock("@/lib/suspense-cache", () => ({
  invalidatePlantDetails: jest.fn(),
  invalidatePlantsCache: jest.fn(),
}));

jest.mock("@/lib/firebase", () => ({ db: {} }));

// ── Fixtures ───────────────────────────────────────────────────────────────

const basePlant: Plant = {
  id: "plant-1",
  name: "OG Kush",
  seedType: "autoflowering",
  growType: "indoor",
  plantingDate: "2024-01-15T00:00:00.000Z",
  status: "growing",
  createdAt: "2024-01-15T00:00:00.000Z",
  photos: [],
};

const baseProps = {
  plant: basePlant,
  userId: "user-1",
  language: "es",
  recentLogs: [] as LogEntry[],
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe("MobilePlantPage", () => {
  it("renders all four tab labels", () => {
    render(<MobilePlantPage {...baseProps} />);
    // i18next returns key in test env
    expect(
      screen.getByRole("button", { name: /plantPage\.tabEstado/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /plantPage\.tabDiario/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /plantPage\.tabInfo/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /plantPage\.tabFotos/i })
    ).toBeInTheDocument();
  });

  it("shows Estado tab content by default", () => {
    render(<MobilePlantPage {...baseProps} />);
    // Estado tab: link to add-log should be present
    expect(
      screen.getByRole("link", { name: /addLog/i })
    ).toHaveAttribute("href", "/plants/plant-1/add-log");
  });

  it("shows dash for missing environment stats", () => {
    render(<MobilePlantPage {...baseProps} />);
    // Four stats all show "—" when no lastEnvironment
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBe(4);
  });

  it("shows last watering chip when lastWatering is provided", () => {
    const lastWatering: LogEntry = {
      id: "log-1",
      type: "watering",
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    render(<MobilePlantPage {...baseProps} lastWatering={lastWatering} />);
    expect(screen.getByText(/plantPage\.watered/i)).toBeInTheDocument();
  });

  it("switching to Diario tab shows log entries", () => {
    const logs: LogEntry[] = [
      {
        id: "log-1",
        type: "watering",
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        notes: "500ml agua",
      },
    ];
    render(<MobilePlantPage {...baseProps} recentLogs={logs} />);

    fireEvent.click(
      screen.getByRole("button", { name: /plantPage\.tabDiario/i })
    );

    expect(screen.getByText("500ml agua")).toBeInTheDocument();
  });

  it("switching to Diario tab shows empty state when no logs", () => {
    render(<MobilePlantPage {...baseProps} recentLogs={[]} />);

    fireEvent.click(
      screen.getByRole("button", { name: /plantPage\.tabDiario/i })
    );

    expect(screen.getByText(/noLogs/i)).toBeInTheDocument();
  });

  it("switching to Info tab shows plant name", () => {
    render(<MobilePlantPage {...baseProps} />);

    fireEvent.click(
      screen.getByRole("button", { name: /plantPage\.tabInfo/i })
    );

    // Plant name appears in both hero InlineEdit and Info tab InlineEdit
    const instances = screen.getAllByText("OG Kush");
    expect(instances.length).toBeGreaterThanOrEqual(2);
  });

  it("delete button is in Info tab, not Estado tab", () => {
    const onDelete = jest.fn();
    render(<MobilePlantPage {...baseProps} onDelete={onDelete} />);

    // Should NOT be visible on Estado (default tab)
    expect(screen.queryByText(/deletePlant/i)).toBeNull();

    // Should appear after switching to Info
    fireEvent.click(
      screen.getByRole("button", { name: /plantPage\.tabInfo/i })
    );
    expect(screen.getByText(/deletePlant/i)).toBeInTheDocument();
  });

  it("switching to Fotos tab shows add button when onAddPhoto provided", () => {
    const onAddPhoto = jest.fn();
    render(
      <MobilePlantPage {...baseProps} onAddPhoto={onAddPhoto} />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /plantPage\.tabFotos/i })
    );

    // "+" add button
    expect(
      screen.getByRole("button", { name: /photos\.addPhotos/i })
    ).toBeInTheDocument();
  });

  it("shows plant name in hero", () => {
    render(<MobilePlantPage {...baseProps} />);
    expect(screen.getAllByText("OG Kush").length).toBeGreaterThanOrEqual(1);
  });
});
