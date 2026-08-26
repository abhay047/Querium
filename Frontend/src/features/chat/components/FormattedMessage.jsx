import { useState } from "react";

function CodeBlock({ code, language, isDarkMode }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`my-3 overflow-hidden rounded-xl border ${
        isDarkMode
          ? "border-[#2c2f33] bg-[#0d1117] text-[#e3e5e8]"
          : "border-slate-300 bg-slate-900 text-slate-100"
      }`}
    >
      <div className="flex items-center justify-between border-b border-slate-800 bg-black/40 px-4 py-2 text-xs font-mono text-slate-400">
        <span className="font-semibold uppercase tracking-wider text-[11px]">
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition cursor-pointer text-xs font-sans"
        >
          {copied ? (
            <span className="text-emerald-400 font-medium">✓ Copied!</span>
          ) : (
            <span className="opacity-80 hover:opacity-100">Copy code</span>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs sm:text-sm font-mono leading-relaxed text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function FormatInline({ text }) {
  if (!text) return null;

  // Regex to split by inline code (`...`), markdown links ([...](...)), bold (**...** or __...__), and italic (*...* or _..._)
  const regex = /(`[^`]+`|\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|__[^_]+__|(?:\b|_)\*[^*]+\*(?:\b|_)|(?:\b|\*)[_][^_]+[_](?:\b|\*))/g;
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;

        // Inline Code `code`
        if (part.startsWith("`") && part.endsWith("`") && part.length > 1) {
          return (
            <code
              key={i}
              className="rounded bg-black/10 dark:bg-white/10 px-1.5 py-0.5 font-mono text-xs text-cyan-600 dark:text-cyan-400 font-medium"
            >
              {part.slice(1, -1)}
            </code>
          );
        }

        // Markdown Link [text](url)
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          return (
            <a
              key={i}
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-600 dark:text-cyan-400 underline underline-offset-2 hover:text-cyan-500 font-medium transition-colors"
            >
              {linkMatch[1]}
            </a>
          );
        }

        // Bold **text** or __text__
        if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) {
          return (
            <strong key={i} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }

        // Italic *text* or _text_
        if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
          return (
            <em key={i} className="italic">
              {part.slice(1, -1)}
            </em>
          );
        }

        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export default function FormattedMessage({ content, isDarkMode }) {
  if (!content) return null;

  // Split code blocks from non-code text
  const blocks = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2 leading-relaxed">
      {blocks.map((block, index) => {
        if (block.startsWith("```") && block.endsWith("```")) {
          const lines = block.slice(3, -3).trim().split("\n");
          let language = "";
          let codeLines = lines;

          if (lines[0] && !lines[0].includes(" ") && lines.length > 1) {
            language = lines[0].trim();
            codeLines = lines.slice(1);
          }

          const code = codeLines.join("\n");

          return (
            <CodeBlock
              key={index}
              code={code}
              language={language}
              isDarkMode={isDarkMode}
            />
          );
        }

        // Non-code block: process lines for headings, lists, blockquotes, paragraphs
        const lines = block.split("\n");
        const renderedElements = [];
        let listItems = [];
        let listType = null; // 'ul' | 'ol'

        const flushList = (keyPrefix) => {
          if (listItems.length > 0) {
            if (listType === "ul") {
              renderedElements.push(
                <ul
                  key={`ul-${keyPrefix}`}
                  className="my-2 space-y-1.5 pl-5 list-disc"
                >
                  {listItems.map((item, idx) => (
                    <li key={idx}>
                      <FormatInline text={item} />
                    </li>
                  ))}
                </ul>
              );
            } else if (listType === "ol") {
              renderedElements.push(
                <ol
                  key={`ol-${keyPrefix}`}
                  className="my-2 space-y-1.5 pl-5 list-decimal"
                >
                  {listItems.map((item, idx) => (
                    <li key={idx}>
                      <FormatInline text={item} />
                    </li>
                  ))}
                </ol>
              );
            }
            listItems = [];
            listType = null;
          }
        };

        lines.forEach((line, lineIdx) => {
          const trimmed = line.trim();

          if (!trimmed) {
            flushList(lineIdx);
            return;
          }

          // Headings
          if (trimmed.startsWith("#### ")) {
            flushList(lineIdx);
            renderedElements.push(
              <h4
                key={lineIdx}
                className="mt-3 mb-1 text-xs sm:text-sm font-bold tracking-tight text-cyan-600 dark:text-cyan-400"
              >
                <FormatInline text={trimmed.slice(5)} />
              </h4>
            );
            return;
          }

          if (trimmed.startsWith("### ")) {
            flushList(lineIdx);
            renderedElements.push(
              <h3
                key={lineIdx}
                className="mt-3.5 mb-1 text-sm sm:text-base font-bold tracking-tight"
              >
                <FormatInline text={trimmed.slice(4)} />
              </h3>
            );
            return;
          }

          if (trimmed.startsWith("## ")) {
            flushList(lineIdx);
            renderedElements.push(
              <h2
                key={lineIdx}
                className="mt-4 mb-1.5 text-base sm:text-lg font-bold tracking-tight border-b border-black/10 dark:border-white/10 pb-1"
              >
                <FormatInline text={trimmed.slice(3)} />
              </h2>
            );
            return;
          }

          if (trimmed.startsWith("# ")) {
            flushList(lineIdx);
            renderedElements.push(
              <h1
                key={lineIdx}
                className="mt-5 mb-2 text-lg sm:text-xl font-extrabold tracking-tight"
              >
                <FormatInline text={trimmed.slice(2)} />
              </h1>
            );
            return;
          }

          // Blockquote
          if (trimmed.startsWith("> ")) {
            flushList(lineIdx);
            renderedElements.push(
              <blockquote
                key={lineIdx}
                className="my-2 border-l-4 border-cyan-500 pl-3.5 italic opacity-90 text-xs sm:text-sm bg-black/5 dark:bg-white/5 py-1 rounded-r-lg"
              >
                <FormatInline text={trimmed.slice(2)} />
              </blockquote>
            );
            return;
          }

          // Horizontal Rule
          if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
            flushList(lineIdx);
            renderedElements.push(
              <hr key={lineIdx} className="my-3 border-t border-black/10 dark:border-white/10" />
            );
            return;
          }

          // Unordered list (- or * or +)
          const ulMatch = trimmed.match(/^[-*+]\s+(.+)/);
          if (ulMatch) {
            if (listType !== "ul") flushList(lineIdx);
            listType = "ul";
            listItems.push(ulMatch[1]);
            return;
          }

          // Ordered list (1. 2. or 1) 2))
          const olMatch = trimmed.match(/^\d+[\.\)]\s+(.+)/);
          if (olMatch) {
            if (listType !== "ol") flushList(lineIdx);
            listType = "ol";
            listItems.push(olMatch[1]);
            return;
          }

          // Regular paragraph line
          flushList(lineIdx);
          renderedElements.push(
            <p key={lineIdx} className="my-1 text-xs sm:text-sm leading-relaxed">
              <FormatInline text={trimmed} />
            </p>
          );
        });

        flushList("end");

        return <div key={index}>{renderedElements}</div>;
      })}
    </div>
  );
}
