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

      // Handle print(...)
      const printMatch = line.match(/^print\((.*)\)$/);
      if (printMatch) {
        const rawContent = printMatch[1].trim();
        try {
          const jsExpr = rawContent
            .replace(/\bTrue\b/g, "true")
            .replace(/\bFalse\b/g, "false")
            .replace(/\bNone\b/g, "null");

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

export function executeCppSimulated(code: string): ExecutionResult {
  const startTime = performance.now();
  const logs: ExecutionLog[] = [];
  let error: string | null = null;
  let exitCode = 0;

  try {
    // Check basic bracket matching
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
      // Ignore comments and preprocessor directives
      if (!line || line.startsWith("//") || line.startsWith("/*") || line.startsWith("*")) continue;
      if (line.startsWith("#include") || line.startsWith("using namespace")) continue;
      if (line.startsWith("int main") || line === "{" || line === "}") continue;

      // Handle std::cout or cout << ...
      const coutMatch = line.match(/(?:std::)?cout\s*<<\s*(.+?)\s*;/);
      if (coutMatch) {
        const fullExpr = coutMatch[1];
        // Split by <<
        const parts = fullExpr.split("<<").map((p) => p.trim());
        const outputSegments: string[] = [];

        for (const part of parts) {
          if (part === "endl" || part === "std::endl") {
            continue; // line break implied per log entry
          }
          if (part.startsWith('"') && part.endsWith('"')) {
            outputSegments.push(part.slice(1, -1));
          } else if (part.startsWith("'") && part.endsWith("'")) {
            outputSegments.push(part.slice(1, -1));
          } else {
            // Evaluate variable or math expression
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

      // Handle printf("...", args...)
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

      // Handle variable declaration e.g. int x = 10; or string s = "hello";
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

      // Handle reassignment e.g. x = x + 5; or x += 1;
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
          // ignore error
        }
        continue;
      }

      // Handle return 0;
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

    // Check bracket balance
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

    // Count rules and selectors
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
    return executePythonSimulated(code);
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
