export type MarkdownSegment = {
  type: "text" | "bold";
  text: string;
};

const MAX_SEGMENTS = 1000;

export function stripSimpleMarkdown(input: string): string {
  if (!input) return "";
  return input.replace(/\*\*([\s\S]*?)\*\*/g, "$1");
}

export function segmentSimpleMarkdown(input: string): MarkdownSegment[] {
  if (!input) return [];

  const segments: MarkdownSegment[] = [];
  let index = 0;
  let safety = 0;

  const push = (type: MarkdownSegment["type"], text: string) => {
    if (!text) return;
    const last = segments[segments.length - 1];
    if (last && last.type === type) {
      last.text += text;
    } else {
      segments.push({ type, text });
    }
  };

  while (index < input.length && safety < MAX_SEGMENTS) {
    safety += 1;
    const open = input.indexOf("**", index);
    if (open === -1) {
      push("text", input.slice(index));
      break;
    }

    if (open > index) {
      push("text", input.slice(index, open));
    }

    const close = input.indexOf("**", open + 2);
    if (close === -1) {
      push("text", input.slice(open));
      break;
    }

    const boldContent = input.slice(open + 2, close);
    push("bold", boldContent);
    index = close + 2;
  }

  return segments;
}

export function countPlainTextLength(segments: MarkdownSegment[]): number {
  return segments.reduce((total, segment) => total + segment.text.length, 0);
}

export function plainTextFromSegments(segments: MarkdownSegment[]): string {
  if (!segments.length) return "";
  return segments.map((segment) => segment.text).join("");
}
