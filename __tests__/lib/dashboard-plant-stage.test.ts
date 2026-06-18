import { getDashboardPlantStage } from "@/lib/dashboard-plant-stage";
import type { Plant } from "@/types";

function createPlant(overrides: Partial<Plant> = {}): Plant {
  return {
    id: "plant-1",
    name: "Lola",
    seedType: "photoperiodic",
    growType: "indoor",
    plantingDate: new Date(Date.now() - 30 * 86_400_000).toISOString(),
    createdAt: new Date().toISOString(),
    status: "growing",
    ...overrides,
  };
}

describe("getDashboardPlantStage", () => {
  it("uses a flowering log as the primary stage signal", () => {
    expect(getDashboardPlantStage(createPlant(), true)).toBe("flowering");
  });

  it("keeps the light schedule fallback for existing plant data", () => {
    expect(
      getDashboardPlantStage(createPlant({ lightSchedule: "12/12" }), false),
    ).toBe("flowering");
  });

  it("falls back to seedling and vegetative stages by age", () => {
    const seedling = createPlant({ plantingDate: new Date().toISOString() });

    expect(getDashboardPlantStage(seedling, false)).toBe("seedling");
    expect(getDashboardPlantStage(createPlant(), false)).toBe("vegetative");
  });
});
