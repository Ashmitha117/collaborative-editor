import type { Completion } from "@codemirror/autocomplete";
import { CompletionContext, autocompletion } from "@codemirror/autocomplete";

export type SupportedLanguage =
  | "javascript"
  | "python"
  | "html"
  | "css"
  | "json"
  | "markdown"
  | "cpp";

export const completions: Record<SupportedLanguage, string[]> = {
  javascript: [
    "function",
    "const",
    "let",
    "var",
    "return",
    "if",
    "else",
    "for",
    "while",
    "switch",
    "case",
    "break",
    "continue",
    "async",
    "await",
    "import",
    "export",
    "class",
    "new",
    "try",
    "catch",
    "finally",
    "throw",
    "typeof",
    "instanceof",
    "console",
    "document",
    "window",
  ],
  python: [
    "def",
    "class",
    "return",
    "if",
    "elif",
    "else",
    "for",
    "while",
    "import",
    "from",
    "as",
    "with",
    "try",
    "except",
    "finally",
    "raise",
    "lambda",
    "yield",
    "print",
    "True",
    "False",
    "None",
    "self",
    "async",
    "await",
  ],
  html: [
    "html",
    "head",
    "body",
    "div",
    "span",
    "header",
    "footer",
    "main",
    "section",
    "article",
    "aside",
    "nav",
    "p",
    "h1",
    "h2",
    "h3",
    "button",
    "input",
    "form",
    "table",
    "ul",
    "ol",
    "li",
    "script",
    "style",
    "link",
    "meta",
  ],
  css: [
    "display",
    "flex",
    "grid",
    "color",
    "background",
    "margin",
    "padding",
    "border",
    "width",
    "height",
    "font-size",
    "font-weight",
    "position",
    "absolute",
    "relative",
    "fixed",
    "justify-content",
    "align-items",
    "gap",
    "overflow",
    "opacity",
    "transition",
    "transform",
  ],
  json: [
    "true",
    "false",
    "null",
  ],
  markdown: [
    "# Heading 1",
    "## Heading 2",
    "### Heading 3",
    "- list item",
    "```javascript",
    "```python",
    "> blockquote",
    "[link text](url)",
    "![alt text](url)",
  ],
  cpp: [
    "#include",
    "int",
    "char",
    "float",
    "double",
    "bool",
    "void",
    "auto",
    "class",
    "struct",
    "namespace",
    "using",
    "std",
    "cout",
    "cin",
    "endl",
    "vector",
    "string",
    "template",
    "return",
    "public",
    "private",
    "protected",
    "virtual",
    "override",
  ],
};

export function createCompletionSource(language: SupportedLanguage) {
  return (context: CompletionContext) => {
    const word = context.matchBefore(/\w*/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const list = completions[language] || [];
    return {
      from: word.from,
      options: list.map((label) => ({ label, type: "keyword" })) as Completion[],
    };
  };
}

export function getAutoComplete(language: SupportedLanguage) {
  return autocompletion({ override: [createCompletionSource(language)] });
}

