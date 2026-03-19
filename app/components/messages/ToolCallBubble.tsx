import { useState } from "react";
import type { ToolCall } from "../../types";

interface ToolCallBubbleProps {
  toolCall: ToolCall;
}

export function ToolCallBubble({ toolCall }: ToolCallBubbleProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = () => {
    switch (toolCall.status) {
      case "pending":
        return (
          <svg className="w-4 h-4 text-yellow-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        );
      case "running":
        return (
          <svg className="w-4 h-4 text-blue-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case "completed":
        return (
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case "error":
        return (
          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
    }
  };

  const getStatusColor = () => {
    switch (toolCall.status) {
      case "pending": return "border-yellow-500/30 bg-yellow-500/5";
      case "running": return "border-blue-500/30 bg-blue-500/5";
      case "completed": return "border-green-500/30 bg-green-500/5";
      case "error": return "border-red-500/30 bg-red-500/5";
    }
  };

  const getStatusText = () => {
    switch (toolCall.status) {
      case "pending": return "Pending";
      case "running": return "Running";
      case "completed": return "Completed";
      case "error": return "Error";
    }
  };

  return (
    <div className={`my-2 rounded-lg border ${getStatusColor()} overflow-hidden`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-xs font-medium text-gray-300">Tool: {toolCall.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-400">
            {getStatusText()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500">{toolCall.id.slice(0, 8)}</span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-3 py-2 border-t border-white/10 space-y-2">
          {/* Arguments */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Arguments</div>
            <pre className="text-xs text-gray-300 font-mono bg-black/30 p-2 rounded overflow-x-auto">
              {JSON.stringify(toolCall.arguments, null, 2)}
            </pre>
          </div>

          {/* Result or Error */}
          {toolCall.status === "completed" && toolCall.result !== undefined && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Result</div>
              <pre className="text-xs text-green-300 font-mono bg-black/30 p-2 rounded overflow-x-auto max-h-40 overflow-y-auto">
                {typeof toolCall.result === "string" ? toolCall.result : JSON.stringify(toolCall.result, null, 2)}
              </pre>
            </div>
          )}

          {toolCall.status === "error" && toolCall.error && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-red-400 mb-1">Error</div>
              <div className="text-xs text-red-300 font-mono bg-red-500/10 p-2 rounded">
                {toolCall.error}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
