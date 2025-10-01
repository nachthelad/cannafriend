const LIGHT_THEME_VARS: Record<string, string> = {
  "--background": "oklch(1 0 0)",
  "--foreground": "oklch(0.145 0 0)",
  "--card": "oklch(1 0 0)",
  "--card-foreground": "oklch(0.145 0 0)",
  "--popover": "oklch(1 0 0)",
  "--popover-foreground": "oklch(0.145 0 0)",
  "--primary": "oklch(0.205 0 0)",
  "--primary-foreground": "oklch(0.985 0 0)",
  "--secondary": "oklch(0.97 0 0)",
  "--secondary-foreground": "oklch(0.205 0 0)",
  "--muted": "oklch(0.97 0 0)",
  "--muted-foreground": "oklch(0.556 0 0)",
  "--accent": "oklch(0.97 0 0)",
  "--accent-foreground": "oklch(0.205 0 0)",
  "--destructive": "oklch(0.577 0.245 27.325)",
  "--destructive-foreground": "oklch(0.577 0.245 27.325)",
  "--border": "oklch(0.922 0 0)",
  "--input": "oklch(0.922 0 0)",
  "--ring": "oklch(0.708 0 0)",
  "--chart-1": "oklch(0.646 0.222 41.116)",
  "--chart-2": "oklch(0.6 0.118 184.704)",
  "--chart-3": "oklch(0.398 0.07 227.392)",
  "--chart-4": "oklch(0.828 0.189 84.429)",
  "--chart-5": "oklch(0.769 0.188 70.08)",
  "--radius": "0.625rem",
  "--sidebar": "oklch(0.985 0 0)",
  "--sidebar-foreground": "oklch(0.145 0 0)",
  "--sidebar-primary": "oklch(0.205 0 0)",
  "--sidebar-primary-foreground": "oklch(0.985 0 0)",
  "--sidebar-accent": "oklch(0.97 0 0)",
  "--sidebar-accent-foreground": "oklch(0.205 0 0)",
  "--sidebar-border": "oklch(0.922 0 0)",
  "--sidebar-ring": "oklch(0.708 0 0)",
};

const DARK_THEME_VARS: Record<string, string> = {
  "--background": "oklch(0.145 0 0)",
  "--foreground": "oklch(0.985 0 0)",
  "--card": "oklch(0.145 0 0)",
  "--card-foreground": "oklch(0.985 0 0)",
  "--popover": "oklch(0.145 0 0)",
  "--popover-foreground": "oklch(0.985 0 0)",
  "--primary": "oklch(0.985 0 0)",
  "--primary-foreground": "oklch(0.205 0 0)",
  "--secondary": "oklch(0.269 0 0)",
  "--secondary-foreground": "oklch(0.985 0 0)",
  "--muted": "oklch(0.269 0 0)",
  "--muted-foreground": "oklch(0.708 0 0)",
  "--accent": "oklch(0.269 0 0)",
  "--accent-foreground": "oklch(0.985 0 0)",
  "--destructive": "oklch(0.396 0.141 25.723)",
  "--destructive-foreground": "oklch(0.637 0.237 25.331)",
  "--border": "oklch(0.269 0 0)",
  "--input": "oklch(0.269 0 0)",
  "--ring": "oklch(0.439 0 0)",
  "--chart-1": "oklch(0.488 0.243 264.376)",
  "--chart-2": "oklch(0.696 0.17 162.48)",
  "--chart-3": "oklch(0.769 0.188 70.08)",
  "--chart-4": "oklch(0.627 0.265 303.9)",
  "--chart-5": "oklch(0.645 0.246 16.439)",
  "--radius": "0.625rem",
  "--sidebar": "oklch(0.205 0 0)",
  "--sidebar-foreground": "oklch(0.985 0 0)",
  "--sidebar-primary": "oklch(0.488 0.243 264.376)",
  "--sidebar-primary-foreground": "oklch(0.985 0 0)",
  "--sidebar-accent": "oklch(0.269 0 0)",
  "--sidebar-accent-foreground": "oklch(0.985 0 0)",
  "--sidebar-border": "oklch(0.269 0 0)",
  "--sidebar-ring": "oklch(0.439 0 0)",
};

function setThemeVariables(target: HTMLElement, variables: Record<string, string>) {
  Object.entries(variables).forEach(([key, value]) => {
    target.style.setProperty(key, value);
  });
}

export function applyTheme(isDark: boolean) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  const body = document.body;
  const themeVars = isDark ? DARK_THEME_VARS : LIGHT_THEME_VARS;

  root.classList.remove("light", "dark");
  root.classList.add(isDark ? "dark" : "light");
  root.setAttribute("data-theme", isDark ? "dark" : "light");
  root.style.colorScheme = isDark ? "dark" : "light";
  setThemeVariables(root, themeVars);

  if (body) {
    body.classList.remove("light", "dark");
    body.classList.add(isDark ? "dark" : "light");
    body.setAttribute("data-theme", isDark ? "dark" : "light");
    body.style.colorScheme = isDark ? "dark" : "light";
    setThemeVariables(body, themeVars);
  }

  // Update PWA theme color for mobile browser chrome
  updateThemeColor(isDark);
}

function updateThemeColor(isDark: boolean) {
  if (typeof document === "undefined") {
    return;
  }

  // Theme color for PWA and mobile browser chrome
  const themeColor = isDark ? "#171717" : "#10b981"; // Dark background or primary green

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
  let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (appleMeta) {
    appleMeta.setAttribute("content", isDark ? "black-translucent" : "default");
  }
}
