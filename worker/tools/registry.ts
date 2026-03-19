import type {
  ToolDefinition,
  ToolContext,
  ToolResult,
  ToolDescription,
} from "../types";

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.name)) {
      console.warn(`Tool "${tool.name}" is already registered. Overwriting.`);
    }
    this.tools.set(tool.name, tool);
  }

  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  async execute(
    name: string,
    args: unknown,
    context: ToolContext,
  ): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        success: false,
        error: `Tool "${name}" not found`,
      };
    }
    try {
      const result = await tool.execute(args, context);
      return result;
    } catch (error) {
      console.error(`Error executing tool "${name}":`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  getToolDescriptions(): ToolDescription[] {
    return Array.from(this.tools.values()).map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }

  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  listTools(): string[] {
    return Array.from(this.tools.keys());
  }
}

// Singleton instance
export const toolRegistry = new ToolRegistry();
