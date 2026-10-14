export type ExecutionLog = {
  type: "log" | "warn" | "error" | "info";
  message: string;
};

export type ExecutionResult = {
  logs: ExecutionLog[];
  error: string | null;
  executionTimeMs: number;
  returnValue?: string;
};

function formatArg(arg: unknown): string {
  if (arg === null) return "null";
  if (arg === undefined) return "undefined";
  if (typeof arg === "object") {
    try {
      return JSON.stringify(arg, null, 2);
    } catch {
      return String(arg);
    }
  }
  return String(arg);
}

export async function executeJavaScript(code: string): Promise<ExecutionResult> {
  const startTime = performance.now();
  const logs: ExecutionLog[] = [];

  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalInfo = console.info;

  console.log = (...args: unknown[]) => {
    logs.push({ type: "log", message: args.map(formatArg).join(" ") });
    originalLog(...args);
  };
  console.warn = (...args: unknown[]) => {
    logs.push({ type: "warn", message: args.map(formatArg).join(" ") });
    originalWarn(...args);
  };
  console.error = (...args: unknown[]) => {
    logs.push({ type: "error", message: args.map(formatArg).join(" ") });
    originalError(...args);
  };
  console.info = (...args: unknown[]) => {
    logs.push({ type: "info", message: args.map(formatArg).join(" ") });
    originalInfo(...args);
  };

  let error: string | null = null;
  let returnValue: string | undefined;

  try {
    // Run inside an AsyncFunction context
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const fn = new AsyncFunction(code);
    const result = await fn();
    if (result !== undefined) {
      returnValue = formatArg(result);
    }
  } catch (err: any) {
    error = err?.message || String(err);
  } finally {
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
    console.info = originalInfo;
  }

  const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

  return {
    logs,
    error,
    executionTimeMs,
    returnValue,
  };
}

export function executePythonSimulated(code: string): ExecutionResult {
  const startTime = performance.now();
  const logs: ExecutionLog[] = [];
  let error: string | null = null;

  try {
    const lines = code.split("\n");
    const scope: Record<string, any> = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith("#")) continue;

      // Handle simple print(...)
      const printMatch = line.match(/^print\((.*)\)$/);
      if (printMatch) {
        const rawContent = printMatch[1].trim();
        // Evaluate simple expressions or string literals
        try {
          // Replace Python True, False, None with JS equivalents
          const jsExpr = rawContent
            .replace(/\bTrue\b/g, "true")
            .replace(/\bFalse\b/g, "false")
            .replace(/\bNone\b/g, "null");

          // Evaluate with known variables in scope
          const scopeKeys = Object.keys(scope);
          const scopeVals = Object.values(scope);
          const evalFn = new Function(...scopeKeys, `return (${jsExpr});`);
          const evaluated = evalFn(...scopeVals);
          logs.push({ type: "log", message: formatArg(evaluated) });
        } catch {
          logs.push({ type: "log", message: rawContent.replace(/^['"]|['"]$/g, "") });
        }
        continue;
      }

      // Handle variable assignment e.g. x = 10
      const assignMatch = line.match(/^([a-zA-Z_]\w*)\s*=\s*(.+)$/);
      if (assignMatch) {
        const varName = assignMatch[1];
        const valExpr = assignMatch[2]
          .replace(/\bTrue\b/g, "true")
          .replace(/\bFalse\b/g, "false")
          .replace(/\bNone\b/g, "null");
        try {
          const scopeKeys = Object.keys(scope);
          const scopeVals = Object.values(scope);
          const evalFn = new Function(...scopeKeys, `return (${valExpr});`);
          scope[varName] = evalFn(...scopeVals);
        } catch {
          scope[varName] = valExpr;
        }
        continue;
      }
    }

    if (logs.length === 0 && !error) {
      logs.push({
        type: "info",
        message: "Program executed with no print output.",
      });
    }
  } catch (err: any) {
    error = err?.message || String(err);
  }

  const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;
  return {
    logs,
    error,
    executionTimeMs,
  };
}

export async function executeCode(code: string, language: string): Promise<ExecutionResult> {
  if (language === "javascript") {
    return executeJavaScript(code);
  }
  if (language === "python") {
    return executePythonSimulated(code);
  }
  if (language === "json") {
    const startTime = performance.now();
    try {
      JSON.parse(code);
      return {
        logs: [{ type: "info", message: "Valid JSON syntax ✓" }],
        error: null,
        executionTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
      };
    } catch (err: any) {
      return {
        logs: [],
        error: `JSON Syntax Error: ${err.message}`,
        executionTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
      };
    }
  }

  return {
    logs: [{ type: "info", message: `Direct runner not applicable for ${language}. Use Preview tab.` }],
    error: null,
    executionTimeMs: 0,
  };
}
