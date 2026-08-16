// app/(admin)/menu/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Plus,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  SquarePen,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useBranch } from "../layout";
import { useAuthStore } from "@/store/useAuthStore";
import { useMenuStore } from "@/store/useMenuStore";
import { MenuItem, MenuItemImage } from "@/types/menu";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const EMPTY_FORM = { name: "", description: "", price: "", categoryId: "", dietary: "" };

// Client-side only — /menu/items has no page/limit params on the backend
// yet, so we're paginating the already-fetched list, not the request.
const PAGE_SIZE = 10;

export default function MenuPage() {
  const branch = useBranch();
  const vendorId = useAuthStore((s) => s.user?.vendorId);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [catOpen, setCatOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [dragOver, setDragOver] = useState(false);
  // Files picked in this modal session, not yet uploaded.
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  // Images already saved on the item (edit flow only).
  const [existingImages, setExistingImages] = useState<MenuItemImage[]>([]);
  const [removingImageId, setRemovingImageId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Live data ──
  const {
    categories,
    categoriesLoading,
    items,
    itemsLoading,
    itemsError,
    isCreating,
    isUpdating,
    isDeleting,
    fetchCategories,
    fetchItems,
    createItem,
    updateItem,
    updateItemImage,
    deleteItemImage,
    deleteItem,
  } = useMenuStore();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchItems(categoryFilter !== "all" ? { categoryId: categoryFilter } : {});
  }, [categoryFilter, fetchItems]);

  const categoryList = categories ?? [];
  const categoryName = (id: string) => categoryList.find((c) => c.id === id)?.name ?? "—";

  const filtered = (items ?? []).filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Search, category filter, or the underlying list itself (delete, refetch)
  // can all shrink the result count below the current page — clamp rather
  // than let the table render an empty page silently.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [search, categoryFilter]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openAdd = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setNewFiles([]);
    setNewPreviews([]);
    setExistingImages([]);
    setModalOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditItem(item);
    setForm({
      name: item.name,
      description: item.description ?? "",
      price: String(item.basePrice),
      categoryId: item.categoryId,
      dietary: item.dietaryTags?.join(", ") ?? "",
    });
    setNewFiles([]);
    setNewPreviews([]);
    setExistingImages(item.images ?? []);
    setModalOpen(true);
  };

  const handleDelete = async (item: MenuItem) => {
    // NOTE: isDeleting is a single shared flag across all rows — every
    // delete button on the page disables while any delete is in flight.
    // Fine at current table sizes; switch to a `deletingId` field on the
    // store if you need per-row granularity later.
    await deleteItem(item.id);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.categoryId) {
      toast.error("Name, price and category are required");
      return;
    }

    const dietaryTags = form.dietary
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (editItem) {
      // updateItem's schema has no image field — new images go through the
      // images endpoint separately. Doing it before the metadata update
      // means we haven't committed text changes if the image upload fails.
      if (newFiles.length > 0) {
        const imageOk = await updateItemImage(editItem.id, newFiles);
        if (!imageOk) return;
      }
      const success = await updateItem(editItem.id, {
        name: form.name,
        description: form.description || undefined,
        basePrice: Number(form.price),
        categoryId: form.categoryId,
        dietaryTags,
      });
      if (success) setModalOpen(false);
    } else {
      if (!vendorId) {
        toast.error("No vendor found on this account — try logging in again");
        return;
      }
      const success = await createItem(
        {
          vendorId,
          categoryId: form.categoryId,
          name: form.name,
          slug: slugify(form.name),
          description: form.description || undefined,
          basePrice: Number(form.price),
          dietaryTags,
          isAvailable: true,
        },
        newFiles
      );
      if (success) setModalOpen(false);
    }
  };

  const handleFiles = (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;
    setNewFiles((prev) => [...prev, ...list]);
    setNewPreviews((prev) => [...prev, ...list.map((f) => URL.createObjectURL(f))]);
  };

  const removeNewImage = (index: number) => {
    setNewPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Only meaningful in the edit flow — removes an already-saved image via
  // the API (see deleteItemImage note in the service re: unconfirmed endpoint).
  const removeExistingImage = async (image: MenuItemImage) => {
    if (!editItem) return;
    setRemovingImageId(image.id);
    const ok = await deleteItemImage(editItem.id, image.id);
    setRemovingImageId(null);
    if (ok) {
      setExistingImages((prev) => prev.filter((img) => img.id !== image.id));
    }
  };

  const isSaving = isCreating || isUpdating;

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Page header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "var(--color-primary)" }}>
              {branch?.name ?? "—"}
            </p>
            <h1 style={{ margin: "6px 0 0", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-heading)" }}>
              MENU
            </h1>
            <p style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--color-text-muted)", margin: 0 }}>
              Add, edit, and manage menu items
            </p>
          </div>
          <button className="btn btn-primary" onClick={openAdd} style={{ gap: 6 }}>
            <Plus size={15} strokeWidth={2.2} />
            Add Dish
          </button>
        </div>

        {/* Filter bar */}
        <div className="card" style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <SlidersHorizontal size={15} color="var(--color-text-muted)" strokeWidth={1.8} />
            <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--color-text)" }}>Filter</span>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <Search
                size={14}
                strokeWidth={1.8}
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }}
              />
              <input
                className="input"
                placeholder="Search menu items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 36 }}
              />
            </div>

            <div style={{ position: "relative", minWidth: 180 }}>
              <button
                onClick={() => setCatOpen((v) => !v)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "9px 12px", border: "1px solid var(--color-border)", borderRadius: 8,
                  background: "var(--color-bg-input)", fontSize: "0.875rem", color: "var(--color-text)",
                  cursor: "pointer", fontFamily: "var(--font-sans)", gap: 8,
                }}
              >
                <span>{categoryFilter === "all" ? "All Categories" : categoryName(categoryFilter)}</span>
                <ChevronDown size={14} strokeWidth={1.8} color="var(--color-text-muted)" />
              </button>
              {catOpen && (
                <div
                  style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                    background: "var(--color-bg-card)", border: "1px solid var(--color-border)",
                    borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", zIndex: 50, overflow: "hidden",
                  }}
                >
                  <button
                    onClick={() => { setCategoryFilter("all"); setCatOpen(false); }}
                    style={{
                      width: "100%", textAlign: "left", padding: "9px 14px", border: "none",
                      background: categoryFilter === "all" ? "var(--color-bg-soft)" : "transparent",
                      color: categoryFilter === "all" ? "var(--color-primary)" : "var(--color-text)",
                      fontFamily: "var(--font-sans)", fontSize: "0.85rem", cursor: "pointer",
                    }}
                  >
                    All Categories
                  </button>
                  {categoryList.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setCategoryFilter(c.id); setCatOpen(false); }}
                      style={{
                        width: "100%", textAlign: "left", padding: "9px 14px", border: "none",
                        background: c.id === categoryFilter ? "var(--color-bg-soft)" : "transparent",
                        color: c.id === categoryFilter ? "var(--color-primary)" : "var(--color-text)",
                        fontFamily: "var(--font-sans)", fontSize: "0.85rem", cursor: "pointer",
                      }}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ minWidth: 300 }}>Dish</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Dietary</th>
                  <th>Available</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(itemsLoading || categoriesLoading) && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--color-text-muted)" }}>
                      Loading…
                    </td>
                  </tr>
                )}
                {!itemsLoading && itemsError && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--color-text-muted)" }}>
                      Could not load menu items
                    </td>
                  </tr>
                )}
                {!itemsLoading && !itemsError && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--color-text-muted)" }}>
                      No dishes found
                    </td>
                  </tr>
                )}
                {!itemsLoading &&
                  !itemsError &&
                  paginated.map((dish) => (
                    <tr key={dish.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <div style={{ width: 56, height: 56, borderRadius: 10, overflow: "hidden", flexShrink: 0, border: "1px solid var(--color-border)", background: "var(--color-bg-soft)" }}>
                            {dish.images?.[0]?.url ? (
                              <Image
                                src={dish.images[0].url}
                                alt={dish.name}
                                width={56}
                                height={56}
                                style={{ objectFit: "cover", width: "100%", height: "100%" }}
                              />
                            ) : null}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontWeight: 500, fontSize: "0.875rem", color: "var(--color-text)" }}>
                              {dish.name}
                            </p>
                            <p style={{ margin: "2px 0 0", fontWeight: 400, fontSize: "0.75rem", color: "var(--color-text-muted)", maxWidth: 340, lineHeight: 1.4 }}>
                              {dish.description || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>{dish.category?.name ?? categoryName(dish.categoryId)}</td>
                      <td style={{ fontWeight: 500, color: "var(--color-primary)" }}>
                        ₦{Number(dish.basePrice).toLocaleString()}
                      </td>
                      <td>
                        {dish.dietaryTags?.length ? (
                          <span className="badge badge-gray">{dish.dietaryTags.join(", ")}</span>
                        ) : (
                          <span style={{ color: "var(--color-text-muted)" }}>—</span>
                        )}
                      </td>
                      <td>
                        <span className={dish.isAvailable ? "badge badge-green" : "badge badge-gray"}>
                          {dish.isAvailable ? "Available" : "Unavailable"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <button
                            aria-label={`Edit ${dish.name}`}
                            onClick={() => openEdit(dish)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", padding: 4, borderRadius: 6 }}
                          >
                            <SquarePen size={15} strokeWidth={1.8} />
                          </button>
                          <button
                            aria-label={`Delete ${dish.name}`}
                            onClick={() => handleDelete(dish)}
                            disabled={isDeleting}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", padding: 4, borderRadius: 6 }}
                          >
                            <Trash2 size={15} strokeWidth={1.8} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {!itemsLoading && !itemsError && filtered.length > 0 && (
            <div
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 20px", borderTop: "1px solid var(--color-border)",
              }}
            >
              <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  aria-label="Previous page"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30,
                    border: "1px solid var(--color-border)", borderRadius: 6, background: "var(--color-bg-card)",
                    color: "var(--color-text)", cursor: page === 1 ? "default" : "pointer", opacity: page === 1 ? 0.4 : 1,
                  }}
                >
                  <ChevronLeft size={15} strokeWidth={1.8} />
                </button>
                <span style={{ fontSize: "0.82rem", color: "var(--color-text)", minWidth: 70, textAlign: "center" }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  aria-label="Next page"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30,
                    border: "1px solid var(--color-border)", borderRadius: 6, background: "var(--color-bg-card)",
                    color: "var(--color-text)", cursor: page === totalPages ? "default" : "pointer", opacity: page === totalPages ? 0.4 : 1,
                  }}
                >
                  <ChevronRight size={15} strokeWidth={1.8} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal ── */}
      {modalOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div
            style={{ background: "var(--color-bg-card)", borderRadius: 16, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", padding: 28, display: "flex", flexDirection: "column", gap: 20 }}
            className="no-scrollbar"
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--color-heading)" }}>
                  {editItem ? "Edit Dish" : "Add New Dish"}
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: "0.82rem", fontWeight: 400, color: "var(--color-text-muted)" }}>
                  {editItem ? "Update the dish details below." : "Fill in the details to add a new dish to the menu."}
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", padding: 4, borderRadius: 6 }}>
                <X size={18} strokeWidth={1.8} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>
                Dish Name <span style={{ color: "var(--color-primary)" }}>*</span>
              </label>
              <input
                className="input"
                placeholder="e.g. Jam Doughnut"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>
                Description
              </label>
              <textarea
                className="input"
                placeholder="Short description of the dish..."
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                style={{ resize: "vertical", lineHeight: 1.5 }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>
                  Price (₦) <span style={{ color: "var(--color-primary)" }}>*</span>
                </label>
                <input
                  className="input"
                  type="number"
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>
                  Category <span style={{ color: "var(--color-primary)" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <select
                    className="input appearance-none"
                    value={form.categoryId}
                    onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                    style={{ paddingRight: "2.5rem", color: "var(--color-text)" }}
                  >
                    <option value="" disabled>Select category</option>
                    {categoryList.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    strokeWidth={1.8}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--color-text-muted)" }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>
                Dietary <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(comma-separated, e.g. Gluten-free, Vegetarian)</span>
              </label>
              <input
                className="input"
                placeholder="e.g. Gluten-free, Contains Egg"
                value={form.dietary}
                onChange={(e) => setForm((f) => ({ ...f, dietary: e.target.value }))}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>
                Dish Images
              </label>

              {(existingImages.length > 0 || newPreviews.length > 0) && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {existingImages.map((img) => (
                    <div key={img.id} style={{ position: "relative", width: 72, height: 72 }}>
                      <Image
                        src={img.url}
                        alt="Dish"
                        width={72}
                        height={72}
                        style={{ borderRadius: 8, objectFit: "cover", width: "100%", height: "100%", border: "1px solid var(--color-border)" }}
                      />
                      <button
                        type="button"
                        aria-label="Remove image"
                        onClick={() => removeExistingImage(img)}
                        disabled={removingImageId === img.id}
                        style={{
                          position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%",
                          background: "var(--color-primary)", border: "2px solid var(--color-bg-card)", color: "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                          opacity: removingImageId === img.id ? 0.5 : 1,
                        }}
                      >
                        <X size={11} strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}
                  {newPreviews.map((src, i) => (
                    <div key={src} style={{ position: "relative", width: 72, height: 72 }}>
                      <Image
                        src={src}
                        alt="New upload preview"
                        width={72}
                        height={72}
                        style={{ borderRadius: 8, objectFit: "cover", width: "100%", height: "100%", border: "1px solid var(--color-primary)" }}
                      />
                      <button
                        type="button"
                        aria-label="Remove image"
                        onClick={() => removeNewImage(i)}
                        style={{
                          position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%",
                          background: "var(--color-primary)", border: "2px solid var(--color-bg-card)", color: "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                        }}
                      >
                        <X size={11} strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
                }}
                style={{
                  border: `1.5px dashed ${dragOver ? "var(--color-primary)" : "var(--color-border)"}`,
                  borderRadius: 10, padding: "20px", display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer",
                  background: dragOver ? "rgba(225,11,28,0.03)" : "var(--color-bg-soft)",
                  transition: "border-color 0.15s, background 0.15s", minHeight: 90,
                }}
              >
                <UploadCloud size={22} strokeWidth={1.6} color="var(--color-text-muted)" />
                <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 400, color: "var(--color-text-muted)" }}>
                  Click or drag to add image(s)
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files?.length) handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={isSaving}
              style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: "0.875rem", opacity: isSaving ? 0.6 : 1 }}
            >
              {isSaving ? "Saving…" : editItem ? "Save Changes" : "Add Dish"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}