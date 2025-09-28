import { z } from "zod";

export const describeSceneSchema = z.object({
  detailLevel: z.enum(["brief", "normal", "detailed"])
});

export const openLinkSchema = z.object({
  url: z.string().url()
});

export const searchWebSchema = z.object({
  query: z.string().min(3)
});

export const createCalendarEventSchema = z.object({
  title: z.string().min(3),
  startISO: z.string(),
  endISO: z.string(),
  attendees: z.array(z.string()).optional()
});

const describeSceneParameters = {
  type: "object",
  properties: {
    detailLevel: {
      type: "string",
      enum: ["brief", "normal", "detailed"],
      description: "Level of detail for the scene description."
    }
  },
  required: ["detailLevel"],
  additionalProperties: false
} as const;

const openLinkParameters = {
  type: "object",
  properties: {
    url: {
      type: "string",
      format: "uri",
      description: "URL to open on the client after confirmation."
    }
  },
  required: ["url"],
  additionalProperties: false
} as const;

const searchWebParameters = {
  type: "object",
  properties: {
    query: {
      type: "string",
      minLength: 3,
      description: "Search query for the web lookup."
    }
  },
  required: ["query"],
  additionalProperties: false
} as const;

const createCalendarEventParameters = {
  type: "object",
  properties: {
    title: { type: "string", minLength: 3 },
    startISO: { type: "string", format: "date-time" },
    endISO: { type: "string", format: "date-time" },
    attendees: {
      type: "array",
      items: { type: "string", format: "email" },
      description: "Optional attendee email addresses."
    }
  },
  required: ["title", "startISO", "endISO"],
  additionalProperties: false
} as const;

export function makeToolSchema(name: string) {
  switch (name) {
    case "describe_scene":
      return {
        type: "function" as const,
        name,
        description: "Summarise the most recent camera frame",
        parameters: describeSceneParameters
      };
    case "open_link":
      return {
        type: "function" as const,
        name,
        description: "Request the client to open a link",
        parameters: openLinkParameters
      };
    case "search_web":
      return {
        type: "function" as const,
        name,
        description: "Perform a web search and return top results",
        parameters: searchWebParameters
      };
    case "create_calendar_event":
      return {
        type: "function" as const,
        name,
        description: "Create a calendar event stub for the user",
        parameters: createCalendarEventParameters
      };
    default:
      throw new Error(`Unknown tool schema for ${name}`);
  }
}
