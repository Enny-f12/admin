"use client";

import { useEffect } from "react";
import { AlertTriangle, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMorningCountAlertsStore } from "@/store/useMorningCountStore";

export default function MorningCountAlertBanner({ vendorId }: { vendorId: string }) {
  const { alerts, startPolling, dismiss, dismissedBranchIds } = useMorningCountAlertsStore();

  useEffect(() => {
    const stop = startPolling(vendorId);
    return stop;
  }, [startPolling, vendorId]);

  const overdue = alerts.filter((b) => b.isOverdue && !dismissedBranchIds.includes(b.branchId));

  if (overdue.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: 16,
        borderRadius: 12,
        border: "1px solid rgba(225,11,28,0.35)",
        background: "rgba(225,11,28,0.06)",
        animation: "mc-alert-slide-in 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <style jsx global>{`
        @keyframes mc-alert-slide-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .mc-alert-row {
          transition: background 0.15s ease, transform 0.15s ease;
        }
        .mc-alert-row:hover {
          background: rgba(225,11,28,0.05);
        }
        .mc-alert-cta {
          transition: background 0.15s ease, transform 0.15s ease;
        }
        .mc-alert-cta:hover {
          background: var(--color-primary-dark, #b8090f);
          transform: translateY(-1px);
        }
        .mc-alert-dismiss {
          transition: opacity 0.15s ease, transform 0.15s ease;
          opacity: 0.5;
        }
        .mc-alert-dismiss:hover {
          opacity: 1;
          transform: scale(1.1);
        }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <AlertTriangle size={18} strokeWidth={2} color="#E10B1C" />
        <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--color-text)" }}>
          {overdue.length} branch{overdue.length > 1 ? "es" : ""} overdue on morning count
          {overdue[0]?.cutoffTime ? ` (cutoff ${overdue[0].cutoffTime})` : ""}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {overdue.map((b) => (
          <div
            key={b.branchId}
            className="mc-alert-row"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              borderRadius: 8,
              background: "#fff",
              border: "1px solid var(--color-border)",
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text)" }}>
                {b.branchName}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                {b.categoriesSubmitted}/{b.categoriesTotal} categories submitted · {b.minutesOverdue}m overdue
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Link
                href={`/morning-count?branchId=${b.branchId}`}
                className="mc-alert-cta"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 8,
                  background: "var(--color-primary)",
                  color: "#fff",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                View
                <ArrowRight size={13} strokeWidth={2} />
              </Link>
              <button
                className="mc-alert-dismiss"
                onClick={() => dismiss(b.branchId)}
                aria-label="Dismiss"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex" }}
              >
                <X size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}