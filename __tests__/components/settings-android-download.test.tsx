import { fireEvent, render, screen } from "@testing-library/react";

import { SettingsAndroidDownload } from "@/components/settings/settings-android-download";

jest.mock("@/lib/android-apk", () => ({
  ANDROID_APK_SHA256: "abc123",
  ANDROID_APK_URL: "https://cannafriend.app/cannafriend.apk",
  ANDROID_APK_VERSION: "2.0.0",
  IS_ANDROID_APK_AVAILABLE: true,
  getAndroidGuideUrl: () => "https://cannafriend.app/android#descarga",
}));

describe("SettingsAndroidDownload", () => {
  it("shows the compact download and keeps verification details collapsible", () => {
    render(<SettingsAndroidDownload />);

    expect(
      screen.getByRole("link", { name: "android.downloadApk" }),
    ).toHaveAttribute("href", "https://cannafriend.app/cannafriend.apk");
    expect(
      screen.getByLabelText("android.qrLabel"),
    ).toBeInTheDocument();

    const summary = screen.getByText("android.viewInfo");
    const details = summary.closest("details");
    expect(details).not.toHaveAttribute("open");

    fireEvent.click(summary);
    expect(details).toHaveAttribute("open");
    expect(screen.getByText(/SHA-256: abc123/)).toBeInTheDocument();
    expect(screen.getByText("android.safetyNote")).toBeInTheDocument();
  });
});
