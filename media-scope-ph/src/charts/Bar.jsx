import { memo, useMemo } from "react";
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
import { getBarChartPalette, useChartDarkMode } from "../js/chartTheme";

echarts.use([
  BarChart,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  CanvasRenderer,
]);

const Bar = ({ data }) => {
  const isDarkMode = useChartDarkMode();

  const option = useMemo(() => {
    const categories = data.map((item) => item.label);
    const legitimate = data.map((item) => item.legitimate);
    const defensive = data.map((item) => item.defensive);
    const aggressor = data.map((item) => item.aggressor);
    const neutral = data.map((item) => item.neutral);

    const palette = getBarChartPalette(isDarkMode);

    return {
      animationDuration: 350,
      animationDurationUpdate: 250,
      title: {
        text: "Entity Framing Distribution per Outlet",
        left: 0,
        top: 0,
        textStyle: {
          fontSize: 20,
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
        left: "center",
        bottom: 0,
        textStyle: { color: palette.label },
      },
      grid: {
        left: 24,
        right: 24,
        bottom: 58,
        top: 68,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: categories,
        axisTick: { alignWithLabel: true },
        axisLabel: {
          color: palette.label,
          interval: 0,
          hideOverlap: false,
        },
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
          name: "Legitimate",
          type: "bar",
          data: legitimate,
          barMaxWidth: 36,
          itemStyle: { color: palette.legitimate },
          emphasis: { focus: "series" },
        },
        {
          name: "Defensive",
          type: "bar",
          data: defensive,
          barMaxWidth: 36,
          itemStyle: { color: palette.defensive },
          emphasis: { focus: "series" },
        },
        {
          name: "Aggressor",
          type: "bar",
          data: aggressor,
          barMaxWidth: 36,
          itemStyle: { color: palette.aggressor },
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
