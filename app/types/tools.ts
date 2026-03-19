export interface ToolDefinition {
  name: string;
  description: string;
  parameters: JSONSchema;
  execute: (args: unknown, context: ToolContext) => Promise<ToolResult>;
}

export interface ToolContext {
  env: Env;
  requestId: string;
  abortSignal?: AbortSignal;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface ToolDescription {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: JSONSchema;
  };
}

export interface JSONSchema {
  type: "object";
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface JSONSchemaProperty {
  type: "string" | "number" | "boolean" | "array" | "object";
  description?: string;
  enum?: string[];
  items?: JSONSchemaProperty;
  properties?: Record<string, JSONSchemaProperty>;
}

export interface RawToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolCallResult {
  toolCallId: string;
  role: "tool";
  content: string;
}
