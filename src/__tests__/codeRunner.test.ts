import { describe, it, expect } from "vitest";
import { executeJavaScript, executePythonSimulated, executeCode } from "../utils/codeRunner";

describe("CodeRunner", () => {
  describe("executeJavaScript", () => {
    it("captures console.log and return value", async () => {
      const code = `
        console.log("Hello from test");
        return 40 + 2;
      `;
      const result = await executeJavaScript(code);
      expect(result.error).toBeNull();
      expect(result.logs.length).toBe(1);
      expect(result.logs[0].message).toBe("Hello from test");
      expect(result.returnValue).toBe("42");
      expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
    });

    it("handles runtime errors cleanly", async () => {
      const code = `
        const x = undefined;
        x.nonExistentMethod();
      `;
      const result = await executeJavaScript(code);
      expect(result.error).toBeTruthy();
      expect(result.error).toContain("nonExistentMethod");
    });
  });

  describe("executePythonSimulated", () => {
    it("evaluates print statements and variables", () => {
      const pyCode = `
x = 15
y = 25
print(x + y)
      `;
      const result = executePythonSimulated(pyCode);
      expect(result.error).toBeNull();
      expect(result.logs.some((log) => log.message === "40")).toBe(true);
    });

    it("evaluates strings and booleans in print", () => {
      const pyCode = `
status = True
print("Server ready")
      `;
      const result = executePythonSimulated(pyCode);
      expect(result.error).toBeNull();
      expect(result.logs.some((log) => log.message === "Server ready")).toBe(true);
    });
  });

  describe("executeCode with JSON", () => {
    it("validates valid JSON string", async () => {
      const validJson = '{"name": "Collab", "active": true}';
      const result = await executeCode(validJson, "json");
      expect(result.error).toBeNull();
      expect(result.logs[0].message).toContain("Valid JSON");
    });

    it("flags invalid JSON syntax with message", async () => {
      const invalidJson = '{"name": "Collab", invalid}';
      const result = await executeCode(invalidJson, "json");
      expect(result.error).toBeTruthy();
      expect(result.error).toContain("JSON Syntax Error");
    });
  });
});
