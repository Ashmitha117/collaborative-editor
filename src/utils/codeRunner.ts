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

function getDevBackendRunUrl() {
  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
  return `http://${host}:1234/run`;
}

const RUN_URL =
  import.meta.env.VITE_BACKEND_RUN_URL ||
  (import.meta.env.DEV ? getDevBackendRunUrl() : "/run");

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
    const rawLines = code.split("\n");
    const lines = rawLines.map((l) => l.replace(/\r$/, ""));
    const scope: Record<string, any> = {};

    const builtins: Record<string, any> = {
      sum: (arr: any) => (Array.isArray(arr) ? arr.reduce((a: number, b: number) => a + b, 0) : arr),
      len: (arr: any) => (arr && typeof arr.length === "number" ? arr.length : 0),
      min: (...args: any[]) => Math.min(...(Array.isArray(args[0]) ? args[0] : args)),
      max: (...args: any[]) => Math.max(...(Array.isArray(args[0]) ? args[0] : args)),
      range: (start: number, stop?: number, step = 1) => {
        if (stop === undefined) {
          stop = start;
          start = 0;
        }
        const res: number[] = [];
        for (let i = start; i < stop; i += step) res.push(i);
        return res;
      },
      abs: (x: number) => Math.abs(x),
      int: (x: any) => parseInt(x, 10),
      float: (x: any) => parseFloat(x),
      str: (x: any) => String(x),
    };

    const evalExpr = (rawExpr: string): any => {
      let expr = rawExpr.trim();
      // Handle f-string: f"..." or f'...'
      const fMatch = expr.match(/^f(["'])([\s\S]*)\1$/);
      if (fMatch) {
        let text = fMatch[2];
        text = text.replace(/\{([^}]+)\}/g, (_, inner) => {
          try {
            const val = evalExpr(inner);
            return formatArg(val);
          } catch {
            return `{${inner}}`;
          }
        });
        return text;
      }

      // Replace Python boolean and None keywords
      expr = expr
        .replace(/\bTrue\b/g, "true")
        .replace(/\bFalse\b/g, "false")
        .replace(/\bNone\b/g, "null");

      const combined = { ...builtins, ...scope };
      const keys = Object.keys(combined);
      const vals = Object.values(combined);
      const fn = new Function(...keys, `return (${expr});`);
      return fn(...vals);
    };

    const executeLine = (line: string) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;

      // Check print(...)
      const printMatch = trimmed.match(/^print\(([\s\S]*)\)$/);
      if (printMatch) {
        const rawContent = printMatch[1].trim();
        try {
          const evaluated = evalExpr(rawContent);
          logs.push({ type: "log", message: formatArg(evaluated) });
        } catch {
          logs.push({ type: "log", message: rawContent.replace(/^['"]|['"]$/g, "") });
        }
        return;
      }

      // Check augmented assignment e.g. total += n
      const augMatch = trimmed.match(/^([a-zA-Z_]\w*)\s*(\+=|-=|\*=|\/=)\s*(.+)$/);
      if (augMatch) {
        const varName = augMatch[1];
        const op = augMatch[2][0];
        const val = evalExpr(augMatch[3]);
        const current = scope[varName] ?? 0;
        if (op === "+") scope[varName] = current + val;
        else if (op === "-") scope[varName] = current - val;
        else if (op === "*") scope[varName] = current * val;
        else if (op === "/") scope[varName] = current / val;
        return;
      }

      // Check variable assignment e.g. x = ...
      const assignMatch = trimmed.match(/^([a-zA-Z_]\w*)\s*=\s*(.+)$/);
      if (assignMatch) {
        const varName = assignMatch[1];
        const valExpr = assignMatch[2];
        try {
          scope[varName] = evalExpr(valExpr);
        } catch {
          scope[varName] = valExpr;
        }
        return;
      }
    };

    let idx = 0;
    while (idx < lines.length) {
      const line = lines[idx];
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        idx++;
        continue;
      }

      // Check for-loop: for <var> in <iterable>:
      const forMatch = trimmed.match(/^for\s+([a-zA-Z_]\w*)\s+in\s+(.+?):$/);
      if (forMatch) {
        const loopVar = forMatch[1];
        const iterExpr = forMatch[2];
        let iterable: any[] = [];
        try {
          const evaluatedIter = evalExpr(iterExpr);
          if (Array.isArray(evaluatedIter)) {
            iterable = evaluatedIter;
          } else if (typeof evaluatedIter === "string") {
            iterable = evaluatedIter.split("");
          }
        } catch {
          iterable = [];
        }

        // Collect loop body (indented lines following the for statement)
        const baseIndent = line.search(/\S/);
        idx++;
        const loopBody: string[] = [];
        while (idx < lines.length) {
          const nextLine = lines[idx];
          const nextTrimmed = nextLine.trim();
          if (!nextTrimmed) {
            idx++;
            continue;
          }
          const nextIndent = nextLine.search(/\S/);
          if (nextIndent > baseIndent) {
            loopBody.push(nextLine);
            idx++;
          } else {
            break;
          }
        }

        // Execute loop body for each item in iterable
        for (const item of iterable) {
          scope[loopVar] = item;
          for (const bodyLine of loopBody) {
            executeLine(bodyLine);
          }
        }
        continue;
      }

      executeLine(line);
      idx++;
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

export async function executePython(code: string): Promise<ExecutionResult> {
  const startTime = performance.now();
  // Attempt native execution via backend server
  try {
    const response = await fetch(RUN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, language: "python" }),
    });

    if (response.ok) {
      const data = await response.json();
      const logs: ExecutionLog[] = [];
      if (data.stdout) {
        const lines = data.stdout.trimEnd().split("\n");
        for (const line of lines) {
          logs.push({ type: "log", message: line.replace(/\r$/, "") });
        }
      }
      if (data.stderr) {
        const errLines = data.stderr.trimEnd().split("\n");
        for (const line of errLines) {
          logs.push({ type: "error", message: line.replace(/\r$/, "") });
        }
      }
      return {
        logs: logs.length > 0 ? logs : [{ type: "info", message: "Program executed with no stdout." }],
        error: data.stderr || null,
        executionTimeMs: data.executionTimeMs || Math.round((performance.now() - startTime) * 100) / 100,
        returnValue: `Process exited with code ${data.exitCode ?? 0}`,
      };
    }
  } catch {
    // If backend is not reached, fall back to simulated evaluator
  }

  return executePythonSimulated(code);
}

export function executeCppSimulated(code: string): ExecutionResult {
  const startTime = performance.now();
  const logs: ExecutionLog[] = [];
  let error: string | null = null;
  let exitCode = 0;

  try {
    let braceCount = 0;
    for (const ch of code) {
      if (ch === "{") braceCount++;
      if (ch === "}") braceCount--;
      if (braceCount < 0) {
        throw new Error("Syntax Error: Unexpected closing brace '}'");
      }
    }
    if (braceCount !== 0) {
      throw new Error(`Syntax Error: Unclosed brace '{' (mismatched braces: ${braceCount})`);
    }

    const lines = code.split("\n");
    const scope: Record<string, any> = {};

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (!line || line.startsWith("//") || line.startsWith("/*") || line.startsWith("*")) continue;
      if (line.startsWith("#include") || line.startsWith("using namespace")) continue;
      if (line.startsWith("int main") || line === "{" || line === "}") continue;

      const coutMatch = line.match(/(?:std::)?cout\s*<<\s*(.+?)\s*;/);
      if (coutMatch) {
        const fullExpr = coutMatch[1];
        const parts = fullExpr.split("<<").map((p) => p.trim());
        const outputSegments: string[] = [];

        for (const part of parts) {
          if (part === "endl" || part === "std::endl") {
            continue;
          }
          if (part.startsWith('"') && part.endsWith('"')) {
            outputSegments.push(part.slice(1, -1));
          } else if (part.startsWith("'") && part.endsWith("'")) {
            outputSegments.push(part.slice(1, -1));
          } else {
            try {
              const scopeKeys = Object.keys(scope);
              const scopeVals = Object.values(scope);
              const evalFn = new Function(...scopeKeys, `return (${part});`);
              outputSegments.push(String(evalFn(...scopeVals)));
            } catch {
              outputSegments.push(part);
            }
          }
        }
        logs.push({ type: "log", message: outputSegments.join("") });
        continue;
      }

      const printfMatch = line.match(/printf\s*\(\s*"([^"]*)"\s*(?:,\s*(.+?))?\s*\)\s*;/);
      if (printfMatch) {
        let fmt = printfMatch[1].replace(/\\n/g, "");
        const argsStr = printfMatch[2];
        if (argsStr) {
          const argList = argsStr.split(",").map((a) => a.trim());
          for (const arg of argList) {
            let val = arg;
            try {
              const scopeKeys = Object.keys(scope);
              const scopeVals = Object.values(scope);
              const evalFn = new Function(...scopeKeys, `return (${arg});`);
              val = String(evalFn(...scopeVals));
            } catch {
              // fallback
            }
            fmt = fmt.replace(/%[difs]/, val);
          }
        }
        logs.push({ type: "log", message: fmt });
        continue;
      }

      const varDeclMatch = line.match(
        /^(?:const\s+)?(?:int|double|float|char|bool|string|auto|long)\s+([a-zA-Z_]\w*)\s*(?:=\s*(.+?))?\s*;/
      );
      if (varDeclMatch) {
        const varName = varDeclMatch[1];
        const valExpr = varDeclMatch[2];
        if (valExpr !== undefined) {
          try {
            const scopeKeys = Object.keys(scope);
            const scopeVals = Object.values(scope);
            const evalFn = new Function(...scopeKeys, `return (${valExpr});`);
            scope[varName] = evalFn(...scopeVals);
          } catch {
            scope[varName] = valExpr.replace(/^["']|["']$/g, "");
          }
        } else {
          scope[varName] = 0;
        }
        continue;
      }

      const reassignMatch = line.match(/^([a-zA-Z_]\w*)\s*(\+=|-=|\*=|\/=|%=|=)\s*(.+?)\s*;/);
      if (reassignMatch) {
        const varName = reassignMatch[1];
        const op = reassignMatch[2];
        const rhs = reassignMatch[3];
        try {
          const scopeKeys = Object.keys(scope);
          const scopeVals = Object.values(scope);
          if (op === "=") {
            const evalFn = new Function(...scopeKeys, `return (${rhs});`);
            scope[varName] = evalFn(...scopeVals);
          } else {
            const basicOp = op[0];
            const evalFn = new Function(...scopeKeys, `return ${varName} ${basicOp} (${rhs});`);
            scope[varName] = evalFn(...scopeVals);
          }
        } catch {
          // ignore
        }
        continue;
      }

      const returnMatch = line.match(/^return\s+([^;]+);/);
      if (returnMatch) {
        try {
          const scopeKeys = Object.keys(scope);
          const scopeVals = Object.values(scope);
          const evalFn = new Function(...scopeKeys, `return (${returnMatch[1]});`);
          exitCode = Number(evalFn(...scopeVals)) || 0;
        } catch {
          exitCode = 0;
        }
        break;
      }
    }

    if (logs.length === 0 && !error) {
      logs.push({
        type: "info",
        message: "Program compiled & executed successfully (no stdout produced).",
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
    returnValue: error ? undefined : `Process finished with exit code ${exitCode}`,
  };
}

export function validateCss(code: string): ExecutionResult {
  const startTime = performance.now();
  const logs: ExecutionLog[] = [];
  let error: string | null = null;

  try {
    const trimmed = code.trim();
    if (!trimmed) {
      return {
        logs: [{ type: "info", message: "Empty stylesheet. Type some CSS to style the preview." }],
        error: null,
        executionTimeMs: 0,
      };
    }

    let openBraces = 0;
    for (let i = 0; i < trimmed.length; i++) {
      if (trimmed[i] === "{") openBraces++;
      if (trimmed[i] === "}") openBraces--;
      if (openBraces < 0) {
        throw new Error(`CSS Syntax Error: Unexpected '}' at position ${i}`);
      }
    }
    if (openBraces !== 0) {
      throw new Error(`CSS Syntax Error: Missing closing brace '}' (${openBraces} unclosed block(s))`);
    }

    const ruleMatches = trimmed.match(/[^{}]+\{[^{}]*\}/g) || [];
    const selectors: string[] = [];

    for (const rule of ruleMatches) {
      const selectorPart = rule.substring(0, rule.indexOf("{")).trim();
      if (selectorPart && !selectorPart.startsWith("@")) {
        selectors.push(selectorPart);
      }
    }

    logs.push({
      type: "info",
      message: `CSS Validated: ${ruleMatches.length} style block(s) detected.`,
    });

    if (selectors.length > 0) {
      const sample = selectors.slice(0, 4).join(", ");
      logs.push({
        type: "log",
        message: `Rules applied for: ${sample}${selectors.length > 4 ? ` and ${selectors.length - 4} more` : ""}`,
      });
    }

    logs.push({
      type: "info",
      message: "Switch to 'Live Preview' tab to see your styles rendered live on interactive components!",
    });
  } catch (err: any) {
    error = err?.message || String(err);
  }

  const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;
  return {
    logs,
    error,
    executionTimeMs,
    returnValue: error ? undefined : "CSS Stylesheet Valid ✓",
  };
}

export async function executeCode(code: string, language: string): Promise<ExecutionResult> {
  if (language === "javascript") {
    return executeJavaScript(code);
  }
  if (language === "python") {
    return executePython(code);
  }
  if (language === "cpp") {
    return executeCppSimulated(code);
  }
  if (language === "css") {
    return validateCss(code);
  }
  if (language === "json") {
    const startTime = performance.now();
    try {
      JSON.parse(code);
      return {
        logs: [{ type: "info", message: "Valid JSON syntax ✓" }],
        error: null,
        executionTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
        returnValue: "Valid JSON",
      };
    } catch (err: any) {
      return {
        logs: [],
        error: `JSON Syntax Error: ${err.message}`,
        executionTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
      };
    }
  }

  if (language === "html" || language === "markdown") {
    return {
      logs: [
        {
          type: "info",
          message: `Rendering ${language.toUpperCase()} in the Live Preview tab.`,
        },
      ],
      error: null,
      executionTimeMs: 1,
      returnValue: "Preview Ready",
    };
  }

  return {
    logs: [{ type: "info", message: `Direct runner not applicable for ${language}.` }],
    error: null,
    executionTimeMs: 0,
  };
}
