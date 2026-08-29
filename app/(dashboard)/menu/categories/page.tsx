"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus,
  Search,
  ChevronLeft,
  X,
  SquarePen,
  Trash2,
  Loader2,
  ImageOff,
  AlertTriangle,
  Crop,
} from "lucide-react";
import { useBranch } from "../../layout";
import { useAuthStore } from "@/store/useAuthStore";
import { useMenuStore } from "@/store/useMenuStore";
import { MenuCategory } from "@/types/menu";
import ImageCropper from "@/components/menu/ImageCropper";
import { blobToDataUrl } from "@/lib/cropimage";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const EMPTY_FORM = { name: "", description: "", imageUrl: "" };
const CATEGORY_ASPECT = 1;

export default function CategoriesPage() {
  const branch = useBranch();
  const branchId = branch?.id;
  const vendorId = useAuthStore((s) => s.user?.vendorId);

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<MenuCategory | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<MenuCategory | null>(null);
  // Crop flow: cropOpen shows the cropper over whatever's currently in
  // form.imageUrl. Works for both a freshly pasted link and a re-crop of
  // an already-cropped (data URL) image.
  const [cropOpen, setCropOpen] = useState(false);

  const {
    categories,
    categoriesLoading,
    categoriesError,
    isCreatingCategory,
    isUpdatingCategory,
    isDeletingCategory,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useMenuStore();

  useEffect(() => {
    fetchCategories(branchId ? { branchId } : {});
  }, [branchId, fetchCategories]);

  const filtered = (categories ?? []).filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditCategory(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (cat: MenuCategory) => {
    setEditCategory(cat);
    setForm({
      name: cat.name,
      description: cat.description ?? "",
      imageUrl: cat.imageUrl ?? "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    if (!vendorId) {
      toast.error("No vendor found on this account — try logging in again");
      return;
    }

    const payload = {
      name: form.name,
      description: form.description || undefined,
      imageUrl: form.imageUrl || undefined,
    };

    if (editCategory) {
      const ok = await updateCategory(editCategory.id, payload);
      if (ok) setModalOpen(false);
    } else {
      const category = await addCategory({
        vendorId,
        slug: slugify(form.name),
        ...payload,
      });
      if (category) setModalOpen(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteCategory(deleteTarget.id);
    setDeleteTarget(null);
  };

  // Cropped result is stored directly as a base64 data URL in imageUrl —
  // there's no dedicated category-image upload endpoint, and the schema
  // already treats imageUrl as a plain string, so this needs no backend
  // change. Trade-off: the payload sent on save is heavier than a plain
  // link (typically tens of KB for a compressed square crop).
  const handleCropComplete = async (blob: Blob) => {
    const dataUrl = await blobToDataUrl(blob);
    setForm((f) => ({ ...f, imageUrl: dataUrl }));
    setCropOpen(false);
  };

  const isSaving = isCreatingCategory || isUpdatingCategory;
  // A data: URL is already same-origin from the canvas's perspective, so
  // no CORS header is needed there — only a fetched http(s) link needs it.
  const cropCrossOrigin = form.imageUrl.startsWith("data:") ? undefined : "anonymous";

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Page header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <Link
              href="/menu"
              className="back-link"
              style={{
                display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.8rem",
                fontWeight: 500, color: "var(--color-text-muted)", textDecoration: "none",
                marginBottom: 6, transition: "color 0.15s ease",
              }}
            >
              <ChevronLeft size={14} strokeWidth={2} />
              Back to Menu
            </Link>
            <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "var(--color-heading)" }}>
              CATEGORIES
            </h1>
            <p style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--color-text-muted)", margin: "6px 0 0" }}>
              Add, edit, and manage menu categories
            </p>
          </div>
          <button className="btn btn-primary" onClick={openAdd} style={{ gap: 6 }}>
            <Plus size={15} strokeWidth={2.2} />
            Add Category
          </button>
        </div>

        {/* Search */}
        <div className="card" style={{ padding: "16px 20px" }}>
          <div style={{ position: "relative" }}>
            <Search
              size={14}
              strokeWidth={1.8}
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }}
            />
            <input
              className="input"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>
        </div>

        {/* Grid */}
        <div className="card" style={{ padding: 20 }}>
          {categoriesLoading && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div className="skeleton" style={{ width: "100%", aspectRatio: "1 / 1", borderRadius: 10 }} />
                  <div className="skeleton" style={{ width: "70%", height: 13, borderRadius: 4 }} />
                  <div className="skeleton" style={{ width: "45%", height: 11, borderRadius: 4 }} />
                </div>
              ))}
            </div>
          )}

          {!categoriesLoading && categoriesError && (
            <p style={{ textAlign: "center", padding: 40, color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
              Could not load categories
            </p>
          )}

          {!categoriesLoading && !categoriesError && filtered.length === 0 && (
            <p style={{ textAlign: "center", padding: 40, color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
              No categories found
            </p>
          )}

          {!categoriesLoading && !categoriesError && filtered.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
              {filtered.map((cat) => (
                <div
                  key={cat.id}
                  className="category-card"
                  style={{ display: "flex", flexDirection: "column", gap: 10, borderRadius: 12, padding: 12, border: "1px solid var(--color-border)" }}
                >
                  <div style={{ width: "100%", aspectRatio: "1 / 1", borderRadius: 8, overflow: "hidden", background: "var(--color-bg-soft)", position: "relative" }}>
                    {cat.imageUrl ? (
                      <Image src={cat.imageUrl} alt={cat.name} fill sizes="200px" style={{ objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ImageOff size={20} strokeWidth={1.6} color="var(--color-text-muted)" />
                      </div>
                    )}
                    {!cat.isActive && (
                      <span className="badge badge-gray" style={{ position: "absolute", top: 8, left: 8 }}>
                        Inactive
                      </span>
                    )}
                  </div>

                  <div>
                    <p style={{ margin: 0, fontWeight: 500, fontSize: "0.875rem", color: "var(--color-text)" }}>
                      {cat.name}
                    </p>
                    <p
                      style={{
                        margin: "2px 0 0", fontSize: "0.75rem", color: "var(--color-text-muted)", lineHeight: 1.4,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                      }}
                    >
                      {cat.description || "—"}
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "auto" }}>
                    <button onClick={() => openEdit(cat)} className="btn-icon" aria-label={`Edit ${cat.name}`}>
                      <SquarePen size={13} strokeWidth={1.8} />
                      Edit
                    </button>
                    <button onClick={() => setDeleteTarget(cat)} className="btn-icon btn-icon-danger" aria-label={`Delete ${cat.name}`}>
                      <Trash2 size={13} strokeWidth={1.8} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit modal */}
      {modalOpen && (
        <div
          className="overlay-in"
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div className="modal-in" style={{ background: "var(--color-bg-card)", borderRadius: 16, width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto", padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--color-heading)" }}>
                  {editCategory ? "Edit Category" : "Add New Category"}
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                  {editCategory ? "Update the category details below." : "Create a category to group your dishes."}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", padding: 4, borderRadius: 6 }}
              >
                <X size={18} strokeWidth={1.8} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>
                Category Name <span style={{ color: "var(--color-primary)" }}>*</span>
              </label>
              <input
                className="input"
                placeholder="e.g. Beverages"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>Description</label>
              <textarea
                className="input"
                placeholder="Short description of this category..."
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                style={{ resize: "vertical", lineHeight: 1.5 }}
              />
            </div>

            {/* Category image — pasted URL, cropped client-side to 1:1 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>
                  Category Image
                </label>
                <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>1:1 · Image URL</span>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div
                  style={{
                    width: 88, aspectRatio: "1 / 1", borderRadius: 10, flexShrink: 0,
                    border: "1px solid var(--color-border)", background: "var(--color-bg-soft)",
                    position: "relative", overflow: "hidden",
                    transition: "border-color 0.2s ease",
                  }}
                >
                  {form.imageUrl ? (
                    <Image
                      src={form.imageUrl}
                      alt="Category preview"
                      fill
                      style={{ objectFit: "cover" }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ImageOff size={16} strokeWidth={1.6} color="var(--color-text-muted)" />
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <input
                    className="input"
                    placeholder="https://images.unsplash.com/..."
                    value={form.imageUrl.startsWith("data:") ? "" : form.imageUrl}
                    onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                      {form.imageUrl.startsWith("data:")
                        ? "Cropped — paste a new link to replace it."
                        : "Paste a link, then crop to 1:1."}
                    </p>
                    <button
                      type="button"
                      onClick={() => setCropOpen(true)}
                      disabled={!form.imageUrl}
                      className="btn-icon"
                      style={{ flexShrink: 0, opacity: form.imageUrl ? 1 : 0.5, cursor: form.imageUrl ? "pointer" : "default" }}
                    >
                      <Crop size={12} strokeWidth={1.8} />
                      Crop
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={isSaving}
              style={{
                width: "100%", justifyContent: "center", padding: "12px", fontSize: "0.875rem",
                opacity: isSaving ? 0.75 : 1, display: "flex", alignItems: "center", gap: 8,
                transition: "opacity 0.15s ease, transform 0.1s ease",
              }}
            >
              {isSaving && <Loader2 size={16} strokeWidth={2.2} style={{ animation: "spin 0.7s linear infinite" }} />}
              {isSaving ? "Saving…" : editCategory ? "Save Changes" : "Add Category"}
            </button>
          </div>
        </div>
      )}

      {/* Crop step — opened on demand from the "Crop" button above */}
      {cropOpen && form.imageUrl && (
        <ImageCropper
          imageSrc={form.imageUrl}
          aspect={CATEGORY_ASPECT}
          title="Crop category image (1:1)"
          crossOrigin={cropCrossOrigin}
          onCancel={() => setCropOpen(false)}
          onComplete={handleCropComplete}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div
          className="overlay-in"
          style={{ position: "fixed", inset: 0, zIndex: 110, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={(e) => e.target === e.currentTarget && setDeleteTarget(null)}
        >
          <div className="modal-in" style={{ background: "var(--color-bg-card)", borderRadius: 16, width: "100%", maxWidth: 380, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(225,11,28,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <AlertTriangle size={17} strokeWidth={2} color="var(--color-primary)" />
              </div>
              <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "var(--color-heading)" }}>
                Delete &#34;{deleteTarget.name}&quot;?
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
              This can&apos;t be undone. Dishes in this category will keep their existing assignment until moved.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-bg-card)", color: "var(--color-text)", fontSize: "0.85rem", fontWeight: 500, cursor: "pointer", transition: "background 0.15s ease" }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeletingCategory}
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: "center", opacity: isDeletingCategory ? 0.75 : 1, display: "flex", alignItems: "center", gap: 6, transition: "opacity 0.15s ease" }}
              >
                {isDeletingCategory && <Loader2 size={14} strokeWidth={2.2} style={{ animation: "spin 0.7s linear infinite" }} />}
                {isDeletingCategory ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .skeleton {
          background: linear-gradient(90deg, var(--color-bg-soft) 25%, var(--color-border) 50%, var(--color-bg-soft) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s ease-in-out infinite;
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.96) translateY(4px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .overlay-in { animation: fadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1); }
        .modal-in { animation: scaleIn 0.22s cubic-bezier(0.16, 1, 0.3, 1); }

        .back-link:hover { color: var(--color-primary); }
        .category-card { transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease; }
        .category-card:hover { border-color: var(--color-primary); transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,0.06); }

        .btn-icon {
          display: inline-flex; align-items: center; gap: 5px; font-size: 0.78rem; font-weight: 500;
          padding: 6px 10px; border-radius: 6px; border: 1px solid var(--color-border);
          background: var(--color-bg-card); color: var(--color-text); cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        }
        .btn-icon:hover { background: var(--color-bg-soft); }
        .btn-icon-danger:hover { border-color: var(--color-primary); color: var(--color-primary); }
      `}</style>
    </>
  );
}