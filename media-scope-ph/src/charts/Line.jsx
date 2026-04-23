import { memo, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { getLineChartPalette, useChartDarkMode } from "../js/chartTheme";

echarts.use([
  LineChart,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  CanvasRenderer,
]);

const defaultDataset = [
  { date: "2026-04-01", positive: 28, neutral: 14, negative: 10 },
  { date: "2026-04-02", positive: 34, neutral: 13, negative: 9 },
  { date: "2026-04-03", positive: 31, neutral: 16, negative: 12 },
  { date: "2026-04-04", positive: 39, neutral: 18, negative: 11 },
  { date: "2026-04-05", positive: 43, neutral: 17, negative: 8 },
  { date: "2026-04-06", positive: 41, neutral: 19, negative: 7 },
  { date: "2026-04-07", positive: 45, neutral: 15, negative: 9 },
];

const Line = ({ data = defaultDataset }) => {
  const isDarkMode = useChartDarkMode();

  const option = useMemo(() => {
    const labels = data.map((item) => item.date);
    const positive = data.map((item) => item.positive);
    const neutral = data.map((item) => item.neutral);
    const negative = data.map((item) => item.negative);

    const palette = getLineChartPalette(isDarkMode);

    return {
      // ECharts option object controls rendering, interaction, and visual style.
      animationDuration: 350,
      animationDurationUpdate: 250,
      title: {
        text: "Daily Sentiment Trend",
        left: "center",
        textStyle: {
          fontSize: 14,
          fontWeight: 600,
          color: palette.title,
        },
      },
      tooltip: {
        trigger: "axis",
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
        boundaryGap: false,
        data: labels,
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
          type: "line",
          data: positive,
          smooth: true,
          sampling: "lttb",
          showSymbol: false,
          lineStyle: { width: 2, color: palette.positive },
          areaStyle: { color: palette.positiveArea },
        },
        {
          name: "Neutral",
          type: "line",
          data: neutral,
          smooth: true,
          sampling: "lttb",
          showSymbol: false,
          lineStyle: { width: 2, color: palette.neutral },
          areaStyle: { color: palette.neutralArea },
        },
        {
          name: "Negative",
          type: "line",
          data: negative,
          smooth: true,
          sampling: "lttb",
          showSymbol: false,
          lineStyle: { width: 2, color: palette.negative },
          areaStyle: { color: palette.negativeArea },
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

export default memo(Line);
