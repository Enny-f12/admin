"use client";

import { useState, useEffect, useRef } from "react";
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
  UploadCloud,
} from "lucide-react";
import { useBranch } from "../../layout";
import { useAuthStore } from "@/store/useAuthStore";
import { useMenuStore } from "@/store/useMenuStore";
import { MenuCategory } from "@/types/menu";
import ImageCropper from "@/components/menu/ImageCropper";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const EMPTY_FORM = { name: "", description: "" };
const CATEGORY_ASPECT = 1;
const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024; // 1MB, same cap as dish images

export default function CategoriesPage() {
  const branch = useBranch();
  const branchId = branch?.id;
  const vendorId = useAuthStore((s) => s.user?.vendorId);

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<MenuCategory | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<MenuCategory | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // A freshly picked + cropped image, staged but not yet uploaded. Only
  // ever holds ONE file — a category has a single image, unlike a dish's
  // multi-image gallery. previewUrl is its object URL for display.
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newPreviewUrl, setNewPreviewUrl] = useState<string | null>(null);
  const [removingImage, setRemovingImage] = useState(false);

  // Crop step: cropSrc is the object URL of whatever was just picked.
  // Category images are only ever cropped right after picking a local
  // file — never re-cropped from an already-uploaded remote image, so
  // there's no CORS/crossOrigin concern here at all.
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropFileMeta, setCropFileMeta] = useState<{ name: string; type: string } | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const {
    categories,
    categoriesLoading,
    categoriesError,
    isCreatingCategory,
    isUpdatingCategory,
    isDeletingCategory,
    isUploadingCategoryImage,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    uploadCategoryImage,
    deleteCategoryImage,
  } = useMenuStore();

  useEffect(() => {
    fetchCategories(branchId ? { branchId } : {});
  }, [branchId, fetchCategories]);

  const filtered = (categories ?? []).filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const resetImageState = () => {
    if (newPreviewUrl) URL.revokeObjectURL(newPreviewUrl);
    setNewFile(null);
    setNewPreviewUrl(null);
  };

  const openAdd = () => {
    setEditCategory(null);
    setForm(EMPTY_FORM);
    resetImageState();
    setModalOpen(true);
  };

  const openEdit = (cat: MenuCategory) => {
    setEditCategory(cat);
    setForm({ name: cat.name, description: cat.description ?? "" });
    resetImageState();
    setModalOpen(true);
  };

  // Enforces the same 1MB cap dish images use, then opens the cropper —
  // only one file is ever accepted for a category, so no queue needed.
  const handleFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`"${file.name}" is over 1MB`);
      return;
    }
    const src = URL.createObjectURL(file);
    setCropSrc(src);
    setCropFileMeta({ name: file.name, type: file.type || "image/jpeg" });
  };

  const handleCropComplete = (blob: Blob) => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    const croppedFile = new File([blob], cropFileMeta?.name ?? "category.jpg", {
      type: cropFileMeta?.type ?? "image/jpeg",
    });
    resetImageState();
    setNewFile(croppedFile);
    setNewPreviewUrl(URL.createObjectURL(croppedFile));
    setCropSrc(null);
    setCropFileMeta(null);
  };

  const handleCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setCropFileMeta(null);
  };

  // Removes an already-saved image via the API immediately — this is
  // the edit flow only, same as removeExistingImage on the dish page.
  const removeExistingImage = async () => {
    if (!editCategory) return;
    setRemovingImage(true);
    const ok = await deleteCategoryImage(editCategory.id);
    setRemovingImage(false);
    if (ok) setEditCategory((prev) => (prev ? { ...prev, imageUrl: null } : prev));
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

    const payload = { name: form.name, description: form.description || undefined };

    if (editCategory) {
      // Same order as the dish flow: attach the new image first (if any),
      // then update the text fields — so a failed image upload doesn't
      // leave the name/description half-saved either.
      if (newFile) {
        const imageOk = await uploadCategoryImage(editCategory.id, newFile);
        if (!imageOk) return;
      }
      const ok = await updateCategory(editCategory.id, payload);
      if (ok) setModalOpen(false);
    } else {
      const category = await addCategory({ vendorId, slug: slugify(form.name), ...payload });
      if (!category) return;
      if (newFile) {
        const imageOk = await uploadCategoryImage(category.id, newFile);
        if (!imageOk) {
          toast.error("Category added, but image upload failed");
        }
      }
      setModalOpen(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteCategory(deleteTarget.id);
    setDeleteTarget(null);
  };

  const isSaving = isCreatingCategory || isUpdatingCategory || isUploadingCategoryImage;
  const displayedImageUrl = newPreviewUrl ?? editCategory?.imageUrl ?? null;

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

            {/* Category image — real file upload, cropped client-side to
                1:1 before it's staged. Same dropzone pattern as dish
                images, just capped at one file. */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>
                  Category Image
                </label>
                <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>1:1 · Max 1MB</span>
              </div>

              {displayedImageUrl ? (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ position: "relative", width: 88, height: 88, flexShrink: 0 }}>
                    <Image
                      src={displayedImageUrl}
                      alt="Category preview"
                      fill
                      style={{ borderRadius: 10, objectFit: "cover", border: newFile ? "1px solid var(--color-primary)" : "1px solid var(--color-border)" }}
                    />
                    <button
                      type="button"
                      aria-label="Remove image"
                      onClick={() => (newFile ? resetImageState() : removeExistingImage())}
                      disabled={removingImage}
                      style={{
                        position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%",
                        background: "var(--color-primary)", border: "2px solid var(--color-bg-card)", color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                        opacity: removingImage ? 0.5 : 1,
                      }}
                    >
                      {removingImage ? (
                        <Loader2 size={11} strokeWidth={2.5} style={{ animation: "spin 0.7s linear infinite" }} />
                      ) : (
                        <X size={11} strokeWidth={2.5} />
                      )}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="btn-icon"
                    style={{ marginTop: 4 }}
                  >
                    <UploadCloud size={13} strokeWidth={1.8} />
                    Replace
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
                  }}
                  style={{
                    border: `1.5px dashed ${dragOver ? "var(--color-primary)" : "var(--color-border)"}`,
                    borderRadius: 10, padding: "18px", display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer",
                    background: dragOver ? "rgba(225,11,28,0.03)" : "var(--color-bg-soft)",
                    transition: "border-color 0.2s ease, background 0.2s ease",
                    minHeight: 88,
                  }}
                >
                  <UploadCloud size={20} strokeWidth={1.6} color="var(--color-text-muted)" />
                  <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 400, color: "var(--color-text-muted)" }}>
                    Click or drag to add an image — crop to 1:1
                  </p>
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFile(e.target.files[0]);
                  e.target.value = "";
                }}
              />
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

      {/* Crop step — shown right after picking a file, before it's staged */}
      {cropSrc && (
        <ImageCropper
          imageSrc={cropSrc}
          aspect={CATEGORY_ASPECT}
          title="Crop category image (1:1)"
          onCancel={handleCropCancel}
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