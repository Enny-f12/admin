"use client";

import { Clock, Eye } from "lucide-react";
import { Order, STATUS_STYLE, fmt, PER_PAGE } from "@/types/orders.types";

type Props = {
  orders: Order[];
  page: number;
  onPageChange: (p: number) => void;
  onView: (order: Order) => void;
};

export default function OrdersTable({ orders, page, onPageChange, onView }: Props) {
  const totalPages = Math.max(1, Math.ceil(orders.length / PER_PAGE));
  const pageOrders = orders.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {["Order ID", "Customer", "Items", "Total Amount", "Type", "Status", "Time", "Action"].map(
                (col) => <th key={col}>{col}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {pageOrders.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--color-text-muted)" }}>
                  No orders found
                </td>
              </tr>
            ) : (
              pageOrders.map((o) => {
                const itemCount = o.items.reduce((s, i) => s + i.qty, 0);
                const total     = o.items.reduce((s, i) => s + i.price, 0);
                return (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 600, color: "var(--color-text)" }}>{o.id}</td>
                    <td>{o.customer}</td>
                    <td>{itemCount} Item{itemCount !== 1 ? "s" : ""}</td>
                    <td style={{ fontWeight: 500, color: "var(--color-text)" }}>{fmt(total)}</td>
                    <td>{o.type}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: STATUS_STYLE[o.status].bg,
                          color: STATUS_STYLE[o.status].color,
                        }}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--color-text-secondary)", fontSize: "0.83rem" }}>
                        <Clock size={13} strokeWidth={1.8} />
                        {o.time}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => onView(o)}
                        aria-label={`View order ${o.id}`}
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: "var(--color-text-muted)", display: "flex",
                          padding: 4, borderRadius: 6, transition: "color 0.15s",
                        }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--color-text)")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)")}
                      >
                        <Eye size={15} strokeWidth={1.8} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, padding: "14px 20px", borderTop: "1px solid var(--color-border)" }}>
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          style={{
            background: "none", border: "none", fontFamily: "var(--font-sans)",
            fontSize: "0.825rem", fontWeight: 500,
            color: page === 1 ? "var(--color-text-muted)" : "var(--color-primary)",
            cursor: page === 1 ? "not-allowed" : "pointer",
          }}
        >
          Previous
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => onPageChange(n)}
            style={{
              width: 30, height: 30, borderRadius: 6, border: "none", cursor: "pointer",
              background: n === page ? "var(--color-secondary)" : "transparent",
              color: n === page ? "#6b4c00" : "var(--color-text-secondary)",
              fontWeight: n === page ? 600 : 400,
              fontSize: "0.825rem", fontFamily: "var(--font-sans)",
            }}
          >
            {n}
          </button>
        ))}

        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          style={{
            background: "none", border: "none", fontFamily: "var(--font-sans)",
            fontSize: "0.825rem", fontWeight: 500,
            color: page === totalPages ? "var(--color-text-muted)" : "var(--color-primary)",
            cursor: page === totalPages ? "not-allowed" : "pointer",
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}