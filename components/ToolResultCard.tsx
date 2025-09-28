"use client";

import { ChevronDown, ExternalLink, Image, Search, StickyNote } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatToolName,
  type CreateCalendarEventResult,
  type DescribeSceneResult,
  type SearchWebResult
} from "@/lib/tools";

const iconMap: Record<string, ReactNode> = {
  describe_scene: <Image className="h-5 w-5" />,
  open_link: <ExternalLink className="h-5 w-5" />,
  search_web: <Search className="h-5 w-5" />,
  create_calendar_event: <StickyNote className="h-5 w-5" />
};

export function ToolResultCard({ name, payload }: { name: string; payload: unknown }) {
  const [expanded, setExpanded] = useState(false);

  const icon = iconMap[name] ?? <StickyNote className="h-5 w-5" />;

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-white/80">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white/70">
            {icon}
          </span>
          <CardTitle className="text-sm font-medium text-white/80">{formatToolName(name)}</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-xs text-white/60"
          onClick={() => setExpanded((prev) => !prev)}
        >
          <ChevronDown className={`h-4 w-4 transition ${expanded ? "rotate-180" : ""}`} />
          JSON
        </Button>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-white/70">
        {renderPreview(name, payload)}
        {expanded && (
          <pre className="mt-3 max-h-64 overflow-auto rounded-2xl bg-black/60 p-4 text-xs text-white/70">
            {JSON.stringify(payload, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}

function renderPreview(name: string, payload: unknown) {
  if (payload && typeof payload === "object") {
    const maybeError = payload as { error?: unknown };
    if (typeof maybeError.error === "string") {
      return <p className="text-xs font-semibold text-red-300">{maybeError.error}</p>;
    }
  }

  switch (name) {
    case "describe_scene": {
      const result = payload as DescribeSceneResult;
      if (!result) return <p className="text-xs font-semibold">No description returned.</p>;
      return (
        <div>
          <p className="font-semibold text-white">{result.summary}</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs font-semibold">
            {result.items?.map((item, index) => (
              <li key={index}>{item.label}</li>
            ))}
          </ul>
        </div>
      );
    }
    case "open_link": {
      const result = payload as { opened: boolean };
      if (!result) return <p className="text-xs font-semibold">Unable to confirm link action.</p>;
      return <p className="font-semibold">{result.opened ? "Link dispatched to client." : "Link pending user approval."}</p>;
    }
    case "search_web": {
      const result = payload as SearchWebResult;
      if (!result) return <p className="text-xs font-semibold">No search results.</p>;
      return (
        <ul className="space-y-2 text-xs font-semibold">
          {result.results?.map((item) => (
            <li key={item.url}>
              <p className="text-white">{item.title}</p>
              <p className="text-white/70">{item.snippet}</p>
            </li>
          ))}
        </ul>
      );
    }
    case "create_calendar_event": {
      const result = payload as CreateCalendarEventResult;
      if (!result) return <p className="text-xs font-semibold">No event produced.</p>;
      return (
        <div className="text-xs font-semibold text-white/80">
          <p>{result.title}</p>
          <p>
            {new Date(result.startISO).toLocaleString()} {" -> "} {new Date(result.endISO).toLocaleString()}
          </p>
        </div>
      );
    }
    default:
      if (!payload) {
        return <p className="text-xs font-semibold">No tool payload captured.</p>;
      }
      return <p className="text-xs font-semibold">Unsupported tool payload.</p>;
  }
}
