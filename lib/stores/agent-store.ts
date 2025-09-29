"use client";

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export type AgentPhase =
  | "idle"
  | "listening"
  | "transcribing"
  | "thinking"
  | "speaking"
  | "error";

export type AgentMessageRole = "user" | "assistant" | "system" | "tool";

export type AgentMessage = {
  id: string;
  role: AgentMessageRole;
  text?: string;
  displayText?: string;
  audioUrl?: string;
  imageThumbDataUrl?: string;
  toolCall?: { name: string; args: unknown };
  toolResult?: unknown;
  toolName?: string;
  primaryModel?: string;
  comparisons?: Array<{ model: string; text: string }>;
  ts: number;
  partial?: boolean;
};

export type AgentSettings = {
  autoFrame: boolean;
  frameRate: number;
  voice: string;
  model: string;
  secondaryModel: string;
  dualModelPreview: boolean;
  autoFallbackLongform: boolean;
  imageModel: string;
  speechRate: number;
};

export type AgentStore = {
  phase: AgentPhase;
  connected: boolean;
  messages: AgentMessage[];
  currentTranscriptPartial?: string;
  settings: AgentSettings;
  setPhase: (phase: AgentPhase) => void;
  addMessage: (message: AgentMessage) => void;
  updateMessage: (
    id: string,
    patch: Partial<AgentMessage> | ((current: AgentMessage) => AgentMessage)
  ) => void;
  updatePartial: (text: string) => void;
  finalizePartial: (delta?: Partial<AgentMessage>) => void;
  setConnected: (connected: boolean) => void;
  setSettings: (patch: Partial<AgentSettings>) => void;
  clearMessages: () => void;
};

const DEFAULT_MODEL = "gemini-2.5-flash";
const DEFAULT_SECONDARY_MODEL = "gemini-2.5-pro";
const DEFAULT_IMAGE_MODEL = "imagen-3.0-generate";
const ENV_VOICE =
  process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID ?? process.env.ELEVENLABS_VOICE_ID ?? "";

function normalizeGeminiModel(input?: string) {
  if (!input) return DEFAULT_MODEL;
  const trimmed = input.trim();
  if (!trimmed) return DEFAULT_MODEL;

  let lower = trimmed.toLowerCase();
  if (lower.startsWith("models/")) {
    lower = lower.replace("models/", "");
  }

  if (lower.startsWith("gpt-")) return DEFAULT_MODEL;
  if (lower.startsWith("gemini-1.5")) return DEFAULT_MODEL;

  return lower;
}

function normalizeImageModel(input?: string) {
  if (!input) return DEFAULT_IMAGE_MODEL;
  const trimmed = input.trim();
  if (!trimmed) return DEFAULT_IMAGE_MODEL;
  return trimmed;
}

function normalizeVoiceId(input?: string) {
  if (!input) return "";
  const trimmed = input.trim();
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();
  if (lower === "natural" || lower === "default") return "";
  return trimmed;
}

const defaultSettings: AgentSettings = {
  autoFrame: false,
  frameRate: 1.5,
  voice: normalizeVoiceId(ENV_VOICE),
  model: normalizeGeminiModel(process.env.NEXT_PUBLIC_GEMINI_MODEL),
  secondaryModel: normalizeGeminiModel(process.env.NEXT_PUBLIC_GEMINI_SECONDARY_MODEL ?? DEFAULT_SECONDARY_MODEL),
  dualModelPreview: false,
  autoFallbackLongform: true,
  imageModel: normalizeImageModel(process.env.NEXT_PUBLIC_GEMINI_IMAGE_MODEL ?? DEFAULT_IMAGE_MODEL),
  speechRate: 1
};

export const useAgentStore = create<AgentStore>()(
  devtools(
    persist(
      (set, get) => ({
        phase: "idle",
        connected: false,
        messages: [],
        currentTranscriptPartial: undefined,
        settings: defaultSettings,
        setPhase: (phase) => set({ phase }),
        setConnected: (connected) => set({ connected }),
        addMessage: (message) =>
          set((state) => ({
            messages: [...state.messages, message]
          })),
        updateMessage: (id, patch) =>
          set((state) => ({
            messages: state.messages.map((message) => {
              if (message.id !== id) return message;
              if (typeof patch === "function") {
                return patch(message);
              }
              return { ...message, ...patch };
            })
          })),
        updatePartial: (text) => set({ currentTranscriptPartial: text }),
        finalizePartial: (delta) => {
          const partial = get().currentTranscriptPartial;
          if (!partial) return;
          const merged: AgentMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            text: partial,
            ts: Date.now(),
            ...delta,
            partial: false
          };
          set((state) => ({
            messages: [...state.messages, merged],
            currentTranscriptPartial: undefined
          }));
        },
        setSettings: (patch) =>
          set((state) => {
            const next: AgentSettings = {
              ...state.settings,
              ...patch
            };
            if (patch.model !== undefined) {
              next.model = normalizeGeminiModel(patch.model);
            }
            if (patch.secondaryModel !== undefined) {
              next.secondaryModel = normalizeGeminiModel(patch.secondaryModel);
            }
            if (patch.voice !== undefined) {
              next.voice = normalizeVoiceId(patch.voice);
            }
            if (patch.imageModel !== undefined) {
              next.imageModel = normalizeImageModel(patch.imageModel);
            }
            if (patch.dualModelPreview !== undefined) {
              next.dualModelPreview = patch.dualModelPreview;
            }
            if (patch.autoFallbackLongform !== undefined) {
              next.autoFallbackLongform = patch.autoFallbackLongform;
            }
            return { settings: next };
          }),
        clearMessages: () => set({ messages: [], currentTranscriptPartial: undefined })
      }),
      {
        name: "jarvis-agent-store",
        partialize: (state) => ({ settings: state.settings }),
        onRehydrateStorage: () => (state) => {
          if (!state) return;
          state.phase = "idle";
          state.connected = false;
          state.messages = [];
          state.currentTranscriptPartial = undefined;
          state.settings.model = normalizeGeminiModel(state.settings.model);
          state.settings.secondaryModel = normalizeGeminiModel(state.settings.secondaryModel ?? DEFAULT_SECONDARY_MODEL);
          state.settings.voice = normalizeVoiceId(state.settings.voice);
          state.settings.dualModelPreview = Boolean(state.settings.dualModelPreview);
          state.settings.autoFallbackLongform =
            state.settings.autoFallbackLongform === undefined ? true : Boolean(state.settings.autoFallbackLongform);
          state.settings.imageModel = normalizeImageModel(state.settings.imageModel ?? DEFAULT_IMAGE_MODEL);
        }
      }
    )
  )
);
