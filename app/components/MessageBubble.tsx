import MarkDownToJSX from "markdown-to-jsx";

export function MessageBubble({ message, error }: MessageBubbleProps) {
  return (
    <div
      className={`flex ${
        message.role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
          message.role === "user"
            ? "bg-linear-to-br from-blue-500 to-cyan-500"
            : error
            ? "bg-linear-to-br from-red-500 to-orange-500"
            : "bg-linear-to-br from-orange-500 to-amber-500"
        } shadow-lg`}
      >
        {message.role === "user" ? (
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
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        ) : error ? (
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
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ) : (
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
        )}
      </div>
      <div
        className={`px-5 py-4 rounded-2xl ${
          message.role === "user"
            ? "bg-linear-to-br from-blue-600 to-cyan-600 text-white"
            : error
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
                    className: "text-2xl font-bold mt-4 mb-3 first:mt-0",
                  },
                },
                h2: {
                  props: {
                    className: "text-xl font-bold mt-4 mb-2 first:mt-0",
                  },
                },
                h3: {
                  props: {
                    className: "text-lg font-semibold mt-3 mb-2 first:mt-0",
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
                    className: "list-decimal list-inside space-y-1 my-3",
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
            {message.content.toString()}
          </MarkDownToJSX>
        </div>
      </div>
    </div>
  );
}
