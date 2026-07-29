// app/(admin)/settings/banners/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
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

export default function BannersPage() {
  const { banners, bannersLoading, bannersError, fetchBanners, createBanner, updateBanner, deleteBanner, isSavingBanner } = useSettingsStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editBanner, setEditBanner] = useState<Banner | null>(null);
  const [form, setForm] = useState<BannerFormData>(EMPTY_BANNER_FORM);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const openAdd = () => { setEditBanner(null); setForm(EMPTY_BANNER_FORM); setPreviewUrl(""); setModalOpen(true); };
  const openEdit = (b: Banner) => {
    setEditBanner(b);
    setForm({ title: b.title, subtitle: b.subtitle, ctaText: b.ctaText, ctaLink: b.ctaLink, startDate: b.startDate, endDate: b.endDate, active: b.active, imageFile: null });
    setPreviewUrl(b.imageUrl);
    setModalOpen(true);
  };

  const handleFile = (file: File) => {
    setForm((f) => ({ ...f, imageFile: file }));
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.title) return;
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
      <SubHeader
        title="Banner Management"
        subtitle="Create and manage promotional banners"
        action={
          <button className="btn btn-primary" onClick={openAdd} style={{ gap: 6 }}>
            <Plus size={14} strokeWidth={2.2} /> Add Banner
          </button>
        }
      />

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {bannersLoading && (
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ display: "flex", gap: 16 }}>
                <Skeleton width={72} height={56} radius={8} />
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
            {/* TODO(BACKEND): GET /admin/banners not implemented — see request doc #1 */}
            No banners configured
          </p>
        )}

        {!bannersLoading && !bannersError && banners?.map((b, i) => (
          <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", borderBottom: i < banners.length - 1 ? "1px solid var(--color-border)" : "none" }}>
            <div style={{ width: 72, height: 56, borderRadius: 8, overflow: "hidden", flexShrink: 0, border: "1px solid var(--color-border)" }}>
              <Image src={b.imageUrl} alt={b.title} width={72} height={56} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--color-heading)" }}>{b.title}</p>
                <span className="badge" style={{ background: b.active ? "rgba(34,197,94,0.12)" : "var(--color-bg-soft)", color: b.active ? "#16a34a" : "var(--color-text-muted)" }}>
                  {b.active ? "Active" : "Offline"}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 400, color: "var(--color-text-muted)" }}>{b.subtitle}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 5 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                  <CalendarDays size={11} strokeWidth={1.8} />{b.startDate} - {b.endDate}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                  <Eye size={11} strokeWidth={1.8} />{b.clicks.toLocaleString()} clicks
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
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
            <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>Banner Image</label>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              style={{
                border: `1.5px dashed ${dragOver ? "var(--color-primary)" : "var(--color-border)"}`,
                borderRadius: 10, padding: "24px 20px", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer",
                background: dragOver ? "rgba(225,11,28,0.03)" : "var(--color-bg-soft)", minHeight: 100,
              }}
            >
              {previewUrl
                ? <Image src={previewUrl} alt="Preview" width={80} height={60} style={{ borderRadius: 8, objectFit: "cover" }} />
                : <>
                    <UploadCloud size={22} strokeWidth={1.6} color="var(--color-text-muted)" />
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-text-muted)" }}>Click or drag to upload image</p>
                  </>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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