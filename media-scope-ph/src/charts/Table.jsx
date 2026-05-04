import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const getFramingColor = (label) => {
  switch (label?.toLowerCase()) {
    case "legitimate":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300";
    case "defensive":
      return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300";
    case "aggressor":
      return "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300";
    case "neutral":
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300";
  }
};

const Table = ({ data }) => {
  const [groupBy, setGroupBy] = useState("sentence"); // 'sentence' or 'article'
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  // Add a small safety check, just in case data is undefined
  const safeData = data || [];

  const processedData = useMemo(() => {
    let result = [];
    if (groupBy === "sentence") {
      result = safeData;
    } else {
      // Group by article_id
      const grouped = {};
      for (const row of safeData) {
        const id = row.article_id;
        if (!grouped[id]) {
          grouped[id] = {
            id,
            article_id: row.article_id,
            source: row.source,
            date: row.date,
            sentences: {},
          };
        }

        if (row.sentence) {
          if (!grouped[id].sentences[row.sentence]) {
            grouped[id].sentences[row.sentence] = [];
          }

          // Deduplicate entity+framing pairs for this sentence
          if (row.entity_text && row.framing_label) {
            const hasPair = grouped[id].sentences[row.sentence].some(
              (ef) =>
                ef.entity === row.entity_text &&
                ef.framing === row.framing_label,
            );
            if (!hasPair) {
              grouped[id].sentences[row.sentence].push({
                entity: row.entity_text,
                framing: row.framing_label,
              });
            }
          }
        }
      }

      result = Object.values(grouped).map((group) => ({
        article_id: group.article_id,
        source: group.source,
        date: group.date,
        sentence_groups: Object.entries(group.sentences).map(
          ([sentence, framings]) => ({
            sentence,
            framings,
          }),
        ),
      }));
    }

    // Sort by most recent date
    result.sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return dateB.getTime() - dateA.getTime();
    });

    return result;
  }, [safeData, groupBy]);

  const totalPages = Math.ceil(processedData.length / rowsPerPage) || 1;
  // Ensure currentPage is valid
  const validPage = Math.min(currentPage, totalPages);

  const currentRows = processedData.slice(
    (validPage - 1) * rowsPerPage,
    validPage * rowsPerPage,
  );

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          News Coverage Sentences
        </h3>

        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-700 dark:text-slate-300">
            View by:
          </label>
          <select
            className="cursor-pointer rounded-md border border-slate-300 bg-white px-2 py-1 text-sm transition hover:bg-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
            value={groupBy}
            onChange={(e) => {
              setGroupBy(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="sentence">All Sentences</option>
            <option value="article">Article ID</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
        <table className="w-full table-fixed divide-y divide-slate-200 text-sm dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="w-1/12 px-4 py-3 text-left font-medium text-slate-900 dark:text-slate-100">
                Date
              </th>
              <th className="w-1/12 px-4 py-3 text-left font-medium text-slate-900 dark:text-slate-100">
                Source
              </th>
              <th className="w-1/2 px-4 py-3 text-left font-medium text-slate-900 dark:text-slate-100">
                Sentence
              </th>
              <th className="w-1/6 px-4 py-3 text-left font-medium text-slate-900 dark:text-slate-100">
                Entity
              </th>
              <th className="w-1/6 px-4 py-3 text-left font-medium text-slate-900 dark:text-slate-100">
                Framing
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
            {currentRows.length > 0 ? (
              currentRows.map((row, idx) => (
                <tr
                  key={`${row.article_id || idx}-${idx}`}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <td className="w-1/12 px-4 py-3 align-top text-slate-600 dark:text-slate-300">
                    {row.date}
                  </td>
                  <td className="w-1/12 px-4 py-3 align-top whitespace-nowrap text-slate-600 dark:text-slate-300">
                    {row.source}
                  </td>
                  {groupBy === "sentence" && (
                    <td className="w-1/2 px-4 py-3 align-top text-slate-600 dark:text-slate-300">
                      <div>{row.sentence}</div>
                    </td>
                  )}
                  {groupBy === "article" ? (
                    <td colSpan={3} className="p-0 align-top">
                      <table className="h-full w-full table-fixed">
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {row.sentence_groups?.map((sg, i) => (
                            <tr key={i}>
                              <td className="w-3/5 px-4 py-3 align-top">
                                <div className="text-slate-600 dark:text-slate-300">
                                  {sg.sentence}
                                </div>
                              </td>
                              <td className="w-2/5 p-0 align-top">
                                <table className="h-full w-full table-fixed">
                                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                    {sg.framings.map((ef, j) => (
                                      <tr key={j}>
                                        <td className="w-1/2 px-4 py-3 align-top font-medium text-slate-700 dark:text-slate-200">
                                          {ef.entity}
                                        </td>
                                        <td className="w-1/2 px-4 py-3 align-top">
                                          <span
                                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getFramingColor(
                                              ef.framing,
                                            )}`}
                                          >
                                            {ef.framing}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  ) : (
                    <>
                      <td className="w-1/6 px-4 py-3 align-top text-slate-600 dark:text-slate-300">
                        {row.entity_text}
                      </td>
                      <td className="w-1/6 px-4 py-3 align-top text-slate-600 dark:text-slate-300">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getFramingColor(
                            row.framing_label,
                          )}`}
                        >
                          {row.framing_label}
                        </span>
                      </td>
                    </>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
                >
                  No data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={validPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="text-sm text-slate-600 dark:text-slate-400">
            Page{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {validPage}
            </span>{" "}
            of {totalPages}
          </span>

          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={validPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Table;
