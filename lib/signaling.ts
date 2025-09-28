"use client";

import type { ToolResultPayload } from "@/lib/tools";

export type SignalingResponse = {
  answer: RTCSessionDescriptionInit;
  sessionId: string;
  iceServers?: RTCIceServer[];
};

export type SignalingError = {
  error: string;
  details?: unknown;
};

export async function postOffer(payload: RTCSessionDescriptionInit): Promise<SignalingResponse> {
  const res = await fetch("/api/realtime/signaling", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ offer: payload })
  });

  if (!res.ok) {
    const err: SignalingError = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error);
  }

  return res.json();
}

export async function postIceCandidate(candidate: RTCIceCandidateInit & { sessionId: string }) {
  await fetch("/api/realtime/ice", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(candidate)
  });
}

export type RealtimeInboundEvent =
  | { type: "partial_transcript"; text: string }
  | { type: "assistant_text"; delta: string }
  | { type: "assistant_final"; text: string }
  | { type: "tool_call"; name: string; args: unknown }
  | { type: "tool_result"; name: string; result: ToolResultPayload }
  | { type: "error"; message: string };

export function parseRealtimeMessage(event: MessageEvent<string>): RealtimeInboundEvent | null {
  try {
    const parsed = JSON.parse(event.data);
    if (!parsed?.type) return null;
    return parsed as RealtimeInboundEvent;
  } catch (error) {
    console.error("Failed to parse realtime message", error);
    return null;
  }
}
