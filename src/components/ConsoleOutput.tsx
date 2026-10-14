import { useState } from "react";
import { executeCode, type ExecutionResult } from "../utils/codeRunner";

type ConsoleOutputProps = {
  getCode: () => string;
  language: string;
  theme: "dark" | "light" | "one-dark";
};

export const ConsoleOutput = ({
  getCode,
  language,
  theme,
}: ConsoleOutputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"output" | "preview">("output");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);

  const isLight = theme === "light";
  const supportsExecution = ["javascript", "python", "json"].includes(language);
  const supportsPreview = language === "html" || language === "markdown";

  const handleRun = async () => {
    setIsOpen(true);
    setIsRunning(true);
    const code = getCode();
    try {
      const res = await executeCode(code, language);
      setResult(res);
      if (supportsPreview) {
        setActiveTab("preview");
      } else {
        setActiveTab("output");
      }
    } finally {
      setIsRunning(false);
    }
  };

  const code = getCode();

  return (
    <div className="flex flex-col mt-3">
      {/* Action Bar */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          {supportsExecution && (
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition disabled:opacity-50 cursor-pointer"
            >
              {isRunning ? (
                <>
                  <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <span>▶</span> Run Code
                </>
              )}
            </button>
          )}

          {supportsPreview && (
            <button
              onClick={() => {
                setIsOpen(true);
                setActiveTab("preview");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition cursor-pointer"
            >
              <span>👁</span> Live Preview
            </button>
          )}

          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              isLight
                ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {isOpen ? "Hide Terminal" : "Show Terminal / Output"}
          </button>
        </div>

        {result && (
          <div className="flex items-center gap-2 text-xs">
            {result.error ? (
              <span className="text-red-400 font-medium">
                ✗ Error ({result.executionTimeMs}ms)
              </span>
            ) : (
              <span className="text-emerald-400 font-medium">
                ✓ Completed in {result.executionTimeMs}ms
              </span>
            )}
          </div>
        )}
      </div>

      {/* Drawer */}
      {isOpen && (
        <div
          className={`rounded-xl border p-4 shadow-xl transition-all ${
            isLight
              ? "bg-white border-slate-200 text-slate-900"
              : "bg-slate-950 border-slate-800 text-slate-100"
          }`}
        >
          {/* Tabs */}
          <div className="flex items-center justify-between border-b pb-2 mb-3 border-slate-700/50">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab("output")}
                className={`text-xs font-semibold pb-1 cursor-pointer transition ${
                  activeTab === "output"
                    ? "border-b-2 border-sky-400 text-sky-400"
                    : isLight
                    ? "text-slate-500 hover:text-slate-800"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Console Logs
              </button>
              {supportsPreview && (
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`text-xs font-semibold pb-1 cursor-pointer transition ${
                    activeTab === "preview"
                      ? "border-b-2 border-sky-400 text-sky-400"
                      : isLight
                      ? "text-slate-500 hover:text-slate-800"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Live Preview
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setResult(null)}
                className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Clear
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "output" ? (
            <div className="font-mono text-xs max-h-48 overflow-y-auto space-y-1">
              {!result && (
                <div className="text-slate-400 italic">
                  Press &quot;Run Code&quot; to execute your {language} script and view output here.
                </div>
              )}

              {result?.logs.map((log, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-2 py-0.5 ${
                    log.type === "error"
                      ? "text-red-400"
                      : log.type === "warn"
                      ? "text-amber-300"
                      : log.type === "info"
                      ? "text-sky-300"
                      : isLight
                      ? "text-slate-800"
                      : "text-slate-200"
                  }`}
                >
                  <span className="text-slate-500 select-none">
                    [{log.type.toUpperCase()}]
                  </span>
                  <pre className="whitespace-pre-wrap break-all font-mono">
                    {log.message}
                  </pre>
                </div>
              ))}

              {result?.returnValue !== undefined && (
                <div className="mt-2 pt-2 border-t border-slate-800 text-purple-400">
                  <span className="text-slate-500 font-semibold select-none">
                    Result:{" "}
                  </span>
                  <span>{result.returnValue}</span>
                </div>
              )}

              {result?.error && (
                <div className="mt-2 p-2 rounded bg-red-950/40 border border-red-800 text-red-300">
                  <span className="font-bold">Error: </span>
                  {result.error}
                </div>
              )}
            </div>
          ) : (
            <div className="h-64 w-full rounded border border-slate-700 bg-white overflow-hidden">
              {language === "html" ? (
                <iframe
                  title="HTML Live Preview"
                  sandbox="allow-scripts"
                  srcDoc={code}
                  className="w-full h-full border-none"
                />
              ) : (
                <div className="p-4 text-slate-800 overflow-auto h-full whitespace-pre-wrap font-sans">
                  {code}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
