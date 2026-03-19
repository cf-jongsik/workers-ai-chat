import type { ModelMessage } from "ai";
import type { ToolCall } from "./streaming";

export type ChatMessage = ModelMessage & {
  id: string;
  timestamp?: number;
  metadata?: MessageMetadata;
};

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

export interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  isLoading: boolean;
  error: string | null;
}

export type MessageRole = "user" | "assistant" | "system" | "tool";
