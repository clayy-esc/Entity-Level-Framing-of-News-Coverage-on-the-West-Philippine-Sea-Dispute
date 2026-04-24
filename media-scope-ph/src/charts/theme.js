import { useEffect, useState } from "react";

// Shared color tokens for charts when the app is in light mode.
const baseLightPalette = {
  title: "#0f172a",
  label: "#334155",
  line: "#cbd5e1",
  split: "#e2e8f0",
  tooltipBg: "rgba(255, 255, 255, 0.96)",
  tooltipBorder: "#cbd5e1",
  legitimate: "#16a34a",
  defensive: "#f59e0b",
  aggressor: "#ef4444",
  neutral: "#64748b",
};

// Shared color tokens for charts when the app is in dark mode.
const baseDarkPalette = {
  title: "#e2e8f0",
  label: "#cbd5e1",
  line: "#475569",
  split: "#334155",
  tooltipBg: "rgba(15, 23, 42, 0.94)",
  tooltipBorder: "#334155",
  legitimate: "#22c55e",
  defensive: "#fbbf24",
  aggressor: "#f87171",
  neutral: "#94a3b8",
};

// Semi-transparent area fills used by line charts in light mode.
const lineAreasLight = {
  legitimateArea: "rgba(22, 163, 74, 0.12)",
  defensiveArea: "rgba(245, 158, 11, 0.10)",
  aggressorArea: "rgba(239, 68, 68, 0.10)",
  neutralArea: "rgba(100, 116, 139, 0.10)",
};

// Semi-transparent area fills used by line charts in dark mode.
const lineAreasDark = {
  legitimateArea: "rgba(34, 197, 94, 0.14)",
  defensiveArea: "rgba(251, 191, 36, 0.14)",
  aggressorArea: "rgba(248, 113, 113, 0.14)",
  neutralArea: "rgba(148, 163, 184, 0.14)",
};

// React hook that tracks whether the root HTML element currently has the "dark" class.
// This keeps charts in sync when theme is toggled at runtime.
export const useChartDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    const root = document.documentElement;
    // Re-check theme whenever root classes change.
    const updateTheme = () => {
      setIsDarkMode(root.classList.contains("dark"));
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    // Listen for root class updates so dark mode toggles are reflected immediately.
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  return isDarkMode;
};

// Returns base chart colors for bar charts based on current theme.
export const getBarChartPalette = (isDarkMode) =>
  isDarkMode ? baseDarkPalette : baseLightPalette;

// Returns line chart colors by combining base tokens with area-fill tokens.
export const getLineChartPalette = (isDarkMode) => {
  const basePalette = isDarkMode ? baseDarkPalette : baseLightPalette;
  const areaPalette = isDarkMode ? lineAreasDark : lineAreasLight;

  return {
    ...basePalette,
    ...areaPalette,
  };
};
