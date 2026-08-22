// app/(admin)/settings/banners/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Plus, Trash2, SquarePen, UploadCloud, CalendarDays, Eye, Check,
} from "lucide-react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Banner, BannerFormData } from "@/types/settings.types";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";
import { SubHeader, Modal, Toggle } from "@/components/settings/SettingsShared";

const EMPTY_BANNER_FORM: BannerFormData = {
  title: "", subtitle: "", ctaText: "", ctaLink: "", startDate: "", endDate: "", active: true, imageFile: null,
};

const MAX_IMAGE_MB = 5;

// Carousel banners are rendered in a fixed 2:1 frame — 1200×600 is the
// recommended export size. Enforced as a soft warning, not a hard block:
// an image that's close (e.g. 1200×620) shouldn't get rejected, but
// something clearly off-ratio (a square product photo) should get
// flagged before it goes live and gets awkwardly cropped by the carousel.
const RECOMMENDED_BANNER_SIZE = { width: 1200, height: 600 };
const BANNER_ASPECT_RATIO = RECOMMENDED_BANNER_SIZE.width / RECOMMENDED_BANNER_SIZE.height; // 2
const ASPECT_RATIO_TOLERANCE = 0.08; // ~8% slack before warning

// Reads actual pixel dimensions from an already-created object URL (the
// same one used for the preview), rather than creating a second blob URL
// just to measure it.
function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Could not read image dimensions"));
    img.src = url;
  });
}

// Backend returns dates as full ISO strings (e.g. "2026-08-16T00:00:00.000Z").
// <input type="date"> only accepts the "YYYY-MM-DD" portion, so slicing is
// enough here — no Date() round-trip, which is what causes off-by-one-day
// bugs in timezones behind UTC.
function toInputDate(iso: string) {
  return iso ? iso.slice(0, 10) : "";
}

// For display, parse the Y/M/D parts directly instead of `new Date(iso)`.
// Going through Date() interprets a date-only string as UTC midnight, and
// formatting that in a local timezone behind UTC rolls it back a day —
// that's the "ooz"-looking date bug. Parsing the parts avoids the TZ step
// entirely.
function formatDisplayDate(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return "—";
  return new Date(y, m - 1, d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function BannersPage() {
  const { banners, bannersLoading, bannersError, fetchBanners, createBanner, updateBanner, deleteBanner, isSavingBanner } = useSettingsStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editBanner, setEditBanner] = useState<Banner | null>(null);
  const [form, setForm] = useState<BannerFormData>(EMPTY_BANNER_FORM);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  // Tracks whether previewUrl is a local blob: URL we created (and must
  // revoke) vs. a remote Cloudinary URL from an existing banner.
  const localPreviewRef = useRef(false);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // Revoke any local preview blob on unmount so we don't leak it.
  useEffect(() => {
    return () => {
      if (localPreviewRef.current && previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const openAdd = () => {
    if (localPreviewRef.current && previewUrl) URL.revokeObjectURL(previewUrl);
    localPreviewRef.current = false;
    setEditBanner(null);
    setForm(EMPTY_BANNER_FORM);
    setPreviewUrl("");
    setModalOpen(true);
  };

  const openEdit = (b: Banner) => {
    if (localPreviewRef.current && previewUrl) URL.revokeObjectURL(previewUrl);
    localPreviewRef.current = false;
    setEditBanner(b);
    setForm({
      title: b.title,
      subtitle: b.subtitle,
      ctaText: b.ctaText,
      ctaLink: b.ctaLink,
      startDate: toInputDate(b.startDate),
      endDate: toInputDate(b.endDate),
      active: b.active,
      imageFile: null,
    });
    setPreviewUrl(b.imageUrl); // remote Cloudinary URL — not ours to revoke
    setModalOpen(true);
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast.error(`Image must be under ${MAX_IMAGE_MB}MB`);
      return;
    }

    if (localPreviewRef.current && previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    localPreviewRef.current = true;
    setForm((f) => ({ ...f, imageFile: file }));
    setPreviewUrl(url);

    // Soft check, fired after the preview is already showing — doesn't
    // block the upload, just flags banners likely to get cropped oddly by
    // the carousel's fixed 2:1 frame.
    try {
      const { width, height } = await getImageDimensions(url);
      const ratio = width / height;
      if (Math.abs(ratio - BANNER_ASPECT_RATIO) > ASPECT_RATIO_TOLERANCE) {
        toast.warning(
          `This image is ${width}×${height} — recommended size is ${RECOMMENDED_BANNER_SIZE.width}×${RECOMMENDED_BANNER_SIZE.height} (2:1) for the banner carousel.`
        );
      }
    } catch {
      // Couldn't read dimensions for some reason — not worth blocking the
      // upload over a measurement failure.
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    // Create requires an image (nothing to fall back to); edit can keep
    // the existing Cloudinary image if the user didn't pick a new one.
    if (!editBanner && !form.imageFile) {
      toast.error("Please add a banner image");
      return;
    }

    if (editBanner) {
      const ok = await updateBanner(editBanner.id, form);
      if (ok) setModalOpen(false);
    } else {
      const ok = await createBanner(form);
      if (ok) {
        setModalOpen(false);
        setSuccess(true);
      }
    }
  };

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          Mobile responsiveness notes:
          - .action-btn-label hides under 420px (matches the breakpoint
            already used in (admin)/layout.tsx for the branch-selector
            label), collapsing "Add Banner" to an icon-only button so it
            can never wrap onto two lines and collide with SubHeader's
            subtitle underneath it. This fixes the button itself rather
            than SubHeader's internals, since that component's source
            isn't available here — if the header still overlaps after
            this, the wrapping needs to happen inside SubHeader itself.
          - .form-grid-2 collapses from 2 columns to 1 under 560px. Uses
            !important because the base grid-template-columns is set via
            inline style, which always wins over a plain class rule
            regardless of media query — same technique already used in
            (admin)/layout.tsx's own mobile overrides.
          - .banner-row switches to flex-wrap under 480px; .banner-thumb
            goes full-width there so it naturally pushes the text below
            it onto its own line, and .banner-actions becomes a
            full-width, right-aligned row of its own rather than getting
            squeezed onto the same line as the thumbnail and text.
         ───────────────────────────────────────────────────────────── */}
      <style jsx>{`
        @media (max-width: 420px) {
          .action-btn-label {
            display: none;
          }
          .action-btn {
            padding: 10px !important;
          }
        }
        @media (max-width: 560px) {
          .form-grid-2 {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .banner-row {
            flex-wrap: wrap !important;
            align-items: flex-start !important;
          }
          .banner-thumb {
            width: 100% !important;
            aspect-ratio: 2 / 1 !important;
            height: auto !important;
          }
          .banner-content {
            flex: 1 1 100% !important;
          }
          .banner-actions {
            width: 100% !important;
            justify-content: flex-end !important;
            margin-top: 8px !important;
          }
        }
      `}</style>

      <SubHeader
        title="Banner Management"
        subtitle="Create and manage promotional banners"
        action={
          <button className="btn btn-primary action-btn" onClick={openAdd} style={{ gap: 6 }}>
            <Plus size={14} strokeWidth={2.2} />
            <span className="action-btn-label">Add Banner</span>
          </button>
        }
      />

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {bannersLoading && (
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ display: "flex", gap: 16 }}>
                <Skeleton width={96} height={48} radius={8} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <SkeletonText width="40%" height={14} />
                  <SkeletonText width="60%" height={12} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!bannersLoading && (bannersError || !banners?.length) && (
          <p style={{ padding: 20, margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            No banners configured
          </p>
        )}

        {!bannersLoading && !bannersError && banners?.map((b, i) => (
          <div
            key={b.id}
            className="banner-row"
            style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", borderBottom: i < banners.length - 1 ? "1px solid var(--color-border)" : "none" }}
          >
            <div className="banner-thumb" style={{ width: 96, height: 48, borderRadius: 8, overflow: "hidden", flexShrink: 0, border: "1px solid var(--color-border)" }}>
              <Image src={b.imageUrl} alt={b.title} width={96} height={48} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
            </div>

            <div className="banner-content" style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3, flexWrap: "wrap" }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--color-heading)" }}>{b.title}</p>
                <span className="badge" style={{ background: b.active ? "rgba(34,197,94,0.12)" : "var(--color-bg-soft)", color: b.active ? "#16a34a" : "var(--color-text-muted)" }}>
                  {b.active ? "Active" : "Offline"}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 400, color: "var(--color-text-muted)" }}>{b.subtitle}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 5, flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                  <CalendarDays size={11} strokeWidth={1.8} />
                  {formatDisplayDate(b.startDate)} – {formatDisplayDate(b.endDate)}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                  <Eye size={11} strokeWidth={1.8} />{b.clicks.toLocaleString()} clicks
                </span>
              </div>
            </div>

            <div className="banner-actions" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <button onClick={() => openEdit(b)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", padding: 6, borderRadius: 6 }}
              >
                <SquarePen size={15} strokeWidth={1.8} />
              </button>
              <button onClick={() => deleteBanner(b.id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", padding: 6, borderRadius: 6 }}
              >
                <Trash2 size={15} strokeWidth={1.8} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <Modal
          title={editBanner ? "Edit Banner" : "Create Promotional Banner"}
          subtitle="Design a new banner for the app carousel"
          onClose={() => setModalOpen(false)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>
              Banner Image {!editBanner && <span style={{ color: "var(--color-primary)" }}>*</span>}
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              style={{
                border: `1.5px dashed ${dragOver ? "var(--color-primary)" : "var(--color-border)"}`,
                borderRadius: 10, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer",
                background: dragOver ? "rgba(225,11,28,0.03)" : "var(--color-bg-soft)",
                // Actual 2:1 box, not an arbitrary fixed height — shows the
                // real target shape before a file's even picked, and the
                // preview image (below) fills exactly this frame.
                width: "100%", aspectRatio: "2 / 1", maxHeight: 220,
                position: "relative", overflow: "hidden",
              }}
            >
              {previewUrl
                ? (
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    sizes="(max-width: 600px) 100vw, 560px"
                    style={{ objectFit: "cover", borderRadius: 8 }}
                  />
                )
                : <>
                    <UploadCloud size={22} strokeWidth={1.6} color="var(--color-text-muted)" />
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-text-muted)" }}>Click or drag to upload image</p>
                  </>
              }
            </div>
            <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
              JPG or PNG, up to {MAX_IMAGE_MB}MB. Recommended size: {RECOMMENDED_BANNER_SIZE.width}×{RECOMMENDED_BANNER_SIZE.height}px (2:1){editBanner ? " — leave blank to keep the current image." : "."}
            </p>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
          </div>

          <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {([
              { label: "Title", key: "title" as const, placeholder: "Summer Special 30% Off" },
              { label: "Subtitle", key: "subtitle" as const, placeholder: "Hot deals on all combos" },
            ]).map(({ label, key, placeholder }) => (
              <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>{label}</label>
                <input className="input" placeholder={placeholder} value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
          </div>

          <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {([
              { label: "CTA Button Text", key: "ctaText" as const, placeholder: "Order Now" },
              { label: "CTA Link", key: "ctaLink" as const, placeholder: "/menu" },
            ]).map(({ label, key, placeholder }) => (
              <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>{label}</label>
                <input className="input" placeholder={placeholder} value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
          </div>

          <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {([
              { label: "Start Date", key: "startDate" as const },
              { label: "End Date", key: "endDate" as const },
            ]).map(({ label, key }) => (
              <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>{label}</label>
                <input className="input" type="date" value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "var(--color-bg-soft)", borderRadius: 8 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text)" }}>Activate Banner</p>
              <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Make this banner visible immediately</p>
            </div>
            <Toggle on={form.active} onToggle={() => setForm((f) => ({ ...f, active: !f.active }))} />
          </div>

          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSavingBanner}
            style={{ width: "100%", justifyContent: "center", padding: "13px", fontSize: "0.875rem", opacity: isSavingBanner ? 0.6 : 1 }}
          >
            {isSavingBanner ? "Saving…" : editBanner ? "Save Changes" : "Create Banner"}
          </button>
        </Modal>
      )}

      {success && (
        <div style={{ position: "fixed", inset: 0, zIndex: 110, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "var(--color-bg-card)", borderRadius: 16, width: "100%", maxWidth: 340, padding: 36, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(34,197,94,0.12)", border: "2px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Check size={24} strokeWidth={2.2} color="#16a34a" />
            </div>
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: "1.05rem", fontWeight: 600, color: "var(--color-heading)" }}>Success!</h3>
              <p style={{ margin: 0, fontSize: "0.855rem", color: "var(--color-text-muted)" }}>Banner created successfully.</p>
            </div>
            <button className="btn btn-primary" onClick={() => setSuccess(false)}
              style={{ width: "100%", justifyContent: "center", padding: "11px", marginTop: 4 }}>
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}