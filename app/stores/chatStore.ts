import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { ChatMessage } from "../types";

interface ChatState {
  // Messages
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  removeMessage: (id: string) => void;
  setMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;

  // Streaming state
  streamingMessageId: string | null;
  streamingContent: string;
  streamingReasoning: string;
  setStreamingMessageId: (id: string | null) => void;
  appendStreamingContent: (content: string) => void;
  appendStreamingReasoning: (reasoning: string) => void;
  clearStreaming: () => void;

  // Loading states
  isLoading: boolean;
  isStreaming: boolean;
  setIsLoading: (loading: boolean) => void;
  setIsStreaming: (streaming: boolean) => void;

  // Error handling
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useChatStore = create<ChatState>()(
  devtools(
    (set) => ({
      // Initial state
      messages: [],
      streamingMessageId: null,
      streamingContent: "",
      streamingReasoning: "",
      isLoading: false,
      isStreaming: false,
      error: null,

      // Message actions
      addMessage: (message) =>
        set(
          (state): Partial<ChatState> => ({
            messages: [...state.messages, message],
          }),
        ),

      updateMessage: (id, updates) =>
        set(
          (state): Partial<ChatState> => ({
            messages: state.messages.map((msg) =>
              msg.id === id ? ({ ...msg, ...updates } as ChatMessage) : msg,
            ),
          }),
        ),

      removeMessage: (id) =>
        set(
          (state): Partial<ChatState> => ({
            messages: state.messages.filter((msg) => msg.id !== id),
          }),
        ),

      setMessages: (messages) => set({ messages }),

      clearMessages: () =>
        set({
          messages: [],
          streamingMessageId: null,
          streamingContent: "",
          streamingReasoning: "",
        }),

      // Streaming actions
      setStreamingMessageId: (id) => set({ streamingMessageId: id }),

      appendStreamingContent: (content) =>
        set((state) => ({
          streamingContent: state.streamingContent + content,
        })),

      appendStreamingReasoning: (reasoning) =>
        set((state) => ({
          streamingReasoning: state.streamingReasoning + reasoning,
        })),

      clearStreaming: () =>
        set({
          streamingMessageId: null,
          streamingContent: "",
          streamingReasoning: "",
        }),

      // Loading actions
      setIsLoading: (isLoading) => set({ isLoading }),
      setIsStreaming: (isStreaming) => set({ isStreaming }),

      // Error actions
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    { name: "chat-store" },
  ),
);
