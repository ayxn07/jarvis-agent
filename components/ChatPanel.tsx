"use client";

import { StarBorder } from "@appletosolutions/reactbits";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Clock, Terminal, User } from "lucide-react";
import { useCallback, useMemo, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";

import { ToolResultCard } from "@/components/ToolResultCard";
import type { AgentMessage } from "@/lib/stores/agent-store";
import { countPlainTextLength, segmentSimpleMarkdown, type MarkdownSegment } from "@/lib/markdown";
import { cn } from "@/lib/utils";

export type ChatPanelProps = {
  messages: AgentMessage[];
  currentPartial?: string;
  onSendMessage: (text: string) => void;
};

const messageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

export function ChatPanel({ messages, currentPartial, onSendMessage }: ChatPanelProps) {
  const [draft, setDraft] = useState("");

  const sorted = useMemo(() => [...messages].sort((a, b) => a.ts - b.ts), [messages]);

  const submitDraft = useCallback(() => {
    const value = draft.trim();
    if (!value) return;
    onSendMessage(value);
    setDraft("");
  }, [draft, onSendMessage]);
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitDraft();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter") return;
    if (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    submitDraft();
  };

  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl min-h-[600px] max-h-[600px]">
      <header className="border-b border-white/10 px-6 py-4">
        <p className="text-xs uppercase tracking-[0.4em] text-white/40">Conversation</p>
        <h2 className="text-lg font-medium text-white/80">Live Thread</h2>
      </header>
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <AnimatePresence initial={false}>
          {sorted.map((message) => (
            <motion.div
              key={message.id}
              variants={messageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <MessageBubble message={message} />
            </motion.div>
          ))}
          {currentPartial && (
            <motion.div
              key="partial"
              className="flex gap-3 text-sm text-white/60"
              initial={{ opacity: 0.4 }}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              <Bot className="mt-1 h-4 w-4 text-neon-magenta/70" />
              <p>{currentPartial}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <form onSubmit={handleSubmit} className="border-t border-white/10 p-4">
        <div className="relative">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Press Enter to deploy instructions. Shift+Enter adds a newline."
            className="h-24 w-full resize-none rounded-3xl border border-white/15 bg-white/5 px-5 py-4
            text-sm text-white placeholder:text-white/40
            transition-[box-shadow,border-color] duration-300 ease-out
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/70"          />
          <button
            type="submit"
            className="absolute bottom-8 right-3 rounded-full border border-white/15 bg-neon-cyan/70 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-black/80 transition hover:brightness-110"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: AgentMessage }) {
  const isUser = message.role === "user";
  const icon = isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />;
  const accent = isUser ? "bg-neon-magenta/40" : "bg-neon-cyan/40";
  const hasToolResult = message.toolResult !== undefined && message.toolResult !== null;
  const showCaret = Boolean(message.partial);
  const comparisons = message.comparisons ?? [];

  const segments = useMemo(() => {
    const source = message.text ?? message.displayText ?? "";
    if (!source) return [];
    return segmentSimpleMarkdown(source);
  }, [message.displayText, message.text]);

  const totalChars = useMemo(() => countPlainTextLength(segments), [segments]);
  const visibleChars = showCaret
    ? message.displayText?.length ?? 0
    : message.displayText?.length ?? totalChars;
  const renderedText = useMemo(() => renderMarkdownSegments(segments, visibleChars), [segments, visibleChars]);

  const comparisonCards = useMemo(() => {
    if (!comparisons.length) return null;
    return comparisons.map((item, index) => {
      const altSegments = segmentSimpleMarkdown(item.text ?? "");
      const totalAltChars = countPlainTextLength(altSegments);
      const nodes = renderMarkdownSegments(altSegments, totalAltChars);
      return (
        <StarBorder
          as="div"
          key={`${message.id}-${item.model}-${index}`}
          color="#47f2ff"
          className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/80 backdrop-blur-lg"
        >
          <header className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-white/50">
            <span className="rounded-full border border-neon-cyan/40 bg-neon-cyan/10 px-2 py-0.5 text-[10px] font-semibold text-neon-cyan/80">
              {item.model}
            </span>
            <span>Alternative</span>
          </header>
          <div className="space-y-2">{nodes}</div>
        </StarBorder>
      );
    });
  }, [comparisons, message.id]);

  return (
    <article className="flex gap-4 text-sm">
      <div className={cn("mt-1 flex h-8 w-8 items-center justify-center rounded-full", accent)}>{icon}</div>
      <div className="flex-1 space-y-2">
        <header className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/40">
          <span>{message.role}</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {new Date(message.ts).toLocaleTimeString()}
          </span>
          {message.primaryModel && (
            <span className="rounded-full border border-neon-cyan/40 bg-neon-cyan/10 px-2 py-0.5 text-[10px] font-semibold text-neon-cyan/80">
              {message.primaryModel}
            </span>
          )}
          {comparisons.length > 0 && (
            <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/70">
              {comparisons.length} alt
            </span>
          )}
          {message.partial && <span className="text-neon-cyan/70">streaming</span>}
        </header>

        {(renderedText.length > 0 || showCaret) && (
          <p className="text-base leading-6 text-white whitespace-pre-wrap">
            {renderedText}
            {showCaret && (
              <span className="ml-[2px] inline-block h-[1.1em] w-[2px] animate-pulse rounded-sm bg-white/70 align-middle" />
            )}
          </p>
        )}

        {comparisonCards && (
          <div className="mt-4 space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Alternative models</p>
            {comparisonCards}
          </div>
        )}

        {message.toolCall && (
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Terminal className="h-4 w-4" />
            <span>{message.toolCall.name}</span>
          </div>
        )}

        {hasToolResult ? (
          <ToolResultCard
            name={message.toolName ?? message.toolCall?.name ?? "tool"}
            payload={message.toolResult}
          />
        ) : null}

        {message.imageThumbDataUrl && (
          <figure className="relative max-w-xs overflow-hidden rounded-2xl border border-white/10">
            <img src={message.imageThumbDataUrl} alt="User captured frame" className="w-full" />
            <figcaption className="absolute inset-x-0 bottom-0 bg-black/60 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/60">
              Snap
            </figcaption>
          </figure>
        )}
      </div>
    </article>
  );
}

function renderMarkdownSegments(segments: MarkdownSegment[], visibleChars: number): ReactNode[] {
  if (!segments.length || visibleChars <= 0) return [];
  let remaining = visibleChars;
  const nodes: ReactNode[] = [];

  segments.forEach((segment, index) => {
    if (remaining <= 0) return;
    const take = Math.min(segment.text.length, remaining);
    if (take <= 0) return;
    const content = segment.text.slice(0, take);
    remaining -= take;
    if (segment.type === "bold") {
      nodes.push(
        <strong key={`bold-${index}`} className="font-semibold text-white">
          {content}
        </strong>
      );
    } else {
      nodes.push(
        <span key={`text-${index}`}>
          {content}
        </span>
      );
    }
  });

  return nodes;
}









