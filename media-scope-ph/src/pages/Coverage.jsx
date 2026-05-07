import { useMemo, useState } from "react";

import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import Bar from "../charts/Bar.jsx";
import Heatmap from "../charts/Heatmap.jsx";
import Line from "../charts/Line.jsx";
import Table from "../charts/Table.jsx";
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
const GENERALIZED_ENTITY_BUCKETS = [
  "China",
  "Philippines",
  "United States",
  "International Organizations",
  "Other",
];

// Provides a fresh 0-initialized counter object for framing buckets.
const emptyFramingCounter = () => ({
  Legitimate: 0,
  Defensive: 0,
  Aggressor: 0,
  Neutral: 0,
});

// Provides a nested map for generalized entity x source heatmap aggregation.
const initHeatmapMatrix = () => {
  const matrix = {};

  for (const entity of GENERALIZED_ENTITY_BUCKETS) {
    matrix[entity] = {};
    for (const sourceCode of SOURCE_ORDER) {
      matrix[entity][sourceCode] = emptyFramingCounter();
    }
  }

  return matrix;
};

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

// Maps dataset-provided normalized entities into standardized buckets.
const generalizeEntity = (entityNormalized) => {
  const trimmed =
    typeof entityNormalized === "string" ? entityNormalized.trim() : "";

  if (!trimmed) {
    return "Other";
  }

  const matchedBucket = GENERALIZED_ENTITY_BUCKETS.find(
    (bucket) => bucket.toLowerCase() === trimmed.toLowerCase(),
  );

  return matchedBucket || "Other";
};

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
  const [useGeneralizedEntities, setUseGeneralizedEntities] = useState(false);
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
  const { barData, lineData, heatmapData, tableData } = useMemo(() => {
    const bySource = SOURCE_ORDER.reduce((accumulator, sourceCode) => {
      accumulator[sourceCode] = emptyFramingCounter();
      return accumulator;
    }, {});

    const byMonth = {};
    const heatmapMatrix = initHeatmapMatrix();
    const tableRows = [];
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

      const normalizedEntityText =
        typeof row.entity_text === "string"
          ? row.entity_text.trim().toLowerCase()
          : "";

      let generalizedEntity = null;

      if (useGeneralizedEntities) {
        generalizedEntity = generalizeEntity(row.entity_normalized);
        if (selectedEntity !== "All" && generalizedEntity !== selectedEntity) {
          continue;
        }
      } else {
        const normalizedEntityQuery =
          selectedEntity === "All" ? "" : selectedEntity.trim().toLowerCase();

        // Entity filter supports partial, case-insensitive matching.
        if (
          normalizedEntityQuery &&
          !normalizedEntityText.includes(normalizedEntityQuery)
        ) {
          continue;
        }
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

      if (
        useGeneralizedEntities &&
        generalizedEntity &&
        heatmapMatrix[generalizedEntity]?.[sourcePrefix]
      ) {
        heatmapMatrix[generalizedEntity][sourcePrefix][framingLabel] += 1;
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

      tableRows.push(row);
    }

    const groupedBarData = SOURCE_ORDER.map((sourceCode) =>
      toChartRow(SOURCE_LABELS[sourceCode], bySource[sourceCode]),
    );

    // Return early when no records match filters.
    const heatmapRows = useGeneralizedEntities
      ? selectedEntity === "All"
        ? GENERALIZED_ENTITY_BUCKETS
        : [selectedEntity]
      : [];
    const heatmapColumns = SOURCE_ORDER.map(
      (sourceCode) => SOURCE_LABELS[sourceCode],
    );
    const heatmapCells = heatmapRows.flatMap((entity) =>
      SOURCE_ORDER.map((sourceCode) => ({
        row: entity,
        column: SOURCE_LABELS[sourceCode],
        counts: heatmapMatrix[entity]?.[sourceCode] || emptyFramingCounter(),
      })),
    );
    const heatmapPayload = useGeneralizedEntities
      ? {
          rows: heatmapRows,
          columns: heatmapColumns,
          cells: heatmapCells,
        }
      : null;

    if (!minIncludedDate || !maxIncludedDate) {
      return {
        barData: groupedBarData,
        lineData: [],
        heatmapData: heatmapPayload,
        tableData: tableRows,
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
      heatmapData: heatmapPayload,
      tableData: tableRows,
    };
  }, [
    datasetMinDate,
    datasetMaxDate,
    endDate,
    selectedEntity,
    selectedEntityLabel,
    selectedOutlet,
    startDate,
    useGeneralizedEntities,
  ]);

  return (
    <main className="flex-1">
      <div className="flex flex-col items-center justify-center">
        <div className="w-5/6 md:w-4/5">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Cross-Media Entity-Level Framing Dashboard
          </h1>
          <p>
            Explore entity-level framing distribution and trends across
            Philippine and International news outlets
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
              <div className="flex items-center justify-between gap-3">
                <label className="block text-sm font-medium">Entity</label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={useGeneralizedEntities}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-2 py-1 text-xs font-medium transition ${
                    useGeneralizedEntities
                      ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                  }`}
                  onClick={() => {
                    setUseGeneralizedEntities((previous) => !previous);
                    setSelectedEntity("All");
                  }}
                >
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${
                      useGeneralizedEntities
                        ? "bg-white"
                        : "bg-slate-500 dark:bg-slate-300"
                    }`}
                  />
                  Generalize
                </button>
              </div>
              {useGeneralizedEntities ? (
                <select
                  className="w-full cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition hover:bg-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800"
                  value={selectedEntity}
                  onChange={(event) => setSelectedEntity(event.target.value)}
                >
                  <option value="All">All Groups</option>
                  {GENERALIZED_ENTITY_BUCKETS.map((bucket) => (
                    <option key={bucket} value={bucket}>
                      {bucket}
                    </option>
                  ))}
                </select>
              ) : (
                <>
                  <input
                    type="text"
                    list="entity-options"
                    className="w-full cursor-text rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition hover:bg-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800"
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
                </>
              )}
            </div>

            {/* Restricts results to one framing label category. */}
            <div className="space-y-1">
              <label className="block text-sm font-medium">Entity Label</label>
              <select
                className="w-full cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition hover:bg-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800"
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
                className="w-full cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition hover:bg-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800"
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
              <div className="flex flex-col space-y-1">
                <label className="mb-1 block text-sm font-medium">
                  Start Date
                </label>
                <DatePicker
                  value={startDate ? dayjs(startDate) : null}
                  minDate={datasetMinDate ? dayjs(datasetMinDate) : undefined}
                  maxDate={
                    endDate
                      ? dayjs(endDate)
                      : datasetMaxDate
                        ? dayjs(datasetMaxDate)
                        : undefined
                  }
                  onChange={(newValue) =>
                    setStartDate(newValue ? newValue.format("YYYY-MM-DD") : "")
                  }
                  slotProps={{
                    textField: {
                      size: "small",
                      sx: {
                        width: "100%",
                        "& .MuiInputBase-root": {
                          borderRadius: "0.375rem",
                          backgroundColor: "transparent",
                          fontSize: "0.875rem",
                          color: "inherit",
                        },
                        "& .MuiOutlinedInput-notchedOutline": {
                          border: "none",
                        },
                      },
                      className:
                        "cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-1.5 transition hover:bg-slate-100 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800",
                    },
                  }}
                />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="mb-1 block text-sm font-medium">
                  End Date
                </label>
                <DatePicker
                  value={endDate ? dayjs(endDate) : null}
                  minDate={
                    startDate
                      ? dayjs(startDate)
                      : datasetMinDate
                        ? dayjs(datasetMinDate)
                        : undefined
                  }
                  maxDate={datasetMaxDate ? dayjs(datasetMaxDate) : undefined}
                  onChange={(newValue) =>
                    setEndDate(newValue ? newValue.format("YYYY-MM-DD") : "")
                  }
                  slotProps={{
                    textField: {
                      size: "small",
                      sx: {
                        width: "100%",
                        "& .MuiInputBase-root": {
                          borderRadius: "0.375rem",
                          backgroundColor: "transparent",
                          fontSize: "0.875rem",
                          color: "inherit",
                        },
                        "& .MuiOutlinedInput-notchedOutline": {
                          border: "none",
                        },
                      },
                      className:
                        "cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-1.5 transition hover:bg-slate-100 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800",
                    },
                  }}
                />
              </div>
            </div>

            {/* Restores default filters to full-dataset scope. */}
            <button
              type="button"
              className="w-full cursor-pointer rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
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
            <div className="rounded-xl bg-white p-4 text-justify shadow-md dark:bg-slate-900">
              {useGeneralizedEntities ? (
                <Heatmap data={heatmapData} />
              ) : (
                <Table data={tableData} />
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Coverage;
