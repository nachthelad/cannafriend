import { render, screen } from "@testing-library/react";
import { PlantCard } from "@/components/plant/plant-card";
import type { Plant } from "@/types";

// next/image and next/link are mocked by next/jest automatically;
// provide simple pass-through stubs here for clarity in assertions.
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const basePlant: Plant = {
  id: "plant-1",
  name: "OG Kush",
  seedType: "autoflowering",
  growType: "indoor",
  lightSchedule: "18/6",
  status: "growing",
  plantingDate: "2024-01-15T00:00:00.000Z",
  userId: "user-1",
  coverPhoto: null,
  photos: [],
};

describe("PlantCard", () => {
  it("renders the plant name", () => {
    render(<PlantCard plant={basePlant} />);
    expect(screen.getByText("OG Kush")).toBeInTheDocument();
  });

  it("shows a leaf placeholder when no photos exist", () => {
    render(<PlantCard plant={basePlant} />);
    // Leaf icon is rendered; no <img> should be present
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("shows the cover photo when coverPhoto is set", () => {
    const plant = { ...basePlant, coverPhoto: "https://example.com/cover.jpg" };
    render(<PlantCard plant={plant} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://example.com/cover.jpg");
    expect(img).toHaveAttribute("alt", expect.stringContaining("OG Kush"));
  });

  it("falls back to first photo when no coverPhoto but photos array has items", () => {
    const plant = {
      ...basePlant,
      coverPhoto: null,
      photos: ["https://example.com/photo1.jpg"],
    };
    render(<PlantCard plant={plant} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://example.com/photo1.jpg");
  });

  it("shows ENDED badge when plant status is ended", () => {
    const plant = { ...basePlant, status: "ended" as const };
    render(<PlantCard plant={plant} />);
    // t("status.ended") returns the key in test environment
    expect(screen.getAllByText("status.ended").length).toBeGreaterThan(0);
  });

  it("does not show ENDED badge when plant is growing", () => {
    render(<PlantCard plant={basePlant} />);
    expect(screen.queryByText("status.ended")).toBeNull();
  });

  it("hides card content and footer in compact mode", () => {
    render(<PlantCard plant={basePlant} compact />);
    // Footer labels should not appear in compact mode
    expect(screen.queryByText("plantCard.lastWatering")).toBeNull();
    expect(screen.queryByText("plantCard.noWateringRecords")).toBeNull();
  });

  it("shows last watering details when lastWatering is provided", () => {
    const lastWatering = { method: "top", amount: 500 } as any;
    render(<PlantCard plant={basePlant} lastWatering={lastWatering} />);
    expect(screen.getByText(/plantCard\.lastWatering/)).toBeInTheDocument();
    expect(screen.getByText(/500ml/)).toBeInTheDocument();
  });

  it("shows noWateringRecords when no lastWatering", () => {
    render(<PlantCard plant={basePlant} />);
    expect(screen.getByText("plantCard.noWateringRecords")).toBeInTheDocument();
  });

  it("shows last feeding details when lastFeeding is provided", () => {
    const lastFeeding = { npk: "4-4-4", amount: 2 } as any;
    render(<PlantCard plant={basePlant} lastFeeding={lastFeeding} />);
    expect(screen.getByText(/plantCard\.lastFeeding/)).toBeInTheDocument();
    expect(screen.getByText(/4-4-4/)).toBeInTheDocument();
  });

  it("shows noFeedingRecords when no lastFeeding", () => {
    render(<PlantCard plant={basePlant} />);
    expect(screen.getByText("plantCard.noFeedingRecords")).toBeInTheDocument();
  });

  it("shows last training details when lastTraining is provided", () => {
    const lastTraining = { method: "lollipopping" } as any;
    render(<PlantCard plant={basePlant} lastTraining={lastTraining} />);
    expect(screen.getByText(/plantCard\.lastTraining/)).toBeInTheDocument();
  });

  it("shows noTrainingRecords when no lastTraining", () => {
    render(<PlantCard plant={basePlant} />);
    expect(screen.getByText("plantCard.noTrainingRecords")).toBeInTheDocument();
  });

  it("wraps the card in a link to the plant page", () => {
    render(<PlantCard plant={basePlant} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/plants/plant-1");
  });
});
