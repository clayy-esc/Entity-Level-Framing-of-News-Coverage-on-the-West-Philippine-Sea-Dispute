import { memo, useEffect, useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts/core";
import { BarChart } from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  BarChart,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  CanvasRenderer,
]);

const defaultDataset = [
  { label: "Facebook", positive: 320, neutral: 190, negative: 70 },
  { label: "X", positive: 260, neutral: 170, negative: 120 },
  { label: "TikTok", positive: 390, neutral: 200, negative: 85 },
  { label: "YouTube", positive: 450, neutral: 230, negative: 60 },
  { label: "Instagram", positive: 410, neutral: 210, negative: 75 },
];

const Bar = ({ data = defaultDataset }) => {
  // Mirror app theme by watching the root dark class toggle.
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

  const option = useMemo(() => {
    const categories = data.map((item) => item.label);
    const positive = data.map((item) => item.positive);
    const neutral = data.map((item) => item.neutral);
    const negative = data.map((item) => item.negative);

    // Keep chart tokens centralized so all ECharts parts switch theme together.
    const palette = isDarkMode
      ? {
          title: "#e2e8f0",
          label: "#cbd5e1",
          line: "#475569",
          split: "#334155",
          tooltipBg: "rgba(15, 23, 42, 0.94)",
          tooltipBorder: "#334155",
          positive: "#22c55e",
          neutral: "#94a3b8",
          negative: "#f87171",
        }
      : {
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

    return {
      // ECharts option object controls rendering, interaction, and visual style.
      animationDuration: 350,
      animationDurationUpdate: 250,
      title: {
        text: "Sentiment by Platform",
        left: "center",
        textStyle: {
          fontSize: 14,
          fontWeight: 600,
          color: palette.title,
        },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: palette.tooltipBg,
        borderColor: palette.tooltipBorder,
        textStyle: { color: palette.label },
      },
      legend: {
        top: 28,
        textStyle: { color: palette.label },
      },
      grid: {
        left: 24,
        right: 24,
        bottom: 20,
        top: 70,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: categories,
        axisTick: { alignWithLabel: true },
        axisLabel: { color: palette.label },
        axisLine: { lineStyle: { color: palette.line } },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: palette.label },
        axisLine: { lineStyle: { color: palette.line } },
        splitLine: { lineStyle: { color: palette.split } },
      },
      series: [
        {
          name: "Positive",
          type: "bar",
          data: positive,
          barMaxWidth: 36,
          itemStyle: { color: palette.positive },
          emphasis: { focus: "series" },
        },
        {
          name: "Neutral",
          type: "bar",
          data: neutral,
          barMaxWidth: 36,
          itemStyle: { color: palette.neutral },
          emphasis: { focus: "series" },
        },
        {
          name: "Negative",
          type: "bar",
          data: negative,
          barMaxWidth: 36,
          itemStyle: { color: palette.negative },
          emphasis: { focus: "series" },
        },
      ],
    };
  }, [data, isDarkMode]);

  return (
    <ReactECharts
      echarts={echarts}
      option={option}
      style={{ height: 360, width: "100%" }}
      opts={{ renderer: "canvas" }}
      notMerge
      lazyUpdate
    />
  );
};

export default memo(Bar);
