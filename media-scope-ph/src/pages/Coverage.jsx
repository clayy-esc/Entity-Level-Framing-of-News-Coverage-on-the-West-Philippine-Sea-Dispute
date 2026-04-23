import { useMemo, useState } from "react";
import Bar from "../charts/Bar.jsx";
import Line from "../charts/Line.jsx";
import elfNewsDataset from "../data/elf_news_dataset.json";

// Canonical outlet order used for grouped bar display.
const SOURCE_ORDER = ["APNEWS", "GMA", "INQ", "SCMP"];
// Mapping from source code prefixes in dataset IDs to display labels.
const SOURCE_LABELS = {
  APNEWS: "AP News",
  GMA: "GMA News",
  INQ: "Philippine Daily Inquirer",
  SCMP: "South China Morning Post",
};
// Allowed framing labels used in filters and chart counters.
const FRAMING_KEYS = ["Legitimate", "Defensive", "Aggressor", "Neutral"];

// Provides a fresh 0-initialized counter object for framing buckets.
const emptyFramingCounter = () => ({
  Legitimate: 0,
  Defensive: 0,
  Aggressor: 0,
  Neutral: 0,
});

// Normalizes source-level aggregates into the Bar component row shape.
const toChartRow = (label, counter) => ({
  label,
  legitimate: counter.Legitimate,
  defensive: counter.Defensive,
  aggressor: counter.Aggressor,
  neutral: counter.Neutral,
});

// Normalizes monthly aggregates into the Line component row shape.
const toTimelineRow = (date, counter) => ({
  date,
  legitimate: counter.Legitimate,
  defensive: counter.Defensive,
  aggressor: counter.Aggressor,
  neutral: counter.Neutral,
});

// Extracts outlet/source prefix from IDs so rows can be grouped by publisher.
const getSourcePrefix = (item) => {
  const entityPrefix =
    typeof item.entity_id === "string" ? item.entity_id.split("-")[0] : "";
  const articlePrefix =
    typeof item.article_id === "string" ? item.article_id.split("-")[0] : "";

  return (entityPrefix || articlePrefix).toUpperCase();
};

// Converts date strings into a stable YYYY-MM-DD UTC key, or null if invalid.
const formatDateKey = (dateValue) => {
  const parsed = new Date(`${dateValue}T00:00:00Z`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
};

// Derives YYYY-MM for monthly rollups.
const toMonthKey = (dateKey) => dateKey.slice(0, 7);

// Computes the next month key used to fill timeline gaps.
const getNextMonthKey = (monthKey) => {
  const [year, month] = monthKey.split("-").map(Number);
  const nextDate = new Date(Date.UTC(year, month, 1));
  return `${nextDate.getUTCFullYear()}-${String(nextDate.getUTCMonth() + 1).padStart(2, "0")}`;
};

// Resolves a dataset row to its human-readable outlet name.
const getSourceLabel = (item) => {
  const sourcePrefix = getSourcePrefix(item);
  return SOURCE_LABELS[sourcePrefix] || "Other";
};

// Scans dataset once to determine min and max valid dates for date filter bounds.
const getDatasetDateBounds = () => {
  let minDate = null;
  let maxDate = null;

  for (const row of elfNewsDataset) {
    const dateKey = formatDateKey(row.date);
    if (!dateKey) {
      continue;
    }

    if (!minDate || dateKey < minDate) {
      minDate = dateKey;
    }

    if (!maxDate || dateKey > maxDate) {
      maxDate = dateKey;
    }
  }

  return {
    minDate,
    maxDate,
  };
};

// Builds a de-duplicated, case-insensitive entity list for autocomplete options.
const getDatasetEntityOptions = () => {
  const normalizedEntityMap = new Map();

  for (const row of elfNewsDataset) {
    if (typeof row.entity_text !== "string") {
      continue;
    }

    const trimmedEntity = row.entity_text.trim();
    if (!trimmedEntity) {
      continue;
    }

    const normalizedKey = trimmedEntity.toLowerCase();
    if (!normalizedEntityMap.has(normalizedKey)) {
      normalizedEntityMap.set(normalizedKey, trimmedEntity);
    }
  }

  return Array.from(normalizedEntityMap.values()).sort((a, b) =>
    a.localeCompare(b),
  );
};

const Coverage = () => {
  // Cache global date bounds so they are not recomputed on every render.
  const { minDate: datasetMinDate, maxDate: datasetMaxDate } = useMemo(
    () => getDatasetDateBounds(),
    [],
  );

  // Filter state used to slice dataset before aggregation.
  const [selectedEntity, setSelectedEntity] = useState("All");
  const [selectedEntityLabel, setSelectedEntityLabel] = useState("All");
  const [selectedOutlet, setSelectedOutlet] = useState("All");
  const [startDate, setStartDate] = useState(datasetMinDate || "");
  const [endDate, setEndDate] = useState(datasetMaxDate || "");

  // Cache static option lists for filter controls.
  const { entities, outlets } = useMemo(() => {
    const outletSet = new Set();

    for (const row of elfNewsDataset) {
      outletSet.add(getSourceLabel(row));
    }

    return {
      entities: getDatasetEntityOptions(),
      outlets: Array.from(outletSet).sort((a, b) => a.localeCompare(b)),
    };
  }, []);

  // Applies active filters, then builds grouped bar data and monthly timeline data.
  const { barData, lineData } = useMemo(() => {
    const bySource = SOURCE_ORDER.reduce((accumulator, sourceCode) => {
      accumulator[sourceCode] = emptyFramingCounter();
      return accumulator;
    }, {});

    const byMonth = {};
    let minIncludedDate = null;
    let maxIncludedDate = null;

    // Fall back to full dataset range when a boundary is not explicitly selected.
    const effectiveStartDate = startDate || datasetMinDate;
    const effectiveEndDate = endDate || datasetMaxDate;

    for (const row of elfNewsDataset) {
      const framingLabel = row.framing_label;
      if (!FRAMING_KEYS.includes(framingLabel)) {
        continue;
      }

      const normalizedEntityQuery =
        selectedEntity === "All" ? "" : selectedEntity.trim().toLowerCase();
      const normalizedEntityText =
        typeof row.entity_text === "string"
          ? row.entity_text.trim().toLowerCase()
          : "";

      // Entity filter supports partial, case-insensitive matching.
      if (
        normalizedEntityQuery &&
        !normalizedEntityText.includes(normalizedEntityQuery)
      ) {
        continue;
      }

      if (
        selectedEntityLabel !== "All" &&
        framingLabel !== selectedEntityLabel
      ) {
        continue;
      }

      const outletLabel = getSourceLabel(row);
      if (selectedOutlet !== "All" && outletLabel !== selectedOutlet) {
        continue;
      }

      const dateKey = formatDateKey(row.date);
      if (!dateKey) {
        continue;
      }

      if (effectiveStartDate && dateKey < effectiveStartDate) {
        continue;
      }

      if (effectiveEndDate && dateKey > effectiveEndDate) {
        continue;
      }

      const sourcePrefix = getSourcePrefix(row);
      if (sourcePrefix in bySource) {
        bySource[sourcePrefix][framingLabel] += 1;
      }

      const monthKey = toMonthKey(dateKey);

      if (!byMonth[monthKey]) {
        byMonth[monthKey] = emptyFramingCounter();
      }

      byMonth[monthKey][framingLabel] += 1;

      if (!minIncludedDate || dateKey < minIncludedDate) {
        minIncludedDate = dateKey;
      }

      if (!maxIncludedDate || dateKey > maxIncludedDate) {
        maxIncludedDate = dateKey;
      }
    }

    const groupedBarData = SOURCE_ORDER.map((sourceCode) =>
      toChartRow(SOURCE_LABELS[sourceCode], bySource[sourceCode]),
    );

    // Return early when no records match filters.
    if (!minIncludedDate || !maxIncludedDate) {
      return {
        barData: groupedBarData,
        lineData: [],
      };
    }

    // Build continuous monthly points so the line chart has no missing months.
    const timelineData = [];
    let cursorMonth = toMonthKey(minIncludedDate);
    const endMonth = toMonthKey(maxIncludedDate);

    while (cursorMonth <= endMonth) {
      timelineData.push(
        toTimelineRow(
          cursorMonth,
          byMonth[cursorMonth] || emptyFramingCounter(),
        ),
      );
      cursorMonth = getNextMonthKey(cursorMonth);
    }

    return {
      barData: groupedBarData,
      lineData: timelineData,
    };
  }, [
    datasetMinDate,
    datasetMaxDate,
    endDate,
    selectedEntity,
    selectedEntityLabel,
    selectedOutlet,
    startDate,
  ]);

  return (
    <main className="flex-1">
      <div className="flex flex-col items-center justify-center">
        <div className="w-5/6 md:w-4/5">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Cross-Media Sentiment Dashboard
          </h1>
          <p>
            Explore sentiment distribution and trends across Philippine news
            outlets
          </p>
        </div>
        {/* Filter panel and chart panel layout. */}
        <section className="mt-6 grid w-5/6 grid-cols-[1fr_3fr] gap-4 md:w-4/5">
          <div className="space-y-5 rounded-xl bg-white p-6 shadow-md dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Filter Data
            </h2>

            {/* Entity text input with datalist suggestions. */}
            <div className="space-y-1">
              <label className="block text-sm font-medium">Entity</label>
              <input
                type="text"
                list="entity-options"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                placeholder="Search entity (empty for all)"
                value={selectedEntity === "All" ? "" : selectedEntity}
                onChange={(event) => {
                  const typedValue = event.target.value;
                  setSelectedEntity(typedValue === "" ? "All" : typedValue);
                }}
              />
              <datalist id="entity-options">
                {entities.map((entity) => (
                  <option key={entity} value={entity}>
                    {entity}
                  </option>
                ))}
              </datalist>
            </div>

            {/* Restricts results to one framing label category. */}
            <div className="space-y-1">
              <label className="block text-sm font-medium">Entity Label</label>
              <select
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={selectedEntityLabel}
                onChange={(event) => setSelectedEntityLabel(event.target.value)}
              >
                <option value="All">All Labels</option>
                {FRAMING_KEYS.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Restricts results to one news outlet. */}
            <div className="space-y-1">
              <label className="block text-sm font-medium">News Outlet</label>
              <select
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                value={selectedOutlet}
                onChange={(event) => setSelectedOutlet(event.target.value)}
              >
                <option value="All">All Outlets</option>
                {outlets.map((outlet) => (
                  <option key={outlet} value={outlet}>
                    {outlet}
                  </option>
                ))}
              </select>
            </div>

            {/* Date boundaries limit included rows before aggregation. */}
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <label className="block text-sm font-medium">Start Date</label>
                <input
                  type="date"
                  className="date-picker-input w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  min={datasetMinDate || undefined}
                  max={endDate || datasetMaxDate || undefined}
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium">End Date</label>
                <input
                  type="date"
                  className="date-picker-input w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  min={startDate || datasetMinDate || undefined}
                  max={datasetMaxDate || undefined}
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </div>
            </div>

            {/* Restores default filters to full-dataset scope. */}
            <button
              type="button"
              className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
              onClick={() => {
                setSelectedEntity("All");
                setSelectedEntityLabel("All");
                setSelectedOutlet("All");
                setStartDate(datasetMinDate || "");
                setEndDate(datasetMaxDate || "");
              }}
            >
              Reset Filters
            </button>
          </div>
          {/* Charts consume memoized aggregates from filtered dataset rows. */}
          <div className="space-y-4">
            <div className="rounded-xl bg-white p-4 text-justify shadow-md dark:bg-slate-900">
              <Bar data={barData} />
            </div>
            <div className="rounded-xl bg-white p-4 text-justify shadow-md dark:bg-slate-900">
              <Line data={lineData} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Coverage;
