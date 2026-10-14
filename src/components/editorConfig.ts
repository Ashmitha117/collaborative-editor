import { EditorView } from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { cpp } from "@codemirror/lang-cpp";
import { oneDark } from "@codemirror/theme-one-dark";
import type { SupportedLanguage } from "./AutoComplete";

export type EditorTheme = "dark" | "light" | "one-dark";

export const darkEditorTheme = EditorView.theme({
  "&": {
    height: "calc(100vh - 270px)",
    borderRadius: "1rem",
    backgroundColor: "#0f172a",
    color: "#ffffff",
    boxShadow: "0 24px 80px rgba(15, 23, 42, 0.45)",
    overflow: "hidden",
  },
  ".cm-editor": {
    color: "#ffffff",
  },
  ".cm-content": {
    color: "#ffffff",
  },
  ".cm-line": {
    color: "#ffffff",
  },
  ".cm-scroller": {
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    lineHeight: "1.7",
    padding: "1rem 1rem",
  },
  ".cm-gutters": {
    backgroundColor: "#0f172a",
    color: "#94a3b8",
    border: "none",
  },
  ".cm-activeLine": {
    backgroundColor: "rgba(148, 163, 184, 0.08)",
  },
  ".cm-cursor": {
    borderLeft: "1px solid #38bdf8",
  },
  ".cm-ySelection": {
    backgroundColor: "rgba(56, 189, 248, 0.18)",
    borderRadius: "2px",
  },
  ".cm-yLineSelection": {
    backgroundColor: "rgba(56, 189, 248, 0.14)",
  },
  ".cm-ySelectionCaret": {
    position: "relative",
    width: "2px",
    marginLeft: "-1px",
    borderLeft: "1px solid currentColor",
    boxSizing: "border-box",
  },
  ".cm-ySelectionCaretDot": {
    borderRadius: "50%",
    position: "absolute",
    width: ".35em",
    height: ".35em",
    top: "-0.21em",
    left: "-0.18em",
    backgroundColor: "currentColor",
  },
  ".cm-ySelectionInfo": {
    backgroundColor: "currentColor",
    color: "#0f172a",
    borderRadius: "0.25rem",
    padding: "0.1rem 0.3rem",
    fontSize: "0.75em",
    fontWeight: 700,
  },
});

export const lightEditorTheme = EditorView.theme({
  "&": {
    height: "calc(100vh - 270px)",
    borderRadius: "1rem",
    backgroundColor: "#ffffff",
    color: "#1e293b",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08)",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
  },
  ".cm-editor": {
    color: "#1e293b",
  },
  ".cm-content": {
    color: "#1e293b",
  },
  ".cm-line": {
    color: "#1e293b",
  },
  ".cm-scroller": {
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    lineHeight: "1.7",
    padding: "1rem 1rem",
  },
  ".cm-gutters": {
    backgroundColor: "#f8fafc",
    color: "#64748b",
    borderRight: "1px solid #e2e8f0",
  },
  ".cm-activeLine": {
    backgroundColor: "rgba(226, 232, 240, 0.5)",
  },
  ".cm-cursor": {
    borderLeft: "2px solid #0284c7",
  },
  ".cm-ySelection": {
    backgroundColor: "rgba(2, 132, 199, 0.2)",
    borderRadius: "2px",
  },
  ".cm-yLineSelection": {
    backgroundColor: "rgba(2, 132, 199, 0.12)",
  },
  ".cm-ySelectionCaret": {
    position: "relative",
    width: "2px",
    marginLeft: "-1px",
    borderLeft: "2px solid currentColor",
    boxSizing: "border-box",
  },
  ".cm-ySelectionCaretDot": {
    borderRadius: "50%",
    position: "absolute",
    width: ".35em",
    height: ".35em",
    top: "-0.21em",
    left: "-0.18em",
    backgroundColor: "currentColor",
  },
  ".cm-ySelectionInfo": {
    backgroundColor: "currentColor",
    color: "#ffffff",
    borderRadius: "0.25rem",
    padding: "0.1rem 0.3rem",
    fontSize: "0.75em",
    fontWeight: 700,
  },
});

export function getLanguageExtension(language: SupportedLanguage): Extension {
  switch (language) {
    case "javascript":
      return javascript();
    case "python":
      return python();
    case "html":
      return html();
    case "css":
      return css();
    case "json":
      return json();
    case "markdown":
      return markdown();
    case "cpp":
      return cpp();
    default:
      return javascript();
  }
}

export function getThemeExtensions(theme: EditorTheme): Extension[] {
  if (theme === "light") {
    return [lightEditorTheme];
  }
  if (theme === "one-dark") {
    return [darkEditorTheme, oneDark];
  }
  return [darkEditorTheme];
}
