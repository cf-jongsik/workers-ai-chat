import { useState, useEffect } from "react";

interface ReasoningBubbleProps {
  reasoning: string;
  isStreaming?: boolean;
}

export function ReasoningBubble({
  reasoning,
  isStreaming,
}: ReasoningBubbleProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!reasoning && !isStreaming) return null;

  return (
    <div className="my-2 rounded-lg border border-orange-500/20 bg-orange-500/5 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between bg-orange-500/10 hover:bg-orange-500/15 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-4 h-4 text-orange-400 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="text-xs font-medium text-orange-300">Reasoning</span>
          {isStreaming && (
            <span className="flex gap-1">
              <span
                className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </span>
          )}
        </div>
        <span className="text-[10px] text-orange-400/60">
          {isExpanded ? "Hide" : "Show"}
        </span>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-3 py-2">
          <div className="text-xs text-orange-200/80 font-mono leading-relaxed whitespace-pre-wrap">
            {reasoning}
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-orange-400/60 ml-1 animate-pulse" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
