import { useState, useCallback, useRef } from "react";
import type { StreamChunk, PendingToolCall } from "../types/streaming";

interface UseStreamingOptions {
  onChunk?: (chunk: StreamChunk) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

interface UseStreamingReturn {
  isStreaming: boolean;
  content: string;
  reasoning: string;
  toolCalls: Map<string, PendingToolCall>;
  error: string | null;
  startStreaming: () => void;
  stopStreaming: () => void;
  processChunk: (chunk: StreamChunk) => void;
  reset: () => void;
}

export function useStreaming(options: UseStreamingOptions = {}): UseStreamingReturn {
  const [isStreaming, setIsStreaming] = useState(false);
  const [content, setContent] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [toolCalls, setToolCalls] = useState<Map<string, PendingToolCall>>(new Map());
  const [error, setError] = useState<string | null>(null);

  const accumulatedArgs = useRef<Map<number, string>>(new Map());

  const startStreaming = useCallback(() => {
    setIsStreaming(true);
    setContent("");
    setReasoning("");
    setToolCalls(new Map());
    setError(null);
    accumulatedArgs.current.clear();
  }, []);

  const stopStreaming = useCallback(() => {
    setIsStreaming(false);
  }, []);

  const processChunk = useCallback((chunk: StreamChunk) => {
    options.onChunk?.(chunk);

    switch (chunk.type) {
      case "content": {
        const text = chunk.data as string;
        setContent((prev) => prev + text);
        break;
      }

      case "reasoning": {
        const text = chunk.data as string;
        setReasoning((prev) => prev + text);
        break;
      }

      case "tool_call": {
        const toolCall = chunk.data as {
          id: string;
          name: string;
          arguments: string;
          index: number;
        };

        setToolCalls((prev) => {
          const newMap = new Map(prev);
          const existing = newMap.get(toolCall.id);

          if (existing) {
            // Accumulate arguments
            existing.arguments += toolCall.arguments;
          } else {
            newMap.set(toolCall.id, {
              id: toolCall.id,
              name: toolCall.name,
              arguments: toolCall.arguments,
              status: "pending",
            });
          }

          return newMap;
        });
        break;
      }

      case "tool_result": {
        const result = chunk.data as {
          toolCallId: string;
          result: unknown;
          error?: string;
        };

        setToolCalls((prev) => {
          const newMap = new Map(prev);
          const existing = newMap.get(result.toolCallId);

          if (existing) {
            existing.status = result.error ? "error" : "completed";
            existing.result = result.result;
            existing.error = result.error;
          }

          return newMap;
        });
        break;
      }

      case "error": {
        const errorMsg = chunk.data as string;
        setError(errorMsg);
        options.onError?.(errorMsg);
        setIsStreaming(false);
        break;
      }

      case "done": {
        setIsStreaming(false);
        options.onComplete?.();
        break;
      }
    }
  }, [options]);

  const reset = useCallback(() => {
    setIsStreaming(false);
    setContent("");
    setReasoning("");
    setToolCalls(new Map());
    setError(null);
    accumulatedArgs.current.clear();
  }, []);

  return {
    isStreaming,
    content,
    reasoning,
    toolCalls,
    error,
    startStreaming,
    stopStreaming,
    processChunk,
    reset,
  };
}
