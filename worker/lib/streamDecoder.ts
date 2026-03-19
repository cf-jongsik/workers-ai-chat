import type { AIStreamChunk } from "../types";

/**
 * Decodes a ReadableStream from Cloudflare AI streaming API
 * Parses SSE (Server-Sent Events) format: data: {...}\n\n
 */
export async function* decodeAIStream(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<AIStreamChunk, void, unknown> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE events in buffer
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      let currentData: string | null = null;

      for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed === "") {
          // Empty line means end of event - process accumulated data
          if (currentData) {
            try {
              // Handle [DONE] marker
              if (currentData === "[DONE]") {
                return;
              }

              const chunk = JSON.parse(currentData) as AIStreamChunk;
              yield chunk;
            } catch (parseError) {
              console.error("Failed to parse SSE data:", currentData, parseError);
            }
            currentData = null;
          }
        } else if (trimmed.startsWith("data: ")) {
          // Extract data from SSE format
          currentData = trimmed.slice(6);
        }
        // Ignore other SSE fields (id:, event:, retry:)
      }
    }

    // Process any remaining data in buffer
    if (buffer.trim()) {
      const trimmed = buffer.trim();
      if (trimmed.startsWith("data: ")) {
        const data = trimmed.slice(6);
        if (data && data !== "[DONE]") {
          try {
            const chunk = JSON.parse(data) as AIStreamChunk;
            yield chunk;
          } catch (parseError) {
            console.error("Failed to parse final SSE data:", data, parseError);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Alternative: Handle the CF AI response which may return chunks directly
 * depending on the runtime environment
 */
export async function* readAIStream(
  response: unknown,
): AsyncGenerator<AIStreamChunk, void, unknown> {
  // If it's already an async iterable (some CF environments do this)
  if (Symbol.asyncIterator in (response as AsyncIterable<unknown>)) {
    for await (const chunk of response as AsyncIterable<unknown>) {
      yield chunk as AIStreamChunk;
    }
    return;
  }

  // If it's a ReadableStream
  if (response instanceof ReadableStream) {
    yield* decodeAIStream(response);
    return;
  }

  // If it's a Response object with a body
  const resp = response as Response;
  if (resp.body) {
    yield* decodeAIStream(resp.body);
    return;
  }

  throw new Error("Unsupported stream format");
}
