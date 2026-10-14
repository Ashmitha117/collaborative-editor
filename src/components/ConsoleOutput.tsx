import { useState } from "react";
import { executeCode, type ExecutionResult } from "../utils/codeRunner";

type ConsoleOutputProps = {
  getCode: () => string;
  language: string;
  theme: "dark" | "light" | "one-dark";
};

function getCssPreviewHtml(userCss: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      padding: 24px;
      margin: 0;
      background: #f8fafc;
      color: #0f172a;
      line-height: 1.5;
    }
    .preview-wrapper {
      max-width: 640px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .btn, button {
      cursor: pointer;
      padding: 8px 16px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      background: #0284c7;
      color: #ffffff;
      font-weight: 600;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      font-size: 12px;
      border-radius: 9999px;
      background: #e0f2fe;
      color: #0369a1;
      font-weight: 500;
    }
    input {
      padding: 8px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
    }
    /* --- USER CUSTOM CSS INJECTED BELOW --- */
    ${userCss}
  </style>
</head>
<body>
  <div class="preview-wrapper">
    <div class="card">
      <h2>CSS Live Preview Canvas</h2>
      <p>This playground renders components styled with your custom CSS in real time.</p>
      <div style="display: flex; gap: 10px; align-items: center; margin-top: 14px; flex-wrap: wrap;">
        <button class="btn button">Sample Button</button>
        <span class="badge tag">Badge / Tag</span>
        <input type="text" placeholder="Styled input field" />
      </div>
    </div>
    <div class="card container">
      <h3>Interactive Container Box</h3>
      <p>Select elements with tags (<code>h2</code>, <code>p</code>, <code>button</code>) or classes (<code>.card</code>, <code>.btn</code>, <code>.badge</code>).</p>
    </div>
  </div>
</body>
</html>`;
}

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
  // All languages now support execution/analysis
  const supportsExecution = [
    "javascript",
    "python",
    "cpp",
    "css",
    "json",
    "html",
  ].includes(language);

  // HTML, CSS, and Markdown support the Live Preview canvas
  const supportsPreview = ["html", "css", "markdown"].includes(language);

  const handleRun = async () => {
    setIsOpen(true);
    setIsRunning(true);
    const code = getCode();
    try {
      const res = await executeCode(code, language);
      setResult(res);
      if (language === "html" || (language === "css" && activeTab === "preview")) {
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
                  Press &quot;Run Code&quot; to execute your {language.toUpperCase()} script and view output here.
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
                <div className="mt-2 pt-2 border-t border-slate-800 text-purple-400 font-medium">
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
              ) : language === "css" ? (
                <iframe
                  title="CSS Live Preview"
                  sandbox="allow-scripts"
                  srcDoc={getCssPreviewHtml(code)}
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
