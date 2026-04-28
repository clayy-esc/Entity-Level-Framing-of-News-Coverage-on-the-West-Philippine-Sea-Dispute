import { memo, useMemo } from "react";
import { getBarChartPalette, useChartDarkMode } from "./theme";

const LABEL_WEIGHTS = {
  Aggressor: -1,
  Defensive: 0.25,
  Neutral: 0,
  Legitimate: 1,
};

// 🎨 Gradient color
const getGradientColor = (value) => {
  if (value <= 0) {
    const t = value + 1;
    const r = 239 + (156 - 239) * t;
    const g = 68 + (163 - 68) * t;
    const b = 68 + (175 - 68) * t;
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  } else if (value <= 0.25) {
    const t = value / 0.25;
    const r = 156 + (234 - 156) * t;
    const g = 163 + (179 - 163) * t;
    const b = 175 + (8 - 175) * t;
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  } else {
    const t = (value - 0.25) / 0.75;
    const r = 234 + (22 - 234) * t;
    const g = 179 + (163 - 179) * t;
    const b = 8 + (74 - 8) * t;
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  }
};

const Heatmap = ({ data }) => {
  const isDarkMode = useChartDarkMode();
  const palette = getBarChartPalette(isDarkMode);

  const { matrix } = useMemo(() => {
    if (!data) return { matrix: {} };

    const matrix = {};

    data.rows.forEach((row) => {
      matrix[row] = {};
      data.columns.forEach((col) => {
        matrix[row][col] = {
          score: 0,
          total: 0,
          breakdown: {
            Aggressor: 0,
            Defensive: 0,
            Neutral: 0,
            Legitimate: 0,
          },
        };
      });
    });

    data.cells.forEach((cell) => {
      const counts = cell.counts || {};
      const total =
        (counts.Aggressor || 0) +
        (counts.Defensive || 0) +
        (counts.Neutral || 0) +
        (counts.Legitimate || 0);

      const weighted =
        (counts.Aggressor || 0) * LABEL_WEIGHTS.Aggressor +
        (counts.Defensive || 0) * LABEL_WEIGHTS.Defensive +
        (counts.Neutral || 0) * LABEL_WEIGHTS.Neutral +
        (counts.Legitimate || 0) * LABEL_WEIGHTS.Legitimate;

      const score = total === 0 ? 0 : weighted / total;

      matrix[cell.row][cell.column] = {
        score,
        total,
        breakdown: counts,
      };
    });

    return { matrix };
  }, [data]);

  if (!data) return null;

  // 🖼 logos
  const logos = {
    "AP News": "/logo/ap.png",
    "GMA News": "/logo/gma.png",
    "Philippine Daily Inquirer": "/logo/inquirer.png",
    "South China Morning Post": "/logo/scmp.png",
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md dark:shadow-none border border-slate-200 dark:border-slate-700">

        {/* Title */}
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-1">
          Entity-Level Framing Heatmap
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Weighted average framing score per entity across media sources
        </p>

        {/* Header */}
        <div className="grid grid-cols-5 border-b border-slate-200 dark:border-slate-700 pb-3">
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center">
            Entity
          </div>

          {data.columns.map((col) => (
            <div key={col} className="flex flex-col items-center justify-center">
              <img
                src={logos[col]}
                alt={col}
                onError={(e) => (e.target.style.display = "none")}
                className="h-8 object-contain mb-1"
              />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 text-center leading-tight px-1">
                {col}
              </span>
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="mt-3 space-y-2">
          {data.rows.map((row) => (
            <div
              key={row}
              className="
                grid grid-cols-5 items-center py-3 px-2 rounded-lg
                bg-white dark:bg-slate-800
                border border-slate-200 dark:border-slate-700
                transition-all duration-200
                hover:bg-slate-100 dark:hover:bg-slate-700/50
                hover:ring-1 hover:ring-slate-300 dark:hover:ring-slate-600
              "
            >
              <div className="text-slate-800 dark:text-slate-200 text-sm pl-1">
                {row}
              </div>

              {data.columns.map((col) => {
                const cell = matrix[row]?.[col];
                const value = cell?.score ?? 0;

                const isExtremeNegative = value <= -0.5;
                const isExtremePositive = value >= 0.7;

                const isDark = value <= -0.3 || value >= 0.6;

                return (
                  <div key={col} className="flex justify-center">
                    <div
                      style={{
                        backgroundColor: getGradientColor(value),
                        color: isDark ? "#ffffff" : "#111827",
                        border: isExtremeNegative
                          ? "2px solid #ef4444"
                          : isExtremePositive
                            ? "2px solid #22c55e"
                            : "none",
                      }}
                      className="px-3 py-2 rounded-lg text-xs font-semibold w-24 text-center transition-all duration-200 hover:scale-105"
                      title={`Score: ${value.toFixed(2)}

Aggressor: ${cell.breakdown.Aggressor}
Neutral: ${cell.breakdown.Neutral}
Defensive: ${cell.breakdown.Defensive}
Legitimate: ${cell.breakdown.Legitimate}

Total (n): ${cell.total}`}
                    >
                      {value.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 text-xs text-slate-600 dark:text-slate-300 flex flex-col items-center">
          <div className="mb-2">Framing Scale (Weighted)</div>

          <div className="flex items-center gap-2">
            <span>-1</span>
            <div
              className="h-3 w-72 rounded"
              style={{
                background:
                  "linear-gradient(to right, #ef4444, #ffffff, #facc15, #84cc16, #22c55e)",
              }}
            />
            <span>+1</span>
          </div>

          <div className="flex justify-between w-72 mt-1 text-[10px]">
            <span>Aggressor (-1)</span>
            <span>Neutral (0)</span>
            <span>Defensive (0.25)</span>
            <span>Legitimate (1)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(Heatmap);