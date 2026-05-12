import {
  getImageAcceptAttribute,
  validateImageFile,
} from "@/lib/image-config";

describe("image-config", () => {
  it("accepts HEIC uploads from mobile devices when size is valid", () => {
    const file = new File(["image"], "plant.heic", { type: "image/heic" });

    expect(validateImageFile(file, 4)).toBeNull();
  });

  it("accept attribute includes HEIC and HEIF for mobile pickers", () => {
    const accept = getImageAcceptAttribute();

    expect(accept).toContain("image/heic");
    expect(accept).toContain("image/heif");
    expect(accept).toContain(".heic");
    expect(accept).toContain(".heif");
  });
});
