export type DescribeSceneArgs = {
  detailLevel: "brief" | "normal" | "detailed";
};

export type DescribeSceneResult = {
  summary: string;
  items: Array<{ label: string; bbox?: [number, number, number, number] }>;
  ocrText?: string;
};

export type OpenLinkArgs = {
  url: string;
};

export type SearchWebArgs = {
  query: string;
};

export type SearchWebResult = {
  results: Array<{ title: string; url: string; snippet: string }>;
};

export type CreateCalendarEventArgs = {
  title: string;
  startISO: string;
  endISO: string;
  attendees?: string[];
};

export type CreateCalendarEventResult = {
  id: string;
  title: string;
  startISO: string;
  endISO: string;
  attendees?: string[];
};

export type ToolResultPayload =
  | { name: "describe_scene"; result: DescribeSceneResult }
  | { name: "open_link"; result: { opened: boolean } }
  | { name: "search_web"; result: SearchWebResult }
  | { name: "create_calendar_event"; result: CreateCalendarEventResult };

export function formatToolName(name: string) {
  return name
    .split("_")
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(" ");
}
