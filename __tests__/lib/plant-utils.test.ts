import { normalizePlant, isPlantGrowing } from "@/lib/plant-utils";
import { PLANT_STATUS } from "@/lib/plant-config";

describe("plant utils", () => {
  it("defaults status to growing when missing", () => {
    const plant = normalizePlant(
      {
        name: "Test Plant",
        createdAt: "2025-01-01T00:00:00.000Z",
      },
      "plant-1"
    );

    expect(plant.status).toBe(PLANT_STATUS.GROWING);
    expect(isPlantGrowing(plant)).toBe(true);
  });

  it("preserves ended status and exposes helper", () => {
    const ended = normalizePlant(
      {
        name: "Ended Plant",
        createdAt: "2025-01-01T00:00:00.000Z",
        status: PLANT_STATUS.ENDED,
        endedAt: "2025-02-01T00:00:00.000Z",
      },
      "plant-2"
    );

    expect(ended.status).toBe(PLANT_STATUS.ENDED);
    expect(ended.endedAt).toBe("2025-02-01T00:00:00.000Z");
    expect(isPlantGrowing(ended)).toBe(false);
  });
});
