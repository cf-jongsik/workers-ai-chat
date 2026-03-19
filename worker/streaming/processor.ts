import type { Connection } from "agents";
import type { StreamChunk, AIStreamChunk, ToolCall } from "../types";

interface AccumulatedToolCall {
  id?: string;
  type?: "function";
  function?: {
    name?: string;
    arguments?: string;
  };
}

export class StreamingProcessor {
  private accumulatedToolCalls = new Map<number, AccumulatedToolCall>();
  private connection: Connection;
  private requestId: string;

  constructor(connection: Connection, requestId: string) {
    this.connection = connection;
    this.requestId = requestId;
  }

  sendChunk(chunk: StreamChunk): void {
    this.connection.send(JSON.stringify(chunk));
  }

  processStreamChunk(chunk: AIStreamChunk): void {
    if (!chunk.choices || chunk.choices.length === 0) return;

    const choice = chunk.choices[0];
    const delta = choice.delta;

    // Process content
    if (delta.content) {
      this.sendChunk({
        type: "content",
        data: delta.content,
        timestamp: Date.now(),
      });
    }

    // Process reasoning
    if (delta.reasoning) {
      this.sendChunk({
        type: "reasoning",
        data: delta.reasoning,
        timestamp: Date.now(),
      });
    }

    // Process tool calls
    if (delta.tool_calls && delta.tool_calls.length > 0) {
      for (const toolCallDelta of delta.tool_calls) {
        this.accumulateToolCall(toolCallDelta);
      }
    }

    // Check if streaming is complete
    if (choice.finish_reason) {
      // Send any completed tool calls
      this.flushAccumulatedToolCalls();

      this.sendChunk({
        type: "done",
        data: null,
        timestamp: Date.now(),
      });
    }
  }

  private accumulateToolCall(
    toolCallDelta: NonNullable<
      AIStreamChunk["choices"][0]["delta"]["tool_calls"]
    >[0],
  ): void {
    const index = toolCallDelta.index;
    const existing: AccumulatedToolCall =
      this.accumulatedToolCalls.get(index) || {};

    if (toolCallDelta.id) {
      existing.id = toolCallDelta.id;
    }

    if (toolCallDelta.type) {
      existing.type = toolCallDelta.type;
    }

    if (toolCallDelta.function) {
      if (!existing.function) {
        existing.function = { name: "", arguments: "" };
      }
      if (toolCallDelta.function.name) {
        existing.function.name = toolCallDelta.function.name;
      }
      if (toolCallDelta.function.arguments) {
        existing.function.arguments =
          (existing.function.arguments || "") +
          toolCallDelta.function.arguments;
      }
    }

    this.accumulatedToolCalls.set(index, existing);
  }

  private flushAccumulatedToolCalls(): void {
    for (const [index, toolCall] of this.accumulatedToolCalls.entries()) {
      if (toolCall.id && toolCall.function?.name) {
        this.sendChunk({
          type: "tool_call",
          data: {
            id: toolCall.id,
            name: toolCall.function.name,
            arguments: toolCall.function.arguments || "{}",
            index,
          },
          timestamp: Date.now(),
        });
      }
    }
    this.accumulatedToolCalls.clear();
  }

  sendError(error: string): void {
    this.sendChunk({
      type: "error",
      data: error,
      timestamp: Date.now(),
    });
  }

  sendToolResult(toolCallId: string, result: unknown, error?: string): void {
    this.sendChunk({
      type: "tool_result",
      data: {
        toolCallId,
        result,
        error,
      },
      timestamp: Date.now(),
    });
  }

  reset(): void {
    this.accumulatedToolCalls.clear();
  }
}

export function createStreamingProcessor(
  connection: Connection,
  requestId: string,
): StreamingProcessor {
  return new StreamingProcessor(connection, requestId);
}
