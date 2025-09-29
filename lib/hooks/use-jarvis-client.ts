"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useAgentStore } from "@/lib/stores/agent-store";
import { stripSimpleMarkdown } from "@/lib/markdown";
import { formatToolName } from "@/lib/tools";
import { captureFrame } from "@/lib/vision";

const DEFAULT_PROMPT = "Describe what you see and call out anything important.";
const VIDEO_READY_TIMEOUT = 4000;

type PlayTtsCallbacks = {
  onAudioReady?: (audio: HTMLAudioElement) => void;
  onAudioStart?: () => void;
};

const BASE_WPM = 165;
const BASE_CHARS_PER_SECOND = 13;
const MAX_TEXT_LEAD_SECONDS = 0.35;
const LONGFORM_WORD_THRESHOLD = 120;
const LONGFORM_CHAR_THRESHOLD = 600;

type GeminiOutput = {
  model: string;
  text: string;
};

type GeminiFailure = {
  model: string;
  error: string;
};

type GeminiResponse = {
  primary: GeminiOutput;
  alternatives: GeminiOutput[];
  failures: GeminiFailure[];
};

const IDENTITY_PATTERNS = [
  /\bwho\s+are\s+you\b/,
  /\bwho\s+are\s+u\b/,
  /\bwho\s+is\s+this\b/,
  /\bwhat(?:'s|\s+is)\s+your\s+name\b/,
  /\bwho\s+am\s+i\s+(?:speaking|talking)\s+to\b/,
  /\bidentify\s+yourself\b/,
  /\bsay\s+your\s+name\b/
];

const IDENTITY_RESPONSE =
  "**Jarvis online.** I'm Jarvis, your operational intelligence interface crafted by Ayaan. Explore his work at github.com/ayxn07 while I coordinate sensors, summarize observations, and orchestrate tools so you can stay focused.";

function dataUrlToBase64(input?: string) {
  if (!input) return undefined;
  if (!input.startsWith("data:")) return input;
  const comma = input.indexOf(",");
  if (comma === -1) return input;
  return input.slice(comma + 1);
}

async function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result.split(",")[1] ?? "");
      } else {
        reject(new Error("Unexpected reader result"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function expandSpeechAbbreviations(input: string) {
  if (!input) return "";
  let output = input;

  const replacements: Array<[RegExp, string]> = [
    [/Â°\s*[Ff]/g, " degrees Fahrenheit"],
    [/Â°\s*[Cc]/g, " degrees Celsius"],
    [/Â°\s*[Kk]/g, " degrees Kelvin"],
    [/\bAI\b/g, "A I"],
    [/\bAR\b/g, "A R"],
    [/\bVR\b/g, "V R"],
    [/\bCPU\b/g, "C P U"],
    [/\bGPU\b/g, "G P U"],
    [/\bRAM\b/g, "R A M"],
    [/\bAPI\b/g, "A P I"],
    [/\bTTS\b/g, "T T S"],
    [/\bETA\b/g, "E T A"],
    [/\bHTTP\b/g, "H T T P"],
    [/\bHTTPS\b/g, "H T T P S"],
    [/\bSQL\b/g, "S Q L"],
    [/\bGPS\b/g, "G P S"],
    [/\bmph\b/gi, " miles per hour"],
    [/\bkm\/?h\b/gi, " kilometres per hour"],
    [/\bkmph\b/gi, " kilometres per hour"],
    [/\bbpm\b/gi, " beats per minute"],
    [/\bhrs\b/gi, " hours"],
    [/\bhr\b/gi, " hour"],
    [/\bmins\b/gi, " minutes"],
    [/\bmin\b/gi, " minute"],
    [/\bsecs\b/gi, " seconds"],
    [/\bsec\b/gi, " second"],
    [/\bavg\b/gi, " average"],
    [/\best\b/gi, " estimate"],
    [/\btemp\b/gi, " temperature"]
  ];

  for (const [pattern, replacement] of replacements) {
    output = output.replace(pattern, replacement);
  }

  return output;
}

function shouldTriggerLongformFallback(text?: string, imageBase64?: string) {
  const trimmed = text?.trim() ?? "";
  if (trimmed.length >= LONGFORM_CHAR_THRESHOLD) return true;
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  if (words >= LONGFORM_WORD_THRESHOLD) return true;
  if (imageBase64) return true;
  return false;
}

function toGeminiResponse(text: string, model: string): GeminiResponse {
  return {
    primary: { model, text },
    alternatives: [],
    failures: []
  };
}

export function useJarvisClient() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [permissionState, setPermissionState] = useState<"unknown" | "denied" | "granted">("unknown");
  const { addMessage, setConnected, setPhase, settings, updateMessage } = useAgentStore();
  const recordToolEvent = useCallback(
    (
      name: string,
      args: unknown,
      outcome: { status: "success"; result: unknown } | { status: "error"; error: string }
    ) => {
      const label = formatToolName(name);
      const baseMessage =
        outcome.status === "success"
          ? `**${label} executed.** Output captured in the timeline.`
          : `**${label} failed.** ${outcome.error}`;
      addMessage({
        id: crypto.randomUUID(),
        role: "tool",
        ts: Date.now(),
        toolName: name,
        toolCall: { name, args },
        toolResult: outcome.status === "success" ? outcome.result : { error: outcome.error },
        text: baseMessage
      });
    },
    [addMessage]
  );

  const waitForVideoReady = useCallback(async (video: HTMLVideoElement) => {
    if (video.videoWidth > 0 && video.videoHeight > 0 && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const cleanup = () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        video.removeEventListener("loadeddata", onReady);
        video.removeEventListener("loadedmetadata", onReady);
        video.removeEventListener("error", onError);
      };

      const onReady = () => {
        cleanup();
        resolve();
      };

      const onError = () => {
        cleanup();
        reject(new Error("Camera stream not available"));
      };

      const timeoutId = window.setTimeout(() => {
        cleanup();
        reject(new Error("Camera feed timed out"));
      }, VIDEO_READY_TIMEOUT);

      video.addEventListener("loadeddata", onReady, { once: true });
      video.addEventListener("loadedmetadata", onReady, { once: true });
      video.addEventListener("error", onError, { once: true });

      if (video.paused) {
        video.play().catch(() => {});
      }

      if (video.videoWidth > 0 && video.videoHeight > 0) {
        cleanup();
        resolve();
      }
    });
  }, []);

  const ensureMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });
      setPermissionState("granted");
      stream.getTracks().forEach((track) => track.stop());
      return stream;
    } catch (error) {
      console.error("Microphone permission denied", error);
      setPermissionState("denied");
      throw error;
    }
  }, []);

  const connect = useCallback(async () => {
    try {
      await ensureMic();
    } catch {
      // Mic is optional; continue in text-only mode.
    }
    setConnected(true);
    setPhase("idle");
  }, [ensureMic, setConnected, setPhase]);

  const disconnect = useCallback(() => {
    setConnected(false);
    setPhase("idle");
  }, [setConnected, setPhase]);

  const historySnapshot = useCallback(() => {
    return useAgentStore
      .getState()
      .messages.filter((msg) => msg.role === "user" || msg.role === "assistant")
      .map((msg) => ({
        role: msg.role,
        text: msg.text,
        image: dataUrlToBase64(msg.imageThumbDataUrl)
      }));
  }, []);

  const callGemini = useCallback(
    async ({
      text,
      imageBase64,
      allowFallback
    }: { text?: string; imageBase64?: string; allowFallback?: boolean }): Promise<GeminiResponse> => {
      const primaryModel = settings.model;
      const secondaryModel = settings.secondaryModel;
      const extras: string[] = [];
      const modelsDiffer = secondaryModel.trim().toLowerCase() !== primaryModel.trim().toLowerCase();
      if (settings.dualModelPreview && modelsDiffer) {
        extras.push(secondaryModel);
      } else if (allowFallback && settings.autoFallbackLongform && modelsDiffer) {
        if (shouldTriggerLongformFallback(text, imageBase64)) {
          extras.push(secondaryModel);
        }
      }

      const body: Record<string, unknown> = {
        text,
        imageBase64,
        history: historySnapshot(),
        model: primaryModel
      };
      if (extras.length > 0) {
        body.models = extras;
      }

      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        const message = (errorBody as { error?: string }).error ?? "Gemini request failed (" + res.status + ")";
        throw new Error(message);
      }

      const data = (await res.json()) as {
        outputs?: Array<{ model?: string; text?: string }>;
        primary?: { model?: string; text?: string };
        text?: string;
        failures?: Array<{ model?: string; error?: string }>;
      };

      const outputs = Array.isArray(data.outputs)
        ? data.outputs
            .filter((item): item is { model: string; text: string } =>
              typeof item?.model === "string" && typeof item?.text === "string"
            )
            .map((item) => ({ model: item.model, text: item.text }))
        : [];

      let primary =
        data.primary && typeof data.primary.model === "string" && typeof data.primary.text === "string"
          ? { model: data.primary.model, text: data.primary.text }
          : null;

      if (!primary && outputs.length > 0) {
        primary = outputs[0];
      }

      if (!primary && typeof data.text === "string") {
        primary = { model: primaryModel, text: data.text };
      }

      if (!primary) {
        throw new Error("Gemini request failed");
      }

      const alternatives = outputs.filter(
        (item) => item.model !== primary!.model || item.text !== primary!.text
      );

      const failures = Array.isArray(data.failures)
        ? data.failures
            .filter(
              (item): item is { model: string; error: string } =>
                typeof item?.model === "string" && typeof item?.error === "string"
            )
            .map((item) => ({ model: item.model, error: item.error }))
        : [];

      return {
        primary,
        alternatives,
        failures
      };
    },
    [
      historySnapshot,
      settings.autoFallbackLongform,
      settings.dualModelPreview,
      settings.model,
      settings.secondaryModel
    ]
  );

  const playTts = useCallback(
    async (text: string, callbacks?: PlayTtsCallbacks) => {
      if (!audioRef.current) {
        throw new Error("Audio element not ready");
      }

      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceId: settings.voice || undefined })
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.error ?? "TTS request failed");
      }

      const arrayBuffer = await res.arrayBuffer();
      const blob = new Blob([arrayBuffer], {
        type: res.headers.get("content-type") ?? "audio/mpeg"
      });
      const objectUrl = URL.createObjectURL(blob);
      const audio = audioRef.current;

      callbacks?.onAudioReady?.(audio);

      return new Promise<void>((resolve, reject) => {
        const resumeEvents: Array<keyof WindowEventMap> = [
          "pointerdown",
          "pointerup",
          "keydown",
          "touchstart"
        ];
        let removeInteractionListeners: (() => void) | null = null;

        const cleanup = () => {
          audio.removeEventListener("ended", onEnded);
          audio.removeEventListener("error", onError);
          audio.removeEventListener("playing", onPlaying);
          removeInteractionListeners?.();
          URL.revokeObjectURL(objectUrl);
        };

        const onEnded = () => {
          cleanup();
          resolve();
        };

        const onError = () => {
          cleanup();
          reject(new Error("Failed to play TTS audio"));
        };

        const onPlaying = () => {
          callbacks?.onAudioStart?.();
        };

        const setupInteractionRetry = () => {
          removeInteractionListeners?.();
          const handler = () => {
            removeInteractionListeners?.();
            attemptPlay();
          };
          resumeEvents.forEach((eventName) => {
            window.addEventListener(eventName, handler, { once: true });
          });
          removeInteractionListeners = () => {
            resumeEvents.forEach((eventName) => window.removeEventListener(eventName, handler));
            removeInteractionListeners = null;
          };
        };

        const attemptPlay = () => {
          try {
            const maybePromise = audio.play();
            if (maybePromise && typeof maybePromise.then === "function") {
              maybePromise.catch((error) => {
                if (error instanceof DOMException && error.name === "NotAllowedError") {
                  setupInteractionRetry();
                  return;
                }
                cleanup();
                reject(error instanceof Error ? error : new Error("Failed to play TTS audio"));
              });
            }
          } catch (error) {
            cleanup();
            reject(error instanceof Error ? error : new Error("Failed to play TTS audio"));
          }
        };

        audio.pause();
        audio.src = objectUrl;
        audio.preload = "auto";
        audio.muted = false;
        audio.volume = 1;
        audio.currentTime = 0;
        try {
          audio.load();
        } catch {
          // ignore load errors
        }

        audio.addEventListener("ended", onEnded, { once: true });
        audio.addEventListener("error", onError, { once: true });
        audio.addEventListener("playing", onPlaying, { once: true });

        attemptPlay();
      });
    },
    [settings.voice]
  );

  const handleAssistantReply = useCallback(
    async (response: GeminiResponse) => {
      const primaryText = response.primary.text ?? "";
      const trimmed = primaryText.trim() || "I do not have a response right now.";
      const plain = stripSimpleMarkdown(trimmed);
      const basePlain = plain.trim() ? plain : trimmed;
      const speechText = expandSpeechAbbreviations(basePlain);
      const typewriterText = trimmed.length > 0 ? trimmed : basePlain;
      const messageId = crypto.randomUUID();
      const now = Date.now();
      addMessage({
        id: messageId,
        role: "assistant",
        text: trimmed,
        displayText: "",
        ts: now,
        partial: true,
        primaryModel: response.primary.model,
        comparisons: response.alternatives
      });

      const safeRate = Math.max(0.25, Number.isFinite(settings.speechRate) ? settings.speechRate : 1);
      const words = typewriterText.trim() ? typewriterText.trim().split(/\s+/).length : 0;
      const wordsPerSecondBase = BASE_WPM / 60;
      const fallbackFromWords = words > 0 ? words / (wordsPerSecondBase * safeRate) : 0;
      const fallbackFromChars =
        typewriterText.length > 0 ? typewriterText.length / (BASE_CHARS_PER_SECOND * safeRate) : 0;
      const fallbackDuration = Math.max(fallbackFromWords, fallbackFromChars, 0.8);

      let cancelTypewriter: (() => void) | undefined;

      const startTypewriter = (audio: HTMLAudioElement) => {
        const previousCancel: (() => void) | undefined = cancelTypewriter;
        if (typeof previousCancel === "function") {
          previousCancel();
        }

        audio.playbackRate = safeRate;

        let rafId: number | null = null;
        let active = true;
        let targetDuration = fallbackDuration;
        const totalLength = typewriterText.length;
        let previousChars = 0;
        const metaEvents: Array<keyof HTMLMediaElementEventMap> = ["loadedmetadata", "durationchange"];
        let fallbackStarter: number | undefined;
        const startedAt = performance.now();

        if (totalLength === 0) {
          updateMessage(messageId, { displayText: "", partial: false });
          cancelTypewriter = () => undefined;
          return;
        }

        const updateTargetDuration = () => {
          if (Number.isFinite(audio.duration) && audio.duration > 0) {
            targetDuration = audio.duration;
          }
        };

        const stopLoop = () => {
          if (rafId !== null) {
            window.cancelAnimationFrame(rafId);
            rafId = null;
          }
        };

        const computeReferenceTime = () => {
          const elapsed = (performance.now() - startedAt) / 1000;
          const audioTime = audio.currentTime;
          if (audioTime <= 0) {
            return Math.min(elapsed, MAX_TEXT_LEAD_SECONDS);
          }
          const upperBound = Math.min(elapsed, audioTime + MAX_TEXT_LEAD_SECONDS);
          return Math.max(audioTime, upperBound);
        };

        const tick = () => {
          if (!active) return;
          updateTargetDuration();
          const usableDuration =
            targetDuration > 0 && Number.isFinite(targetDuration) ? targetDuration : fallbackDuration;
          const referenceTime = computeReferenceTime();
          const progress = usableDuration > 0 ? Math.min(referenceTime / usableDuration, 1) : 1;
          let charCount = Math.min(totalLength, Math.floor(progress * totalLength));
          if (progress > 0 && charCount === 0) {
            charCount = 1;
          }
          if (charCount <= previousChars) {
            rafId = window.requestAnimationFrame(tick);
            return;
          }

          previousChars = charCount;
          const display = typewriterText.slice(0, charCount);
          updateMessage(messageId, {
            displayText: display,
            partial: charCount < totalLength,
            primaryModel: response.primary.model,
            comparisons: response.alternatives
          });

          if (charCount >= totalLength) {
            stopLoop();
            return;
          }

          rafId = window.requestAnimationFrame(tick);
        };

        const ensureTick = () => {
          if (!active) return;
          if (rafId !== null) return;
          rafId = window.requestAnimationFrame(tick);
        };

        const onPlaying = () => {
          if (typeof fallbackStarter === "number") {
            window.clearTimeout(fallbackStarter);
            fallbackStarter = undefined;
          }
          ensureTick();
        };

        const onTimeUpdate = () => {
          if (!active) return;
          if (rafId === null && !audio.paused) {
            rafId = window.requestAnimationFrame(tick);
          }
        };

        updateTargetDuration();
        metaEvents.forEach((eventName) => audio.addEventListener(eventName, updateTargetDuration));
        audio.addEventListener("playing", onPlaying);
        audio.addEventListener("timeupdate", onTimeUpdate);

        fallbackStarter = window.setTimeout(() => {
          if (!active) return;
          ensureTick();
        }, 220);

        cancelTypewriter = () => {
          if (!active) return;
          active = false;
          if (typeof fallbackStarter === "number") {
            window.clearTimeout(fallbackStarter);
            fallbackStarter = undefined;
          }
          stopLoop();
          metaEvents.forEach((eventName) => audio.removeEventListener(eventName, updateTargetDuration));
          audio.removeEventListener("playing", onPlaying);
          audio.removeEventListener("timeupdate", onTimeUpdate);
        };

        ensureTick();
      };

      try {
        setPhase("speaking");
        await playTts(speechText, { onAudioReady: startTypewriter });
        const cancel: (() => void) | undefined = cancelTypewriter;
        if (typeof cancel === "function") {
          cancel();
        }
        cancelTypewriter = undefined;
        updateMessage(messageId, {
          displayText: typewriterText,
          partial: false,
          primaryModel: response.primary.model,
          comparisons: response.alternatives,
          text: trimmed
        });
      } catch (error) {
        const cancel: (() => void) | undefined = cancelTypewriter;
        if (typeof cancel === "function") {
          cancel();
        }
        cancelTypewriter = undefined;
        console.error(error);
        updateMessage(messageId, {
          displayText: typewriterText,
          partial: false,
          primaryModel: response.primary.model,
          comparisons: response.alternatives,
          text: trimmed
        });
        addMessage({
          id: crypto.randomUUID(),
          role: "system",
          ts: Date.now(),
          text: error instanceof Error ? error.message : "Unable to synthesize voice"
        });
        setPhase("error");
      } finally {
        setPhase("idle");
      }

      if (response.failures.length > 0) {
        const detail = response.failures
          .map((failure) => `${failure.model}: ${failure.error}`)
          .join("; ");
        addMessage({
          id: crypto.randomUUID(),
          role: "system",
          ts: Date.now(),
          text: `Secondary model issue - ${detail}`
        });
      }
    },
    [addMessage, playTts, setPhase, settings.speechRate, updateMessage]
  );

  const sendUserText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const now = Date.now();
      addMessage({
        id: crypto.randomUUID(),
        role: "user",
        text: trimmed,
        ts: now
      });

      const normalized = trimmed.toLowerCase();
      if (IDENTITY_PATTERNS.some((pattern) => pattern.test(normalized))) {
        setPhase("thinking");
        await handleAssistantReply(toGeminiResponse(IDENTITY_RESPONSE, settings.model));
        return;
      }

      setPhase("thinking");
      try {
        const response = await callGemini({ text: trimmed, allowFallback: true });
        await handleAssistantReply(response);
      } catch (error) {
        console.error(error);
        addMessage({
          id: crypto.randomUUID(),
          role: "system",
          ts: Date.now(),
          text: error instanceof Error ? error.message : "Gemini request failed"
        });
        setPhase("error");
      }
    },
    [addMessage, callGemini, handleAssistantReply, setPhase, settings.model]
  );

  const sendControlEvent = useCallback(
    (action: string) => {
      if (action === "start_listen") {
        setPhase("listening");
      }
      if (action === "stop_listen") {
        setPhase("idle");
      }
    },
    [setPhase]
  );

  const attachVideo = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          width: { ideal: 1280 },
          facingMode: "environment"
        }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      return stream;
    } catch (error) {
      console.error("Camera permission error", error);
      throw error;
    }
  }, []);

  const captureAndSendFrame = useCallback(
    async (opts?: Parameters<typeof captureFrame>[1]) => {
      const target = videoRef.current;
      if (!target) throw new Error("Video reference missing");

      await waitForVideoReady(target);
      const { blob, dataUrl } = await captureFrame(target, opts);
      const base64 = await blobToBase64(blob);
      const detailLevel = opts?.roi ? "detailed" : "normal";

      addMessage({
        id: crypto.randomUUID(),
        role: "user",
        ts: Date.now(),
        imageThumbDataUrl: dataUrl
      });

      setPhase("thinking");
      try {
        const response = await callGemini({
          text: DEFAULT_PROMPT,
          imageBase64: base64,
          allowFallback: true
        });
        await handleAssistantReply(response);

        try {
          const toolResponse = await fetch("/api/tools/describe-scene", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ detailLevel })
          });
          if (!toolResponse.ok) {
            const errorBody = await toolResponse.json().catch(() => ({}));
            const message =
              typeof errorBody.error === "string"
                ? errorBody.error
                : `describe_scene failed (${toolResponse.status})`;
            recordToolEvent("describe_scene", { detailLevel }, { status: "error", error: message });
          } else {
            const toolPayload = await toolResponse.json();
            recordToolEvent("describe_scene", { detailLevel }, { status: "success", result: toolPayload });
          }
        } catch (toolError) {
          const message =
            toolError instanceof Error ? toolError.message : "describe_scene tool failed";
          recordToolEvent("describe_scene", { detailLevel }, { status: "error", error: message });
        }
      } catch (error) {
        console.error(error);
        addMessage({
          id: crypto.randomUUID(),
          role: "system",
          ts: Date.now(),
          text: error instanceof Error ? error.message : "Gemini request failed"
        });
        setPhase("error");
      }

      return { blob, dataUrl };
    },
    [addMessage, callGemini, handleAssistantReply, recordToolEvent, setPhase, waitForVideoReady]
  );

  useEffect(() => {
    if (!settings.autoFrame || settings.frameRate <= 0) return;
    const interval = window.setInterval(() => {
      const video = videoRef.current;
      if (!video || !video.videoWidth || !video.videoHeight) return;
      captureAndSendFrame().catch((error) => console.warn("Auto frame failed", error));
    }, Math.max(500, (1 / settings.frameRate) * 1000));

    return () => window.clearInterval(interval);
  }, [captureAndSendFrame, settings.autoFrame, settings.frameRate]);

  const generateImages = useCallback(
    async ({ prompt, aspectRatio, negativePrompt, count }: { prompt: string; aspectRatio?: string; negativePrompt?: string; count?: number }) => {
      const trimmedPrompt = prompt.trim();
      if (!trimmedPrompt) {
        throw new Error("Prompt is required to generate an image");
      }

      const res = await fetch("/api/gemini/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmedPrompt,
          aspectRatio: aspectRatio?.trim() || undefined,
          negativePrompt: negativePrompt?.trim() || undefined,
          numberOfImages: count && count > 0 ? Math.min(count, 4) : 1,
          model: settings.imageModel
        })
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        const message = (errorBody as { error?: string }).error ?? "Image generation failed";
        throw new Error(message);
      }

      const data = (await res.json()) as {
        images: Array<{ id: string; base64: string; mimeType: string; dataUrl: string }>;
        model: string;
        promptFeedback?: unknown;
      };

      return data;
    },
    [settings.imageModel]
  );

  return {
    audioRef,
    videoRef,
    permissionState,
    connect,
    disconnect,
    sendUserText,
    sendControlEvent,
    captureAndSendFrame,
    generateImages,
    attachVideo
  };
}


