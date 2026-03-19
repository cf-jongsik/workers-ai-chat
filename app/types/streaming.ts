export interface StreamChunk {
  type:
    | "content"
    | "reasoning"
    | "tool_call"
    | "tool_result"
    | "done"
    | "error";
  data: string | ToolCallChunk | ToolResultChunk | null;
  timestamp: number;
}

export interface ToolCallChunk {
  id: string;
  name: string;
  arguments: string;
  index: number;
}

export interface ToolResultChunk {
  toolCallId: string;
  result: unknown;
  error?: string;
}

export interface StreamState {
  isActive: boolean;
  content: string;
  reasoning: string;
  toolCalls: Map<string, PendingToolCall>;
  error: string | null;
}

export interface PendingToolCall {
  id: string;
  name: string;
  arguments: string;
  status: "pending" | "running" | "completed" | "error";
  result?: unknown;
  error?: string;
}

export interface StreamingMessage {
  id: string;
  role: "assistant";
  content: string;
  reasoning?: string;
  toolCalls?: ToolCall[];
  isComplete: boolean;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  status: "pending" | "running" | "completed" | "error";
  result?: unknown;
  error?: string;
}
