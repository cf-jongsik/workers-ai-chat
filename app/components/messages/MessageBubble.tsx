import { memo, useMemo } from "react";
import MarkdownToJSX from "markdown-to-jsx";
import type { ChatMessage } from "../../types";
import { ReasoningBubble } from "./ReasoningBubble";
import { ToolCallBubble } from "./ToolCallBubble";

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
  streamingReasoning?: string;
}

// Get avatar styles based on message role
const getAvatarStyles = (role: string) => {
  if (role === "user") {
    return "bg-gradient-to-br from-blue-500 to-cyan-500";
  }
  return "bg-gradient-to-br from-orange-500 to-amber-500";
};

// Get bubble styles based on message role
const getBubbleStyles = (role: string) => {
  if (role === "user") {
    return "bg-gradient-to-br from-sky-600 to-cyan-600 text-white border border-cyan-300/30";
  }
  // Assistant: Rich gradient with glow effect
  return "bg-gradient-to-br from-zinc-900 via-zinc-800/95 to-zinc-900 backdrop-blur-xl border border-orange-500/20 text-gray-100 shadow-[0_0_30px_rgba(249,115,22,0.1)]";
};

// Get bubble radius styles
const getBubbleRadiusStyles = (role: string) => {
  if (role === "user") {
    return "rounded-3xl rounded-br-lg";
  }
  return "rounded-3xl rounded-bl-lg";
};

// Icon components
const UserIcon = () => (
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
);

const AssistantIcon = () => (
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
);

// Markdown options with custom components
const markdownOptions = {
  forceBlock: true,
  disableParsingRawHTML: true,
  overrides: {
    h1: {
      component: ({ children }: { children: React.ReactNode }) => (
        <h1 className="text-2xl font-bold mt-4 mb-3 text-transparent bg-clip-text bg-linear-to-r from-orange-300 via-amber-200 to-orange-300 border-b border-orange-500/20 pb-2">
          {children}
        </h1>
      ),
    },
    h2: {
      component: ({ children }: { children: React.ReactNode }) => (
        <h2 className="text-xl font-bold mt-3 mb-2 text-transparent bg-clip-text bg-linear-to-r from-amber-200 to-orange-300">
          {children}
        </h2>
      ),
    },
    h3: {
      component: ({ children }: { children: React.ReactNode }) => (
        <h3 className="text-lg font-semibold mt-3 mb-2 text-orange-300">
          {children}
        </h3>
      ),
    },
    p: {
      component: ({ children }: { children: React.ReactNode }) => (
        <p className="leading-7 my-3 text-gray-100 whitespace-pre-wrap">
          {children}
        </p>
      ),
    },
    ul: {
      component: ({ children }: { children: React.ReactNode }) => (
        <ul className="space-y-2 my-3 ml-4 list-disc marker:text-orange-400">
          {children}
        </ul>
      ),
    },
    ol: {
      component: ({ children }: { children: React.ReactNode }) => (
        <ol className="space-y-2 my-3 ml-4 list-decimal marker:text-orange-400">
          {children}
        </ol>
      ),
    },
    li: {
      component: ({ children }: { children: React.ReactNode }) => (
        <li className="text-gray-200 my-1 pl-1">{children}</li>
      ),
    },
    code: {
      component: ({
        children,
        className,
      }: {
        children: React.ReactNode;
        className?: string;
      }) => {
        const isInline = !className;
        if (isInline) {
          return (
            <code className="bg-orange-500/20 px-1.5 py-0.5 rounded text-sm font-mono text-orange-300">
              {children}
            </code>
          );
        }
        return (
          <code className="text-sm font-mono text-gray-200">{children}</code>
        );
      },
    },
    pre: {
      component: ({ children }: { children: React.ReactNode }) => (
        <pre className="bg-black/50 p-3 rounded-lg overflow-x-auto my-3 border border-white/10">
          {children}
        </pre>
      ),
    },
    a: {
      component: ({
        children,
        href,
      }: {
        children: React.ReactNode;
        href: string;
      }) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-orange-300 hover:text-orange-200 underline"
        >
          {children}
        </a>
      ),
    },
    blockquote: {
      component: ({ children }: { children: React.ReactNode }) => (
        <blockquote className="border-l-4 border-orange-400 pl-4 py-3 my-4 bg-linear-to-r from-orange-500/10 to-amber-500/5 italic rounded-r shadow-inner">
          {children}
        </blockquote>
      ),
    },
    hr: {
      component: () => (
        <hr className="my-4 border-0 h-px bg-linear-to-r from-transparent via-orange-500/50 to-transparent" />
      ),
    },
    strong: {
      component: ({ children }: { children: React.ReactNode }) => (
        <strong className="text-amber-200 font-semibold">{children}</strong>
      ),
    },
    em: {
      component: ({ children }: { children: React.ReactNode }) => (
        <em className="text-orange-200/90 italic">{children}</em>
      ),
    },
    table: {
      component: ({ children }: { children: React.ReactNode }) => (
        <div className="overflow-x-auto my-4 rounded-lg border border-orange-500/30 shadow-lg shadow-black/20">
          <table className="w-full text-sm border-collapse">{children}</table>
        </div>
      ),
    },
    thead: {
      component: ({ children }: { children: React.ReactNode }) => (
        <thead className="bg-linear-to-r from-orange-500/25 to-amber-500/15 text-orange-100">
          {children}
        </thead>
      ),
    },
    th: {
      component: ({ children }: { children: React.ReactNode }) => (
        <th className="px-4 py-3 text-left font-bold border-b-2 border-orange-500/40 text-orange-100 tracking-wide">
          {children}
        </th>
      ),
    },
    td: {
      component: ({ children }: { children: React.ReactNode }) => (
        <td className="px-4 py-3 border-b border-white/10 text-gray-100 leading-relaxed">
          {children}
        </td>
      ),
    },
    tr: {
      component: ({ children }: { children: React.ReactNode }) => (
        <tr className="even:bg-white/3 hover:bg-orange-500/10 transition-colors duration-200">
          {children}
        </tr>
      ),
    },
    tbody: {
      component: ({ children }: { children: React.ReactNode }) => (
        <tbody className="bg-zinc-900/50">{children}</tbody>
      ),
    },
    br: {
      component: () => <br className="block my-2" />,
    },
  },
};

export const MessageBubble = memo(function MessageBubble({
  message,
  isStreaming,
  streamingReasoning,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const avatarStyles = getAvatarStyles(message.role);
  const bubbleStyles = getBubbleStyles(message.role);
  const bubbleRadiusStyles = getBubbleRadiusStyles(message.role);

  // Extract content from various message formats and preserve line breaks
  const processedContent = useMemo(() => {
    let rawContent = "";
    if (typeof message.content === "string") {
      rawContent = message.content;
    } else if (Array.isArray(message.content)) {
      rawContent = message.content
        .map((part) => {
          if (typeof part === "string") return part;
          if (part && typeof part === "object" && "text" in part) {
            return String(part.text);
          }
          return "";
        })
        .join("");
    }

    // Convert multiple consecutive newlines to <br> tags to preserve spacing
    // This ensures empty lines from the AI are visible in the UI
    return rawContent.replace(/\n\n+/g, (match) => {
      const brCount = Math.min(match.length - 1, 3); // Cap at 3 line breaks
      return "\n" + "<br>".repeat(brCount) + "\n";
    });
  }, [message.content]);

  const roleLabel = isUser ? "You" : "Assistant";

  return (
    <div className={`group flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex gap-3 max-w-[85%] ${isUser ? "flex-row-reverse" : ""}`}
      >
        {/* Avatar */}
        <div
          className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${avatarStyles} shadow-lg`}
        >
          {isUser ?
            <UserIcon />
          : <AssistantIcon />}
        </div>

        {/* Message Bubble */}
        <div
          className={`${bubbleRadiusStyles} ${bubbleStyles} shadow-lg overflow-hidden`}
        >
          {/* Header */}
          <div
            className={`px-4 py-2 border-b border-white/10 ${isUser ? "bg-white/5" : "bg-linear-to-r from-orange-500/10 via-amber-500/5 to-transparent"}`}
          >
            <span
              className={`text-xs font-medium ${isUser ? "text-white/80" : "text-orange-300"}`}
            >
              {roleLabel}
            </span>
          </div>

          {/* Content */}
          <div className="px-4 py-3">
            {/* Reasoning (only for assistant messages) */}
            {!isUser && (streamingReasoning || message.metadata?.reasoning) && (
              <ReasoningBubble
                reasoning={
                  streamingReasoning || message.metadata?.reasoning || ""
                }
                isStreaming={isStreaming && !!streamingReasoning}
              />
            )}

            {/* Main content */}
            <div className="prose prose-invert max-w-none">
              <MarkdownToJSX {...markdownOptions}>
                {processedContent || "_No content_"}
              </MarkdownToJSX>
            </div>

            {/* Tool calls */}
            {!isUser &&
              message.metadata?.toolCalls &&
              message.metadata.toolCalls.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.metadata.toolCalls.map((toolCall) => (
                    <ToolCallBubble key={toolCall.id} toolCall={toolCall} />
                  ))}
                </div>
              )}

            {/* Streaming indicator */}
            {isStreaming && !isUser && (
              <div className="flex gap-1 mt-2">
                <span
                  className="w-2 h-2 rounded-full bg-orange-400 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-2 h-2 rounded-full bg-orange-400 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-2 h-2 rounded-full bg-orange-400 animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
