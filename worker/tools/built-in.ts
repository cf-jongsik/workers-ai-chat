import { toolRegistry } from "./registry";
import type { ToolDefinition } from "../types";

const fetchTool: ToolDefinition = {
  name: "fetch",
  description:
    "Fetch data from a URL. Supports HTTP GET requests to retrieve web content.",
  parameters: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description: "The URL to fetch data from",
      },
      headers: {
        type: "object",
        description: "Optional headers to include in the request",
      },
    },
    required: ["url"],
  },
  execute: async (args) => {
    const { url, headers = {} } = args as {
      url: string;
      headers?: Record<string, string>;
    };

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          accept:
            "text/markdown;q=1.0, text/html;q=0.7, text/json;q=0.9, text/plain;q=0.8, application/json;q=0.9, application/xhtml+xml;q=0.7, application/xml;q=0.9",
          "User-Agent": "Workers-AI-Chat/1.0",
          ...headers,
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const contentType = response.headers.get("content-type") || "";
      let data: unknown;

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return {
        success: true,
        data: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: data,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

const calculatorTool: ToolDefinition = {
  name: "calculator",
  description:
    "Evaluate mathematical expressions safely. Supports basic arithmetic, parentheses, and standard math functions.",
  parameters: {
    type: "object",
    properties: {
      expression: {
        type: "string",
        description:
          "The mathematical expression to evaluate (e.g., '2 + 2', 'sqrt(16)', '10 * (5 + 3)')",
      },
    },
    required: ["expression"],
  },
  execute: async (args) => {
    const { expression } = args as { expression: string };

    try {
      // Safe evaluation - only allow math operators, numbers, and specific functions
      const sanitized = expression
        .replace(/[^0-9+\-*/().\s\w]/g, "")
        .replace(/\b\w+\b/g, (match) => {
          const allowed = [
            "sqrt",
            "abs",
            "round",
            "floor",
            "ceil",
            "max",
            "min",
            "pow",
          ];
          return allowed.includes(match.toLowerCase()) ? match : "";
        });

      // Use Function constructor for safer evaluation than eval()
      // eslint-disable-next-line no-new-func
      const result = new Function(`return ${sanitized}`)();

      return {
        success: true,
        data: {
          expression: sanitized,
          result: Number(result),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

const datetimeTool: ToolDefinition = {
  name: "datetime",
  description: "Get current date and time information in various formats.",
  parameters: {
    type: "object",
    properties: {
      format: {
        type: "string",
        description:
          "The format to return the datetime in: 'iso', 'locale', 'date', 'time', or 'unix'",
        enum: ["iso", "locale", "date", "time", "unix"],
      },
      timezone: {
        type: "string",
        description:
          "Optional timezone (e.g., 'America/New_York', 'Europe/London'). Defaults to system timezone.",
      },
    },
    required: [],
  },
  execute: async (args) => {
    const { format = "iso", timezone } = args as {
      format?: string;
      timezone?: string;
    };

    try {
      const now = new Date();
      let result: string | number;

      const options: Intl.DateTimeFormatOptions = timezone
        ? { timeZone: timezone }
        : {};

      switch (format) {
        case "iso":
          result = now.toISOString();
          break;
        case "locale":
          result = now.toLocaleString(undefined, options);
          break;
        case "date":
          result = now.toLocaleDateString(undefined, options);
          break;
        case "time":
          result = now.toLocaleTimeString(undefined, options);
          break;
        case "unix":
          result = Math.floor(now.getTime() / 1000);
          break;
        default:
          result = now.toISOString();
      }

      return {
        success: true,
        data: {
          format,
          timezone: timezone || "system",
          value: result,
          timestamp: now.getTime(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

// Register all built-in tools
export function registerBuiltInTools(): void {
  toolRegistry.register(fetchTool);
  toolRegistry.register(calculatorTool);
  toolRegistry.register(datetimeTool);
}

export { fetchTool, calculatorTool, datetimeTool };
