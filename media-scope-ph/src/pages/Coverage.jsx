import { useMemo, useState } from "react";

import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { BookOpen, ChevronDown, ChevronUp, Info } from "lucide-react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import pdfFile from "../assets/ELF_Annotation_Guide.pdf";

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

  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

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
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Comparative Framing Analysis Dashboard
              </h1>
              <p className="mb-4">
                Explore entity-level framing patterns and contextual portrayals
                across local and international news coverage of the West
                Philippine Sea dispute.
              </p>
            </div>
          </div>
          {/* Guide Buttons */}
          <div className="mt-6 -mb-2 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="flex shrink-0 cursor-pointer items-center gap-1 rounded-md bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-800 transition hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Info size={16} />
              <span>How to Read Dashboard</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPdfOpen(true)}
              className="flex shrink-0 cursor-pointer items-center gap-1 rounded-md bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-800 transition hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <BookOpen size={16} />
              <span>Annotation Guide</span>
            </button>
          </div>
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
            {/* Dynamic Status Bar - Contextually Highlights Applied Filters */}
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900 transition-colors duration-300 dark:border-blue-800/50 dark:bg-blue-900/20 dark:text-blue-100">
              <div className="mb-2 flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-blue-600 dark:text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-xs font-bold tracking-wider uppercase">
                  {selectedEntity === "All" &&
                  selectedEntityLabel === "All" &&
                  selectedOutlet === "All" &&
                  !startDate &&
                  !endDate
                    ? "Current View: Dashboard Overview"
                    : "Current View: Filtered Analysis"}
                </h3>
              </div>
              <p className="pl-7 leading-relaxed">
                You are currently exploring{" "}
                <strong className="text-blue-700 dark:text-blue-300">
                  {selectedEntityLabel === "All"
                    ? "all framing types"
                    : `${selectedEntityLabel} framing`}
                </strong>{" "}
                for{" "}
                <strong className="text-blue-700 dark:text-blue-300">
                  {selectedEntity === "All" ? "all entities" : selectedEntity}
                </strong>{" "}
                as reported by{" "}
                <strong className="text-blue-700 dark:text-blue-300">
                  {selectedOutlet === "All"
                    ? "all available outlets"
                    : selectedOutlet}
                </strong>
                {(startDate || endDate) && (
                  <span>
                    {" "}
                    from{" "}
                    <strong className="text-blue-700 dark:text-blue-300">
                      {startDate
                        ? dayjs(startDate).format("MMMM D, YYYY")
                        : "the beginning"}
                    </strong>{" "}
                    to{" "}
                    <strong className="text-blue-700 dark:text-blue-300">
                      {endDate
                        ? dayjs(endDate).format("MMMM D, YYYY")
                        : "the latest record"}
                    </strong>
                  </span>
                )}
                .{" "}
                {useGeneralizedEntities
                  ? " Entities are currently grouped into generalized state actors."
                  : " Data is shown using the actual raw entities collected."}
              </p>
            </div>
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

        {/* HOW TO READ THIS DASHBOARD DIALOG */}
        <Dialog
          open={isGuideOpen}
          onClose={() => setIsGuideOpen(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            className:
              "dark:bg-slate-900 border border-slate-200 dark:border-slate-800",
          }}
        >
          <DialogTitle className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
            <span>How to Read This Dashboard</span>
            <button
              onClick={() => setIsGuideOpen(false)}
              className="cursor-pointer text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              ✕
            </button>
          </DialogTitle>
          <DialogContent className="border-none bg-white p-6 dark:bg-slate-900">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <p className="w-full text-justify text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                  This interactive dashboard supports exploratory analysis of
                  entity-level framing patterns in news coverage related to the
                  West Philippine Sea dispute. Using transformer-based Natural
                  Language Processing models, the system analyzes how entities
                  such as countries, organizations, and government agencies are
                  contextually represented within sentence-level discourse.
                  Instead of measuring overall positive or negative sentiment,
                  the system classifies entities into four contextual framing
                  categories: Legitimate, Aggressor, Defensive, and Neutral.
                  These classifications are generated from linguistic and
                  contextual cues within the surrounding sentence. The
                  visualizations below allow users to explore framing
                  distributions, temporal framing trends, and aggregated
                  contextual portrayals across different news sources. The
                  dashboard is intended to support comparative and
                  research-oriented analysis of geopolitical news discourse.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-700/50 dark:bg-slate-800/50">
                  <span className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Bar Chart
                  </span>
                  <p className="text-justify text-slate-800 dark:text-slate-200">
                    The bar chart displays the distribution of entity-level
                    framing categories across selected news outlets. By
                    comparing aggregated framing results, users can explore
                    variations in contextual portrayal patterns across different
                    reporting environments.
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-700/50 dark:bg-slate-800/50">
                  <span className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Line Chart
                  </span>
                  <p className="text-justify text-slate-800 dark:text-slate-200">
                    The line chart presents changes in framing distributions
                    over time. Users may examine how contextual framing patterns
                    shift across reporting periods and major geopolitical
                    developments related to the West Philippine Sea dispute.
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-700/50 dark:bg-slate-800/50">
                  <span className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Heatmap
                  </span>
                  <p className="text-justify text-slate-800 dark:text-slate-200">
                    The heatmap visualizes aggregated framing distributions
                    across generalized entity groups and news outlets. Darker
                    values indicate stronger concentrations of specific framing
                    categories within the selected analytical context.
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-700/50 dark:bg-slate-800/50">
                  <span className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Table
                  </span>
                  <p className="text-justify text-slate-800 dark:text-slate-200">
                    The table displays sentence-level entity framing outputs
                    generated by the transformer models. Users can review
                    contextual examples, entities, framing classifications,
                    source outlets, and publication dates associated with the
                    dataset.
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
          <DialogActions className="shrink-0 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <Button
              onClick={() => setIsGuideOpen(false)}
              className="text-slate-700 dark:text-slate-300"
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* PDF DIALOG */}
        <Dialog
          open={isPdfOpen}
          onClose={() => setIsPdfOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            className:
              "dark:bg-slate-900 border border-slate-200 dark:border-slate-800",
            style: { height: "90vh", maxHeight: "90vh" },
          }}
        >
          <DialogTitle className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
            <span>ELF Annotation Guide</span>
            <button
              onClick={() => setIsPdfOpen(false)}
              className="cursor-pointer text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              ✕
            </button>
          </DialogTitle>
          <DialogContent
            className="border-none bg-white p-0 dark:bg-slate-900"
            style={{ height: "500px", overflow: "hidden" }}
          >
            <iframe
              src={`${pdfFile}#view=FitH`}
              title="ELF Annotation Guide"
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          </DialogContent>
          <DialogActions className="shrink-0 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <Button
              onClick={() => setIsPdfOpen(false)}
              className="text-slate-700 dark:text-slate-300"
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </main>
  );
};

export default Coverage;
