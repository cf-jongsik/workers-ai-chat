export interface ChatAgentState {
  messages: ChatMessage[];
  lastUpdate: Date;
  streamingMessageId?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  timestamp: number;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  reasoning?: string;
  toolCalls?: ToolCall[];
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  model?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  status: "pending" | "running" | "completed" | "error";
  result?: unknown;
  error?: string;
}

// Tool system types
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

// Streaming types
export interface ContentWithRole {
  content: string;
  role: "user" | "assistant";
}

export interface StreamChunk {
  type:
    | "content"
    | "reasoning"
    | "tool_call"
    | "tool_result"
    | "done"
    | "error";
  data: unknown;
  timestamp: number;
}

export interface AIResponseChoice {
  index: number;
  message: {
    role: string;
    content: string | null;
    tool_calls?: Array<{
      id: string;
      type: "function";
      function: {
        name: string;
        arguments: string;
      };
    }>;
  };
  finish_reason: string | null;
}

export interface AIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: AIResponseChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AIStreamChunk {
  id: string;
  choices: Array<{
    index: number;
    delta: {
      content?: string;
      reasoning?: string;
      role?: string;
      tool_calls?: Array<{
        index: number;
        id?: string;
        type?: "function";
        function?: {
          name?: string;
          arguments?: string;
        };
      }>;
    };
    finish_reason: string | null;
  }>;
}
