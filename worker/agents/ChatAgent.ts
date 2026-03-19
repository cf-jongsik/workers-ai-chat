import {
  Agent,
  type Connection,
  type ConnectionContext,
  type WSMessage,
} from "agents";
import type {
  ChatAgentState,
  ChatMessage,
  StreamChunk,
  AIStreamChunk,
} from "../types";
import { toolRegistry } from "../tools";
import { createStreamingProcessor } from "../streaming/processor";
import { decodeAIStream } from "../lib/streamDecoder";
import { prompts } from "./prompts";

export class ChatAgent extends Agent<Env, ChatAgentState> {
  initialState: ChatAgentState = {
    messages: [],
    lastUpdate: new Date(),
  };

  onConnect(connection: Connection, ctx: ConnectionContext): void {
    // Send existing messages
    if (this.state.messages.length > 0) {
      for (const msg of this.state.messages) {
        const chunk: StreamChunk = {
          type: msg.role === "assistant" ? "content" : "content",
          data: msg.content,
          timestamp: msg.timestamp,
        };
        connection.send(JSON.stringify(chunk));
      }
    } else {
      // Send welcome message
      const welcomeMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "Hello! I'm an AI assistant with tool-calling capabilities. Ask me anything!",
        timestamp: Date.now(),
      };

      this.setState({
        messages: [welcomeMessage],
        lastUpdate: new Date(),
      });

      const chunk: StreamChunk = {
        type: "content",
        data: welcomeMessage.content,
        timestamp: welcomeMessage.timestamp,
      };
      connection.send(JSON.stringify(chunk));
    }
    // Send done to complete the welcome message
    connection.send(
      JSON.stringify({
        type: "done",
        data: null,
        timestamp: Date.now(),
      }),
    );
  }

  async onMessage(connection: Connection, message: WSMessage): Promise<void> {
    const requestId = crypto.randomUUID();

    const streamingProcessor = createStreamingProcessor(connection, requestId);

    try {
      // Validate AI service availability
      const { AI } = this.env;
      if (!AI) {
        console.error(`[${requestId}] AI service not available`);
        streamingProcessor.sendError("AI service is not available");
        return;
      }

      // Parse and validate incoming message
      let userMessage: ChatMessage;
      try {
        const parsed = JSON.parse(message.toString());
        userMessage = {
          id: parsed.id || crypto.randomUUID(),
          role: "user",
          content: parsed.content || String(parsed),
          timestamp: Date.now(),
        };
      } catch (parseError) {
        console.error(`[${requestId}] Failed to parse message:`, parseError);
        streamingProcessor.sendError("Invalid message format");
        return;
      }

      // Validate message content
      if (!userMessage.content || typeof userMessage.content !== "string") {
        console.error(`[${requestId}] Invalid message content:`, userMessage);
        streamingProcessor.sendError("Invalid message: content is required");
        return;
      }

      // Add user message to state
      this.setState({
        messages: [...this.state.messages, userMessage],
        lastUpdate: new Date(),
      });

      // Prepare conversation history
      const conversationHistory = this.state.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Get available tools
      const tools = toolRegistry.getToolDescriptions();

      // Call AI service with streaming
      try {
        // @ts-ignore - AI streaming API
        const stream = await AI.run("@cf/nvidia/nemotron-3-120b-a12b", {
          messages: [
            { role: "system", content: prompts },
            ...conversationHistory,
          ],
          max_tokens: 20000,
          reasoning_effort: "high",
          stream: true,
          tools: tools.length > 0 ? tools : undefined,
          tool_choice: tools.length > 0 ? "auto" : undefined,
        });

        // Process the stream using SSE decoder
        let fullContent = "";
        let fullReasoning = "";
        const toolCalls: Array<{
          id: string;
          name: string;
          arguments: string;
          result?: unknown;
          error?: string;
        }> = [];

        // Decode and process SSE stream
        for await (const streamChunk of decodeAIStream(
          stream as unknown as ReadableStream<Uint8Array>,
        )) {
          const typedChunk = streamChunk as AIStreamChunk;
          // Process content
          if (typedChunk.choices?.[0]?.delta?.content) {
            const content = typedChunk.choices[0].delta.content;
            fullContent += content;

            streamingProcessor.sendChunk({
              type: "content",
              data: content,
              timestamp: Date.now(),
            });
          }

          // Process reasoning
          if (typedChunk.choices?.[0]?.delta?.reasoning) {
            const reasoning = typedChunk.choices[0].delta.reasoning;
            fullReasoning += reasoning;

            streamingProcessor.sendChunk({
              type: "reasoning",
              data: reasoning,
              timestamp: Date.now(),
            });
          }

          // Process tool calls
          if (typedChunk.choices?.[0]?.delta?.tool_calls) {
            for (const toolCallDelta of typedChunk.choices[0].delta
              .tool_calls) {
              const index = toolCallDelta.index;

              if (!toolCalls[index]) {
                toolCalls[index] = {
                  id: toolCallDelta.id || crypto.randomUUID(),
                  name: "",
                  arguments: "",
                };
              }

              if (toolCallDelta.function?.name) {
                toolCalls[index].name = toolCallDelta.function.name;
              }
              if (toolCallDelta.function?.arguments) {
                toolCalls[index].arguments += toolCallDelta.function.arguments;
              }

              // Send tool_call chunk when first encountering a new tool call
              if (toolCallDelta.id) {
                streamingProcessor.sendChunk({
                  type: "tool_call",
                  data: {
                    id: toolCallDelta.id,
                    name: toolCallDelta.function?.name || "",
                    arguments: toolCallDelta.function?.arguments || "{}",
                    index,
                  },
                  timestamp: Date.now(),
                });
              }
            }
          }

          // Check for completion
          if (typedChunk.choices?.[0]?.finish_reason) {
            break;
          }
        }

        // Execute tool calls if any and continue conversation
        if (toolCalls.length > 0) {
          for (const toolCall of toolCalls) {
            if (!toolCall.name) continue;
            try {
              // Parse arguments
              const args = JSON.parse(toolCall.arguments || "{}");

              // Execute tool
              const result = await toolRegistry.execute(toolCall.name, args, {
                env: this.env,
                requestId,
              });

              toolCall.result = result.data;
              toolCall.error = result.error;
            } catch (toolError) {
              const error =
                toolError instanceof Error
                  ? toolError.message
                  : String(toolError);
              toolCall.error = error;
            }
          }

          // Update state with assistant response containing tool calls
          const assistantMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: fullContent,
            timestamp: Date.now(),
            metadata: {
              reasoning: fullReasoning || undefined,
              toolCalls:
                toolCalls.length > 0
                  ? toolCalls.map((tc) => ({
                      id: tc.id,
                      name: tc.name,
                      arguments: JSON.parse(tc.arguments || "{}"),
                      status: tc.error ? "error" : "completed",
                      result: tc.result,
                      error: tc.error,
                    }))
                  : undefined,
            },
          };

          this.setState({
            messages: [...this.state.messages, assistantMessage],
            lastUpdate: new Date(),
          });

          // Send tool results message to continue conversation
          streamingProcessor.sendChunk({
            type: "done",
            data: null,
            timestamp: Date.now(),
          });

          // Continue conversation with tool results
          const toolResultsContent = toolCalls
            .map(
              (tc) =>
                `- ${tc.name}: ${tc.error ? `Error: ${tc.error}` : JSON.stringify(tc.result, null, 2)}`,
            )
            .join("\n");

          const toolResultsMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content: `Tool results:\n${toolResultsContent}\n\nPlease interpret these results and provide a helpful response.`,
            timestamp: Date.now(),
          };

          // Add tool results to state
          this.setState({
            messages: [...this.state.messages, toolResultsMessage],
            lastUpdate: new Date(),
          });

          // Send follow-up request to AI
          const followUpHistory = this.state.messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          }));

          try {
            // AI streaming API
            const followUpStream = await AI.run(
              //@ts-ignore
              "@cf/nvidia/nemotron-3-120b-a12b",
              {
                messages: [
                  { role: "system", content: prompts },
                  ...followUpHistory,
                ],
                max_tokens: 20000,
                reasoning_effort: "high",
                stream: true,
              },
            );

            // Stream the follow-up response
            let followUpContent = "";
            let followUpReasoning = "";

            for await (const streamChunk of decodeAIStream(
              followUpStream as unknown as ReadableStream<Uint8Array>,
            )) {
              const typedChunk = streamChunk as AIStreamChunk;
              if (typedChunk.choices?.[0]?.delta?.content) {
                const content = typedChunk.choices[0].delta.content;
                followUpContent += content;
                streamingProcessor.sendChunk({
                  type: "content",
                  data: content,
                  timestamp: Date.now(),
                });
              }

              if (typedChunk.choices?.[0]?.delta?.reasoning) {
                const reasoning = typedChunk.choices[0].delta.reasoning;
                followUpReasoning += reasoning;
                streamingProcessor.sendChunk({
                  type: "reasoning",
                  data: reasoning,
                  timestamp: Date.now(),
                });
              }

              if (typedChunk.choices?.[0]?.finish_reason) {
                break;
              }
            }

            // Update state with follow-up response
            const followUpAssistantMessage: ChatMessage = {
              id: crypto.randomUUID(),
              role: "assistant",
              content: followUpContent,
              timestamp: Date.now(),
              metadata: {
                reasoning: followUpReasoning || undefined,
              },
            };

            this.setState({
              messages: [...this.state.messages, followUpAssistantMessage],
              lastUpdate: new Date(),
            });
          } catch (followUpError) {
            console.error(`[${requestId}] Follow-up AI error:`, followUpError);

            // Check for token limit error
            const errorMessage =
              followUpError instanceof Error
                ? followUpError.message
                : String(followUpError);
            const isTokenLimitError =
              errorMessage.includes(
                "exceeded this model context window limit",
              ) || errorMessage.includes("5021");

            if (isTokenLimitError) {
              // Send graceful message about token limit
              streamingProcessor.sendChunk({
                type: "content",
                data:
                  "\n\nI've successfully executed the requested tools and obtained the results. However, the conversation has become quite long and has reached the model's token limit for this follow-up response.\n\n**Tool Results Summary:**\n" +
                  toolCalls
                    .map(
                      (tc) =>
                        `- **${tc.name}**: ${tc.error ? "Failed - " + tc.error : "Completed successfully"}`,
                    )
                    .join("\n") +
                  "\n\nTo continue with a detailed analysis, please consider starting a new conversation or asking a more specific follow-up question.",
                timestamp: Date.now(),
              });

              // Update state with graceful response
              const gracefulMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: "assistant",
                content:
                  "Token limit reached after tool execution. Results were obtained but detailed interpretation could not be generated due to conversation length.",
                timestamp: Date.now(),
                metadata: {
                  toolCalls: toolCalls.map((tc) => ({
                    id: tc.id,
                    name: tc.name,
                    arguments: JSON.parse(tc.arguments || "{}"),
                    status: tc.error ? "error" : "completed",
                    result: tc.result,
                    error: tc.error,
                  })),
                },
              };

              this.setState({
                messages: [...this.state.messages, gracefulMessage],
                lastUpdate: new Date(),
              });
            } else {
              streamingProcessor.sendError(
                "Failed to interpret tool results. Please try again.",
              );
            }

            // Send final completion
            streamingProcessor.sendChunk({
              type: "done",
              data: null,
              timestamp: Date.now(),
            });
            return;
          }

          // Send final completion
          streamingProcessor.sendChunk({
            type: "done",
            data: null,
            timestamp: Date.now(),
          });
          return;
        }

        // Send completion for non-tool responses
        streamingProcessor.sendChunk({
          type: "done",
          data: null,
          timestamp: Date.now(),
        });

        // Update state with assistant response (no tools)
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: fullContent,
          timestamp: Date.now(),
          metadata: {
            reasoning: fullReasoning || undefined,
            toolCalls: undefined,
          },
        };

        this.setState({
          messages: [...this.state.messages, assistantMessage],
          lastUpdate: new Date(),
        });
      } catch (aiError) {
        console.error(`[${requestId}] AI service error:`, aiError);
        streamingProcessor.sendError(
          "Failed to process your request. Please try again.",
        );
      }
    } catch (error) {
      console.error(`[${requestId}] Unexpected error:`, error);
      streamingProcessor.sendError(
        "An unexpected error occurred. Please try again.",
      );
    }
  }

  onRequest(request: Request): Response | Promise<Response> {
    return new Response("not found", { status: 404 });
  }
}
