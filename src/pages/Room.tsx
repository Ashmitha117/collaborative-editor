import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import Editor, { type EditorTheme } from "../components/Editor";
import Presence from "../components/Presence";
import BackendStatus from "../components/BackendStatus";
import { ConsoleOutput } from "../components/ConsoleOutput";
import { Chat } from "../components/Chat";
import { useCollaboration } from "../hooks/useCollaboration";
import type { SupportedLanguage } from "../components/AutoComplete";

const languages: { label: string; value: SupportedLanguage }[] = [
  { label: "JavaScript", value: "javascript" },
  { label: "Python", value: "python" },
  { label: "HTML", value: "html" },
  { label: "CSS", value: "css" },
  { label: "JSON", value: "json" },
  { label: "Markdown", value: "markdown" },
  { label: "C++", value: "cpp" },
];

const themes: { label: string; value: EditorTheme }[] = [
  { label: "Deep Space (Dark)", value: "dark" },
  { label: "One Dark", value: "one-dark" },
  { label: "Clean Light", value: "light" },
];

const Room = () => {
  const { id } = useParams();

  const { doc, text, provider, connected, userInfo } = useCollaboration({
    roomId: id || "default-room",
  });

  const [language, setLanguage] = useState<SupportedLanguage>("javascript");
  const [theme, setTheme] = useState<EditorTheme>("dark");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const isLight = theme === "light";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = text.toString();
    const extMap: Record<SupportedLanguage, string> = {
      javascript: "js",
      python: "py",
      html: "html",
      css: "css",
      json: "json",
      markdown: "md",
      cpp: "cpp",
    };
    const ext = extMap[language] || "txt";
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `collab-${id || "room"}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const filename = file.name.toLowerCase();
    if (filename.endsWith(".js") || filename.endsWith(".jsx") || filename.endsWith(".ts") || filename.endsWith(".tsx")) {
      setLanguage("javascript");
    } else if (filename.endsWith(".py")) {
      setLanguage("python");
    } else if (filename.endsWith(".html") || filename.endsWith(".htm")) {
      setLanguage("html");
    } else if (filename.endsWith(".css")) {
      setLanguage("css");
    } else if (filename.endsWith(".json")) {
      setLanguage("json");
    } else if (filename.endsWith(".md")) {
      setLanguage("markdown");
    } else if (filename.endsWith(".cpp") || filename.endsWith(".cc") || filename.endsWith(".h") || filename.endsWith(".hpp")) {
      setLanguage("cpp");
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === "string") {
        doc.transact(() => {
          text.delete(0, text.length);
          text.insert(0, result);
        });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div
      className={`min-h-screen p-4 md:p-6 transition-colors duration-200 ${
        isLight ? "bg-slate-50 text-slate-900" : "bg-slate-900 text-slate-100"
      }`}
    >
      {/* Top Navbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className={`text-xs px-2.5 py-1.5 rounded-lg border transition ${
              isLight
                ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            ← Home
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-bold truncate max-w-[200px] md:max-w-xs">
                Room: {id}
              </h2>
              <button
                onClick={handleCopyLink}
                className={`text-xs px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  isLight
                    ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
                title="Copy shareable link"
              >
                {copied ? "✓ Copied!" : "📋 Copy Link"}
              </button>

              <button
                onClick={handleDownload}
                className={`text-xs px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  isLight
                    ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
                title="Download current file"
              >
                ⬇ Export
              </button>

              <label
                className={`text-xs px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  isLight
                    ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
                title="Open/Import code file from your computer"
              >
                <span>⬆ Import</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {provider && <Presence awareness={provider.awareness} />}

          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none border transition cursor-pointer ${
              isLight
                ? "bg-white border-slate-300 text-slate-900 focus:border-sky-500"
                : "bg-slate-800 border-slate-700 text-white focus:border-sky-500"
            }`}
          >
            {languages.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>

          {/* Theme Selector */}
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as EditorTheme)}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none border transition cursor-pointer ${
              isLight
                ? "bg-white border-slate-300 text-slate-900 focus:border-sky-500"
                : "bg-slate-800 border-slate-700 text-white focus:border-sky-500"
            }`}
          >
            {themes.map((t) => (
              <option key={t.value} value={t.value}>
                🎨 {t.label}
              </option>
            ))}
          </select>

          {/* Connection status badge */}
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              connected
                ? "bg-emerald-600/90 text-white"
                : "bg-rose-600/90 text-white"
            }`}
          >
            {connected ? "● Connected" : "○ Disconnected"}
          </span>

          {/* Chat Toggle Button */}
          <button
            onClick={() => setIsChatOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              isChatOpen
                ? "bg-sky-600 text-white"
                : isLight
                ? "bg-slate-200 text-slate-800 hover:bg-slate-300"
                : "bg-slate-800 text-slate-200 hover:bg-slate-700"
            }`}
          >
            <span>💬</span> Chat
          </button>

          <BackendStatus />
        </div>
      </div>

      {/* Editor Main Section */}
      {provider && (
        <div>
          <Editor
            yText={text}
            provider={provider}
            language={language}
            theme={theme}
          />

          <ConsoleOutput
            getCode={() => text.toString()}
            language={language}
            theme={theme}
          />
        </div>
      )}

      {/* Real-time Room Chat Sidebar */}
      {provider && (
        <Chat
          doc={doc}
          userInfo={userInfo}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          theme={theme}
        />
      )}
    </div>
  );
};

export default Room;