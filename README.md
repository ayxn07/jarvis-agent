# Jarvis Web Agent

A multimodal assistant that combines Gemini text/vision responses, ElevenLabs speech synthesis, and rich real-time UI affordances. The project delivers a "Jarvis"-style control center experience with auto-scrolling live chat, tool execution timeline, camera integration, and cinematic animation layers.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Application Flow](#application-flow)
- [Tool Timeline](#tool-timeline)
- [Speech & Pronunciation](#speech--pronunciation)
- [Styling & Animations](#styling--animations)
- [Accessibility Notes](#accessibility-notes)
- [Roadmap Ideas](#roadmap-ideas)

## Features

- **Gemini-integrated chat** — Streams responses from Google Gemini (text + image) with markdown-aware rendering and partial streaming indicators.
- **Auto-scrolling Live Thread** — Conversations always snap to the latest message, with a floating "jump to newest" button when you scroll up.
- **Camera capture** — Manual and automated frame capture pushes snapshots to Gemini for visual analysis.
- **Tool timeline** — Dedicated timeline card that logs tool invocations (describe_scene, search_web, open_link, create_calendar_event) with success/error badges and timestamps.
- **Speech synthesis** — ElevenLabs TTS playback syncs with a typewriter reveal animation; abbreviations and temperature units are expanded for natural pronunciation.
- **Responsive cinematic UI** — Framer Motion entrance animations, neon gradients, and noise overlays create an immersive headset-like interface.
- **Preferences drawer** — Animated sheet for configuring model, voice, frame cadence, and speech tempo.
- **Keyboard-free interaction** — Prominent on-screen controls replace previous shortcut keys for voice and capture.

## Architecture

```
app/
├─ page.tsx                  # Root shell that renders the HomePage component
├─ api/
│  ├─ gemini/chat/route.ts   # Gemini REST orchestrator
│  ├─ tts/route.ts           # ElevenLabs TTS proxy
│  └─ tools/...              # Tool endpoints (search, describe scene, calendar, open link)
components/
├─ home/home-page.tsx        # Main layout and orchestration
├─ ChatPanel.tsx             # Live thread UI, autoscroll, jump-to-latest
├─ ToolTimeline.tsx          # Animated tool execution timeline
├─ VoiceButton.tsx           # Voice control button with tactile animations
├─ SettingsSheet.tsx         # Preferences panel (Framer Motion entrance)
├─ AudioVisualizer.tsx       # Audio activity display during speech playback
├─ HeaderDock.tsx            # Hero bar, connection status, animated tagline
└─ ...
lib/
├─ hooks/use-jarvis-client.ts# Client hook: connections, messaging, speech, tools
├─ stores/agent-store.ts     # Zustand store for agent phase, settings, history
├─ markdown.ts               # Simple markdown segmentation helper
├─ tools.ts                  # Tool type definitions & formatting helpers
└─ vision.ts                 # Canvas capture helpers
styles/
└─ globals.css               # Tailwind base styles + scrollbar styling
```

Key responsibilities:

- **`useJarvisClient`** orchestrates message sending, Gemini calls, camera capture, tool logging, and TTS playback.
- **`agent-store`** keeps a single source of truth for agent phase (idle/listening/thinking/etc.), connection flag, message list, and persistent settings.
- **`ChatPanel`** sorts messages chronologically, renders markdown segments, handles scrolling, and exposes the jump-to-bottom control.
- **API routes** provide backend integration for Gemini, ElevenLabs, and synthetic tool endpoints.

## Tech Stack

- **Next.js 15** with the App Router and API routes.
- **React 19** + **TypeScript**.
- **Tailwind CSS** for styling and utility classes.
- **Framer Motion** for entrance and hover animations.
- **Lucide React** for iconography.
- **Zustand** for client-side state management.
- **Google Generative AI SDK** for Gemini requests.
- **ElevenLabs API** for speech synthesis.

## Getting Started

```bash
# Install dependencies
npm install

# Run the development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The app listens on `http://localhost:3000` by default. A custom network URL is also logged during development.

## Environment Variables

Create `.env.local` and set:

```
GEMINI_API_KEY=your_google_generative_ai_key
GEMINI_MODEL=gemini-2.5-flash  # optional override
ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVENLABS_VOICE_ID=default_voice_id
NEXT_PUBLIC_ELEVENLABS_VOICE_ID=default_voice_id
NEXT_PUBLIC_GEMINI_MODEL=gemini-2.5-flash
SITE_NAME=Jarvis
```

> Note: `NEXT_PUBLIC_*` variables are exposed to the browser, while the rest remain server-side.

## Available Scripts

- **`npm run dev`** – Start Next.js dev server with live reload.
- **`npm run build`** – Compile production bundle.
- **`npm start`** – Launch production server (after build).
- **`npm run lint`** – Run Next.js lint (requires the ESLint CLI migration prompt to be accepted on Next.js ≥15.5).

## Project Structure

| Path | Description |
|------|-------------|
| `app/api/gemini/chat/route.ts` | Normalizes Gemini requests, enforces persona instructions, handles prompt history. |
| `app/api/tts/route.ts` | Posts TTS text to ElevenLabs and streams audio back to the client. |
| `app/api/tools/*` | Stub tool endpoints (describe scene, search web, calendar, open link). |
| `components/ChatPanel.tsx` | Live message area with autoscroll and scroll-to-latest control. |
| `components/ToolTimeline.tsx` | Animated list of tool calls with status icons. |
| `components/SettingsSheet.tsx` | Preferences drawer with responsive cards and toggles. |
| `lib/hooks/use-jarvis-client.ts` | Core client logic: history snapshot, Gemini calls, tool logging, TTS playback with abbreviation expansion. |
| `lib/stores/agent-store.ts` | Zustand store + persistence for settings and message state. |
| `lib/markdown.ts` | Minimal bold segmentation for Markdown-like strings. |

## Application Flow

1. **Initialization** – `HomePage` mounts, automatically attempts to connect (requesting mic access) and sets the agent phase to `idle`.
2. **User input** – `ChatPanel` captures text via textarea; hitting Enter calls `sendUserText` from `useJarvisClient`.
3. **Gemini call** – `sendUserText` logs the user message and fetches a response from the Gemini API route; images use `captureAndSendFrame` with `DEFAULT_PROMPT`.
4. **Assistant reply** – `handleAssistantReply` stages a partial assistant message, synchronizes typewriter text with TTS playback, and finalizes the message at the end of the stream.
5. **Tool execution** – If a captured frame triggers describe-scene (or other tools), the result is logged via `recordToolEvent`; `ToolTimeline` renders the latest entries.
6. **TTS playback** – `playTts` requests audio from `/api/tts`; `expandSpeechAbbreviations` smooths spoken phrases while the UI displays the original text.

## Tool Timeline

- Located in `components/ToolTimeline.tsx`.
- Reads tool messages from the agent store, derives status badges, and animates them with Framer Motion.
- Shows up to eight recent tool calls with timestamps and summary text.
- Highlights failures (e.g., API errors) in red and successes in cyan.

## Speech & Pronunciation

- `expandSpeechAbbreviations` converts problematic abbreviations (°F, mph, TTS, GPU, etc.) into TTS-friendly phrases.
- Only the speech text is modified; the displayed message remains untouched.
- Typewriter animation duration is synchronized with ElevenLabs audio length to keep text and audio aligned.

## Styling & Animations

- Global styles use Tailwind with custom neon gradients, noise backgrounds, and tinted scrollbars (see `styles/globals.css`).
- `HeaderDock` features a Framer Motion entrance and shimmering tagline.
- `SettingsSheet` animates from the right with a spring motion and reorganized preference cards.
- Floating controls (jump-to-latest button, voice ring) are motion-enabled for tactile feedback.

## Accessibility Notes

- Focus rings have fade-in transitions for smoother UX but remain visible with `focus-visible` states.
- The scroll-to-latest control includes an `sr-only` label for screen readers.
- Voice button retains ARIA labeling through the `sr-only` span.
- Consider adding optional keyboard shortcuts for power users if desired.

## Roadmap Ideas

- Replace placeholder tool endpoints (describe scene, search web, etc.) with real integrations.
- Add error toasts or inline banners for Gemini/ElevenLabs failures.
- Introduce conversation export (JSON/Markdown) and sharing capabilities.
- Support multi-voice previews in Preferences.
- Expand abbreviation handling via configurable dictionary.

---

Built by Ayaan ("Jarvis online").
