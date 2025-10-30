import { useAgent } from "agents/react";
import type { ModelMessage } from "ai";
import { useState, useEffect, useRef, useCallback, memo } from "react";
import { MessageBubble } from "./MessageBubble";

const MemoizedMessageBubble = memo(MessageBubble);

export function ChatPage({
  agentName,
  roomId,
}: {
  agentName: string;
  roomId: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [ready, setReady] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const agent = useAgent<chatAgentState>({
    agent: agentName,
    name: roomId,
    onMessage: (message) => {
      setReady(false);
      const msg = JSON.parse(message.data) as ModelMessage;
      const msgWithId = { ...msg, id: Date.now() + Math.random() }; // Add unique id
      setMessages((prev) => [...prev, msgWithId]);
      setError(false); // Reset error state on new message
      setIsLoading(false); // Reset loading state
      console.log("client got msg", message);
      setReady(true);
    },
    onError(event) {
      console.error(event);
      setError(true);
      setIsLoading(false); // Reset loading state
      setReady(false);
    },
  });

  const sendMsg = useCallback(() => {
    if (!input.trim()) return; // Prevent sending empty messages
    setIsLoading(true);
    setReady(false);
    const msg: ChatMessage = {
      role: "user",
      content: input,
      id: Date.now() + Math.random(), // Add unique id
    };
    agent.send(JSON.stringify(msg));
    setMessages((prev) => [...prev, msg]);
    setInput("");
    setError(false); // Reset error on send
  }, [input, agent]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height =
          textareaRef.current.scrollHeight + "px";
      }
    },
    []
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMsg();
      }
    },
    [sendMsg]
  );

  return (
    <div
      className="flex flex-col h-screen bg-linear-to-br from-black via-slate-950 to-black"
      role="main"
    >
      <header
        className="bg-black/60 backdrop-blur-lg border-b border-white/5 px-6 py-4 shadow-xl"
        role="banner"
      >
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg"
            aria-label="Chat application logo"
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
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
              Powered by Cloudflare Workers AI
            </p>
          </div>
        </div>
      </header>

      {/* Messages Container */}
      <div
        className="flex-1 overflow-y-auto px-4 py-6"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg) => (
            <MemoizedMessageBubble key={msg.id} message={msg} error={error} />
          ))}

          {error && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-3xl">
                <div className="shrink-0 w-8 h-8 rounded-lg bg-linear-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 5.636l-12.728 12.728m0 0L12 12m-6.364 6.364L12 12m6.364-6.364L12 12"
                    />
                  </svg>
                </div>
                <div className="px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-100">
                  <div className="text-sm font-medium animate-pulse">
                    Connection lost - Reconnecting...
                  </div>
                </div>
              </div>
            </div>
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-3xl">
                <div className="shrink-0 w-8 h-8 rounded-lg bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <div className="px-4 py-3 rounded-2xl bg-zinc-900/80 backdrop-blur-sm border border-white/5 shadow-lg">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" />
                    <div
                      className="w-2 h-2 rounded-full bg-orange-400 animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <div
                      className="w-2 h-2 rounded-full bg-orange-400 animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div
        className="border-t border-white/5 bg-black/60 backdrop-blur-lg px-4 py-4"
        role="complementary"
        aria-label="Message input area"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMsg();
          }}
          className="max-w-4xl mx-auto"
          aria-label="Send message form"
        >
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                placeholder="Type your message... (Shift+Enter for new line)"
                rows={1}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-3 bg-zinc-900/80 backdrop-blur-sm border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent resize-none max-h-32 shadow-lg"
                disabled={!ready}
                aria-label="Type your message"
                aria-describedby="message-instructions"
              />
              <div id="message-instructions" className="sr-only">
                Press Enter to send, Shift+Enter for new line
              </div>
            </div>
            <button
              type="submit"
              disabled={!ready || !input.trim() || isLoading}
              className="px-6 py-3 bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-2xl transition-all shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100 flex items-center gap-2"
              aria-label={
                isLoading
                  ? "Sending message..."
                  : !ready
                  ? "Connecting..."
                  : "Send message"
              }
            >
              <span>{isLoading ? "Sending..." : "Send"}</span>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
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
        </form>
      </div>
    </div>
  );
}
