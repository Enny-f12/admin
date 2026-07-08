"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  Plus,
  Search,
  SlidersHorizontal,
  ChevronDown,
  X,
  SquarePen,
  Trash2,
  UploadCloud,
} from "lucide-react";

/* ── Types ── */
type Dish = {
  id: number;
  name: string;
  description: string;
  image: string;
  category: string;
  price: number;
  dietary: string;
  orders: number;
};

/* ── Categories ── */
const CATEGORIES = [
  "All Categories",
  "Pastry",
  "Soup",
  "Swallow",
  "Protein",
  "Intercontinental",
  "Drinks",
  "Juice",
  "Catering",
];

/* ── Seed data ── */
const INITIAL_DISHES: Dish[] = [
  {
    id: 1,
    name: "Jam Doughnut",
    description: "Soft, fluffy doughnut filled with sweet fruit jam and dusted with sugar.",
    image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=120&q=70",
    category: "Pastry",
    price: 1200,
    dietary: "Vegetarian",
    orders: 146,
  },
  {
    id: 2,
    name: "Fried Rice",
    description: "Nigerian-style fried rice with mixed vegetables, liver, and spices. Rich and flavourful.",
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=120&q=70",
    category: "Intercontinental",
    price: 3200,
    dietary: "Contains egg",
    orders: 100,
  },
  {
    id: 3,
    name: "Egusi",
    description: "Rich, thick melon seed soup made with ground egusi, leafy vegetables, palm oil, and assorted meat or fish. A Nigerian classic.",
    image: "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=120&q=70",
    category: "Soup",
    price: 3500,
    dietary: "Gluten-free",
    orders: 100,
  },
  {
    id: 4,
    name: "Pizza Roll",
    description: "Rolled pastry filled with pizza-style toppings – tomato sauce, cheese, and seasoned minced meat. Baked until crispy.",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=120&q=70",
    category: "Pastry",
    price: 3700,
    dietary: "Contains Gluten",
    orders: 100,
  },
  {
    id: 5,
    name: "Pounded Yam",
    description: "Smooth, elastic swallow made from boiled and pounded yam. Similar to mashed potatoes but completely smooth with no chunks left. Premium option.",
    image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=120&q=70",
    category: "Swallow",
    price: 1200,
    dietary: "Gluten-free",
    orders: 100,
  },
  {
    id: 6,
    name: "Afang Soup",
    description: "Rich vegetable soup originating from the Efik, Ibibio, and Annang people. Made with afang leaves, waterleaf, periwinkles, and assorted meat/fish.",
    image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=120&q=70",
    category: "Soup",
    price: 3000,
    dietary: "Gluten-free",
    orders: 100,
  },
  {
    id: 7,
    name: "Starch",
    description: "Traditional swallow made from cassava starch, popular in the Niger Delta region. Slightly translucent and elastic.",
    image: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=120&q=70",
    category: "Swallow",
    price: 600,
    dietary: "Gluten-free",
    orders: 100,
  },
];

/* ── Modal default ── */
const EMPTY_FORM = { name: "", description: "", price: "", category: "", dietary: "", image: "" };

export default function MenuPage() {
  const [dishes, setDishes]           = useState<Dish[]>(INITIAL_DISHES);
  const [search, setSearch]           = useState("");
  const [category, setCategory]       = useState("All Categories");
  const [catOpen, setCatOpen]         = useState(false);
  const [modalOpen, setModalOpen]     = useState(false);
  const [editDish, setEditDish]       = useState<Dish | null>(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [dragOver, setDragOver]       = useState(false);
  const fileRef                       = useRef<HTMLInputElement>(null);

  /* ── Filter ── */
  const filtered = dishes.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchCat    = category === "All Categories" || d.category === category;
    return matchSearch && matchCat;
  });

  /* ── Open add modal ── */
  const openAdd = () => {
    setEditDish(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  /* ── Open edit modal ── */
  const openEdit = (dish: Dish) => {
    setEditDish(dish);
    setForm({
      name:        dish.name,
      description: dish.description,
      price:       String(dish.price),
      category:    dish.category,
      dietary:     dish.dietary,
      image:       dish.image,
    });
    setModalOpen(true);
  };

  /* ── Delete ── */
  const deleteDish = (id: number) =>
    setDishes((prev) => prev.filter((d) => d.id !== id));

  /* ── Submit ── */
  const handleSubmit = () => {
    if (!form.name || !form.price || !form.category) return;
    if (editDish) {
      setDishes((prev) =>
        prev.map((d) =>
          d.id === editDish.id
            ? { ...d, ...form, price: Number(form.price) }
            : d
        )
      );
    } else {
      setDishes((prev) => [
        ...prev,
        {
          id:          Date.now(),
          name:        form.name,
          description: form.description,
          image:       form.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&q=70",
          category:    form.category,
          price:       Number(form.price),
          dietary:     form.dietary,
          orders:      0,
        },
      ]);
    }
    setModalOpen(false);
  };

  /* ── Image upload preview ── */
  const handleFile = (file: File) => {
    const url = URL.createObjectURL(file);
    setForm((f) => ({ ...f, image: url }));
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Page header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
          <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "var(--color-primary)" }}>
                Foodies 1 LEKKI
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
            {/* Search */}
            <div style={{ flex: 1, position: "relative" }}>
              <Search
                size={14}
                strokeWidth={1.8}
                style={{
                  position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                  color: "var(--color-text-muted)", pointerEvents: "none",
                }}
              />
              <input
                className="input"
                placeholder="Search menu items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 36 }}
              />
            </div>

            {/* Category dropdown */}
            <div style={{ position: "relative", minWidth: 180 }}>
              <button
                onClick={() => setCatOpen((v) => !v)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 12px",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  background: "var(--color-bg-input)",
                  fontSize: "0.875rem",
                  color: "var(--color-text)",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  gap: 8,
                }}
              >
                <span>{category}</span>
                <ChevronDown size={14} strokeWidth={1.8} color="var(--color-text-muted)" />
              </button>
              {catOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    left: 0,
                    right: 0,
                    background: "var(--color-bg-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                    zIndex: 50,
                    overflow: "hidden",
                  }}
                >
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => { setCategory(c); setCatOpen(false); }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "9px 14px",
                        border: "none",
                        background: c === category ? "var(--color-bg-soft)" : "transparent",
                        color: c === category ? "var(--color-primary)" : "var(--color-text)",
                        fontFamily: "var(--font-sans)",
                        fontSize: "0.85rem",
                        fontWeight: c === category ? 500 : 400,
                        cursor: "pointer",
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={(e) =>
                        c !== category && ((e.currentTarget as HTMLButtonElement).style.background = "var(--color-bg-soft)")
                      }
                      onMouseLeave={(e) =>
                        c !== category && ((e.currentTarget as HTMLButtonElement).style.background = "transparent")
                      }
                    >
                      {c}
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
                  <th>Orders</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--color-text-muted)" }}>
                      No dishes found
                    </td>
                  </tr>
                ) : (
                  filtered.map((dish) => (
                    <tr key={dish.id}>
                      {/* Dish */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <div style={{ width: 56, height: 56, borderRadius: 10, overflow: "hidden", flexShrink: 0, border: "1px solid var(--color-border)" }}>
                            <Image
                              src={dish.image}
                              alt={dish.name}
                              width={56}
                              height={56}
                              style={{ objectFit: "cover", width: "100%", height: "100%" }}
                            />
                          </div>
                          <div>
                            <p style={{ margin: 0, fontWeight: 500, fontSize: "0.875rem", color: "var(--color-text)" }}>
                              {dish.name}
                            </p>
                            <p style={{ margin: "2px 0 0", fontWeight: 400, fontSize: "0.75rem", color: "var(--color-text-muted)", maxWidth: 340, lineHeight: 1.4 }}>
                              {dish.description}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td>{dish.category}</td>

                      {/* Price */}
                      <td style={{ fontWeight: 500, color: "var(--color-primary)" }}>
                        ₦{dish.price.toLocaleString()}
                      </td>

                      {/* Dietary */}
                      <td>
                        <span className="badge badge-gray">{dish.dietary}</span>
                      </td>

                      {/* Orders */}
                      <td style={{ fontWeight: 400 }}>{dish.orders}</td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <button
                            aria-label={`Edit ${dish.name}`}
                            onClick={() => openEdit(dish)}
                            style={{
                              background: "none", border: "none", cursor: "pointer",
                              color: "var(--color-text-muted)", display: "flex",
                              padding: 4, borderRadius: 6, transition: "color 0.15s",
                            }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--color-text)")}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)")}
                          >
                            <SquarePen size={15} strokeWidth={1.8} />
                          </button>
                          <button
                            aria-label={`Delete ${dish.name}`}
                            onClick={() => deleteDish(dish.id)}
                            style={{
                              background: "none", border: "none", cursor: "pointer",
                              color: "var(--color-text-muted)", display: "flex",
                              padding: 4, borderRadius: 6, transition: "color 0.15s",
                            }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--color-primary)")}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)")}
                          >
                            <Trash2 size={15} strokeWidth={1.8} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Modal overlay ── */}
      {modalOpen && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div
            style={{
              background: "var(--color-bg-card)",
              borderRadius: 16,
              width: "100%",
              maxWidth: 560,
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 28,
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
            className="no-scrollbar"
          >
            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--color-heading)" }}>
                  {editDish ? "Edit Dish" : "Add New Dish"}
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: "0.82rem", fontWeight: 400, color: "var(--color-text-muted)" }}>
                  {editDish ? "Update the dish details below." : "Fill in the details to add a new dish to the menu."}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", padding: 4, borderRadius: 6 }}
              >
                <X size={18} strokeWidth={1.8} />
              </button>
            </div>

            {/* Dish Name */}
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

            {/* Description */}
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

            {/* Price + Category */}
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
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    style={{ paddingRight: "2.5rem", color: "var(--color-text)" }}
                  >
                    <option value="" disabled>Select category</option>
                    {CATEGORIES.slice(1).map((c) => (
                      <option key={c} value={c}>{c}</option>
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

            {/* Dietary */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>
                Dietary
              </label>
              <input
                className="input"
                placeholder="e.g. Gluten-free, Contains Egg"
                value={form.dietary}
                onChange={(e) => setForm((f) => ({ ...f, dietary: e.target.value }))}
              />
            </div>

            {/* Dish image upload */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>
                Dish Image
              </label>
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files[0];
                  if (file) handleFile(file);
                }}
                style={{
                  border: `1.5px dashed ${dragOver ? "var(--color-primary)" : "var(--color-border)"}`,
                  borderRadius: 10,
                  padding: "28px 20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  cursor: "pointer",
                  background: dragOver ? "rgba(225,11,28,0.03)" : "var(--color-bg-soft)",
                  transition: "border-color 0.15s, background 0.15s",
                  minHeight: 120,
                }}
              >
                {form.image ? (
                  <Image
                    src={form.image}
                    alt="Preview"
                    width={80}
                    height={80}
                    style={{ borderRadius: 8, objectFit: "cover" }}
                  />
                ) : (
                  <>
                    <UploadCloud size={24} strokeWidth={1.6} color="var(--color-text-muted)" />
                    <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 400, color: "var(--color-text-muted)" }}>
                      Click or drag to upload image
                    </p>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>

            {/* Submit */}
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: "0.875rem" }}
            >
              {editDish ? "Save Changes" : "Add Dish"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}