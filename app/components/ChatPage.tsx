import { useEffect, useCallback, useRef, useState } from "react";
import { useAgent } from "agents/react";
import { useChatStore, useUIStore } from "../stores";
import { MessageBubble } from "./messages";
import type { ChatMessage, StreamChunk } from "../types";

interface ChatPageProps {
  agentName: string;
  roomId: string;
}

export function ChatPage({ agentName, roomId }: ChatPageProps) {
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  // Store hooks
  const {
    messages,
    streamingMessageId,
    streamingContent,
    streamingReasoning,
    isLoading,
    isStreaming,
    error,
    addMessage,
    updateMessage,
    setStreamingMessageId,
    appendStreamingContent,
    appendStreamingReasoning,
    clearStreaming,
    setIsLoading,
    setIsStreaming,
    setError,
    clearMessages,
  } = useChatStore();

  const { inputValue, setInputValue, clearInput } = useUIStore();

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingToolResults = useRef<
    Map<
      string,
      {
        id: string;
        name: string;
        arguments: string;
        result?: unknown;
        error?: string;
      }
    >
  >(new Map());
  const hasAutoSentResults = useRef(false);

  // Auto-scroll to bottom only when new messages added (not during streaming)
  const prevMessagesLength = useRef(messages.length);

  useEffect(() => {
    const hasNewMessage = messages.length > prevMessagesLength.current;
    prevMessagesLength.current = messages.length;

    // Only scroll when:
    // 1. New message added (user sent or assistant started)
    // 2. Not actively streaming content
    if (messagesEndRef.current && hasNewMessage && !isStreaming) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isStreaming]);

  // Initialize streaming message when streaming starts
  useEffect(() => {
    if (isStreaming && !streamingMessageId) {
      const newId = crypto.randomUUID();
      setStreamingMessageId(newId);

      // Add initial streaming message
      const streamingMsg: ChatMessage = {
        id: newId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      };
      addMessage(streamingMsg);
    }
  }, [isStreaming, streamingMessageId, setStreamingMessageId, addMessage]);

  // Handle stream completion
  const handleStreamComplete = useCallback(() => {
    if (streamingMessageId) {
      // Update the message with final content and metadata
      const toolCalls = Array.from(pendingToolResults.current.values()).map(
        (tc) => ({
          id: tc.id,
          name: tc.name,
          arguments: JSON.parse(tc.arguments || "{}"),
          status: (tc.error ? "error" : "completed") as "error" | "completed",
          result: tc.result,
          error: tc.error,
        }),
      );

      updateMessage(streamingMessageId, {
        content: streamingContent,
        metadata: {
          reasoning: streamingReasoning || undefined,
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        },
      });
    }
  }, [streamingMessageId, streamingContent, streamingReasoning, updateMessage]);

  // Agent connection
  const agent = useAgent<Env>({
    agent: agentName,
    name: roomId,
    onMessage: (message) => {
      try {
        const chunk = JSON.parse(message.data) as StreamChunk;
        switch (chunk.type) {
          case "content": {
            // Auto-start streaming if receiving content while not streaming
            // (happens with server-side follow-up after tool execution)
            if (!isStreaming) {
              setIsStreaming(true);
              setIsLoading(true);
            }
            appendStreamingContent(chunk.data as string);
            break;
          }
          case "reasoning": {
            appendStreamingReasoning(chunk.data as string);
            break;
          }
          case "tool_call": {
            const toolCall = chunk.data as {
              id: string;
              name: string;
              arguments: string;
              index: number;
            };
            const existing = pendingToolResults.current.get(toolCall.id);
            if (existing) {
              existing.arguments += toolCall.arguments;
            } else {
              pendingToolResults.current.set(toolCall.id, {
                id: toolCall.id,
                name: toolCall.name,
                arguments: toolCall.arguments,
              });
            }
            hasAutoSentResults.current = false;
            break;
          }
          case "tool_result": {
            const result = chunk.data as {
              toolCallId: string;
              result: unknown;
              error?: string;
            };
            const existing = pendingToolResults.current.get(result.toolCallId);
            if (existing) {
              existing.result = result.result;
              existing.error = result.error;
            }
            break;
          }
          case "done": {
            handleStreamComplete();
            // Clear streaming state so follow-up can start fresh
            clearStreaming();
            setIsStreaming(false);
            setIsLoading(false);
            break;
          }
          case "error": {
            setError(chunk.data as string);
            setIsStreaming(false);
            setIsLoading(false);
            break;
          }
        }
      } catch (err) {
        console.error("Failed to parse message:", err);
      }
    },
    onError: (event) => {
      console.error("Agent error:", event);
      setError("Connection error. Please try again.");
      setIsLoading(false);
      setIsStreaming(false);
    },
    onOpen: () => {
      setIsConnected(true);
    },
    onClose: () => {
      setIsConnected(false);
    },
  });

  // Send message handler
  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim() || isLoading || isStreaming) return;

    // Create user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: inputValue.trim(),
      timestamp: Date.now(),
    };

    // Add to store
    addMessage(userMessage);

    // Send via agent
    agent.send(JSON.stringify(userMessage));

    // Clear input
    clearInput();

    // Set loading states
    setIsLoading(true);
    setIsStreaming(true);
    setError(null);

    // Reset accumulated tool calls
    pendingToolResults.current.clear();
    hasAutoSentResults.current = false;
  }, [
    inputValue,
    isLoading,
    isStreaming,
    agent,
    addMessage,
    clearInput,
    setIsLoading,
    setIsStreaming,
    setError,
  ]);

  // Handle input change with auto-resize
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputValue(e.target.value);

      // Auto-resize textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    },
    [setInputValue],
  );

  // Handle key press (Enter to send, Shift+Enter for new line)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage],
  );

  // Clear chat history
  const handleClearHistory = useCallback(() => {
    clearMessages();
    // Note: Agent state clearing should be handled server-side
  }, [clearMessages]);

  // Ensure connection is established immediately on mount
  useEffect(() => {
    // The useAgent hook connects automatically
  }, [agent]);

  // Reset loading states on mount to fix UI lock after refresh
  useEffect(() => {
    setIsLoading(false);
    setIsStreaming(false);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-linear-to-br from-black via-slate-950 to-black">
      {/* Header */}
      <header className="bg-black/60 backdrop-blur-lg border-b border-white/5 px-6 py-4 shadow-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Workers AI Chat</h1>
              <p className="text-xs text-orange-400/70">
                Streaming with Tools & Reasoning
              </p>
            </div>
          </div>

          <button
            onClick={handleClearHistory}
            className="px-4 py-2 bg-red-600/80 hover:bg-red-500 text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <span>Clear</span>
          </button>
        </div>
      </header>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Render messages */}
          {messages.map((message, index) => {
            const isLastAssistant =
              index === messages.length - 1 && message.role === "assistant";
            const displayMessage =
              isLastAssistant && isStreaming
                ? { ...message, content: streamingContent || message.content }
                : message;

            return (
              <MessageBubble
                key={message.id}
                message={displayMessage}
                isStreaming={isStreaming && isLastAssistant}
                streamingReasoning={
                  isLastAssistant ? streamingReasoning : undefined
                }
              />
            );
          })}

          {/* Error message */}
          {error && (
            <div className="flex justify-center">
              <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 text-sm">
                {error}
              </div>
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-white/5 bg-black/60 backdrop-blur-lg px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                placeholder={
                  isConnected
                    ? "Type your message... (Shift+Enter for new line)"
                    : "Connecting to agent..."
                }
                rows={1}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-3 bg-zinc-900/80 backdrop-blur-sm border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent resize-none max-h-32 shadow-lg"
                disabled={isLoading || !isConnected}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading || !isConnected}
              className="px-6 py-3 bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <span>
                {!isConnected
                  ? "Connecting..."
                  : isLoading
                    ? "Sending..."
                    : "Send"}
              </span>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
