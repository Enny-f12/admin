// app/(admin)/reviews/page.tsx
// ─────────────────────────────────────────────────────────────
// BRANCH: F3 — UI (Reviews)
// ─────────────────────────────────────────────────────────────
"use client";

import { useEffect, useState } from "react";
import { Star, Eye, EyeOff, Flag, ChevronDown } from "lucide-react";
import { useReviewStore } from "@/store/useReviewStore";
import { Review, ReviewStatus } from "@/types/review.types";

const STATUS_OPTIONS: { value: ReviewStatus | "all"; label: string }[] = [
  { value: "all", label: "All Reviews" },
  { value: "PUBLISHED", label: "Published" },
  { value: "HIDDEN", label: "Hidden" },
  { value: "FLAGGED", label: "Flagged" },
];

function statusBadgeClass(status: ReviewStatus) {
  if (status === "PUBLISHED") return "badge badge-green";
  if (status === "FLAGGED") return "badge badge-red";
  return "badge badge-gray";
}

// UNCONFIRMED — see review.types.ts. createdAt isn't guaranteed to exist
// on the real response yet, so this falls back gracefully instead of
// crashing on a missing field.
function formatDisplayDate(iso?: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return "—";
  return new Date(y, m - 1, d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export default function ReviewsPage() {
  const { reviews, reviewsLoading, reviewsError, updatingStatusId, fetchReviews, updateReviewStatus } = useReviewStore();

  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "all">("all");
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    fetchReviews(statusFilter === "all" ? undefined : statusFilter);
  }, [statusFilter, fetchReviews]);

  const handleModerate = (review: Review, status: ReviewStatus) => {
    if (review.status === status) return;
    updateReviewStatus(review.id, status);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      <div>
        <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "var(--color-heading)" }}>
          REVIEWS
        </h1>
        <p style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--color-text-muted)", margin: "4px 0 0" }}>
          Moderate customer reviews
        </p>
      </div>

      <div className="card" style={{ padding: "16px 20px" }}>
        <div style={{ position: "relative", maxWidth: 220 }}>
          <button
            onClick={() => setFilterOpen((v) => !v)}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "9px 12px", border: "1px solid var(--color-border)", borderRadius: 8,
              background: "var(--color-bg-input)", fontSize: "0.875rem", color: "var(--color-text)",
              cursor: "pointer", fontFamily: "var(--font-sans)", gap: 8,
            }}
          >
            <span>{STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label}</span>
            <ChevronDown size={14} strokeWidth={1.8} color="var(--color-text-muted)" />
          </button>
          {filterOpen && (
            <div
              style={{
                position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                background: "var(--color-bg-card)", border: "1px solid var(--color-border)",
                borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", zIndex: 50, overflow: "hidden",
              }}
            >
              {STATUS_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => { setStatusFilter(o.value); setFilterOpen(false); }}
                  style={{
                    width: "100%", textAlign: "left", padding: "9px 14px", border: "none",
                    background: o.value === statusFilter ? "var(--color-bg-soft)" : "transparent",
                    color: o.value === statusFilter ? "var(--color-primary)" : "var(--color-text)",
                    fontFamily: "var(--font-sans)", fontSize: "0.85rem", cursor: "pointer",
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {reviewsLoading && (
          <p style={{ padding: 40, margin: 0, textAlign: "center", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            Loading…
          </p>
        )}
        {!reviewsLoading && reviewsError && (
          <p style={{ padding: 40, margin: 0, textAlign: "center", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            Could not load reviews
          </p>
        )}
        {!reviewsLoading && !reviewsError && (reviews?.length ?? 0) === 0 && (
          <p style={{ padding: 40, margin: 0, textAlign: "center", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            No reviews found
          </p>
        )}

        {!reviewsLoading && !reviewsError && reviews?.map((r, i) => (
          <div
            key={r.id}
            style={{
              display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16,
              padding: "18px 20px", borderBottom: i < reviews.length - 1 ? "1px solid var(--color-border)" : "none",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--color-heading)" }}>
                  {r.customerName ?? "Anonymous"}
                </p>
                <span className={statusBadgeClass(r.status)}>{r.status}</span>
                {typeof r.rating === "number" && (
                  <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    <Star size={11} strokeWidth={1.8} fill="currentColor" />
                    {r.rating}/5
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text)", lineHeight: 1.5 }}>
                {r.comment ?? <span style={{ color: "var(--color-text-muted)" }}>No comment text</span>}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                {r.menuItemName && (
                  <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>on {r.menuItemName}</span>
                )}
                {r.createdAt && (
                  <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>{formatDisplayDate(r.createdAt)}</span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <button
                aria-label="Publish"
                title="Publish"
                onClick={() => handleModerate(r, "PUBLISHED")}
                disabled={updatingStatusId === r.id || r.status === "PUBLISHED"}
                style={{
                  display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 6, fontSize: "0.75rem",
                  border: "1px solid var(--color-border)", background: r.status === "PUBLISHED" ? "rgba(34,197,94,0.1)" : "var(--color-bg-card)",
                  color: r.status === "PUBLISHED" ? "#16a34a" : "var(--color-text-muted)",
                  cursor: r.status === "PUBLISHED" ? "default" : "pointer", opacity: updatingStatusId === r.id ? 0.5 : 1,
                }}
              >
                <Eye size={13} strokeWidth={1.8} /> Publish
              </button>
              <button
                aria-label="Hide"
                title="Hide"
                onClick={() => handleModerate(r, "HIDDEN")}
                disabled={updatingStatusId === r.id || r.status === "HIDDEN"}
                style={{
                  display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 6, fontSize: "0.75rem",
                  border: "1px solid var(--color-border)", background: r.status === "HIDDEN" ? "var(--color-bg-soft)" : "var(--color-bg-card)",
                  color: "var(--color-text-muted)", cursor: r.status === "HIDDEN" ? "default" : "pointer", opacity: updatingStatusId === r.id ? 0.5 : 1,
                }}
              >
                <EyeOff size={13} strokeWidth={1.8} /> Hide
              </button>
              <button
                aria-label="Flag"
                title="Flag"
                onClick={() => handleModerate(r, "FLAGGED")}
                disabled={updatingStatusId === r.id || r.status === "FLAGGED"}
                style={{
                  display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 6, fontSize: "0.75rem",
                  border: "1px solid var(--color-border)", background: r.status === "FLAGGED" ? "rgba(225,11,28,0.08)" : "var(--color-bg-card)",
                  color: r.status === "FLAGGED" ? "var(--color-primary)" : "var(--color-text-muted)",
                  cursor: r.status === "FLAGGED" ? "default" : "pointer", opacity: updatingStatusId === r.id ? 0.5 : 1,
                }}
              >
                <Flag size={13} strokeWidth={1.8} /> Flag
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}