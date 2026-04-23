import { useEffect, useState } from "react";

const baseLightPalette = {
  title: "#0f172a",
  label: "#334155",
  line: "#cbd5e1",
  split: "#e2e8f0",
  tooltipBg: "rgba(255, 255, 255, 0.96)",
  tooltipBorder: "#cbd5e1",
  positive: "#16a34a",
  neutral: "#64748b",
  negative: "#ef4444",
};

const baseDarkPalette = {
  title: "#e2e8f0",
  label: "#cbd5e1",
  line: "#475569",
  split: "#334155",
  tooltipBg: "rgba(15, 23, 42, 0.94)",
  tooltipBorder: "#334155",
  positive: "#22c55e",
  neutral: "#94a3b8",
  negative: "#f87171",
};

const lineAreasLight = {
  positiveArea: "rgba(22, 163, 74, 0.12)",
  neutralArea: "rgba(100, 116, 139, 0.10)",
  negativeArea: "rgba(239, 68, 68, 0.10)",
};

const lineAreasDark = {
  positiveArea: "rgba(34, 197, 94, 0.14)",
  neutralArea: "rgba(148, 163, 184, 0.14)",
  negativeArea: "rgba(248, 113, 113, 0.14)",
};

export const useChartDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    const root = document.documentElement;
    const updateTheme = () => {
      setIsDarkMode(root.classList.contains("dark"));
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  return isDarkMode;
};

export const getBarChartPalette = (isDarkMode) =>
  isDarkMode ? baseDarkPalette : baseLightPalette;

export const getLineChartPalette = (isDarkMode) => {
  const basePalette = isDarkMode ? baseDarkPalette : baseLightPalette;
  const areaPalette = isDarkMode ? lineAreasDark : lineAreasLight;

  return {
    ...basePalette,
    ...areaPalette,
  };
};
