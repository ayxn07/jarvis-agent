"use client";

import { del, get, set } from "idb-keyval";

import type { AgentMessage } from "@/lib/stores/agent-store";

const MEMORY_KEY = "jarvis-memory-v1";

export async function loadMemory(): Promise<AgentMessage[]> {
  return (await get<AgentMessage[]>(MEMORY_KEY)) ?? [];
}

export async function persistMemory(messages: AgentMessage[]): Promise<void> {
  await set(MEMORY_KEY, messages);
}

export async function clearMemory(): Promise<void> {
  await del(MEMORY_KEY);
}

export function trimMessages(messages: AgentMessage[], max = 200): AgentMessage[] {
  if (messages.length <= max) return messages;
  return messages.slice(messages.length - max);
}
