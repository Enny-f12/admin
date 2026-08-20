"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  X,
  Phone,
  MapPin,
  Building2,
  ChevronDown,
  Check,
  Tag,
} from "lucide-react";
import { useSuppliersStore } from "@/store/useSuppliersStore";
import { SupplierType } from "@/types/suppliers.types";
import { useBranch } from "../../layout";

export default function SuppliersPage() {
  const {
    suppliers,
    suppliersLoading,
    suppliersError,
    detail,
    detailLoading,
    detailError,
    fetchSuppliers,
    fetchSupplierDetail,
    clearDetail,
    addSupplier,
  } = useSuppliersStore();

  // Branch scoping, same pattern as Stock Inventory: a specific branch
  // filters deliveries/outstanding to that branch. "All Branches" no
  // longer exists as a selectable option (see app/(admin)/layout.tsx),
  // so this always filters to whichever branch is currently selected.
  const branch = useBranch();
  const [branchOpen, setBranchOpen] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [successName, setSuccessName] = useState<string | null>(null);

  useEffect(() => {
    fetchSuppliers(branch.id);
  }, [fetchSuppliers, branch.id]);

  useEffect(() => {
    if (selectedId) {
      fetchSupplierDetail(selectedId, branch.id);
    }
  }, [selectedId, branch.id, fetchSupplierDetail]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "var(--color-primary)" }}>
            {branch.name}
          </p>
          <h1 style={{ margin: "6px 0 0", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-heading)" }}>
            SUPPLIERS
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            Vendor directory, deliveries and invoices
          </p>
        </div>

        <button
          onClick={() => setAddOpen(true)}
          className="btn btn-primary"
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", fontSize: "0.85rem" }}
        >
          <Plus size={16} strokeWidth={2} />
          Add Supplier
        </button>
      </div>

      {/* Branch filter -- dropdown for supers, static chip for locked managers */}
      {branch.canPickBranch ? (
        <div style={{ position: "relative", alignSelf: "flex-start" }}>
          <button
            onClick={() => setBranchOpen((v) => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 20, justifyContent: "space-between",
              minWidth: 150, padding: "10px 14px", borderRadius: 8, border: "1px solid var(--color-border)",
              background: "#fff", cursor: "pointer", fontSize: "0.9rem", color: "var(--color-text)",
              fontFamily: "var(--font-sans)",
            }}
          >
            {branch.name}
            <ChevronDown size={16} strokeWidth={1.8} color="var(--color-text-muted)" />
          </button>
          {branchOpen && (
            <div
              style={{
                position: "absolute", top: "calc(100% + 6px)", left: 0, minWidth: 150,
                background: "#fff", border: "1px solid var(--color-border)", borderRadius: 10,
                boxShadow: "0 8px 24px rgba(0,0,0,0.10)", overflow: "hidden", zIndex: 60,
              }}
            >
              {branch.branches.map((b) => (
                <button
                  key={b.id}
                  onClick={() => { branch.setBranch(b); setBranchOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
                    padding: "10px 14px", background: b.id === branch.id ? "var(--color-bg-soft)" : "#fff",
                    border: "none", cursor: "pointer", fontSize: "0.85rem", fontFamily: "var(--font-sans)",
                    color: "var(--color-text)", textAlign: "left",
                  }}
                >
                  {b.id === branch.id && <span style={{ marginRight: 6 }}>{"✓"}</span>}
                  {b.name}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            display: "flex", alignItems: "center", minWidth: 150, alignSelf: "flex-start",
            padding: "10px 14px", borderRadius: 8, border: "1px solid var(--color-border)",
            background: "var(--color-bg-soft)", fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text)",
          }}
          title="Your account is scoped to this branch"
        >
          {branch.name}
        </div>
      )}

      {suppliersLoading && (
        <div className="card"><p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Loading...</p></div>
      )}

      {!suppliersLoading && (suppliersError || !suppliers?.length) && (
        <div className="card">
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            No supplier data available
          </p>
        </div>
      )}

      {!suppliersLoading && !suppliersError && suppliers && suppliers.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          {suppliers.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedId(s.id)}
              className="card"
              style={{ textAlign: "left", cursor: "pointer", position: "relative", border: "1px solid var(--color-border)", background: "#fff" }}
            >
              {s.outstanding > 0 && (
                <span
                  style={{
                    position: "absolute", top: 20, right: 20, padding: "5px 12px", borderRadius: 999,
                    border: "1px solid rgba(225,11,28,0.3)", background: "rgba(225,11,28,0.06)",
                    color: "var(--color-primary)", fontWeight: 700, fontSize: "0.8rem",
                  }}
                >
                  {"₦"}{s.outstanding.toLocaleString()}
                </span>
              )}

              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div
                  style={{
                    width: 38, height: 38, borderRadius: 8, background: "var(--color-secondary)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}
                >
                  <Building2 size={18} strokeWidth={1.8} color="#7a5500" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem", color: "var(--color-heading)" }}>{s.name}</p>
                  {s.type && (
                    <p style={{ display: "flex", alignItems: "center", gap: 6, margin: "4px 0 0", fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                      <Tag size={12} strokeWidth={1.8} />
                      {s.type}
                    </p>
                  )}
                  {s.phone && (
                    <p style={{ display: "flex", alignItems: "center", gap: 6, margin: "4px 0 0", fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                      <Phone size={13} strokeWidth={1.8} />
                      {s.phone}
                    </p>
                  )}
                </div>
              </div>

              {s.address && (
                <p style={{ display: "flex", alignItems: "center", gap: 6, margin: "10px 0 14px", fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                  <MapPin size={13} strokeWidth={1.8} />
                  {s.address}
                </p>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ padding: "12px 10px", borderRadius: 10, background: "var(--color-bg-soft)", textAlign: "center" }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "1rem", color: "var(--color-heading)" }}>{s.deliveries}</p>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>deliveries</p>
                </div>
                <div style={{ padding: "12px 10px", borderRadius: 10, background: "var(--color-bg-soft)", textAlign: "center" }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "1rem", color: s.outstanding > 0 ? "var(--color-primary)" : "var(--color-heading)" }}>
                    {"₦"}{s.outstanding.toLocaleString()}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>outstanding</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedId && (
        <SupplierDetailModal
          supplierName={suppliers?.find((s) => s.id === selectedId)?.name ?? ""}
          detail={detail}
          loading={detailLoading}
          error={detailError}
          onClose={() => { setSelectedId(null); clearDetail(); }}
        />
      )}

      {addOpen && (
        <AddSupplierModal
          onClose={() => setAddOpen(false)}
          onSave={async (payload) => {
            const supplier = await addSupplier(payload, branch.id);
            if (supplier) {
              setAddOpen(false);
              setSuccessName(supplier.name);
            }
          }}
        />
      )}

      {successName && <SuccessModal name={successName} onClose={() => setSuccessName(null)} />}
    </div>
  );
}

/* -- Shared modal shell -- */
function ModalShell({ title, onClose, children, width = 700 }: { title?: string; onClose: () => void; children: React.ReactNode; width?: number }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        zIndex: 100, padding: "5vh 20px", overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width, maxWidth: "94vw", maxHeight: "88vh", background: "#fff", borderRadius: 14,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        {title && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", flexShrink: 0, borderBottom: "1px solid var(--color-border)" }}>
            <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, letterSpacing: "0.01em", color: "var(--color-heading)" }}>{title}</h3>
            <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex" }}>
              <X size={18} />
            </button>
          </div>
        )}
        <div style={{ padding: title ? "20px 24px 24px" : 0, overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

/* -- Supplier detail modal -- */
function SupplierDetailModal({
  supplierName, detail, loading, error, onClose,
}: {
  supplierName: string;
  detail: import("@/types/suppliers.types").SupplierDetail | null;
  loading: boolean;
  error: boolean;
  onClose: () => void;
}) {
  return (
    <ModalShell title={supplierName || "Supplier"} onClose={onClose}>
      {loading && <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Loading...</p>}

      {!loading && (error || !detail) && (
        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          No supplier detail available
        </p>
      )}

      {!loading && detail && (
        <>
          <div style={{ padding: "14px 16px", borderRadius: 10, background: "var(--color-bg-soft)", display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {detail.type && (
              <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.9rem", color: "var(--color-text)" }}>
                <Tag size={15} strokeWidth={1.8} color="var(--color-primary)" />
                {detail.type}
              </span>
            )}
            {detail.phone && (
              <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.9rem", color: "var(--color-text)" }}>
                <Phone size={15} strokeWidth={1.8} color="var(--color-primary)" />
                {detail.phone}
              </span>
            )}
            {detail.address && (
              <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.9rem", color: "var(--color-text)" }}>
                <MapPin size={15} strokeWidth={1.8} color="var(--color-primary)" />
                {detail.address}
              </span>
            )}
          </div>

          <p style={{ margin: "0 0 10px", fontSize: "0.95rem", fontWeight: 700, color: "var(--color-heading)" }}>
            Supplier Payment Tracking:
          </p>
          <div style={{ borderRadius: 10, background: "var(--color-bg-soft)", padding: "4px 16px", marginBottom: 24 }}>
            {detail.payments.length === 0 ? (
              <p style={{ margin: "12px 0", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>No payment records yet.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Date", "Invoice #", "Amount", "Paid", "Reference"].map((c) => (
                      <th key={c} style={{ textAlign: "left", fontSize: "0.78rem", fontWeight: 600, color: "var(--color-text-muted)", padding: "12px 8px", borderBottom: "1px solid var(--color-border)" }}>
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detail.payments.map((p, i) => (
                    <tr key={i}>
                      <td style={cellStyle}>{p.date}</td>
                      <td style={cellStyle}>{p.invoiceNumber}</td>
                      <td style={{ ...cellStyle, fontWeight: 600 }}>{"₦"}{p.amount.toLocaleString()}</td>
                      <td style={cellStyle}>{p.paid ? "Yes" : "No"}</td>
                      <td style={cellStyle}>{p.reference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <p style={{ margin: "0 0 10px", fontSize: "0.95rem", fontWeight: 700, color: "var(--color-heading)" }}>
            Purchase Order History:
          </p>
          <div style={{ borderRadius: 10, background: "var(--color-bg-soft)", padding: "4px 16px" }}>
            {detail.purchaseOrders.length === 0 ? (
              <p style={{ margin: "12px 0", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>No purchase orders yet.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["PO #", "Date", "Items", "Status", "Delivery Date"].map((c) => (
                      <th key={c} style={{ textAlign: "left", fontSize: "0.78rem", fontWeight: 600, color: "var(--color-text-muted)", padding: "12px 8px", borderBottom: "1px solid var(--color-border)" }}>
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detail.purchaseOrders.map((po, i) => (
                    <tr key={i}>
                      <td style={cellStyle}>{po.poNumber}</td>
                      <td style={cellStyle}>{po.date}</td>
                      <td style={cellStyle}>{po.items}</td>
                      <td style={cellStyle}>{po.status}</td>
                      <td style={cellStyle}>{po.deliveryDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </ModalShell>
  );
}
const cellStyle: React.CSSProperties = { padding: "12px 8px", fontSize: "0.85rem", color: "var(--color-text)", borderBottom: "1px solid var(--color-border)" };

/* -- Add Supplier modal -- */
const SUPPLIER_TYPES: SupplierType[] = ["Food Supplier", "Beverage Supplier", "Packaging Supplier"];

function AddSupplierModal({
  onClose, onSave,
}: {
  onClose: () => void;
  onSave: (payload: {
    name: string;
    type: SupplierType | null;
    contactPerson: string | null;
    phone: string | null;
    address: string | null;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<SupplierType | "">("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const canSave = name.trim().length > 0;

  return (
    <ModalShell title="Add New Supplier" onClose={onClose} width={460}>
      <Field label="Brand Name">
        <input
          className="input"
          placeholder="Enter brand name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>

      <Field label="Type">
        <div style={{ position: "relative" }}>
          <select className="input" value={type} onChange={(e) => setType(e.target.value as SupplierType)} style={{ appearance: "none", width: "100%" }}>
            <option value="">select type....</option>
            {SUPPLIER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown size={16} strokeWidth={1.8} color="var(--color-text-muted)" style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        </div>
      </Field>

      <Field label="Contact Person">
        <input className="input" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
      </Field>
      <Field label="Phone">
        <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </Field>
      <Field label="Address">
        <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
      </Field>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={onClose} style={outlineBtn}>Cancel</button>
        <button
          className="btn btn-primary"
          style={{ padding: "9px 18px", fontSize: "0.85rem" }}
          disabled={!canSave}
          onClick={() =>
            onSave({
              name,
              type: type || null,
              contactPerson: contactPerson || null,
              phone: phone || null,
              address: address || null,
            })
          }
        >
          Save
        </button>
      </div>
    </ModalShell>
  );
}

/* -- Success confirmation -- */
function SuccessModal({ name, onClose }: { name: string; onClose: () => void }) {
  return (
    <ModalShell onClose={onClose} width={420}>
      <div style={{ padding: "40px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 6 }}>
        <div
          style={{
            width: 56, height: 56, borderRadius: "50%", background: "var(--color-primary)",
            display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10,
          }}
        >
          <Check size={28} strokeWidth={2.5} color="#fff" />
        </div>
        <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "var(--color-heading)" }}>
          New Supplier Added
        </h3>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-text-muted)" }}>{name}.</p>
      </div>
    </ModalShell>
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