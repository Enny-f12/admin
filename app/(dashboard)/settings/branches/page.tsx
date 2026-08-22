// app/(admin)/settings/branches/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";
import { SubHeader, Modal, Toggle } from "@/components/settings/SettingsShared";

export default function BranchesPage() {
  const { branches, branchesLoading, branchesError, fetchBranches, createBranch, updateBranchField, saveBranches, isSavingBranch } = useSettingsStore();

  const [addOpen, setAddOpen] = useState(false);
  const [pickup, setPickup] = useState(true);
  const [newBranch, setNewBranch] = useState({ name: "", location: "", phone: "", email: "" });

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          Mobile responsiveness — same technique as banners/page.tsx:
          - .action-btn-label hides under 420px so "Add Location" can't
            wrap onto two lines and collide with SubHeader's subtitle.
            Matches the 420px breakpoint already used for the branch
            selector label in (admin)/layout.tsx.
          - .branch-form-grid collapses from 2 columns to 1 under 560px.
            Needs !important since the base grid-template-columns comes
            from an inline style, which a plain class rule can't override
            regardless of media query specificity.
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
          .branch-form-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .save-changes-btn {
            width: 100% !important;
            justify-content: center !important;
          }
        }
      `}</style>

      <SubHeader
        title="Branch Locations"
        subtitle="Manage branch"
        action={
          <button className="btn btn-primary action-btn" onClick={() => setAddOpen(true)} style={{ gap: 6 }}>
            <Plus size={14} strokeWidth={2.2} />
            <span className="action-btn-label">Add Location</span>
          </button>
        }
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {branchesLoading && Array.from({ length: 2 }).map((_, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <SkeletonText width={80} height={14} />
            <div className="card branch-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {Array.from({ length: 4 }).map((_, j) => <Skeleton key={j} width="100%" height={38} radius={8} />)}
            </div>
          </div>
        ))}

        {!branchesLoading && (branchesError || !branches?.length) && (
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            {/* TODO(BACKEND): branch create/update not implemented — see request doc #7 */}
            No branches configured
          </p>
        )}

        {!branchesLoading && !branchesError && branches?.map((b) => (
          <div key={b.id} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--color-heading)" }}>{b.label}</p>
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="branch-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {([
                  { label: "Location Name", key: "name" as const },
                  { label: "Location", key: "location" as const },
                  { label: "Phone", key: "phone" as const },
                  { label: "Email", key: "email" as const },
                ]).map(({ label, key }) => (
                  <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--color-text-secondary)" }}>{label}</label>
                    <input className="input" value={b[key]} onChange={(e) => updateBranchField(b.id, key, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        <button
          className="btn btn-primary save-changes-btn"
          onClick={saveBranches}
          disabled={isSavingBranch || !branches?.length}
          style={{ alignSelf: "flex-start", padding: "10px 24px", opacity: isSavingBranch || !branches?.length ? 0.6 : 1 }}
        >
          {isSavingBranch ? "Saving…" : "Save Changes"}
        </button>
      </div>

      {addOpen && (
        <Modal title="Add New Location" subtitle="Set up a new restaurant branch" onClose={() => setAddOpen(false)}>
          <div className="branch-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {([
              { label: "Location Name", key: "name" as const, placeholder: "Lekki Main Branch" },
              { label: "Location", key: "location" as const, placeholder: "enter address..." },
              { label: "Phone", key: "phone" as const, placeholder: "enter phone number" },
              { label: "Email", key: "email" as const, placeholder: "enter email ..." },
            ]).map(({ label, key, placeholder }) => (
              <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>{label}</label>
                <input className="input" placeholder={placeholder} value={newBranch[key]}
                  onChange={(e) => setNewBranch((f) => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "var(--color-bg-soft)", borderRadius: 8 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text)" }}>Enable Pickup</p>
              <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Allow customers to pick up orders</p>
            </div>
            <Toggle on={pickup} onToggle={() => setPickup((v) => !v)} />
          </div>

          <button
            className="btn btn-primary"
            onClick={async () => {
              if (!newBranch.name) return;
              const ok = await createBranch({ ...newBranch, pickupEnabled: pickup });
              if (ok) {
                setAddOpen(false);
                setNewBranch({ name: "", location: "", phone: "", email: "" });
                setPickup(true);
              }
            }}
            style={{ width: "100%", justifyContent: "center", padding: "13px", fontSize: "0.875rem" }}
          >
            Add Location
          </button>
        </Modal>
      )}
    </>
  );
}