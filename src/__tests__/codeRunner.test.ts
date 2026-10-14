import { describe, it, expect } from "vitest";
import {
  executeJavaScript,
  executePythonSimulated,
  executeCppSimulated,
  validateCss,
  executeCode,
} from "../utils/codeRunner";

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

    // Test case from User Image 1: f-strings
    it("evaluates Python f-strings correctly", () => {
      const pyCode = `
a = 10
b = 6
sum = a + b
print(f"sum is :{sum}")
      `;
      const result = executePythonSimulated(pyCode);
      expect(result.error).toBeNull();
      expect(result.logs.some((log) => log.message === "sum is :16")).toBe(true);
    });

    // Test case from User Image 2: sum() built-in
    it("evaluates Python sum(numbers) correctly", () => {
      const pyCode = `
numbers = [10, 20, 30, 40, 50]
result = sum(numbers)
print(result)
      `;
      const result = executePythonSimulated(pyCode);
      expect(result.error).toBeNull();
      expect(result.logs.some((log) => log.message === "150")).toBe(true);
    });

    // Test case from User Image 3: for loop summation
    it("evaluates Python for loop summation correctly", () => {
      const pyCode = `
numbers = [10, 20, 30, 40, 50]
total = 0
for n in numbers:
    total += n
print(total)
      `;
      const result = executePythonSimulated(pyCode);
      expect(result.error).toBeNull();
      expect(result.logs.some((log) => log.message === "150")).toBe(true);
    });
  });

  describe("executeCppSimulated", () => {
    it("executes basic C++ cout and main return code", () => {
      const cppCode = `
#include <iostream>
using namespace std;

int main() {
    int a = 10;
    int b = 20;
    cout << "Sum: " << a + b << endl;
    return 0;
}
      `;
      const result = executeCppSimulated(cppCode);
      expect(result.error).toBeNull();
      expect(result.logs.some((log) => log.message.includes("Sum: 30"))).toBe(true);
      expect(result.returnValue).toBe("Process finished with exit code 0");
    });

    it("catches mismatched braces in C++", () => {
      const invalidCpp = `
int main() {
    cout << "Unclosed" << endl;
      `;
      const result = executeCppSimulated(invalidCpp);
      expect(result.error).toBeTruthy();
      expect(result.error).toContain("Unclosed brace");
    });
  });

  describe("validateCss", () => {
    it("validates well-formed CSS rules and reports count", () => {
      const css = `
        .card { background: white; padding: 16px; }
        button { color: blue; }
      `;
      const result = validateCss(css);
      expect(result.error).toBeNull();
      expect(result.returnValue).toContain("Valid");
      expect(result.logs.some((l) => l.message.includes("2 style block(s)"))).toBe(true);
    });

    it("catches unclosed brackets in CSS", () => {
      const badCss = `.card { background: white;`;
      const result = validateCss(badCss);
      expect(result.error).toBeTruthy();
      expect(result.error).toContain("Missing closing brace");
    });
  });

  describe("executeCode with JSON and C++", () => {
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

    it("runs C++ through executeCode dispatcher", async () => {
      const cppCode = `
int main() {
    cout << "Hello C++" << endl;
    return 0;
}
      `;
      const result = await executeCode(cppCode, "cpp");
      expect(result.error).toBeNull();
      expect(result.logs[0].message).toBe("Hello C++");
    });
  });
});
