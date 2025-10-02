"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Image as ImageIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState(
    "Cinematic photo of a falcon over Dubai skyline at sunrise, 3:2"
  );
  const [img, setImg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [models, setModels] = useState<Array<{ name: string; displayName?: string }>>([]);
  const [model, setModel] = useState<string>("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [metaRes, listRes] = await Promise.all([
          fetch("/api/generate"),
          fetch("/api/generate/models")
        ]);
        const meta = await metaRes.json().catch(() => ({}));
        const list = await listRes.json().catch(() => []);
        if (!alive) return;
        const defaultModel = meta?.defaultModel || "gemini-2.5-flash-image-preview";
        setModel(defaultModel);
        if (Array.isArray(list)) {
          const normalized = list.map((m: any) => ({ name: m.name, displayName: m.displayName }));
          setModels(normalized);
        }
      } catch {
        // Optional: keep silent; user can still type prompt and generate with server default
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function generate() {
    setLoading(true);
    setNote(null);
    setImg(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        body: JSON.stringify({ prompt, model: model || undefined }),
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (data.image) setImg(data.image);
      else setNote(data.text || data.error || "No image returned.");
    } catch (e: any) {
      setNote(e?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  function downloadImage() {
    if (!img) return;
    try {
      // Derive extension from data URL mime type
      const match = /^data:([^;]+);base64,/.exec(img);
      const mime = match?.[1] || "image/png";
      const ext =
        mime === "image/jpeg" || mime === "image/jpg"
          ? "jpg"
          : mime === "image/webp"
          ? "webp"
          : "png";

      // Build a readable, safe filename from prompt
      const base = (prompt || "gemini-image").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const name = `${base.slice(0, 40) || "gemini-image"}-${timestamp}.${ext}`;

      const a = document.createElement("a");
      a.href = img;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      setNote("Could not download image.");
    }
  }

  return (
    <motion.div
      className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/60">
        <Sparkles className="h-4 w-4 text-neon-cyan" />
        Image generation
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
        <div className="grid gap-3">
          <label className="text-xs text-white/60">Model</label>
          <select
            className="w-full rounded-2xl border border-white/15 bg-black/40 p-3 text-sm text-white/90 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            {model && !models.find((m) => m.name === model) && (
              <option value={model}>{model}</option>
            )}
            {models.map((m) => (
              <option key={m.name} value={m.name}>
                {m.displayName || m.name}
              </option>
            ))}
          </select>
          <textarea
            className="min-h-[110px] w-full resize-none rounded-2xl border border-white/15 bg-black/40 p-4 text-sm text-white/90 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50"
            placeholder="Describe what to create…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div className="flex gap-3 md:flex-col">
          <Button onClick={generate} disabled={loading} className="gap-2">
            <ImageIcon className="h-4 w-4" />
            {loading ? "Generating…" : "Generate"}
          </Button>
          {img && (
            <div className="flex gap-2 md:flex-col">
              <Button
                type="button"
                variant="outline"
                onClick={downloadImage}
                className="border-white/25 gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setImg(null)}
                className="border-white/25"
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      </div>

      {note && (
        <p className="mt-3 text-sm text-white/70">{note}</p>
      )}

      {img && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img}
            alt="generated"
            className="mx-auto w-full max-w-full rounded-xl"
          />
        </div>
      )}
    </motion.div>
  );
}
