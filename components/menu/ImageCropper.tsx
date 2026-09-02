// components/ImageCropper.tsx
"use client";

import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import { X, Loader2, ZoomIn } from "lucide-react";
import { getCroppedImageBlob } from "@/lib/cropimage";

interface ImageCropperProps {
  imageSrc: string;
  aspect: number;
  title?: string;
  // Pass "anonymous" for remote URLs so the canvas isn't tainted — omit
  // for local blob/object URLs and data URLs, which don't need it.
  crossOrigin?: "anonymous" | "use-credentials";
  onCancel: () => void;
  onComplete: (blob: Blob) => void;
}

export default function ImageCropper({
  imageSrc,
  aspect,
  title = "Crop image",
  crossOrigin,
  onCancel,
  onComplete,
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    setError(null);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels, "image/jpeg", crossOrigin);
      onComplete(blob);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      // Most likely a cross-origin image whose host doesn't send
      // permissive CORS headers, tainting the canvas on export.
      setError(
        "Couldn't crop this image — the source may not allow it. Try a different link (e.g. Unsplash) or a locally saved copy."
      );
      setProcessing(false);
    }
  };

  return (
    <div
      className="cropper-overlay-in"
      style={{
        position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={(e) => e.target === e.currentTarget && !processing && onCancel()}
    >
      <div
        className="cropper-modal-in"
        style={{ background: "var(--color-bg-card)", borderRadius: 16, width: "100%", maxWidth: 420, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "var(--color-heading)" }}>{title}</h3>
          <button
            onClick={onCancel}
            disabled={processing}
            style={{
              background: "none", border: "none", cursor: processing ? "default" : "pointer",
              color: "var(--color-text-muted)", display: "flex", padding: 4, borderRadius: 6,
              opacity: processing ? 0.5 : 1, transition: "opacity 0.15s ease",
            }}
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        </div>

        <div style={{ position: "relative", width: "100%", height: 300, borderRadius: 10, overflow: "hidden", background: "#111" }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ZoomIn size={14} strokeWidth={1.8} color="var(--color-text-muted)" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ flex: 1, accentColor: "var(--color-primary)" }}
          />
        </div>

        {error && (
          <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-primary)", lineHeight: 1.4 }}>{error}</p>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            disabled={processing}
            style={{
              flex: 1, padding: "10px", borderRadius: 8, border: "1px solid var(--color-border)",
              background: "var(--color-bg-card)", color: "var(--color-text)", fontSize: "0.85rem",
              fontWeight: 500, cursor: processing ? "default" : "pointer", opacity: processing ? 0.6 : 1,
              transition: "background 0.15s ease",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={processing || !croppedAreaPixels}
            className="btn btn-primary"
            style={{
              flex: 1, justifyContent: "center", display: "flex", alignItems: "center", gap: 6,
              opacity: processing ? 0.75 : 1, transition: "opacity 0.15s ease",
            }}
          >
            {processing && <Loader2 size={14} strokeWidth={2.2} style={{ animation: "spin 0.7s linear infinite" }} />}
            {processing ? "Cropping…" : "Use this crop"}
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes cropperFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cropperScaleIn { from { opacity: 0; transform: scale(0.96) translateY(4px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .cropper-overlay-in { animation: cropperFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1); }
        .cropper-modal-in { animation: cropperScaleIn 0.22s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
}