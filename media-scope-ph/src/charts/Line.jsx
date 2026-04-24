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
import { getLineChartPalette, useChartDarkMode } from "./theme";

echarts.use([
  LineChart,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  CanvasRenderer,
]);

const Line = ({ data }) => {
  const isDarkMode = useChartDarkMode();

  const option = useMemo(() => {
    const labels = data.map((item) => item.date);
    const legitimate = data.map((item) => item.legitimate);
    const defensive = data.map((item) => item.defensive);
    const aggressor = data.map((item) => item.aggressor);
    const neutral = data.map((item) => item.neutral);

    const palette = getLineChartPalette(isDarkMode);

    return {
      animationDuration: 350,
      animationDurationUpdate: 250,
      title: {
        text: "Entity Framing Trend Over Time",
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
        boundaryGap: false,
        data: labels,
        axisLabel: {
          color: palette.label,
          rotate: 45,
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
          type: "line",
          data: legitimate,
          smooth: true,
          sampling: "lttb",
          showSymbol: false,
          lineStyle: { width: 2, color: palette.legitimate },
          itemStyle: { color: palette.legitimate },
          areaStyle: { color: palette.legitimateArea },
        },
        {
          name: "Defensive",
          type: "line",
          data: defensive,
          smooth: true,
          sampling: "lttb",
          showSymbol: false,
          lineStyle: { width: 2, color: palette.defensive },
          itemStyle: { color: palette.defensive },
          areaStyle: { color: palette.defensiveArea },
        },
        {
          name: "Aggressor",
          type: "line",
          data: aggressor,
          smooth: true,
          sampling: "lttb",
          showSymbol: false,
          lineStyle: { width: 2, color: palette.aggressor },
          itemStyle: { color: palette.aggressor },
          areaStyle: { color: palette.aggressorArea },
        },
        {
          name: "Neutral",
          type: "line",
          data: neutral,
          smooth: true,
          sampling: "lttb",
          showSymbol: false,
          lineStyle: { width: 2, color: palette.neutral },
          itemStyle: { color: palette.neutral },
          areaStyle: { color: palette.neutralArea },
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
