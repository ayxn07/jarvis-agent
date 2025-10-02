# Jarvis Web Agent - AI Development Guide

A Next.js 15 multimodal assistant combining Gemini text/vision, ElevenLabs TTS, and cinematic UI for a "Jarvis"-style control center experience.

## Architecture Overview

- **`useJarvisClient`** (lib/hooks/use-jarvis-client.ts) - Central orchestrator for messaging, Gemini calls, camera capture, tool logging, and TTS with typewriter synchronization
- **`agent-store`** (lib/stores/agent-store.ts) - Zustand store with persistence for agent phases (idle/listening/thinking/speaking), settings, and message history
- **API routes** (app/api/) - Backend proxies for Gemini chat/image generation, ElevenLabs TTS, and tool endpoints
- **Components** - Framer Motion animated UI with auto-scrolling chat, tool timeline, and camera integration

## Key Patterns & Conventions

### Message Flow & State Management
- Messages flow through `agent-store` with strict role typing: `user | assistant | system | tool`
- Agent phases control UI state: `idle → thinking → speaking → idle` cycle
- Typewriter animation syncs with TTS playback duration using `expandSpeechAbbreviations()`
- Tool executions are logged via `recordToolEvent()` and displayed in `ToolTimeline`

### API Route Structure
- All routes use Zod validation with `safeParse()` for type safety
- Gemini routes support dual-model comparison (Flash vs Pro) via `modelsToQuery()`
- Model normalization functions handle legacy model names and environment variables
- Tools follow REST pattern: POST to `/api/tools/{tool-name}/route.ts`

### Component Patterns
- Framer Motion variants for consistent entrance animations (`messageVariants`, etc.)
- Markdown rendering uses custom `segmentSimpleMarkdown()` for **bold** text styling
- Camera integration requires `waitForVideoReady()` before frame capture
- Settings persist via Zustand middleware with environment variable defaults

### Development Workflows
- `npm run dev` starts Next.js with hot reload
- Environment variables: `GEMINI_API_KEY`, `ELEVENLABS_API_KEY`, model overrides with `NEXT_PUBLIC_*` prefix
- Tool endpoints are currently stubs - implement real integrations in `/api/tools/*/route.ts`
- TTS speech text preprocessing via `expandSpeechAbbreviations()` for natural pronunciation

### Integration Points
- **Gemini**: Text/image generation with conversation history and system instructions
- **ElevenLabs**: TTS streaming with voice ID configuration and audio synchronization  
- **Camera**: Canvas-based frame capture with optional ROI cropping
- **Tools**: Extensible schema-driven endpoints for calendar, search, scene description

## File Modification Guidelines

- When adding new tools: Define schema in `app/api/tools/schemas.ts`, create route handler, update `lib/tools.ts` types
- For component changes: Follow Framer Motion animation patterns and maintain consistent styling via Tailwind classes with `neon-*` custom colors
- State updates: Always use store setters, never mutate Zustand state directly
- API routes: Include proper error handling, Zod validation, and environment variable checks

## Current Limitations
- Tool endpoints return placeholder data - require real service integrations
- Camera permission handling could be more robust for different browsers
- No real-time audio streaming - uses REST API pattern instead