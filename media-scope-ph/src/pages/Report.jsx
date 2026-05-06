import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  Lightbulb,
  Activity,
  Users,
  BarChart,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  BookOpen,
} from "lucide-react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import pdfFile from "../assets/ELF_Annotation_Guide.pdf";

const Report = () => {
  const API = import.meta.env.VITE_API_URL + "/api";

  const [text, setText] = useState("");
  const [entities, setEntities] = useState([]);
  const [results, setResults] = useState([]);
  const [model, setModel] = useState("model1");
  const [loading, setLoading] = useState(false);

  // NEW: community history
  const [analyses, setAnalyses] = useState([]);
  const [latestAnalysisId, setLatestAnalysisId] = useState(null);
  const [duplicateMessage, setDuplicateMessage] = useState(null);
  const [highlightId, setHighlightId] = useState(null);
  const rowRefs = useRef({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const tableRef = useRef(null);
  const isFirstRender = useRef(true);

  const containerRef = useRef(null);
  const lastAnalysisRef = useRef(null);

  const limit = 5;

  const colorMap = {
    Aggressor: `
      bg-red-100 text-red-700 border border-red-300
      dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30
    `,
    Defensive: `
      bg-blue-100 text-blue-700 border border-blue-300
      dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30
    `,
    Legitimate: `
      bg-green-100 text-green-700 border border-green-300
      dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30
    `,
    Neutral: `
      bg-gray-100 text-gray-700 border border-gray-300
      dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-500/30
    `,
  };

  const modelColorMap = {
    RoBERTa: `
      bg-teal-100 text-teal-700 border border-teal-300
      dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/30
    `,
    BERT: `
      bg-purple-100 text-purple-700 border border-purple-300
      dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30
    `,
  };

  // =========================
  // FETCH ANALYSES
  // =========================
  const fetchAnalyses = async () => {
    try {
      const res = await fetch(`${API}/analyses?page=${page}&limit=${limit}`);
      const data = await res.json();
      setAnalyses(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, [page]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    tableRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [page]);

  // =========================
  // TOKEN LOGIC
  // =========================
  const tokenSpans = useMemo(() => {
    const tokens = text.match(/\S+|\s+/g) || [];
    let offset = 0;

    return tokens.map((t) => {
      const start = offset;
      const end = offset + t.length;
      offset = end;
      return { start, end };
    });
  }, [text]);

  const snapToToken = (start, end) => {
    let newStart = start;
    let newEnd = end;

    tokenSpans.forEach((tok) => {
      if (start > tok.start && start < tok.end) newStart = tok.start;
      if (end > tok.start && end < tok.end) newEnd = tok.end;
    });

    return { start: newStart, end: newEnd };
  };

  const isOverlapping = (start, end) => {
    return entities.some((ent) => start < ent.end && end > ent.start);
  };

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString();

    // 🚫 NEW: prevent empty or whitespace-only selections
    if (!selectedText || selectedText.trim().length === 0) {
      selection.removeAllRanges();
      return;
    }

    const preRange = range.cloneRange();
    preRange.selectNodeContents(containerRef.current);
    preRange.setEnd(range.startContainer, range.startOffset);

    let start = preRange.toString().length;
    let end = start + selectedText.length;

    const snapped = snapToToken(start, end);
    start = snapped.start;
    end = snapped.end;

    // 🚫 EXTRA SAFETY: check again after snapping
    const snappedText = text.slice(start, end);
    if (!snappedText.trim()) {
      selection.removeAllRanges();
      return;
    }

    if (isOverlapping(start, end)) {
      selection.removeAllRanges();
      return;
    }

    setEntities((prev) => [...prev, { start, end }]);
    selection.removeAllRanges();
  };

  const handleDelete = (index) => {
    setEntities((prev) => prev.filter((_, i) => i !== index));
  };

  const entityTexts = useMemo(
    () => entities.map((ent) => text.slice(ent.start, ent.end)),
    [entities, text],
  );

  const currentPayload = useMemo(
    () =>
      JSON.stringify({
        sentence: text,
        entities: entityTexts,
        model: model,
      }),
    [text, entityTexts, model],
  );

  const isSameAsLast =
    lastAnalysisRef.current &&
    JSON.stringify(lastAnalysisRef.current) === currentPayload;

  const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

  const isTooLong = wordCount > 120;

  // =========================
  // ANALYZE (BATCH)
  // =========================
  const handleAnalyze = async () => {
    if (isSameAsLast) return;

    setLoading(true);

    try {
      const res = await fetch(`${API}/analyze-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sentence: text,
          entities: entityTexts,
          model: model,
        }),
      });

      const data = await res.json();

      // attach model for UI consistency
      const enriched = (data.results || []).map((r) => ({
        ...r,
        model: model === "model1" ? "RoBERTa" : "BERT",
      }));

      setResults(enriched);

      // HANDLE NEW vs DUPLICATE
      if (data.message === "duplicate") {
        // duplicate case
        setDuplicateMessage({
          text: "Already analyzed",
          id: data.analysis_id,
        });
      } else {
        // new analysis
        setDuplicateMessage(null);

        setLatestAnalysisId(data.analysis_id);

        // remove highlight after animation
        setTimeout(() => {
          setLatestAnalysisId(null);
        }, 600);
      }

      // save last request
      lastAnalysisRef.current = JSON.parse(currentPayload);

      // ONLY ONE refresh
      await fetchAnalyses();
    } catch (error) {
      console.error("Error:", error);
      setDuplicateMessage(null);
    }

    setLoading(false);
  };

  const handleClear = () => {
    setText("");
    setEntities([]);
    setResults([]);
    lastAnalysisRef.current = null;
    setDuplicateMessage(null);
  };

  // =========================
  // RENDER TEXT
  // =========================
  const renderText = () => {
    let parts = [];
    let last = 0;

    const sorted = [...entities].sort((a, b) => a.start - b.start);

    sorted.forEach((ent, i) => {
      parts.push(text.slice(last, ent.start));

      const originalIndex = entities.findIndex(
        (e) => e.start === ent.start && e.end === ent.end,
      );
      const entityText = text.slice(ent.start, ent.end);
      const result = results.find((r) => r.entity_text === entityText);

      parts.push(
        <span
          key={i}
          onClick={() => handleDelete(originalIndex)}
          title="Click to remove"
          className={`group relative cursor-pointer rounded px-1 transition-all duration-200 ${
            result
              ? colorMap[result.framing_label]
              : "border border-yellow-300 bg-yellow-100 text-yellow-800 dark:border-yellow-400 dark:bg-yellow-400/20 dark:text-yellow-200"
          } hover:ring-2 hover:ring-red-400`}
        >
          {entityText}
          <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white opacity-0 group-hover:opacity-100">
            ×
          </span>
        </span>,
      );

      last = ent.end;
    });

    parts.push(text.slice(last));
    return <>{parts}</>;
  };

  // =========================
  // PAGINATION
  // =========================
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  const sortedAnalyses = [...analyses].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let aValue;
    let bValue;

    switch (sortConfig.key) {
      case "entity":
        aValue = a.entities?.[0]?.entity_text || "";
        bValue = b.entities?.[0]?.entity_text || "";
        break;

      case "model":
        aValue = a.model || "";
        bValue = b.model || "";
        break;

      case "date":
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
        break;

      default:
        return 0;
    }

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });
  const [isPdfOpen, setIsPdfOpen] = useState(false);

  return (
    <main className="flex-1">
      <div className="flex flex-col items-center justify-center">
        <div className="w-5/6 md:w-3/5">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Detailed Report
          </h1>
          <p>Entity-level framing analysis with real-time testing</p>
        </div>

        <section className="mt-6 w-5/6 space-y-6 md:w-3/5">
          {/* ANALYZER */}
          <div className="rounded-xl bg-white p-6 shadow-md dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity
                  size={18}
                  className="text-slate-900 dark:text-slate-100"
                />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Real-Time Sentence Analyzer
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsPdfOpen(true)}
                className="flex cursor-pointer items-center gap-1 rounded-md bg-slate-200 px-3 py-1.5 text-sm font-medium text-slate-800 transition hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <BookOpen size={16} />
                Annotation Guide
              </button>
            </div>
            <p className="mt-2 mb-4 text-sm text-slate-700 dark:text-slate-300">
              Enter a sentence and highlight entities.
            </p>

            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setEntities([]);
                setResults([]);
                lastAnalysisRef.current = null;
                setDuplicateMessage(null);
              }}
              placeholder="Enter a sentence..."
              className={`w-full cursor-text rounded-md border p-3 text-sm transition focus:ring-1 focus:outline-none ${
                isTooLong
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              } bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100`}
            />

            <div className="mt-2 mb-3 space-y-1">
              <p
                className={`text-xs ${
                  isTooLong
                    ? "text-red-500"
                    : wordCount > 100
                      ? "text-yellow-500"
                      : "text-slate-500"
                }`}
              >
                {wordCount} / <span className="font-semibold">120</span> words
              </p>

              {isTooLong && (
                <p className="text-xs text-red-500">
                  Input exceeds recommended length. The model may truncate the
                  sentence, which can affect accuracy.
                </p>
              )}
            </div>

            <div className="mb-3 flex items-center gap-2 rounded border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Lightbulb
                size={16}
                className="text-blue-600 dark:text-blue-400"
              />
              Highlight the entity you want to analyze.
            </div>

            <div
              ref={containerRef}
              onMouseUp={handleMouseUp}
              className="mb-2 min-h-20 cursor-text overflow-hidden rounded-md border border-slate-300 bg-slate-50 p-4 text-sm wrap-break-word whitespace-pre-wrap dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              {renderText()}
            </div>

            {/* Selected Entities */}
            {entities.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <span>Selected:</span>

                {/* Entity chips */}
                <div className="flex flex-wrap gap-1">
                  {entityTexts.map((ent, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-slate-200 px-2 py-0.5 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                    >
                      {ent}
                    </span>
                  ))}
                </div>

                {/* Count badge */}
                <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                  {entities.length}
                </span>
              </div>
            )}

            {/* CONTROL ROW */}
            <div className="mt-4 flex items-end justify-between">
              {/* LEFT: ACTION BUTTONS */}
              <div className="flex gap-2">
                <button
                  onClick={handleAnalyze}
                  disabled={
                    loading ||
                    entities.length === 0 ||
                    isSameAsLast ||
                    isTooLong
                  }
                  title={
                    loading
                      ? "Processing..."
                      : isTooLong
                        ? "Text too long (max 120 words for accurate analysis)"
                        : entities.length === 0
                          ? "Select/Highlight at least one entity"
                          : isSameAsLast
                            ? "No changes to analyze"
                            : "Analyze selected entities"
                  }
                  className="flex cursor-pointer items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  {loading && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  )}

                  {loading ? "Analyzing..." : "Analyze Sentence"}
                </button>

                <button
                  onClick={handleClear}
                  className="cursor-pointer rounded-md bg-slate-200 px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                >
                  Clear
                </button>
              </div>

              {/* RIGHT: MODEL SELECT */}
              <div className="flex flex-col items-end gap-1">
                <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Model
                </label>

                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition hover:bg-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  <option value="model1">RoBERTa</option>
                  <option value="model2">BERT</option>
                </select>
              </div>
            </div>
          </div>

          {/* DUPLICATE MESSAGE */}
          {duplicateMessage?.id && (
            <div className="mt-3 flex items-center gap-2 rounded border border-yellow-300 bg-yellow-100 px-3 py-2 text-xs text-yellow-700 dark:border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-400">
              <AlertTriangle size={16} />
              <span>
                {duplicateMessage.text} —{" "}
                <span
                  onClick={async () => {
                    const targetId = duplicateMessage.id;

                    try {
                      const res = await fetch(
                        `${API}/analysis-page/${targetId}`,
                      );
                      const data = await res.json();

                      const targetPage = data.page;

                      if (targetPage !== page) {
                        setPage(targetPage);

                        setTimeout(() => {
                          rowRefs.current[targetId]?.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });

                          setHighlightId(targetId);
                          setTimeout(() => setHighlightId(null), 1500);
                        }, 400);
                      } else {
                        rowRefs.current[targetId]?.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });

                        setHighlightId(targetId);
                        setTimeout(() => setHighlightId(null), 1500);
                      }
                    } catch (err) {
                      console.error("Jump error:", err);
                    }
                  }}
                  className="cursor-pointer underline hover:text-yellow-300"
                >
                  jump to saved result
                </span>
              </span>
            </div>
          )}

          {/* COMMUNITY */}
          <div className="rounded-xl bg-white p-6 shadow-md dark:bg-slate-900">
            <div className="mb-2 flex items-center gap-2">
              <Users size={18} className="text-slate-900 dark:text-slate-100" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Community Analyses
              </h2>
            </div>

            {/* Total Count */}
            <div className="mb-3 flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
              <BarChart
                size={16}
                className="text-blue-600 dark:text-blue-400"
              />
              Total Analyses: {total}
            </div>

            {analyses.length === 0 ? (
              <div className="text-center text-sm text-slate-600 dark:text-slate-400">
                No saved analyses yet
              </div>
            ) : (
              <div ref={tableRef} className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  {/* HEADER */}
                  <thead className="sticky top-0 z-10 bg-slate-100/80 text-xs tracking-wide text-slate-700 backdrop-blur dark:bg-slate-800/70 dark:text-slate-300">
                    <tr className="border-b border-slate-200/60 dark:border-slate-700/60">
                      {/* Sentence (no sort) */}
                      <th className="px-4 py-3 text-left font-semibold">
                        Sentence
                      </th>

                      {/* Entity */}
                      <th
                        onClick={() => handleSort("entity")}
                        className="cursor-pointer px-4 py-3 text-center font-semibold hover:text-blue-500"
                      >
                        <div className="flex items-center justify-center gap-1">
                          Entity
                          {sortConfig.key === "entity" ? (
                            sortConfig.direction === "asc" ? (
                              <ArrowUp size={14} />
                            ) : (
                              <ArrowDown size={14} />
                            )
                          ) : (
                            <ArrowUp size={14} className="opacity-20" />
                          )}
                        </div>
                      </th>

                      {/* Framing (no sort) */}
                      <th className="px-4 py-3 text-center font-semibold">
                        Framing
                      </th>

                      {/* Model */}
                      <th
                        onClick={() => handleSort("model")}
                        className="cursor-pointer px-4 py-3 text-center font-semibold hover:text-blue-500"
                      >
                        <div className="flex items-center justify-center gap-1">
                          Model
                          {sortConfig.key === "model" ? (
                            sortConfig.direction === "asc" ? (
                              <ArrowUp size={14} />
                            ) : (
                              <ArrowDown size={14} />
                            )
                          ) : (
                            <ArrowUp size={14} className="opacity-20" />
                          )}
                        </div>
                      </th>

                      {/* Date */}
                      <th
                        onClick={() => handleSort("date")}
                        className="cursor-pointer px-4 py-3 text-center font-semibold hover:text-blue-500"
                      >
                        <div className="flex items-center justify-center gap-1">
                          Date
                          {sortConfig.key === "date" ? (
                            sortConfig.direction === "asc" ? (
                              <ArrowUp size={14} />
                            ) : (
                              <ArrowDown size={14} />
                            )
                          ) : (
                            <ArrowUp size={14} className="opacity-20" />
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>

                  {/* BODY */}
                  <tbody>
                    {sortedAnalyses.map((a, index) => (
                      <React.Fragment key={a.id}>
                        {/* Section Divider */}
                        {index !== 0 && (
                          <tr>
                            <td colSpan={5} className="py-2">
                              <div className="h-px bg-slate-300/40 dark:bg-slate-600/30"></div>
                            </td>
                          </tr>
                        )}

                        {a.entities.map((e, i) => (
                          <tr
                            key={`${a.id}-${i}`}
                            ref={(el) => {
                              if (i === 0) rowRefs.current[a.id] = el;
                            }}
                            className={`bg-white dark:bg-slate-700/50 ${
                              i !== a.entities.length - 1
                                ? "border-b border-slate-200 dark:border-slate-600"
                                : ""
                            } ${a.id === latestAnalysisId ? "animate-fadeInUp" : ""} ${
                              a.id === highlightId
                                ? "bg-yellow-100 dark:bg-yellow-500/10"
                                : ""
                            }`}
                          >
                            {/* Sentence */}
                            {i === 0 && (
                              <td
                                rowSpan={a.entities.length}
                                className="max-w-105 space-y-1 px-4 py-4 align-top leading-relaxed"
                              >
                                <div>{a.sentence}</div>

                                <div className="mt-1 text-xs text-slate-500">
                                  Analysis #{(page - 1) * limit + index + 1} •{" "}
                                  {a.entities.length} entities
                                </div>
                              </td>
                            )}

                            {/* Entity */}
                            <td className="px-4 py-4 text-center">
                              {e.entity_text}
                            </td>

                            {/* Framing */}
                            <td className="px-4 py-4 text-center">
                              <span
                                className={`rounded px-2 py-1 text-xs ${colorMap[e.framing_label]}`}
                              >
                                {e.framing_label}
                              </span>
                            </td>

                            {/* Model */}
                            <td className="px-4 py-4 text-center">
                              <span
                                className={`rounded px-2 py-1 text-xs ${
                                  modelColorMap[a.model] ||
                                  "bg-gray-500/20 text-gray-300"
                                }`}
                              >
                                {a.model}
                              </span>
                            </td>

                            {/* Date */}
                            <td className="px-4 py-4 text-center text-xs whitespace-nowrap text-slate-600 dark:text-slate-400">
                              {new Date(a.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* PAGINATION */}
            <div className="mt-4 flex items-center justify-between text-sm text-slate-700 dark:text-slate-300">
              <span>
                {total === 0
                  ? "No results"
                  : total === 1
                    ? "Showing 1 result"
                    : `Showing ${start}–${end} of ${total}`}
              </span>

              <div className="flex items-center justify-center gap-4 pt-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Prev
                </button>

                <span>
                  Page{" "}
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {page}
                  </span>{" "}
                  of {totalPages}
                </span>

                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
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
        </section>
      </div>
    </main>
  );
};

export default Report;
