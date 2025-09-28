"use client";

export type CaptureOptions = {
  roi?: { x: number; y: number; width: number; height: number } | null;
  maxSize?: number;
  quality?: number;
};

export type CapturedFrame = {
  blob: Blob;
  dataUrl: string;
};

const defaultOptions: Required<Omit<CaptureOptions, "roi">> = {
  maxSize: 768,
  quality: 0.8
};

export async function captureFrame(
  video: HTMLVideoElement,
  { roi = null, maxSize, quality }: CaptureOptions = {}
): Promise<CapturedFrame> {
  if (!video.videoWidth || !video.videoHeight) {
    throw new Error("Video element has no dimensions yet");
  }

  const opts = { ...defaultOptions, ...(maxSize ? { maxSize } : {}), ...(quality ? { quality } : {}) };

  const ratio = video.videoWidth / video.videoHeight;
  const targetWidth = ratio >= 1 ? opts.maxSize : Math.round(opts.maxSize * ratio);
  const targetHeight = ratio >= 1 ? Math.round(opts.maxSize / ratio) : opts.maxSize;

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cannot get 2d context");

  if (roi) {
    const scaleX = targetWidth / (roi.width || video.videoWidth);
    const scaleY = targetHeight / (roi.height || video.videoHeight);
    ctx.drawImage(
      video,
      roi.x,
      roi.y,
      roi.width,
      roi.height,
      0,
      0,
      Math.round(roi.width * scaleX),
      Math.round(roi.height * scaleY)
    );
  } else {
    ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", opts.quality));
  if (!blob) throw new Error("Failed to encode JPEG");

  const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
  return { blob, dataUrl };
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === "string") {
        const base64 = result.split(",")[1] ?? "";
        resolve(base64);
      } else {
        reject(new Error("Unexpected reader result"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
