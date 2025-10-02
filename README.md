# Jarvis Web Agent

An animated, multimodal “Jarvis”-style control center built with Next.js 15. It combines:

- Gemini for chat, vision, and image generation (server-only API key usage)
- ElevenLabs for TTS synced with a typewriter effect
- A cinematic UI: Framer Motion, cyan/magenta neon palette, fluid background

The landing page now includes a documentation/tutorial section with a pinned (sticky/fixed) sidebar and animated content cards.

## Table of Contents

- Features
- Architecture
- Tech Stack
- Quick Start
- Environment Variables
- API Endpoints
- Project Structure
- UI Guide (Landing → Docs → Workspace)
- Tool Timeline
- Speech & Pronunciation
- Styling & Theme
- Troubleshooting

## Features

- Gemini-integrated chat with partial streaming indicators and simple Markdown styling
- Camera capture (manual + optional auto-frame) for live context
- Tool Timeline with running → success/error lifecycle, details, and timestamps
- Image generation UI with model selector, download, and server route using the Gemini key
- Pinned Docs sidebar with section highlighting as you scroll, and animated tutorial cards
- Voice capture + ElevenLabs TTS with pronunciation smoothing and typewriter sync
- Fluid “SplashCursor” background and neon cyan–magenta theme

## Architecture

```
app/
├─ page.tsx                       # Root shell → renders HomePage
├─ api/
│  ├─ gemini/chat/route.ts        # Chat proxy to Gemini
│  ├─ generate/route.ts           # Image generation via @google/genai
│  ├─ generate/models/route.ts    # Lists image-capable models
│  ├─ tts/route.ts                # ElevenLabs TTS proxy
│  └─ tools/*                     # Tool endpoints (search, open link, describe scene, calendar)
components/
├─ home/home-page.tsx             # Landing + Docs + Workspace (animated)
├─ ChatPanel.tsx                  # Live thread, autoscroll, jump-to-bottom
├─ ToolTimeline.tsx               # Tool lifecycle with details
├─ VoiceButton.tsx                # Press-and-hold voice mic
├─ SettingsSheet.tsx              # Preferences panel
├─ ui/SplashCursor.tsx            # Fluid background effect
└─ image/image-generator.tsx      # Prompt → image, model selector, download
lib/
├─ hooks/use-jarvis-client.ts     # Messaging, tools, TTS orchestration
├─ stores/agent-store.ts          # Zustand store, phases, persistence
└─ tools.ts / vision.ts / markdown.ts
styles/
└─ globals.css                    # Base styles, scrollbars, animations
```

## Tech Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS + custom neon palette (Cyan/Blue and Magenta/Pink)
- Framer Motion for animations
- Zustand for state
- Google Generative AI SDK (@google/genai)
- ElevenLabs (REST)

## Quick Start

```powershell
# 1) Install
npm install

# 2) Configure env (see below)

# 3) Dev server
npm run dev

# Build
npm run build

# Start (production)
npm start
```

The dev server runs on http://localhost:3000 (auto-falls back to 3001 if taken). A LAN URL is logged for testing on other devices.

## Environment Variables

Create `.env.local` and set the following (server values without NEXT_PUBLIC stay on the server):

```
GEMINI_API_KEY=your_google_generative_ai_key
IMAGE_MODEL=gemini-2.0-flash-exp     # optional; UI can override

ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVENLABS_VOICE_ID=default_voice_id

NEXT_PUBLIC_ELEVENLABS_VOICE_ID=default_voice_id
NEXT_PUBLIC_GEMINI_MODEL=gemini-2.5-flash  # optional default for chat

SITE_NAME=Jarvis
```

## API Endpoints

- Chat: `POST /api/gemini/chat` – Streams assistant replies using your key
- Image generation: `POST /api/generate` – Generates image from prompt; optional `model` overrides
- Models list: `GET /api/generate/models` – Returns image-capable models available to your key
- TTS: `POST /api/tts` – ElevenLabs proxy
- Tools: `POST /api/tools/{tool-name}` – Stubs for search, describe-scene, open-link, calendar

All API routes validate inputs and handle errors. Tool endpoints are schema-driven and can be swapped for live integrations.

## Project Structure (highlights)

| Path                                   | Description                                         |
| -------------------------------------- | --------------------------------------------------- |
| `components/home/home-page.tsx`        | Landing hero, Docs (pinned), Tutorials, Workspace   |
| `components/image/image-generator.tsx` | Prompt → image, model selector + download           |
| `app/api/generate/route.ts`            | Server-only image generation via @google/genai      |
| `app/api/generate/models/route.ts`     | Lists available image models                        |
| `components/ToolTimeline.tsx`          | Tool lifecycle with running/success/error + details |
| `lib/hooks/use-jarvis-client.ts`       | Orchestrates chat, tools, TTS, camera snaps         |
| `components/ui/SplashCursor.tsx`       | Fluid cyan–magenta background effect                |

## UI Guide (Landing → Docs → Workspace)

1. Landing Hero

- Animated entrance for tag, strapline (ShinyText), H1, and CTAs
- Neon gradient buttons and subtle hover scale

2. Documentation (Pinned)

- Left sidebar stays pinned; active section highlights via IntersectionObserver
- Right column contains animated cards explaining setup, interaction, tools, images, and settings

3. Tutorials

- Three animated cards with a quick overview of the workflow

4. Workspace

- Chat panel, voice controls, audio visualizer, camera dock, tool timeline, and image generator

## Tool Timeline

- Displays each tool call with timestamps and lifecycle
- Expandable details for arguments and results
- Icons and animated entries make the audit trail easy to scan

## Speech & Pronunciation

- `expandSpeechAbbreviations` converts things like °F, mph, TTS, GPU to better TTS phrases
- Only speech text is transformed; the visible text stays unchanged
- Typewriter duration is synced with ElevenLabs audio length

## Styling & Theme

- Tailwind + custom neon palette
  - Cyan/Blue: `#00D1FF`, `#00ABFF`, `#0085FF`
  - Magenta/Pink: `#FF00E6`, `#FF00B0`, `#FF007A`
- Fluid background: `components/ui/SplashCursor.tsx`
- ShinyText pulse glow and hue-shift in `styles/globals.css`

## Troubleshooting

- Port in use? Next.js will auto-pick the next available port (often 3001).
- No images? Ensure `GEMINI_API_KEY` is set, and your key supports the selected model.
- No audio? Verify `ELEVENLABS_API_KEY` and voice IDs; check browser autoplay policies.
- Sticky Docs not pinning? The sidebar uses sticky with a fixed-on-scroll fallback. Make sure you’re actually within the Documentation section; the nav will pin once that section reaches the top.

---

Built by Ayaan ("Jarvis online").
