import React, { useState, useRef, useMemo, useEffect } from "react";

const Report = () => {
  const API = import.meta.env.VITE_API_URL;

  const [text, setText] = useState("");
  const [entities, setEntities] = useState([]);
  const [results, setResults] = useState([]);
  const [model, setModel] = useState("model1");
  const [loading, setLoading] = useState(false);

  // 🔥 NEW: community history
  const [analyses, setAnalyses] = useState([]);
  const [latestAnalysisId, setLatestAnalysisId] = useState(null);
  const [duplicateMessage, setDuplicateMessage] = useState(null);
  const [highlightId, setHighlightId] = useState(null);
  const rowRefs = useRef({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

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
    `
  };

  const modelColorMap = {
    RoBERTa: `
      bg-teal-100 text-teal-700 border border-teal-300
      dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/30
    `,
    BERT: `
      bg-purple-100 text-purple-700 border border-purple-300
      dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30
    `
  };

  // =========================
  // 🔹 FETCH ANALYSES
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

  // =========================
  // 🔹 TOKEN LOGIC
  // =========================
  const tokenSpans = useMemo(() => {
    const tokens = text.match(/\S+|\s+/g) || [];
    let offset = 0;

    return tokens.map(t => {
      const start = offset;
      const end = offset + t.length;
      offset = end;
      return { start, end };
    });
  }, [text]);

  const snapToToken = (start, end) => {
    let newStart = start;
    let newEnd = end;

    tokenSpans.forEach(tok => {
      if (start > tok.start && start < tok.end) newStart = tok.start;
      if (end > tok.start && end < tok.end) newEnd = tok.end;
    });

    return { start: newStart, end: newEnd };
  };

  const isOverlapping = (start, end) => {
    return entities.some(ent => start < ent.end && end > ent.start);
  };

  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString();

    const preRange = range.cloneRange();
    preRange.selectNodeContents(containerRef.current);
    preRange.setEnd(range.startContainer, range.startOffset);

    let start = preRange.toString().length;
    let end = start + selectedText.length;

    const snapped = snapToToken(start, end);
    start = snapped.start;
    end = snapped.end;

    if (isOverlapping(start, end)) {
      selection.removeAllRanges();
      return;
    }

    setEntities(prev => [...prev, { start, end }]);
    selection.removeAllRanges();
  };

  const handleDelete = (index) => {
    setEntities(prev => prev.filter((_, i) => i !== index));
  };

  const entityTexts = useMemo(() =>
    entities.map(ent => text.slice(ent.start, ent.end)),
    [entities, text]);

  const currentPayload = useMemo(() => JSON.stringify({
    sentence: text,
    entities: entityTexts,
    model: model
  }), [text, entityTexts, model]);

  const isSameAsLast =
    lastAnalysisRef.current &&
    JSON.stringify(lastAnalysisRef.current) === currentPayload;

  // =========================
  // 🔥 ANALYZE (BATCH)
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
          model: model
        })
      });

      const data = await res.json();

      // attach model for UI consistency
      const enriched = (data.results || []).map(r => ({
        ...r,
        model: model === "model1" ? "RoBERTa" : "BERT"
      }));

      setResults(enriched);

      // ✅ HANDLE NEW vs DUPLICATE
      if (data.message) {
        // 🔹 duplicate case
        setDuplicateMessage({
          text: "Already analyzed",
          id: data.analysis_id
        });
      } else {
        // 🔹 new analysis
        setDuplicateMessage(null);

        setLatestAnalysisId(data.analysis_id);

        // remove highlight after animation
        setTimeout(() => {
          setLatestAnalysisId(null);
        }, 600);
      }

      // save last request
      lastAnalysisRef.current = JSON.parse(currentPayload);

      // ✅ ONLY ONE refresh
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
    setPage(1);
  };

  // =========================
  // 🔹 RENDER TEXT
  // =========================
  const renderText = () => {
    let parts = [];
    let last = 0;

    const sorted = [...entities].sort((a, b) => a.start - b.start);

    sorted.forEach((ent, i) => {
      parts.push(text.slice(last, ent.start));

      const originalIndex = entities.findIndex(
        e => e.start === ent.start && e.end === ent.end
      );
      const entityText = text.slice(ent.start, ent.end);
      const result = results.find(r => r.entity_text === entityText);

      parts.push(
        <span
          key={i}
          onClick={() => handleDelete(originalIndex)}
          title="Click to remove"
          className={`relative px-1 rounded cursor-pointer transition-all duration-200 group ${result
            ? colorMap[result.framing_label]
            : "bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-400/20 dark:text-yellow-200 dark:border-yellow-400"
            } hover:ring-2 hover:ring-red-400`}
        >
          {entityText}
          <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100">
            ×
          </span>
        </span>
      );

      last = ent.end;
    });

    parts.push(text.slice(last));
    return <>{parts}</>;
  };

  // =========================
  // 🔹 PAGINATION
  // =========================
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="min-h-screen bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300 p-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* HEADER */}
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Detailed Report</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Entity-level framing analysis with real-time testing
          </p>
        </div>

        {/* ANALYZER */}
        <div className="bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow">
          <h2 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">
            Real-Time Sentence Analyzer
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
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
            className="w-full bg-white border border-slate-300 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="bg-slate-100 border border-slate-300 text-slate-600 dark:bg-slate-700/40 dark:border-slate-600 dark:text-slate-300 text-sm px-3 py-2 rounded mb-3">
            💡 Highlight the entity you want to analyze.
          </div>

          <div
            ref={containerRef}
            onMouseUp={handleMouseUp}
            className="bg-slate-50 border border-slate-300 dark:bg-slate-700 dark:border-slate-600 p-4 rounded min-h-[80px] cursor-text mb-2"
          >
            {renderText()}
          </div>

          {/* Selected Entities */}
          {entities.length > 0 && (
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-2 flex items-center gap-2 flex-wrap">

              <span>
                Selected:
              </span>

              {/* Entity chips */}
              <div className="flex flex-wrap gap-1">
                {entityTexts.map((ent, i) => (
                  <span
                    key={i}
                    className="
                      px-2 py-0.5 rounded-md text-xs
                      bg-slate-200 text-slate-700
                      dark:bg-slate-600 dark:text-slate-200
                    "
                  >
                    {ent}
                  </span>
                ))}
              </div>

              {/* Count badge */}
              <span
                className="
                  ml-1 px-2 py-0.5 rounded text-xs
                  bg-blue-100 text-blue-700
                  dark:bg-blue-500/20 dark:text-blue-300
                "
              >
                {entities.length}
              </span>

            </div>
          )}

          {/* CONTROL ROW */}
          <div className="flex items-end justify-between mt-4">

            {/* LEFT: ACTION BUTTONS */}
            <div className="flex gap-2">
              <button
                onClick={handleAnalyze}
                disabled={loading || entities.length === 0 || isSameAsLast}
                title={
                  loading
                    ? "Processing..."
                    : entities.length === 0
                    ? "Select/Highlight at least one entity"
                    : isSameAsLast
                    ? "No changes to analyze"
                    : "Analyze selected entities"
                }
                className="
                  bg-blue-600 text-white hover:bg-blue-700
                  dark:bg-blue-500 dark:hover:bg-blue-600

                  px-4 py-2 rounded text-sm
                  flex items-center gap-2
                  transition

                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {loading && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                )}

                {loading ? "Analyzing..." : "Analyze Sentence"}
              </button>

              <button
                onClick={handleClear}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-white px-3 py-2 rounded text-sm transition"
              >
                Clear
              </button>
            </div>

            {/* RIGHT: MODEL SELECT */}
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Model
              </span>

              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="
                  bg-white text-slate-700 border border-slate-300
                  hover:bg-slate-100
                  dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-600
                  px-3 py-2 rounded text-sm cursor-pointer
                  focus:outline-none focus:ring-1 focus:ring-blue-500
                  transition
                "
              >
                <option value="model1">RoBERTa</option>
                <option value="model2">BERT</option>
              </select>
            </div>

          </div>
        </div>

        {/* 🔥 DUPLICATE MESSAGE */}
        {duplicateMessage?.id && (
          <div className="mt-3 text-xs px-3 py-2 rounded text-yellow-700 bg-yellow-100 border border-yellow-300 dark:text-yellow-400 dark:bg-yellow-500/10 dark:border-yellow-500/30">
            ⚠️ {duplicateMessage.text} —{" "}
            <span
              onClick={async () => {
                const targetId = duplicateMessage.id;

                try {
                  const res = await fetch(`${API}/analysis-page/${targetId}`);
                  const data = await res.json();

                  const targetPage = data.page;

                  if (targetPage !== page) {
                    setPage(targetPage);

                    setTimeout(() => {
                      rowRefs.current[targetId]?.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                      });

                      setHighlightId(targetId);
                      setTimeout(() => setHighlightId(null), 1500);

                    }, 400);
                  } else {
                    rowRefs.current[targetId]?.scrollIntoView({
                      behavior: "smooth",
                      block: "center"
                    });

                    setHighlightId(targetId);
                    setTimeout(() => setHighlightId(null), 1500);
                  }

                } catch (err) {
                  console.error("Jump error:", err);
                }
              }}
              className="underline cursor-pointer hover:text-yellow-300"
            >
              jump to saved result
            </span>
          </div>
        )}

        {/* COMMUNITY */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl">
          <h2 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">
            Community Analyses
          </h2>

          {/* 🔹 Total Count */}
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            📊 Total Analyses: {total}
          </div>

          {analyses.length === 0 ? (
            <div className="text-center text-slate-600 dark:text-slate-400 text-sm">
              No saved analyses yet
            </div>
          ) : (
            <table className="w-full text-sm border-collapse">

              <thead>
                <tr className="text-slate-600 dark:text-slate-400 border-b border-slate-300 dark:border-slate-600">
                  <th className="text-left py-3 px-4">Sentence</th>
                  <th className="text-center py-3 px-4">Entity</th>
                  <th className="text-center py-3 px-4">Framing</th>
                  <th className="text-center py-3 px-4">Model</th>
                  <th className="text-center py-3 px-4">Date</th>
                </tr>
              </thead>

              <tbody>
                {analyses.map((a, index) => (
                  <React.Fragment key={a.id}>

                    {/* 🔹 Divider BETWEEN analyses (not before first) */}
                    {index !== 0 && (
                      <tr>
                        <td colSpan={5} className="py-2">
                          <div className="h-px bg-slate-600/20"></div>
                        </td>
                      </tr>
                    )}

                    {a.entities.map((e, i) => (
                      <tr
                        key={`${a.id}-${i}`}
                        ref={(el) => {
                          if (i === 0) rowRefs.current[a.id] = el;
                        }}
                        className={`
                          bg-white dark:bg-slate-700/50
                          ${i !== a.entities.length - 1
                            ? "border-b border-slate-200 dark:border-slate-600"
                            : ""}
                          ${a.id === latestAnalysisId ? "animate-fadeInUp" : ""}
                          ${a.id === highlightId
                            ? "bg-yellow-100 dark:bg-yellow-500/10"
                            : ""}
                        `}
                      >

                        {/* Sentence */}
                        {i === 0 && (
                          <td
                            rowSpan={a.entities.length}
                            className="py-4 px-4 align-top max-w-[420px] leading-relaxed space-y-1"
                          >
                            <div>{a.sentence}</div>

                            <div className="text-xs text-slate-500 mt-1">
                              Analysis #{(page - 1) * limit + index + 1} • {a.entities.length} entities
                            </div>
                          </td>
                        )}

                        {/* Entity */}
                        <td className="py-4 px-4 text-center">
                          {e.entity_text}
                        </td>

                        {/* Framing */}
                        <td className="py-4 px-4 text-center">
                          <span className={`px-2 py-1 rounded text-xs ${colorMap[e.framing_label]}`}>
                            {e.framing_label}
                          </span>
                        </td>

                        {/* Model */}
                        <td className="py-4 px-4 text-center">
                          <span className={`px-2 py-1 text-xs rounded ${modelColorMap[a.model] || "bg-gray-500/20 text-gray-300"
                            }`}>
                            {a.model}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-4 px-4 text-center text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {new Date(a.created_at).toLocaleString()}
                        </td>

                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}

          {/* 🔹 PAGINATION */}
          <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mt-4">
            <span>
              {total === 0
                ? "No results"
                : total === 1
                  ? "Showing 1 result"
                  : `Showing ${start}–${end} of ${total}`}
            </span>

            <span>Page {page} of {totalPages}</span>
          </div>

          <div className="flex gap-2 mt-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Prev
            </button>

            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Report;