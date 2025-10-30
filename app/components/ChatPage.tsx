import MarkDownToJSX from "markdown-to-jsx";
import { useEffect, useRef } from "react";
import { useAgentChat } from "agents/ai-react";
import { useAgent } from "agents/react";
import type { ModelMessage } from "ai";
import type { UIMessage } from "ai";

export async function ChatPage({
  agentName,
  roomId,
}: {
  agentName: string;
  roomId: string;
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  console.log("test");
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messagesEndRef]);

  const agent = useAgent({ agent: agentName, id: roomId });
  const { messages, sendMessage, status } = useAgentChat<
    ModelMessage,
    UIMessage<ModelMessage>
  >({ agent });

  console.log(messages);

  return (
    <div className="flex flex-col h-screen bg-linear-to-br from-black via-slate-950 to-black">
      {/* Header */}
      <header className="bg-black/60 backdrop-blur-lg border-b border-white/5 px-6 py-4 shadow-xl">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
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
              Powered by Cloudflare Workers AI
            </p>
          </div>
        </div>
      </header>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full space-y-6 py-20">
              <div className="w-20 h-20 rounded-2xl bg-orange-500/10 flex items-center justify-center backdrop-blur-sm border border-orange-500/20">
                <svg
                  className="w-10 h-10 text-orange-400/70"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-white">
                  Welcome to Workers AI Chat
                </h2>
                <p className="text-gray-400 max-w-md">
                  Start a conversation with AI. Ask me anything!
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                {[
                  { icon: "💡", text: "Explain quantum computing" },
                  { icon: "🎨", text: "Help me write a poem" },
                  { icon: "💻", text: "Debug my JavaScript code" },
                  { icon: "🌍", text: "Teach me about climate change" },
                ].map((example, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      sendMessage({
                        text: example.text,
                      });
                    }}
                    className="p-4 rounded-xl bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 text-left transition-all hover:scale-105 hover:shadow-xl group"
                  >
                    <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">
                      {example.icon}
                    </span>
                    <span className="text-sm text-gray-300">
                      {example.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex gap-3 max-w-3xl ${
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                    msg.role === "user"
                      ? "bg-linear-to-br from-blue-500 to-cyan-500"
                      : status === "error"
                      ? "bg-linear-to-br from-red-500 to-orange-500"
                      : "bg-linear-to-br from-orange-500 to-amber-500"
                  } shadow-lg`}
                >
                  {msg.role === "user" ? (
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  ) : status === "error" ? (
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  )}
                </div>
                <div
                  className={`px-5 py-4 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-linear-to-br from-blue-600 to-cyan-600 text-white"
                      : status === "error"
                      ? "bg-red-500/10 border border-red-500/30 text-red-100"
                      : "bg-zinc-900/80 backdrop-blur-sm border border-white/5 text-gray-100"
                  } shadow-lg`}
                >
                  <div className="prose prose-invert max-w-none">
                    <MarkDownToJSX
                      options={{
                        overrides: {
                          h1: {
                            props: {
                              className:
                                "text-2xl font-bold mt-4 mb-3 first:mt-0",
                            },
                          },
                          h2: {
                            props: {
                              className:
                                "text-xl font-bold mt-4 mb-2 first:mt-0",
                            },
                          },
                          h3: {
                            props: {
                              className:
                                "text-lg font-semibold mt-3 mb-2 first:mt-0",
                            },
                          },
                          p: {
                            props: {
                              className: "leading-7 my-2 first:mt-0 last:mb-0",
                            },
                          },
                          ul: {
                            props: {
                              className: "list-disc list-inside space-y-1 my-3",
                            },
                          },
                          ol: {
                            props: {
                              className:
                                "list-decimal list-inside space-y-1 my-3",
                            },
                          },
                          li: {
                            props: {
                              className: "leading-7",
                            },
                          },
                          a: {
                            props: {
                              className:
                                "text-orange-300 hover:text-orange-200 underline font-medium",
                              target: "_blank",
                              rel: "noopener noreferrer",
                            },
                          },
                          code: {
                            props: {
                              className:
                                "bg-black/60 px-2 py-1 rounded text-sm font-mono text-orange-300 border border-white/10",
                            },
                          },
                          pre: {
                            component: ({ children, ...props }: any) => (
                              <pre
                                {...props}
                                className="bg-black/60 p-4 rounded-xl overflow-x-auto my-4 border border-white/10"
                              >
                                <code className="text-sm font-mono leading-relaxed block text-gray-200">
                                  {children}
                                </code>
                              </pre>
                            ),
                          },
                          blockquote: {
                            props: {
                              className:
                                "border-l-4 border-orange-500/50 pl-4 py-2 my-3 italic bg-black/40 rounded-r",
                            },
                          },
                          strong: {
                            props: {
                              className: "font-bold text-white",
                            },
                          },
                          em: {
                            props: {
                              className: "italic",
                            },
                          },
                        },
                      }}
                    >
                      {msg.parts
                        .map((part) => {
                          if (part.type === "text") return part.text;
                        })
                        .join("")}
                    </MarkDownToJSX>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {status === "streaming" && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-3xl">
                <div className="shrink-0 w-8 h-8 rounded-lg bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
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
      <div className="border-t border-white/5 bg-black/60 backdrop-blur-lg px-4 py-4">
        <form onSubmit={() => sendMessage()} className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                placeholder="Type your message... (Shift+Enter for new line)"
                rows={1}
                className="w-full px-4 py-3 bg-zinc-900/80 backdrop-blur-sm border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent resize-none max-h-32 shadow-lg"
                disabled={status === "streaming"}
              />
            </div>
            <button
              type="submit"
              disabled={status === "streaming"}
              className="px-6 py-3 bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-2xl transition-all shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100 flex items-center gap-2"
            >
              <span>Send</span>
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
        </form>
      </div>
    </div>
  );
}
