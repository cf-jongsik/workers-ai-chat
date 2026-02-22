import MarkDownToJSX from "markdown-to-jsx";
import { Children, useMemo, useState } from "react";

// Avatar styles based on message type and error state
const getAvatarStyles = (role: string, hasError: boolean) => {
  if (role === "user") {
    return "bg-linear-to-br from-blue-500 to-cyan-500";
  }
  return hasError ?
      "bg-linear-to-br from-red-500 to-orange-500"
    : "bg-linear-to-br from-orange-500 to-amber-500";
};

// Message bubble styles based on message type and error state
const getBubbleStyles = (role: string, hasError: boolean) => {
  if (role === "user") {
    return "bg-linear-to-br from-sky-600 to-cyan-600 text-white border border-cyan-300/30";
  }
  return hasError ?
      "bg-red-500/10 border border-red-500/30 text-red-100"
    : "bg-zinc-900/85 backdrop-blur-sm border border-white/10 text-gray-100";
};

const getBubbleRadiusStyles = (role: string) => {
  if (role === "user") {
    return "rounded-3xl rounded-br-lg";
  }
  return "rounded-3xl rounded-bl-lg";
};

const stringifyUnknown = (value: unknown) => {
  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const toCodeText = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => toCodeText(item)).join("");
  }

  if (value == null) {
    return "";
  }

  return String(value);
};

const getLanguageFromClassName = (className?: string) => {
  if (!className) {
    return "";
  }

  const match = className.match(/(?:language|lang)-([\w-]+)/i);
  return match?.[1] ?? "";
};

const toMarkdownPart = (part: unknown): string => {
  if (typeof part === "string") {
    return part;
  }

  if (part == null) {
    return "";
  }

  if (Array.isArray(part)) {
    return part
      .map((item) => toMarkdownPart(item))
      .filter(Boolean)
      .join("\n\n");
  }

  if (typeof part !== "object") {
    return String(part);
  }

  const partRecord = part as Record<string, unknown>;

  if (typeof partRecord.text === "string") {
    return partRecord.text;
  }

  if (typeof partRecord.reasoning === "string") {
    return partRecord.reasoning;
  }

  if (typeof partRecord.content === "string") {
    return partRecord.content;
  }

  if (Array.isArray(partRecord.content)) {
    return partRecord.content
      .map((item) => toMarkdownPart(item))
      .filter(Boolean)
      .join("\n\n");
  }

  if (partRecord.type === "tool-call") {
    const toolName =
      typeof partRecord.toolName === "string" ? partRecord.toolName : "tool";
    return `**Tool call - \`${toolName}\`**\n\n\`\`\`json\n${stringifyUnknown(partRecord.args ?? {})}\n\`\`\``;
  }

  if (partRecord.type === "tool-result") {
    const toolName =
      typeof partRecord.toolName === "string" ? partRecord.toolName : "tool";
    return `**Tool result - \`${toolName}\`**\n\n\`\`\`json\n${stringifyUnknown(partRecord.result)}\n\`\`\``;
  }

  return stringifyUnknown(partRecord);
};

const toMarkdownContent = (content: ChatMessage["content"]): string => {
  const normalized = toMarkdownPart(content)
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();

  return normalized;
};

// Icon components for better organization
const UserIcon = () => (
  <svg
    className="w-5 h-5 text-white transition-transform duration-200 group-hover:scale-110"
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
);

const ErrorIcon = () => (
  <svg
    className="w-5 h-5 text-white transition-transform duration-200 group-hover:scale-110"
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
);

const AssistantIcon = () => (
  <svg
    className="w-5 h-5 text-white transition-transform duration-200 group-hover:scale-110"
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
);

// Custom components for enhanced markdown rendering
const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-6 right-3 px-2 py-1 text-xs bg-black/40 hover:bg-black/60 text-gray-300 hover:text-white rounded transition-all duration-200 opacity-0 group-hover:opacity-100"
      title="Copy code"
    >
      {copied ? "✓" : "📋"}
    </button>
  );
};

const TableComponent = ({ children, ...props }: any) => (
  <div className="overflow-x-auto my-6 rounded-xl border border-white/10 shadow-lg">
    <table className="min-w-full border-collapse" {...props}>
      {children}
    </table>
  </div>
);

const TableHead = ({ children, ...props }: any) => (
  <thead
    className="bg-linear-to-r from-orange-500/20 to-amber-500/20 border-b border-white/20"
    {...props}
  >
    {children}
  </thead>
);

const TableBody = ({ children, ...props }: any) => (
  <tbody className="divide-y divide-white/5 bg-black/20" {...props}>
    {children}
  </tbody>
);

const TableRow = ({ children, ...props }: any) => {
  const isBodyRow = props["data-row-type"] !== "header";
  return (
    <tr
      className={`hover:bg-white/10 transition-colors duration-150 ${
        isBodyRow ? "even:bg-white/3" : ""
      }`}
      {...props}
    >
      {children}
    </tr>
  );
};

const TableCell = ({ children, ...props }: any) => (
  <td
    className="px-4 py-3 text-sm border-r border-white/5 last:border-r-0"
    {...props}
  >
    {children}
  </td>
);

const TableHeaderCell = ({ children, ...props }: any) => (
  <th
    className="px-4 py-3 text-sm font-bold text-left border-r border-white/5 last:border-r-0 text-orange-200 uppercase tracking-wide"
    {...props}
  >
    {children}
  </th>
);

// Enhanced markdown options with custom components
const MARKDOWN_OPTIONS = {
  forceBlock: true,
  disableParsingRawHTML: true,
  overrides: {
    h1: {
      component: ({ children, ...props }: any) => (
        <h1
          className="text-3xl font-bold mt-6 mb-4 first:mt-0 text-white border-b border-white/10 pb-2"
          {...props}
        >
          {children}
        </h1>
      ),
    },
    h2: {
      component: ({ children, ...props }: any) => (
        <h2
          className="text-2xl font-bold mt-5 mb-3 first:mt-0 text-white border-b border-white/5 pb-1"
          {...props}
        >
          {children}
        </h2>
      ),
    },
    h3: {
      component: ({ children, ...props }: any) => (
        <h3
          className="text-xl font-semibold mt-5 mb-3 first:mt-0 text-orange-200 flex items-center gap-2"
          {...props}
        >
          <span className="w-1 h-6 bg-linear-to-b from-orange-400 to-amber-500 rounded-full"></span>
          {children}
        </h3>
      ),
    },
    h4: {
      component: ({ children, ...props }: any) => (
        <h4
          className="text-lg font-semibold mt-4 mb-2 first:mt-0 text-orange-300"
          {...props}
        >
          {children}
        </h4>
      ),
    },
    h5: {
      component: ({ children, ...props }: any) => (
        <h5
          className="text-base font-semibold mt-3 mb-2 first:mt-0 text-orange-400"
          {...props}
        >
          {children}
        </h5>
      ),
    },
    h6: {
      component: ({ children, ...props }: any) => (
        <h6
          className="text-sm font-semibold mt-3 mb-2 first:mt-0 text-gray-300 uppercase tracking-wider"
          {...props}
        >
          {children}
        </h6>
      ),
    },
    p: {
      component: ({ children, ...props }: any) => (
        <p
          className="leading-8 my-3 first:mt-0 last:mb-0 text-gray-100 text-base"
          {...props}
        >
          {children}
        </p>
      ),
    },
    ul: {
      component: ({ children, ...props }: any) => {
        // Check if it's a task list by looking for checkbox inputs in children
        const listItems = Children.toArray(children);
        const hasCheckboxes = listItems.some((child: any) =>
          Children.toArray(child?.props?.children).some(
            (item: any) =>
              item?.type === "input" && item?.props?.type === "checkbox",
          ),
        );

        return (
          <ul
            className={
              hasCheckboxes ? "space-y-2 my-4 ml-2" : "space-y-2 my-4 ml-1"
            }
            {...props}
          >
            {children}
          </ul>
        );
      },
    },
    ol: {
      component: ({ children, ...props }: any) => (
        <ol className="space-y-2 my-4 ml-1" {...props}>
          {children}
        </ol>
      ),
    },
    li: {
      component: ({ children, ...props }: any) => {
        const normalizedChildren = Children.toArray(children);

        // Check if this is a task list item
        const hasCheckbox = normalizedChildren.some(
          (child: any) =>
            child?.type === "input" && child?.props?.type === "checkbox",
        );

        if (hasCheckbox) {
          return (
            <li
              className="flex items-start gap-2 leading-7 text-gray-200 list-none"
              {...props}
            >
              {normalizedChildren}
            </li>
          );
        }

        return (
          <li
            className="leading-7 text-gray-200 marker:text-orange-400 marker:text-lg ml-6"
            {...props}
          >
            <span className="pl-2">{normalizedChildren}</span>
          </li>
        );
      },
    },
    input: {
      component: ({ type, checked, ...props }: any) => {
        if (type === "checkbox") {
          return (
            <input
              type="checkbox"
              checked={checked}
              disabled
              className="mt-1.5 w-4 h-4 rounded border-2 border-orange-400 bg-black/60 checked:bg-orange-500 checked:border-orange-500 cursor-default"
              {...props}
            />
          );
        }
        return <input type={type} {...props} />;
      },
    },
    a: {
      component: ({ children, href, ...props }: any) => (
        <a
          href={href}
          className="text-orange-300 hover:text-orange-200 underline font-medium transition-colors duration-200 inline-flex items-center gap-1"
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      ),
    },
    code: {
      component: ({ children, className, ...props }: any) => {
        const language = getLanguageFromClassName(className);
        const isInline = !language;
        return isInline ?
            <code
              className="bg-linear-to-r from-orange-500/20 to-amber-500/20 px-2 py-0.5 rounded-md text-sm font-mono text-orange-300 border border-orange-500/30 hover:border-orange-400/50 transition-all duration-200 shadow-sm"
              {...props}
            >
              {children}
            </code>
          : <code
              className="text-sm font-mono leading-relaxed block text-gray-200"
              data-language={language || undefined}
              {...props}
            >
              {children}
            </code>;
      },
    },
    pre: {
      component: ({ children, ...props }: any) => {
        const codeLanguage = getLanguageFromClassName(
          children?.props?.className,
        );
        const codeContent = toCodeText(children?.props?.children);

        return (
          <div className="relative group my-6">
            {codeLanguage && (
              <span className="absolute right-3 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide rounded bg-white/10 text-orange-200 border border-white/15 z-10">
                {codeLanguage}
              </span>
            )}
            <pre
              className="bg-linear-to-br from-black/80 to-black/60 p-5 pt-10 rounded-xl overflow-x-auto border border-white/10 hover:border-orange-500/30 transition-all duration-300 shadow-xl backdrop-blur-sm"
              {...props}
            >
              {children}
            </pre>
            <CopyButton text={codeContent} />
          </div>
        );
      },
    },
    blockquote: {
      component: ({ children, ...props }: any) => (
        <blockquote
          className="border-l-4 border-orange-500 pl-6 pr-4 py-4 my-6 italic bg-linear-to-r from-orange-500/10 to-transparent rounded-r-lg relative shadow-lg"
          {...props}
        >
          <div className="absolute -left-3 top-4 w-6 h-6 bg-linear-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
            <svg
              className="w-3 h-3 text-black"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M14,17H17L19,13V7H13V13H16M6,17H9L11,13V7H5V13H8L6,17Z" />
            </svg>
          </div>
          <div className="text-gray-200 text-base leading-relaxed">
            {children}
          </div>
        </blockquote>
      ),
    },
    strong: {
      component: ({ children, ...props }: any) => (
        <strong className="font-bold text-white" {...props}>
          {children}
        </strong>
      ),
    },
    em: {
      component: ({ children, ...props }: any) => (
        <em className="italic text-orange-200" {...props}>
          {children}
        </em>
      ),
    },
    hr: {
      component: () => (
        <hr className="border-0 border-t border-white/10 my-6" />
      ),
    },
    table: {
      component: TableComponent,
    },
    thead: {
      component: TableHead,
    },
    tbody: {
      component: TableBody,
    },
    tr: {
      component: TableRow,
    },
    td: {
      component: TableCell,
    },
    th: {
      component: TableHeaderCell,
    },
    del: {
      component: ({ children, ...props }: any) => (
        <del className="line-through text-gray-400 opacity-70" {...props}>
          {children}
        </del>
      ),
    },
    img: {
      component: ({ src, alt, title, ...props }: any) => (
        <div className="my-6 rounded-xl overflow-hidden border border-white/10 shadow-lg group">
          <img
            src={src}
            alt={alt || "Image"}
            title={title}
            className="w-full h-auto transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            {...props}
          />
          {(alt || title) && (
            <div className="bg-black/60 px-4 py-2 text-sm text-gray-300 text-center border-t border-white/5">
              {title || alt}
            </div>
          )}
        </div>
      ),
    },
    kbd: {
      component: ({ children, ...props }: any) => (
        <kbd
          className="inline-flex items-center px-2 py-1 text-xs font-mono font-semibold text-white bg-linear-to-b from-gray-700 to-gray-800 border border-gray-600 rounded shadow-md hover:shadow-lg transition-shadow duration-200"
          {...props}
        >
          {children}
        </kbd>
      ),
    },
    mark: {
      component: ({ children, ...props }: any) => (
        <mark
          className="bg-yellow-500/30 text-yellow-100 px-1 py-0.5 rounded border-b-2 border-yellow-500/50"
          {...props}
        >
          {children}
        </mark>
      ),
    },
    sub: {
      component: ({ children, ...props }: any) => (
        <sub className="text-xs text-gray-400" {...props}>
          {children}
        </sub>
      ),
    },
    sup: {
      component: ({ children, ...props }: any) => (
        <sup className="text-xs text-orange-300 font-semibold" {...props}>
          {children}
        </sup>
      ),
    },
    abbr: {
      component: ({ children, title, ...props }: any) => (
        <abbr
          title={title}
          className="cursor-help border-b-2 border-dotted border-orange-400 text-orange-200 no-underline"
          {...props}
        >
          {children}
        </abbr>
      ),
    },
    details: {
      component: ({ children, ...props }: any) => (
        <details
          className="my-4 p-4 bg-black/40 border border-white/10 rounded-lg hover:border-white/20 transition-colors duration-200"
          {...props}
        >
          {children}
        </details>
      ),
    },
    summary: {
      component: ({ children, ...props }: any) => (
        <summary
          className="cursor-pointer font-semibold text-orange-300 hover:text-orange-200 transition-colors duration-200 select-none"
          {...props}
        >
          ▶ {children}
        </summary>
      ),
    },
  },
};

interface MessageBubbleProps {
  message: ChatMessage;
  error?: boolean;
}

export function MessageBubble({ message, error }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const avatarStyles = getAvatarStyles(message.role, !!error);
  const bubbleStyles = getBubbleStyles(message.role, !!error);
  const bubbleRadiusStyles = getBubbleRadiusStyles(message.role);
  const markdownContent = useMemo(
    () => toMarkdownContent(message.content),
    [message.content],
  );
  const roleLabel =
    isUser ? "You"
    : error ? "System"
    : "Assistant";

  const renderAvatarIcon = () => {
    if (isUser) return <UserIcon />;
    return error ? <ErrorIcon /> : <AssistantIcon />;
  };

  return (
    <div
      className={`group flex transition-all duration-300 ease-in-out hover:scale-[1.02] ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`flex gap-3 max-w-[min(90%,52rem)] ${
          isUser ? "flex-row-reverse" : ""
        }`}
      >
        {/* Avatar */}
        <div
          className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${avatarStyles} shadow-lg transition-all duration-200 group-hover:shadow-xl`}
        >
          {renderAvatarIcon()}
        </div>

        {/* Message Bubble */}
        <div
          className={`px-5 py-4 ${bubbleRadiusStyles} ${bubbleStyles} shadow-lg transition-all duration-200 hover:shadow-xl`}
        >
          <div
            className={`text-[11px] uppercase tracking-wider font-semibold mb-2 ${
              isUser ? "text-cyan-100/80 text-right" : "text-orange-200/70"
            }`}
          >
            {roleLabel}
          </div>
          <div className="max-w-none wrap-break-word">
            <MarkDownToJSX options={MARKDOWN_OPTIONS}>
              {markdownContent || "_No content_"}
            </MarkDownToJSX>
          </div>
        </div>
      </div>
    </div>
  );
}
