import { memo, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts/core";
import { HeatmapChart } from "echarts/charts";
import {
  GridComponent,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { getBarChartPalette, useChartDarkMode } from "./theme";

echarts.use([
  HeatmapChart,
  GridComponent,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
  CanvasRenderer,
]);

const LABEL_WEIGHTS = {
  Aggressor: -1,
  Defensive: 0.25,
  Neutral: 0,
  Legitimate: 1,
};

const clamp = (value, minValue, maxValue) =>
  Math.min(maxValue, Math.max(minValue, value));

const hexToRgb = (hex) => {
  if (typeof hex !== "string") {
    return [0, 0, 0];
  }

  const trimmed = hex.replace("#", "").trim();
  if (trimmed.length !== 6) {
    return [0, 0, 0];
  }

  const parsed = Number.parseInt(trimmed, 16);
  if (Number.isNaN(parsed)) {
    return [0, 0, 0];
  }

  return [(parsed >> 16) & 255, (parsed >> 8) & 255, parsed & 255];
};

const interpolateColor = (color1, color2, factor) => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  const result = rgb1.map((c, i) => Math.round(c + factor * (rgb2[i] - c)));
  return `rgb(${result[0]}, ${result[1]}, ${result[2]})`;
};

const getScoreColor = (score, palette) => {
  if (score < 0) {
    // -1 to 0 -> Aggressor to Neutral
    const factor = score + 1; // 0 to 1
    return interpolateColor(palette.aggressor, palette.neutral, factor);
  } else if (score < 0.25) {
    // 0 to 0.25 -> Neutral to Defensive
    const factor = score / 0.25; // 0 to 1
    return interpolateColor(palette.neutral, palette.defensive, factor);
  } else {
    // 0.25 to 1 -> Defensive to Legitimate
    const factor = (score - 0.25) / 0.75; // 0 to 1
    return interpolateColor(palette.defensive, palette.legitimate, factor);
  }
};

const Heatmap = ({ data }) => {
  const isDarkMode = useChartDarkMode();

  const { option, gradientString, colorByLabel, height } = useMemo(() => {
    const palette = getBarChartPalette(isDarkMode);
    const rows = data?.rows ?? [];
    const columns = data?.columns ?? [];
    const cells = data?.cells ?? [];
    const rowIndex = new Map(rows.map((row, index) => [row, index]));
    const columnIndex = new Map(
      columns.map((column, index) => [column, index]),
    );
    const colorByLabel = {
      Aggressor: palette.aggressor,
      Defensive: palette.defensive,
      Neutral: palette.neutral,
      Legitimate: palette.legitimate,
    };

    const seriesData = cells.map((cell) => {
      const counts = cell.counts || {};
      const aggressor = counts.Aggressor || 0;
      const defensive = counts.Defensive || 0;
      const neutral = counts.Neutral || 0;
      const legitimate = counts.Legitimate || 0;
      const total = aggressor + defensive + neutral + legitimate;
      const weightedSum =
        aggressor * LABEL_WEIGHTS.Aggressor +
        defensive * LABEL_WEIGHTS.Defensive +
        neutral * LABEL_WEIGHTS.Neutral +
        legitimate * LABEL_WEIGHTS.Legitimate;
      const score = total === 0 ? 0 : weightedSum / total;

      const cellColor =
        total === 0 ? "rgba(0,0,0,0.05)" : getScoreColor(score, palette);

      return {
        value: [
          columnIndex.get(cell.column) ?? 0,
          rowIndex.get(cell.row) ?? 0,
          score,
        ],
        itemStyle: {
          color: cellColor,
          borderColor: palette.split,
          borderWidth: 1,
        },
        emphasis: {
          itemStyle: {
            borderColor: palette.title,
            borderWidth: 1,
          },
        },
        detail: {
          rowLabel: cell.row,
          columnLabel: cell.column,
          counts: {
            Aggressor: aggressor,
            Defensive: defensive,
            Neutral: neutral,
            Legitimate: legitimate,
          },
          total,
          weightedSum,
          score,
        },
      };
    });

    const chartHeight = Math.max(340, 140 + rows.length * 56);
    const gradientString = `linear-gradient(to right, ${colorByLabel.Aggressor} 0%, ${colorByLabel.Neutral} 50%, ${colorByLabel.Defensive} 62.5%, ${colorByLabel.Legitimate} 100%)`;

    return {
      option: {
        animationDuration: 400,
        animationDurationUpdate: 280,
        title: {
          text: "Generalized Entity Framing Score",
          left: "center",
          top: 0,
          textStyle: {
            fontSize: 20,
            fontWeight: 600,
            color: palette.title,
          },
        },
        tooltip: {
          trigger: "item",
          backgroundColor: palette.tooltipBg,
          borderColor: palette.tooltipBorder,
          textStyle: { color: palette.label },
          confine: true,
          formatter: (params) => {
            const detail = params?.data?.detail;
            if (!detail) {
              return "";
            }

            const scoreLabel = Number.isFinite(detail.score)
              ? detail.score.toFixed(3)
              : "0.000";
            const weightedLabel = Number.isFinite(detail.weightedSum)
              ? detail.weightedSum.toFixed(2)
              : "0.00";
            const emptyLabel = detail.total === 0 ? " (no matches)" : "";

            return [
              `<strong>${detail.rowLabel}</strong> x <strong>${detail.columnLabel}</strong>`,
              `Score: <strong>${scoreLabel}</strong>`,
              `Weighted sum: ${weightedLabel}`,
              `n = ${detail.total}${emptyLabel}`,
              `Aggressor: ${detail.counts.Aggressor}`,
              `Defensive: ${detail.counts.Defensive}`,
              `Neutral: ${detail.counts.Neutral}`,
              `Legitimate: ${detail.counts.Legitimate}`,
            ].join("<br/>");
          },
        },
        visualMap: {
          show: false,
          min: -1,
          max: 1,
          calculable: true,
          inRange: {
            color: ["#fff"],
          },
        },
        grid: {
          left: 140,
          right: 32,
          top: 80,
          bottom: 24,
          containLabel: false,
        },
        xAxis: {
          type: "category",
          position: "top",
          data: columns,
          axisLabel: {
            color: palette.label,
            interval: 0,
            rotate: 0,
            width: 110,
            overflow: "break",
          },
          axisTick: { show: false },
          axisLine: { show: false },
          splitLine: { show: true, lineStyle: { color: palette.split } },
        },
        yAxis: {
          type: "category",
          data: rows,
          inverse: true,
          axisLabel: {
            color: palette.label,
            width: 120,
            overflow: "truncate",
          },
          axisTick: { show: false },
          axisLine: { show: false },
          splitLine: { show: true, lineStyle: { color: palette.split } },
        },
        series: [
          {
            name: "Framing Score",
            type: "heatmap",
            data: seriesData,
            label: {
              show: true,
              formatter: (params) => {
                const scoreValue = params?.data?.detail?.score;
                if (!Number.isFinite(scoreValue)) {
                  return "-";
                }

                return scoreValue.toFixed(2);
              },
              color: palette.title,
              fontWeight: 600,
              fontSize: 11,
            },
            emphasis: {
              label: {
                show: true,
                formatter: (params) =>
                  Number.isFinite(params?.data?.detail?.score)
                    ? params.data.detail.score.toFixed(2)
                    : "0.00",
                color: palette.title,
                fontWeight: 600,
              },
            },
          },
        ],
      },
      gradientString,
      colorByLabel,
      height: chartHeight,
    };
  }, [data, isDarkMode]);

  if (!data) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <div className="w-full">
        <ReactECharts
          echarts={echarts}
          option={option}
          style={{ height, width: "100%" }}
          opts={{ renderer: "canvas" }}
          notMerge
          lazyUpdate
        />
      </div>
      <div
        className="w-full space-y-2 pt-2"
        style={{ paddingLeft: 140, paddingRight: 32 }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500">-1</span>
          <div
            className="h-3 flex-1 rounded-full"
            style={{ background: gradientString }}
          />
          <span className="text-xs font-medium text-slate-500">+1</span>
        </div>
        <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: colorByLabel.Aggressor }}
            />
            Aggressor (-1)
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: colorByLabel.Neutral }}
            />
            Neutral (0)
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: colorByLabel.Defensive }}
            />
            Defensive (0.25)
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: colorByLabel.Legitimate }}
            />
            Legitimate (1)
          </span>
        </div>
      </div>
    </div>
  );
};

export default memo(Heatmap);
