"use client";

import { useState } from "react";
import {
  Clock,
  ChevronDown,
  FileClock,
  CheckCircle2,
  SquarePen,
  X,
} from "lucide-react";

/* ── Types ── */
type Status = "Updated" | "Pending" | "Out of stock";

type Item = {
  name: string;
  unit: string;
  packSize: string;
  previous: number;
  current: number | null; // null = left blank
  status?: Status; // undefined = no badge shown for this row
};

type CategoryData = {
  submitted: boolean;
  items: Item[];
};

/* ── Data, transcribed 1:1 from the mock screens ── */
const INITIAL_CATEGORIES: Record<string, CategoryData> = {
  Salad: {
    submitted: false,
    items: [
      { name: "Coleslaw",      unit: "Bowl", packSize: "1 bowl", previous: 30, current: 40,   status: "Updated" },
      { name: "Chicken salad", unit: "Bowl", packSize: "1 bowl", previous: 40, current: 25,   status: "Updated" },
      { name: "Cherry salad",  unit: "Bowl", packSize: "1 bowl", previous: 25, current: null, status: "Pending" },
      { name: "Pasta salad",   unit: "Bowl", packSize: "1 bowl", previous: 20, current: 25,   status: "Updated" },
    ],
  },
  Intercontinental: {
    submitted: true,
    items: [
      { name: "Jollof rice",  unit: "Kg",    packSize: "1 serving", previous: 60, current: 60, status: "Updated"      },
      { name: "Fried rice",   unit: "Kg",    packSize: "1 serving", previous: 40, current: 35, status: "Updated"      },
      { name: "Chinese rice", unit: "Piece", packSize: "1 serving", previous: 30, current: 0,  status: "Out of stock" },
      { name: "Gizdodo",      unit: "Piece", packSize: "1 serving", previous: 20, current: 25, status: "Updated"      },
    ],
  },
  Africana: {
    submitted: true,
    items: [
      { name: "Nkwobi", unit: "Piece", packSize: "1 portion", previous: 20, current: 25 },
      { name: "Isi ewu", unit: "Piece", packSize: "1 portion", previous: 25, current: 25 },
      { name: "Abacha", unit: "Piece", packSize: "1 portion", previous: 30, current: 50 },
    ],
  },
  Protein: {
    submitted: false,
    items: [
      { name: "Chicken thigh",   unit: "Piece", packSize: "1 piece", previous: 50, current: 60, status: "Updated"      },
      { name: "Grilled turkey",  unit: "Piece", packSize: "1 piece", previous: 30, current: 40, status: "Updated"      },
      { name: "Peppered beef",   unit: "Piece", packSize: "1 piece", previous: 20, current: 40, status: "Updated"      },
      { name: "Grilled chicken", unit: "Piece", packSize: "1 piece", previous: 30, current: 0,  status: "Out of stock" },
      { name: "Peppered turkey", unit: "Piece", packSize: "1 piece", previous: 30, current: 15, status: "Updated"      },
    ],
  },
  Soup: {
    submitted: false,
    items: [
      { name: "Egusi",          unit: "Bowl", packSize: "1 bowl", previous: 6, current: 4, status: "Updated" },
      { name: "Banga",          unit: "Bowl", packSize: "1 bowl", previous: 8, current: 2, status: "Updated" },
      { name: "Oha",            unit: "Bowl", packSize: "1 bowl", previous: 4, current: 3, status: "Updated" },
      { name: "Seafood Okro",   unit: "Bowl", packSize: "1 bowl", previous: 7, current: 8, status: "Updated" },
      { name: "Beef Peppersoup", unit: "Bowl", packSize: "1 bowl", previous: 6, current: 5, status: "Updated" },
    ],
  },
  Swallow: {
    submitted: false,
    items: [
      { name: "Semo",         unit: "Wrap", packSize: "1 Wrap", previous: 30, current: 0,    status: "Out of stock" },
      { name: "Amala",        unit: "Wrap", packSize: "1 Wrap", previous: 25, current: 30,   status: "Updated"      },
      { name: "Pounded yam",  unit: "Wrap", packSize: "1 Wrap", previous: 20, current: null, status: "Pending"      },
    ],
  },
  Pastry: {
    submitted: false,
    items: [
      { name: "Puff puff",      unit: "Piece", packSize: "4 pieces", previous: 100, current: 50,   status: "Updated"      },
      { name: "Chicken pie",    unit: "Piece", packSize: "1 piece",  previous: 25,  current: 20,   status: "Updated"      },
      { name: "Meat pie",       unit: "Piece", packSize: "1 piece",  previous: 20,  current: 0,    status: "Out of stock" },
      { name: "Plain doughnut", unit: "Piece", packSize: "1 piece",  previous: 50,  current: null, status: "Pending"      },
    ],
  },
};

const CATEGORY_NAMES = Object.keys(INITIAL_CATEGORIES);

const STATUS_CLASS: Record<Status, string> = {
  Updated:        "badge badge-green",
  Pending:        "badge badge-grey",
  "Out of stock": "badge badge-red",
};

export default function MorningCountPage() {
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [selected, setSelected] = useState(CATEGORY_NAMES[0]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [editing, setEditing] = useState<{ category: string; index: number } | null>(null);
  const [editUnit, setEditUnit] = useState("");
  const [editPackSize, setEditPackSize] = useState("");

  const category = categories[selected];

  const updateCurrent = (index: number, value: string) => {
    setCategories((prev) => {
      const next = { ...prev };
      const items = [...next[selected].items];
      items[index] = {
        ...items[index],
        current: value === "" ? null : Number(value),
      };
      next[selected] = { ...next[selected], items };
      return next;
    });
  };

  const openEdit = (index: number) => {
    const item = category.items[index];
    setEditUnit(item.unit);
    setEditPackSize(item.packSize);
    setEditing({ category: selected, index });
  };

  const saveEdit = () => {
    if (!editing) return;
    setCategories((prev) => {
      const next = { ...prev };
      const items = [...next[editing.category].items];
      items[editing.index] = {
        ...items[editing.index],
        unit: editUnit,
        packSize: editPackSize,
      };
      next[editing.category] = { ...next[editing.category], items };
      return next;
    });
    setEditing(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, position: "relative" }}>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--color-primary)",
            }}
          >
            Foodies 1 LEKKI <span style={{ margin: "0 4px" }}>•</span>{" "}
            <span style={{ fontWeight: 700 }}>(FOOD ITEMS ONLY)</span>
          </p>
          <h1
            style={{
              margin: "6px 0 0",
              fontSize: "1.25rem",
              fontWeight: 700,
              letterSpacing: "0.01em",
              color: "var(--color-heading)",
            }}
          >
            MORNING STOCK COUNT
          </h1>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "0.85rem",
              color: "var(--color-text-muted)",
            }}
          >
            Count every food item to unlock the day&apos;s operations
          </p>
        </div>

        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 16px",
            borderRadius: 8,
            border: "1px solid var(--color-primary)",
            background: "#fff",
            color: "var(--color-primary)",
            fontSize: "0.85rem",
            fontWeight: 600,
            fontFamily: "var(--font-sans)",
            cursor: "pointer",
          }}
        >
          <Clock size={15} strokeWidth={1.8} />
          Save Draft
        </button>
      </div>

      {/* Meta rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: -8 }}>
        {[
          ["Date:", "May 15, 2026"],
          ["Counter Staff:", "Sarah Johnson"],
          ["Time:", "8:30 AM"],
        ].map(([label, value]) => (
          <p key={label} style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text)" }}>
            <span style={{ color: "var(--color-text-muted)" }}>{label}</span>{" "}
            <span style={{ fontWeight: 600 }}>{value}</span>
          </p>
        ))}
      </div>

      {/* Instructions */}
      <div
        className="card"
        style={{ border: "1px solid rgba(225,11,28,0.35)" }}
      >
        <p style={{ margin: "0 0 8px", fontSize: "0.9rem", fontWeight: 700, color: "var(--color-text)" }}>
          INSTRUCTIONS:
        </p>
        <p style={{ margin: "0 0 12px", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)" }}>
          Please physically count each FOOD ITEM and enter the quantity.
        </p>
        <p style={{ margin: "0 0 6px", fontSize: "0.85rem", color: "var(--color-text)" }}>
          &ldquo;Previous column shows&rdquo;
        </p>
        <ul style={{ margin: "0 0 12px", paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            "Previous day closing stock (if available)",
            "Last manual adjustment value (if no closing stock)",
            "Default value (10) if never inventoried",
            "\u201C_\u201D if first time - manual entry required",
          ].map((line) => (
            <li key={line} style={{ fontSize: "0.85rem", color: "var(--color-text)" }}>
              {line}
            </li>
          ))}
        </ul>
        <p style={{ margin: "0 0 4px", fontSize: "0.85rem", color: "var(--color-text)" }}>
          Items left blank <span style={{ margin: "0 4px" }}>→</span> Keep previous value
        </p>
        <p style={{ margin: "0 0 12px", fontSize: "0.85rem", color: "var(--color-text)" }}>
          Items marked &ldquo;0&rdquo; <span style={{ margin: "0 4px" }}>→</span>{" "}
          <span style={{ color: "var(--color-error, #E10B1C)", fontWeight: 600 }}>Out of stock</span>
        </p>
        <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)" }}>
          DRINKS are NOT counted here. Use Drinks Inventory tab.
        </p>
      </div>

      {/* Category selector + submission status */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setCategoryOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              justifyContent: "space-between",
              minWidth: 200,
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid var(--color-border)",
              background: "#fff",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: 500,
              color: "var(--color-text)",
              fontFamily: "var(--font-sans)",
            }}
          >
            {selected}
            <ChevronDown size={16} strokeWidth={1.8} color="var(--color-text-muted)" />
          </button>

          {categoryOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 0,
                minWidth: 200,
                background: "#fff",
                border: "1px solid var(--color-border)",
                borderRadius: 10,
                boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                overflow: "hidden",
                zIndex: 60,
              }}
            >
              {CATEGORY_NAMES.map((name) => (
                <button
                  key={name}
                  onClick={() => {
                    setSelected(name);
                    setCategoryOpen(false);
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 14px",
                    background: name === selected ? "var(--color-bg-soft)" : "#fff",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontFamily: "var(--font-sans)",
                    color: "var(--color-text)",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.background = "var(--color-bg-soft)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.background =
                      name === selected ? "var(--color-bg-soft)" : "#fff")
                  }
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        {category.submitted ? (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid rgba(22,163,74,0.35)",
              background: "rgba(22,163,74,0.06)",
              color: "#16A34A",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={15} strokeWidth={1.8} />
            Submitted
          </span>
        ) : (
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid var(--color-border)",
              background: "#fff",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 500,
              color: "var(--color-text)",
              fontFamily: "var(--font-sans)",
            }}
          >
            <FileClock size={15} strokeWidth={1.8} color="#a07a00" />
            Pending Submissions
          </button>
        )}
      </div>

      {/* Category table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "20px 20px 4px" }}>
          <h3
            style={{
              margin: 0,
              fontSize: "1rem",
              fontWeight: 700,
              letterSpacing: "0.02em",
              color: "var(--color-heading)",
            }}
          >
            {selected.toUpperCase()}
          </h3>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {["Item", "Pack Size", "Previous", "Current", "Status", "UoM"].map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {category.items.map((item, i) => (
                <tr key={item.name}>
                  <td>
                    <p style={{ margin: 0, fontWeight: 600, color: "var(--color-text)" }}>{item.name}</p>
                    <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-text-muted)" }}>{item.unit}</p>
                  </td>
                  <td style={{ fontWeight: 400 }}>{item.packSize}</td>
                  <td style={{ fontWeight: 500, color: "var(--color-text)" }}>{item.previous}</td>
                  <td>
                    <input
                      type="number"
                      className="input"
                      disabled={category.submitted}
                      value={item.current === null ? "" : item.current}
                      onChange={(e) => updateCurrent(i, e.target.value)}
                      style={{ width: 90, opacity: category.submitted ? 0.6 : 1 }}
                    />
                  </td>
                  <td>
                    {item.status && (
                      <span className={STATUS_CLASS[item.status]}>{item.status}</span>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => openEdit(i)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: "1px solid var(--color-border)",
                        background: "#fff",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        fontWeight: 500,
                        color: "var(--color-text)",
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      <SquarePen size={13} strokeWidth={1.8} />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="card">
        <p style={{ margin: "0 0 10px", fontSize: "0.95rem", fontWeight: 700, color: "var(--color-heading)" }}>
          Summary:
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text)" }}>
            Total Items updated: <strong>12</strong>
          </p>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text)" }}>
            Items pending: <strong>3</strong>
          </p>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text)" }}>
            Items marked out of stock: <strong>1</strong>
          </p>
        </div>
      </div>

      {/* Footer actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            border: "1px solid var(--color-border)",
            background: "#fff",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "var(--color-text)",
            fontFamily: "var(--font-sans)",
          }}
          onClick={() => setCategories(INITIAL_CATEGORIES)}
        >
          Reset
        </button>
        <button className="btn btn-primary" style={{ padding: "10px 20px", fontSize: "0.85rem" }}>
          Submit Count
        </button>
      </div>

      {/* Dim overlay + Edit UoM modal */}
      {editing && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={() => setEditing(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 400,
              maxWidth: "90vw",
              background: "#fff",
              borderRadius: 14,
              padding: 24,
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--color-heading)" }}>
                Edit UoM
              </h3>
              <button
                onClick={() => setEditing(null)}
                aria-label="Close"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)" }}>Unit</label>
              <input
                className="input"
                value={editUnit}
                onChange={(e) => setEditUnit(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)" }}>Pack size</label>
              <input
                className="input"
                value={editPackSize}
                onChange={(e) => setEditPackSize(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => setEditing(null)}
                style={{
                  padding: "9px 18px",
                  borderRadius: 8,
                  border: "1px solid var(--color-border)",
                  background: "#fff",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--color-text)",
                  fontFamily: "var(--font-sans)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="btn btn-primary"
                style={{ padding: "9px 18px", fontSize: "0.85rem" }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}