"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { Children, isValidElement, type ReactNode } from "react";
import { formatEtaChatLong } from "@/lib/format-date";
import { normalizeShipmentReference, SHIPMENT_REFERENCE_REGEX } from "@/lib/shipment-reference";
import type { Shipment } from "@/lib/types";

function textFromNodes(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textFromNodes).join("");
  return "";
}

function RiskInlineBadge({ level }: { level: "high" | "medium" | "low" }) {
  const cls =
    level === "high"
      ? "bg-red-100 text-red-800 ring-1 ring-red-200 dark:bg-red-950/50 dark:text-red-200 dark:ring-red-900/50"
      : level === "medium"
        ? "bg-amber-100 text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900/40"
        : "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900/40";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${cls}`}>
      {level} risk
    </span>
  );
}

/** Turn ISO dates and shipment refs into markdown links for custom rendering. */
export function prepareChatMarkdown(raw: string): string {
  let s = raw.replace(/\r\n/g, "\n");
  s = s.replace(/\b(\d{4}-\d{2}-\d{2})\b/g, (_, iso) => {
    const pretty = formatEtaChatLong(iso);
    return `[${pretty}](eta:${iso})`;
  });
  s = s.replace(new RegExp(SHIPMENT_REFERENCE_REGEX.source, "gi"), (match, g1: string) => {
    return `[${g1}](shipment:${encodeURIComponent(g1)})`;
  });
  return s;
}

type MarkdownProps = {
  content: string;
  shipmentsByReference: Map<string, Shipment>;
  onShipmentClick: (shipmentId: string) => void;
};

export function ChatMarkdown({ content, shipmentsByReference, onShipmentClick }: MarkdownProps) {
  const md = prepareChatMarkdown(content);

  const components: Components = {
    h1: ({ children }) => (
      <h1 className="mb-2 mt-3 border-b border-[#e2e8f0] pb-1.5 text-[17px] font-bold tracking-tight text-[#0f172a] first:mt-0 dark:border-slate-600 dark:text-slate-100">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="mb-2 mt-3 text-[15px] font-semibold text-[#0f172a] first:mt-0 dark:text-slate-100">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-1.5 mt-2 text-[14px] font-semibold text-[#334155] first:mt-0 dark:text-slate-300">{children}</h3>
    ),
    p: ({ children }) => <p className="mb-2 text-[14px] leading-relaxed text-[#334155] last:mb-0 dark:text-slate-300">{children}</p>,
    ul: ({ className, children }) => (
      <ul
        className={`mb-2 text-[14px] text-[#334155] dark:text-slate-300 ${
          className?.includes("contains-task-list")
            ? "list-none space-y-1.5 pl-0"
            : "list-disc space-y-1.5 pl-5 marker:text-[#64748b]"
        }`}
      >
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-2 list-decimal space-y-1.5 pl-5 text-[14px] text-[#334155] marker:font-medium dark:text-slate-300">
        {children}
      </ol>
    ),
    li: ({ className, children }) => {
      const hasCheckbox = Children.toArray(children).some(
        (c) => isValidElement(c) && c.type === "input",
      );
      const t = textFromNodes(children).toLowerCase();
      const missingDoc =
        !hasCheckbox &&
        !className?.includes("task-list-item") &&
        /missing|not on file|not received|outstanding|without.*doc/i.test(t);
      return (
        <li
          className={
            hasCheckbox
              ? "flex items-start gap-2 leading-snug"
              : missingDoc
                ? "rounded-md border border-red-200 bg-red-50/80 py-1.5 pl-2 text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200"
                : "leading-snug"
          }
        >
          {missingDoc && (
            <span
              className="mt-0.5 inline-block h-3.5 w-3.5 shrink-0 rounded border-2 border-red-400"
              aria-hidden
            />
          )}
          {children}
        </li>
      );
    },
    strong: ({ children }) => {
      const t = textFromNodes(children).trim();
      const m = /^(high|medium|low)\s+risk$/i.exec(t);
      if (m) {
        const lvl = m[1].toLowerCase() as "high" | "medium" | "low";
        if (lvl === "high" || lvl === "medium" || lvl === "low") {
          return <RiskInlineBadge level={lvl} />;
        }
      }
      return (
        <strong className="text-[15px] font-bold text-[#0f172a] dark:text-slate-100">{children}</strong>
      );
    },
    em: ({ children }) => <em className="italic text-[#475569] dark:text-slate-400">{children}</em>,
    blockquote: ({ children }) => (
      <blockquote className="my-2 border-l-4 border-[#93c5fd] bg-[#eff6ff]/60 py-2 pl-3 text-[13px] text-[#1e3a5f] dark:border-sky-700 dark:bg-sky-950/30 dark:text-sky-200">
        {children}
      </blockquote>
    ),
    code: ({ className, children, ...props }) => {
      const isFenced = Boolean(className && String(className).startsWith("language-"));
      if (!isFenced) {
        return (
          <code
            className="rounded-md bg-[#e2e8f0] px-1.5 py-0.5 font-mono text-[12px] text-[#0f172a] dark:bg-slate-700 dark:text-slate-100"
            {...props}
          >
            {children}
          </code>
        );
      }
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    pre: ({ children }) => (
      <pre className="mb-2 overflow-x-auto rounded-lg bg-[#0f172a] p-3 text-[12px] text-[#e2e8f0]">{children}</pre>
    ),
    a: ({ href, children }) => {
      if (href?.startsWith("shipment:")) {
        const ref = decodeURIComponent(href.slice("shipment:".length));
        const key = normalizeShipmentReference(ref);
        const s = shipmentsByReference.get(key);
        return (
          <button
            type="button"
            onClick={() => s && onShipmentClick(s.id)}
            className="inline font-mono text-[13px] font-semibold text-[#2563eb] underline decoration-[#93c5fd] underline-offset-2 hover:text-[#1d4ed8] disabled:cursor-not-allowed disabled:text-[#94a3b8] disabled:no-underline"
            disabled={!s}
            title={s ? `${s.customsStatus || "unknown"} · ${formatEtaChatLong(s.eta)}` : "Not in workspace"}
          >
            {children}
          </button>
        );
      }
      if (href?.startsWith("eta:")) {
        const iso = href.slice(4);
        return (
          <time
            dateTime={iso}
            className="font-medium tabular-nums text-[#0f172a] dark:text-slate-100"
          >
            {children}
          </time>
        );
      }
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[#2563eb] underline decoration-[#93c5fd] underline-offset-2 hover:text-[#1d4ed8]"
        >
          {children}
        </a>
      );
    },
    hr: () => <hr className="my-3 border-[#e2e8f0] dark:border-slate-600" />,
    table: ({ children }) => (
      <div className="mb-2 overflow-x-auto rounded-lg border border-[#e2e8f0] dark:border-slate-600">
        <table className="w-full min-w-[280px] border-collapse text-left text-[13px]">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-[#f1f5f9] dark:bg-slate-800">{children}</thead>,
    th: ({ children }) => (
      <th className="border-b border-[#e2e8f0] px-3 py-2 font-semibold text-[#0f172a] dark:border-slate-600 dark:text-slate-100">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border-b border-[#f1f5f9] px-3 py-2 text-[#334155] dark:border-slate-700 dark:text-slate-300">
        {children}
      </td>
    ),
  };

  return (
    <div className="chat-markdown max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {md}
      </ReactMarkdown>
    </div>
  );
}
