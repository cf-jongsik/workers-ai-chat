import { toolRegistry } from "./registry";
import type { ToolDefinition } from "../types";
import { env } from "cloudflare:workers";

const browserTool: ToolDefinition = {
  name: "browser",
  description: "Open a webpage in a browser and return the content.",
  parameters: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description: "The URL to open (e.g., https://example.com)",
      },
      instruction: {
        type: "string",
        description: `Instruction for the browser fetching agent to extract data from the webpage.
        It must specify the 'action' (e.g., 'extract_text', 'find_links', 'get_price', 'get_release_date'),
        and a 'keywords' array of text to focus on. (e.g., ["price", "discount", "release date", "availability"])`,
      },
    },
    required: ["url", "instruction"],
  },
  execute: async (args) => {
    const { url, instruction } = args as {
      url: string;
      instruction: string;
    };

    if (!url || !instruction) {
      return {
        success: false,
        error: "Missing required parameters",
      };
    }
    console.log("browserTool", { url, instruction });
    const browserWSEndpoint = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/browser-rendering/json`;

    try {
      const result = await fetch(browserWSEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
        },
        body: JSON.stringify({
          url,
          prompt: instruction,
          response_format: {
            type: "json_schema",
            schema: {
              type: "object",
              properties: {
                url: {
                  type: "string",
                },
                action: {
                  type: "string",
                },
                keywords: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
                data: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
            },
          },
        }),
      });

      console.log("browserTool result", result);

      if (!result.ok) {
        console.error("Browser tool error:", result);
        return {
          success: false,
          error: "Failed to fetch data from browser rendering API",
        };
      }

      const resultJson = (await result.json()) as {
        success: boolean;
        result: object;
      };

      console.log("browserTool result", resultJson.result);

      return {
        success: resultJson.success,
        data: resultJson.result,
      };
    } catch (error) {
      console.error("Browser tool error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
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

      const options: Intl.DateTimeFormatOptions =
        timezone ? { timeZone: timezone } : {};

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
  toolRegistry.register(calculatorTool);
  toolRegistry.register(datetimeTool);
  toolRegistry.register(browserTool);
}

export { calculatorTool, datetimeTool, browserTool };
