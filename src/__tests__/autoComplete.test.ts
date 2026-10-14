import { describe, it, expect } from "vitest";
import { completions, createCompletionSource, type SupportedLanguage } from "../components/AutoComplete";

describe("AutoComplete", () => {
  const supportedLanguages: SupportedLanguage[] = [
    "javascript",
    "python",
    "html",
    "css",
    "json",
    "markdown",
    "cpp",
  ];

  it("defines keyword completions for all supported languages", () => {
    for (const lang of supportedLanguages) {
      expect(completions[lang]).toBeDefined();
      expect(completions[lang].length).toBeGreaterThan(0);
    }
  });

  it("contains essential keywords for JavaScript and Python", () => {
    expect(completions.javascript).toContain("function");
    expect(completions.javascript).toContain("async");
    expect(completions.python).toContain("def");
    expect(completions.python).toContain("class");
  });

  it("returns completion options matching context", () => {
    const source = createCompletionSource("javascript");
    const mockContext = {
      matchBefore: () => ({ from: 0, to: 4, text: "func" }),
      explicit: false,
    } as any;

    const result = source(mockContext);
    expect(result).not.toBeNull();
    expect(result?.options.length).toBe(completions.javascript.length);
    expect(result?.options[0].type).toBe("keyword");
  });

  it("returns null when no word is matched and explicit is false", () => {
    const source = createCompletionSource("javascript");
    const mockContext = {
      matchBefore: () => ({ from: 0, to: 0, text: "" }),
      explicit: false,
    } as any;

    const result = source(mockContext);
    expect(result).toBeNull();
  });
});
