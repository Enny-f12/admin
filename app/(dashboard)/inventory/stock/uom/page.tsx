// app/(admin)/menu/uom/page.tsx — full file
//
// Units of Measurement Configuration (ERP spec 4.5.2). Sources items
// from useStockStore — the SAME store Stock Inventory, Inventory
// Dashboard, and Drinks & Fridge all read from. No separate item list.
// UoM is per-branch (unit/pack size/volume/supplier can differ at each
// branch), stored on each item's BranchQuantity.uom for the currently
// selected branch — see stock.types.ts.

"use client";

import { useEffect, useState } from "react";
import { Lock, SquarePen, Eye, X } from "lucide-react";
import { useStockStore } from "@/store/useStockStore";
import { StockItem, BranchUom, Supplier } from "@/types/stock.types";
import { useBranch } from "../../../layout";

export default function UomConfigurationPage() {
  const branch = useBranch();
  const { items, itemsLoading, itemsError, suppliers, fetchItems, fetchSuppliers, updateBranchUom, isSavingUom } =
    useStockStore();

  const [editItem, setEditItem] = useState<{ item: StockItem; uom: BranchUom } | null>(null);
  const [viewItem, setViewItem] = useState<{ item: StockItem; uom: BranchUom } | null>(null);

  useEffect(() => {
    fetchItems(branch.id);
    fetchSuppliers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch.id]);

  const branchUomOf = (item: StockItem): BranchUom | undefined =>
    (item.quantities.find((q) => q.branchId === branch.id) ?? item.quantities[0])?.uom;

  const foodItems = (items ?? []).filter((i) => i.itemType === "food");
  const drinkItems = (items ?? []).filter((i) => i.itemType === "drink");

  const foodByCategory = groupByCategory(foodItems);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "var(--color-primary)" }}>
          {branch.name}
        </p>
        <h1 style={{ margin: "6px 0 0", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-heading)" }}>
          Units of Measurement
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          View and edit how each item is measured at this branch. Editable by Manager and Super Admin only.
        </p>
      </div>

      {itemsLoading && (
        <div className="card"><p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Loading...</p></div>
      )}
      {!itemsLoading && itemsError && (
        <div className="card"><p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>No item data available</p></div>
      )}

      {!itemsLoading && !itemsError && (
        <>
          {Object.entries(foodByCategory).map(([category, categoryItems]) => (
            <div key={category} className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px 4px" }}>
                <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "var(--color-heading)" }}>
                  {category.toUpperCase()}
                </p>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>{["Item", "Unit", "Pack Size", "Editable", "Actions"].map((c) => <th key={c}>{c}</th>)}</tr>
                  </thead>
                  <tbody>
                    {categoryItems.map((item) => {
                      const uom = branchUomOf(item);
                      if (!uom) return null;
                      return (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 600, color: "var(--color-text)" }}>{item.name}</td>
                          <td>{uom.unit}</td>
                          <td>{uom.packSize ? `${uom.packSize} pieces` : "1 piece"}</td>
                          <td>
                            {uom.editable ? (
                              <span className="badge badge-green" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                Yes
                              </span>
                            ) : (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                                <Lock size={12} strokeWidth={1.8} /> Fixed
                              </span>
                            )}
                          </td>
                          <td>
                            {uom.editable ? (
                              <IconAction icon={<SquarePen size={14} strokeWidth={1.8} />} label="Edit" onClick={() => setEditItem({ item, uom })} />
                            ) : (
                              <IconAction icon={<Eye size={14} strokeWidth={1.8} />} label="View" onClick={() => setViewItem({ item, uom })} />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px 4px" }}>
              <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "var(--color-heading)" }}>
                DRINKS (by bottle/can/pack)
              </p>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>{["Item", "Unit", "Volume", "Supplier", "Actions"].map((c) => <th key={c}>{c}</th>)}</tr>
                </thead>
                <tbody>
                  {drinkItems.map((item) => {
                    const uom = branchUomOf(item);
                    if (!uom) return null;
                    const supplierName = suppliers?.find((s) => s.id === uom.defaultSupplierId)?.name ?? "—";
                    return (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600, color: "var(--color-text)" }}>{item.name}</td>
                        <td>{uom.unit}</td>
                        <td>{uom.volume ?? "—"}</td>
                        <td>{supplierName}</td>
                        <td>
                          {uom.editable ? (
                            <IconAction icon={<SquarePen size={14} strokeWidth={1.8} />} label="Edit" onClick={() => setEditItem({ item, uom })} />
                          ) : (
                            <IconAction icon={<Eye size={14} strokeWidth={1.8} />} label="View" onClick={() => setViewItem({ item, uom })} />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {drinkItems.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: 20, color: "var(--color-text-muted)" }}>
                        No drinks found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {editItem && (
        <EditUomModal
          item={editItem.item}
          uom={editItem.uom}
          branchId={branch.id}
          suppliers={suppliers ?? []}
          isSaving={isSavingUom}
          onClose={() => setEditItem(null)}
          onSubmit={async (form) => {
            const ok = await updateBranchUom({
              itemId: editItem.item.id,
              menuItemId: editItem.item.menuItemId,
              branchId: branch.id,
              unit: form.unit,
              packSize: editItem.item.itemType === "food" ? form.packSize : undefined,
              volume: editItem.item.itemType === "drink" ? form.volume : undefined,
              defaultSupplierId: editItem.item.itemType === "drink" ? form.defaultSupplierId : undefined,
            });
            if (ok) setEditItem(null);
          }}
        />
      )}

      {viewItem && (
        <ViewUomModal
          item={viewItem.item}
          uom={viewItem.uom}
          supplierName={suppliers?.find((s) => s.id === viewItem.uom.defaultSupplierId)?.name}
          onClose={() => setViewItem(null)}
        />
      )}
    </div>
  );
}

function groupByCategory(items: StockItem[]): Record<string, StockItem[]> {
  return items.reduce<Record<string, StockItem[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});
}

function IconAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 6,
        border: "1px solid var(--color-border)", background: "#fff", cursor: "pointer",
        fontSize: "0.78rem", fontWeight: 600, color: "var(--color-text)", fontFamily: "var(--font-sans)",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function ModalShell({ title, onClose, children, width = 440 }: { title: string; onClose: () => void; children: React.ReactNode; width?: number }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 100, padding: "5vh 20px", overflowY: "auto" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width, maxWidth: "90vw", maxHeight: "88vh", background: "#fff", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", flexShrink: 0, borderBottom: "1px solid var(--color-border)" }}>
          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--color-heading)" }}>{title}</h3>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex" }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: "20px 24px 24px", overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
      <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)" }}>{label}</label>
      {children}
    </div>
  );
}

const outlineBtn: React.CSSProperties = {
  padding: "9px 18px", borderRadius: 8, border: "1px solid var(--color-border)", background: "#fff",
  cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)", fontFamily: "var(--font-sans)",
};

/* -- Edit modal — only reachable for items where uom.editable is true.
   The backend re-checks editable server-side regardless. -- */
function EditUomModal({
  item, uom, suppliers, isSaving, onClose, onSubmit,
}: {
  item: StockItem;
  uom: BranchUom;
  branchId: string;
  suppliers: Supplier[];
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (form: { unit: string; packSize: number; volume: string; defaultSupplierId: string | null }) => void;
}) {
  const [unit, setUnit] = useState(uom.unit);
  const [packSize, setPackSize] = useState(uom.packSize ?? 1);
  const [volume, setVolume] = useState(uom.volume ?? "");
  const [defaultSupplierId, setDefaultSupplierId] = useState(uom.defaultSupplierId ?? "");

  return (
    <ModalShell title={`Edit units — ${item.name}`} onClose={onClose}>
      <Field label="Unit">
        <input className="input" value={unit} onChange={(e) => setUnit(e.target.value)} />
      </Field>

      {item.itemType === "food" ? (
        <Field label="Pack size (pieces per pack)">
          <input className="input" type="number" min={1} value={packSize} onChange={(e) => setPackSize(Number(e.target.value) || 1)} />
        </Field>
      ) : (
        <>
          <Field label="Volume">
            <input className="input" placeholder="e.g. 33cl" value={volume} onChange={(e) => setVolume(e.target.value)} />
          </Field>
          <Field label="Default supplier">
            <select className="input" value={defaultSupplierId} onChange={(e) => setDefaultSupplierId(e.target.value)}>
              <option value="">None</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
        </>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={onClose} style={outlineBtn}>Cancel</button>
        <button
          className="btn btn-primary"
          style={{ padding: "9px 18px", fontSize: "0.85rem" }}
          disabled={isSaving || !unit.trim()}
          onClick={() => onSubmit({ unit, packSize, volume, defaultSupplierId: defaultSupplierId || null })}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </ModalShell>
  );
}

/* -- View-only modal — for items locked (uom.editable === false) -- */
function ViewUomModal({
  item, uom, supplierName, onClose,
}: { item: StockItem; uom: BranchUom; supplierName?: string; onClose: () => void }) {
  return (
    <ModalShell title={`${item.name} — units (locked)`} onClose={onClose}>
      <p style={{ display: "flex", alignItems: "center", gap: 6, margin: "0 0 16px", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
        <Lock size={14} strokeWidth={1.8} />
        This item&apos;s units are fixed and cannot be edited here.
      </p>
      <Field label="Unit"><input className="input" value={uom.unit} readOnly /></Field>
      {item.itemType === "food" ? (
        <Field label="Pack size"><input className="input" value={uom.packSize ? `${uom.packSize} pieces` : "1 piece"} readOnly /></Field>
      ) : (
        <>
          <Field label="Volume"><input className="input" value={uom.volume ?? "—"} readOnly /></Field>
          <Field label="Default supplier"><input className="input" value={supplierName ?? "—"} readOnly /></Field>
        </>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={onClose} style={outlineBtn}>Close</button>
      </div>
    </ModalShell>
  );
}