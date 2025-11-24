export function applyTheme(isDark: boolean) {
  if (typeof document === "undefined") {
    return;
  }

  // Update PWA theme color for mobile browser chrome
  updateThemeColor(isDark);
}

function updateThemeColor(isDark: boolean) {
  if (typeof document === "undefined") {
    return;
  }

  // Theme color for PWA and mobile browser chrome
  // Dark: Matches --background oklch(0.12 0.01 145) -> #1a1f1a
  // Light: Matches --background oklch(0.99 0 0) -> #fcfcfc
  const themeColor = isDark ? "#1a1f1a" : "#fcfcfc";

  // Update existing theme-color meta tag
  let themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.setAttribute("content", themeColor);
  } else {
    // Create theme-color meta tag if it doesn't exist
    themeColorMeta = document.createElement("meta");
    themeColorMeta.setAttribute("name", "theme-color");
    themeColorMeta.setAttribute("content", themeColor);
    document.head.appendChild(themeColorMeta);
  }

  // Update Apple-specific meta tags
  let appleMeta = document.querySelector(
    'meta[name="apple-mobile-web-app-status-bar-style"]'
  );
  if (appleMeta) {
    appleMeta.setAttribute("content", isDark ? "black-translucent" : "default");
  }
}
