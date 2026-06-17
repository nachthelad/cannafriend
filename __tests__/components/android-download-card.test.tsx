import { render, screen } from "@testing-library/react";

import { AndroidDownloadCard } from "@/features/marketing/components/android-download-card";

describe("AndroidDownloadCard", () => {
  it("shows the coming soon state when no APK URL is configured", () => {
    render(<AndroidDownloadCard />);

    expect(screen.getByText("android.comingSoonTitle")).toBeInTheDocument();
    expect(screen.queryByText("android.downloadApk")).not.toBeInTheDocument();
    expect(screen.getByText("android.openGuide")).toBeInTheDocument();
  });
});
