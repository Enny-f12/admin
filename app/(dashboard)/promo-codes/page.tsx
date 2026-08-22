// app/(admin)/promo-codes/page.tsx
// ─────────────────────────────────────────────────────────────
// BRANCH: F3 — UI (Promo Codes)
// ─────────────────────────────────────────────────────────────
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Plus, Search, ChevronLeft, ChevronRight, X, SquarePen, Trash2, ChevronDown,
} from "lucide-react";
import { usePromoCodeStore } from "@/store/usePromoCodeStore";
import { PromoCode, PromoDiscountType, CreatePromoCodePayload } from "@/types/promo.types";

const EMPTY_FORM = {
  code: "",
  description: "",
  discountType: "PERCENTAGE" as PromoDiscountType,
  discountValue: "",
  minOrderValue: "",
  maxDiscount: "",
  maxUses: "",
  perUserLimit: "",
  startDate: "",
  endDate: "",
  isActive: true,
};

const PAGE_SIZE = 10;

// GET /admin/promo-codes returned no example response body in Swagger, so
// dates here are assumed ISO strings (same convention as banners). If the
// real payload sends plain "YYYY-MM-DD", these still work unchanged since
// slice(0, 10) is a no-op on an already-short string.
function toInputDate(iso: string) {
  return iso ? iso.slice(0, 10) : "";
}
function formatDisplayDate(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return "—";
  return new Date(y, m - 1, d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function formatDiscount(type: PromoDiscountType, value: number) {
  return type === "PERCENTAGE" ? `${value}%` : `₦${value.toLocaleString()}`;
}

export default function PromoCodesPage() {
  const {
    promoCodes, promoCodesLoading, promoCodesError,
    isSavingPromoCode, deletingPromoCodeId,
    fetchPromoCodes, createPromoCode, updatePromoCode, deletePromoCode,
  } = usePromoCodeStore();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<PromoCode | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    fetchPromoCodes();
  }, [fetchPromoCodes]);

  const filtered = (promoCodes ?? []).filter(
    (p) =>
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [search]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openAdd = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (item: PromoCode) => {
    setEditItem(item);
    setForm({
      code: item.code,
      description: item.description,
      discountType: item.discountType,
      discountValue: String(item.discountValue),
      minOrderValue: String(item.minOrderValue),
      maxDiscount: String(item.maxDiscount),
      maxUses: String(item.maxUses),
      perUserLimit: String(item.perUserLimit),
      startDate: toInputDate(item.startDate),
      endDate: toInputDate(item.endDate),
      isActive: item.isActive,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.code.trim() || !form.discountValue || !form.startDate || !form.endDate) {
      toast.error("Code, discount value, start and end date are required");
      return;
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      toast.error("End date can't be before start date");
      return;
    }

    const shared = {
      description: form.description,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minOrderValue: Number(form.minOrderValue || 0),
      maxDiscount: Number(form.maxDiscount || 0),
      maxUses: Number(form.maxUses || 0),
      perUserLimit: Number(form.perUserLimit || 0),
      startDate: form.startDate,
      endDate: form.endDate,
      isActive: form.isActive,
    };

    if (editItem) {
      // `code` intentionally omitted — see UpdatePromoCodePayload note in
      // the types file, PATCH's Swagger example doesn't include it.
      const success = await updatePromoCode(editItem.id, shared);
      if (success) setModalOpen(false);
    } else {
      const payload: CreatePromoCodePayload = { code: form.code.trim().toUpperCase(), ...shared };
      const success = await createPromoCode(payload);
      if (success) setModalOpen(false);
    }
  };

  const handleDelete = async (item: PromoCode) => {
    await deletePromoCode(item.id);
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "var(--color-heading)" }}>
              PROMO CODES
            </h1>
            <p style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--color-text-muted)", margin: "4px 0 0" }}>
              Create and manage discount codes
            </p>
          </div>
          <button className="btn btn-primary" onClick={openAdd} style={{ gap: 6 }}>
            <Plus size={15} strokeWidth={2.2} />
            Add Promo Code
          </button>
        </div>

        <div className="card" style={{ padding: "16px 20px" }}>
          <div style={{ position: "relative" }}>
            <Search
              size={14}
              strokeWidth={1.8}
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }}
            />
            <input
              className="input"
              placeholder="Search by code or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Min Order</th>
                  <th>Usage Limit</th>
                  <th>Validity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {promoCodesLoading && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--color-text-muted)" }}>
                      Loading…
                    </td>
                  </tr>
                )}
                {!promoCodesLoading && promoCodesError && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--color-text-muted)" }}>
                      Could not load promo codes
                    </td>
                  </tr>
                )}
                {!promoCodesLoading && !promoCodesError && filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--color-text-muted)" }}>
                      No promo codes found
                    </td>
                  </tr>
                )}
                {!promoCodesLoading &&
                  !promoCodesError &&
                  paginated.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: "0.85rem", color: "var(--color-heading)" }}>{p.code}</p>
                        <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "var(--color-text-muted)", maxWidth: 260 }}>
                          {p.description || "—"}
                        </p>
                      </td>
                      <td style={{ fontWeight: 500, color: "var(--color-primary)" }}>
                        {formatDiscount(p.discountType, p.discountValue)}
                      </td>
                      <td>{p.minOrderValue ? `₦${p.minOrderValue.toLocaleString()}` : "—"}</td>
                      <td style={{ fontSize: "0.8rem" }}>
                        {p.maxUses ? `${p.currentUses ?? 0}/${p.maxUses}` : "Unlimited"}
                        {p.perUserLimit ? <span style={{ color: "var(--color-text-muted)" }}> · {p.perUserLimit}/user</span> : null}
                      </td>
                      <td style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                        {formatDisplayDate(p.startDate)} – {formatDisplayDate(p.endDate)}
                      </td>
                      <td>
                        <span className={p.isActive ? "badge badge-green" : "badge badge-gray"}>
                          {p.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <button
                            aria-label={`Edit ${p.code}`}
                            onClick={() => openEdit(p)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", padding: 4, borderRadius: 6 }}
                          >
                            <SquarePen size={15} strokeWidth={1.8} />
                          </button>
                          <button
                            aria-label={`Delete ${p.code}`}
                            onClick={() => handleDelete(p)}
                            disabled={deletingPromoCodeId === p.id}
                            style={{
                              background: "none", border: "none", cursor: "pointer", display: "flex", padding: 4, borderRadius: 6,
                              color: "var(--color-text-muted)", opacity: deletingPromoCodeId === p.id ? 0.4 : 1,
                            }}
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

          {!promoCodesLoading && !promoCodesError && filtered.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderTop: "1px solid var(--color-border)" }}>
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

      {modalOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div
            style={{ background: "var(--color-bg-card)", borderRadius: 16, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", padding: 28, display: "flex", flexDirection: "column", gap: 18 }}
            className="no-scrollbar"
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--color-heading)" }}>
                  {editItem ? "Edit Promo Code" : "Create Promo Code"}
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                  {editItem ? "Update the discount details below." : "Set up a new discount code for customers."}
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", padding: 4, borderRadius: 6 }}>
                <X size={18} strokeWidth={1.8} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>
                Code <span style={{ color: "var(--color-primary)" }}>*</span>
              </label>
              <input
                className="input"
                placeholder="e.g. WELCOME10"
                value={form.code}
                disabled={!!editItem}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                style={{ textTransform: "uppercase", opacity: editItem ? 0.6 : 1 }}
              />
              {editItem && (
                <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                  Code can&apos;t be changed after creation.
                </p>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>Description</label>
              <input
                className="input"
                placeholder="e.g. 10% off your first order"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>
                  Discount Type <span style={{ color: "var(--color-primary)" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <select
                    className="input appearance-none"
                    value={form.discountType}
                    onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value as PromoDiscountType }))}
                    style={{ paddingRight: "2.5rem" }}
                  >
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED">Fixed Amount</option>
                  </select>
                  <ChevronDown size={14} strokeWidth={1.8} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--color-text-muted)" }} />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>
                  {form.discountType === "PERCENTAGE" ? "Discount (%)" : "Discount (₦)"} <span style={{ color: "var(--color-primary)" }}>*</span>
                </label>
                <input
                  className="input" type="number" placeholder="0"
                  value={form.discountValue}
                  onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>Min Order Value (₦)</label>
                <input className="input" type="number" placeholder="0" value={form.minOrderValue}
                  onChange={(e) => setForm((f) => ({ ...f, minOrderValue: e.target.value }))} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>Max Discount (₦)</label>
                <input className="input" type="number" placeholder="0" value={form.maxDiscount}
                  onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>Max Total Uses</label>
                <input className="input" type="number" placeholder="0 = unlimited" value={form.maxUses}
                  onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>Per-User Limit</label>
                <input className="input" type="number" placeholder="0 = unlimited" value={form.perUserLimit}
                  onChange={(e) => setForm((f) => ({ ...f, perUserLimit: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>
                  Start Date <span style={{ color: "var(--color-primary)" }}>*</span>
                </label>
                <input className="input" type="date" value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>
                  End Date <span style={{ color: "var(--color-primary)" }}>*</span>
                </label>
                <input className="input" type="date" value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "var(--color-bg-soft)", borderRadius: 8 }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text)" }}>Active</p>
                <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Customers can use this code immediately</p>
              </div>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                style={{
                  width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer", position: "relative",
                  background: form.isActive ? "var(--color-primary)" : "var(--color-border)", transition: "background 0.15s",
                }}
                aria-label="Toggle active"
              >
                <span style={{
                  position: "absolute", top: 2, left: form.isActive ? 20 : 2, width: 18, height: 18, borderRadius: "50%",
                  background: "#fff", transition: "left 0.15s",
                }} />
              </button>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={isSavingPromoCode}
              style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: "0.875rem", opacity: isSavingPromoCode ? 0.6 : 1 }}
            >
              {isSavingPromoCode ? "Saving…" : editItem ? "Save Changes" : "Create Promo Code"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}