import { useEffect, useState } from "react";
import { SITE_THEME_KEY } from "./storage-keys";

export type SiteTheme = "sandustry" | "unified" | "terrain-light" | "sandrun" | "elements";

export interface ThemeOption {
  id: SiteTheme;
  name: string;
  mode: "dark" | "light";
  icon: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { id: "sandustry", name: "Sandustry (Classic)", mode: "dark", icon: "⚙️" },
  { id: "unified", name: "Unified (Dark)", mode: "dark", icon: "🌙" },
  { id: "terrain-light", name: "Terrain (Light)", mode: "light", icon: "☀️" },
  { id: "sandrun", name: "Sandrun (Outrun)", mode: "dark", icon: "🌆" },
  { id: "elements", name: "Elements (Molten)", mode: "dark", icon: "🔥" },
];

const THEME_CLASSES: Record<SiteTheme, string> = {
  sandustry: "theme-sandustry",
  unified: "theme-unified",
  "terrain-light": "theme-terrain-light",
  sandrun: "theme-sandrun",
  elements: "theme-elements",
};

export function getSavedTheme(): SiteTheme {
  if (typeof window === "undefined") return "sandustry";
  try {
    const saved = window.localStorage.getItem(SITE_THEME_KEY);
    if (saved && saved in THEME_CLASSES) {
      return saved as SiteTheme;
    }
  } catch {
    // Ignore storage read errors
  }
  return "sandustry";
}

export function applyTheme(theme: SiteTheme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // Clear all existing theme classes
  for (const cls of Object.values(THEME_CLASSES)) {
    root.classList.remove(cls);
  }
  root.classList.remove("theme-light");

  // Apply new theme class and attributes
  root.classList.add(THEME_CLASSES[theme]);
  root.setAttribute("data-theme", theme);
  const isLight = theme === "terrain-light";
  if (isLight) {
    root.classList.add("theme-light");
    root.style.colorScheme = "light";
  } else {
    root.style.colorScheme = "dark";
  }

  try {
    window.localStorage.setItem(SITE_THEME_KEY, theme);
  } catch {
    // Ignore storage write errors
  }

  window.dispatchEvent(new CustomEvent("sandustry-theme-change", { detail: theme }));
}

export function useTheme(): [SiteTheme, (theme: SiteTheme) => void, () => void] {
  const [theme, setThemeState] = useState<SiteTheme>(() => {
    const initial = getSavedTheme();
    applyTheme(initial);
    return initial;
  });

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<SiteTheme>;
      if (customEvent.detail && customEvent.detail in THEME_CLASSES) {
        setThemeState(customEvent.detail);
      }
    };
    window.addEventListener("sandustry-theme-change", handler);
    return () => window.removeEventListener("sandustry-theme-change", handler);
  }, []);

  const setTheme = (next: SiteTheme) => {
    setThemeState(next);
    applyTheme(next);
  };

  const toggleMode = () => {
    const next: SiteTheme = theme === "terrain-light" ? "sandustry" : "terrain-light";
    setTheme(next);
  };

  return [theme, setTheme, toggleMode];
}
