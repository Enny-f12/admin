// app/(admin)/settings/branches/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Plus, ChevronDown } from "lucide-react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";
import { SubHeader, Modal, Toggle } from "@/components/settings/SettingsShared";
import { CreateBranchPayload } from "@/types/settings.types";

const EMPTY_NEW_BRANCH: CreateBranchPayload = {
  name: "",
  location: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "NG",
  postalCode: "",
  latitude: 0,
  longitude: 0,
  phone: "",
  email: "",
  pickupEnabled: true,
  isActive: true,
};

const ADDRESS_FIELDS = [
  { label: "Address Line 1", key: "addressLine1" as const, placeholder: "12 Admiralty Way, Lekki Phase 1" },
  { label: "Address Line 2", key: "addressLine2" as const, placeholder: "Suite 4" },
  { label: "City", key: "city" as const, placeholder: "Lagos" },
  { label: "State", key: "state" as const, placeholder: "Lagos" },
  { label: "Country", key: "country" as const, placeholder: "NG" },
  { label: "Postal Code", key: "postalCode" as const, placeholder: "105102" },
];

export default function BranchesPage() {
  const { branches, branchesLoading, branchesError, fetchBranches, createBranch, updateBranchField, saveBranches, isSavingBranch } = useSettingsStore();

  const [addOpen, setAddOpen] = useState(false);
  const [newBranch, setNewBranch] = useState<CreateBranchPayload>(EMPTY_NEW_BRANCH);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const toggleExpanded = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          Mobile responsiveness — same technique as banners/page.tsx:
          - .action-btn-label hides under 420px so "Add Location" can't
            wrap onto two lines and collide with SubHeader's subtitle.
          - .branch-form-grid collapses from 2 columns to 1 under 560px.
            Needs !important since the base grid-template-columns comes
            from an inline style, which a plain class rule can't override
            regardless of media query specificity.

          Motion:
          - .branch-card gets a small hover lift + shadow.
          - .branch-enter staggers a fade/slide-in for each branch card
            on initial load.
          - .advanced-panel animates open/closed via grid-template-rows
            (0fr -> 1fr), which — unlike max-height hacks — animates to
            the panel's actual content height with no guessing.
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

        .branch-card {
          transition: box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .branch-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
        }

        .branch-enter {
          animation: branchFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes branchFadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .advanced-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          padding: 4px 0;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--color-text-secondary);
          transition: color 0.15s ease;
        }
        .advanced-toggle:hover {
          color: var(--color-heading);
        }
        .advanced-chevron {
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .advanced-chevron.open {
          transform: rotate(180deg);
        }

        .advanced-panel {
          display: grid;
          grid-template-rows: 0fr;
          opacity: 0;
          transition: grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease;
        }
        .advanced-panel.open {
          grid-template-rows: 1fr;
          opacity: 1;
        }
        .advanced-panel > div {
          overflow: hidden;
        }

        .input {
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .toggle-row {
          display: flex;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
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
            No branches configured
          </p>
        )}

        {!branchesLoading && !branchesError && branches?.map((b, i) => {
          const isOpen = !!expanded[b.id];
          return (
            <div key={b.id} className="branch-enter" style={{ display: "flex", flexDirection: "column", gap: 14, animationDelay: `${i * 40}ms` }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--color-heading)" }}>{b.name || "Untitled branch"}</p>
              <div className="card branch-card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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

                <button type="button" className="advanced-toggle" onClick={() => toggleExpanded(b.id)}>
                  <ChevronDown size={14} className={`advanced-chevron ${isOpen ? "open" : ""}`} />
                  Address & coordinates
                </button>

                <div className={`advanced-panel ${isOpen ? "open" : ""}`}>
                  <div>
                    <div className="branch-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, paddingTop: 4 }}>
                      {ADDRESS_FIELDS.map(({ label, key }) => (
                        <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <label style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--color-text-secondary)" }}>{label}</label>
                          <input className="input" value={b[key] ?? ""} onChange={(e) => updateBranchField(b.id, key, e.target.value)} />
                        </div>
                      ))}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--color-text-secondary)" }}>Latitude</label>
                        <input className="input" type="number" step="any" value={b.latitude} onChange={(e) => updateBranchField(b.id, "latitude", e.target.value)} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--color-text-secondary)" }}>Longitude</label>
                        <input className="input" type="number" step="any" value={b.longitude} onChange={(e) => updateBranchField(b.id, "longitude", e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="toggle-row" style={{ paddingTop: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Toggle on={b.pickupEnabled} onToggle={() => updateBranchField(b.id, "pickupEnabled", !b.pickupEnabled)} />
                    <span style={{ fontSize: "0.82rem", color: "var(--color-text)" }}>Pickup enabled</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Toggle on={b.isActive} onToggle={() => updateBranchField(b.id, "isActive", !b.isActive)} />
                    <span style={{ fontSize: "0.82rem", color: "var(--color-text)" }}>Active</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

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
              { label: "Location", key: "location" as const, placeholder: "12 Admiralty Way, Lekki" },
              { label: "Phone", key: "phone" as const, placeholder: "+2348012345678" },
              { label: "Email", key: "email" as const, placeholder: "lekki@restaurant.com" },
            ]).map(({ label, key, placeholder }) => (
              <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>{label}</label>
                <input className="input" placeholder={placeholder} value={newBranch[key]}
                  onChange={(e) => setNewBranch((f) => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}

            {ADDRESS_FIELDS.map(({ label, key, placeholder }) => (
              <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>{label}</label>
                <input className="input" placeholder={placeholder} value={newBranch[key]}
                  onChange={(e) => setNewBranch((f) => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>Latitude</label>
              <input className="input" type="number" step="any" placeholder="6.4474" value={newBranch.latitude || ""}
                onChange={(e) => setNewBranch((f) => ({ ...f, latitude: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--color-text)" }}>Longitude</label>
              <input className="input" type="number" step="any" placeholder="3.4723" value={newBranch.longitude || ""}
                onChange={(e) => setNewBranch((f) => ({ ...f, longitude: parseFloat(e.target.value) || 0 }))} />
            </div>
          </div>

          <div className="toggle-row" style={{ padding: "12px 14px", background: "var(--color-bg-soft)", borderRadius: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flex: 1, minWidth: 220 }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text)" }}>Enable Pickup</p>
                <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Allow customers to pick up orders</p>
              </div>
              <Toggle on={newBranch.pickupEnabled} onToggle={() => setNewBranch((f) => ({ ...f, pickupEnabled: !f.pickupEnabled }))} />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flex: 1, minWidth: 160 }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text)" }}>Active</p>
                <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Branch is live</p>
              </div>
              <Toggle on={newBranch.isActive} onToggle={() => setNewBranch((f) => ({ ...f, isActive: !f.isActive }))} />
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={async () => {
              if (!newBranch.name) return;
              const ok = await createBranch(newBranch);
              if (ok) {
                setAddOpen(false);
                setNewBranch(EMPTY_NEW_BRANCH);
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