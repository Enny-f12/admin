"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import Dropdown from "./Dropdown";
import { SEARCH_BY_OPTIONS, STATUS_OPTIONS, Status } from "@/types/orders.types";

type Props = {
  search: string;
  onSearch: (v: string) => void;
  searchBy: string;
  onSearchBy: (v: string) => void;
  statusFilter: "All Status" | Status;
  onStatus: (v: "All Status" | Status) => void;
};

export default function OrdersFilter({
  search, onSearch, searchBy, onSearchBy, statusFilter, onStatus,
}: Props) {
  return (
    <div className="card" style={{ padding: "16px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <SlidersHorizontal size={15} color="var(--color-text-muted)" strokeWidth={1.8} />
        <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--color-text)" }}>
          Filter
        </span>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        {/* Search input */}
        <div style={{ flex: 1, position: "relative" }}>
          <Search
            size={14}
            strokeWidth={1.8}
            style={{
              position: "absolute", left: 12, top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-text-muted)", pointerEvents: "none",
            }}
          />
          <input
            className="input"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            style={{ paddingLeft: 36 }}
          />
        </div>

        {/* Search By — gold pill */}
        <div style={{ minWidth: 140 }}>
          <div
            style={{
              background: "var(--color-secondary)",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <Dropdown
              options={SEARCH_BY_OPTIONS}
              value={searchBy}
              onChange={onSearchBy}
              minWidth={140}
            />
          </div>
        </div>

        {/* Status */}
        <Dropdown
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(v) => onStatus(v as "All Status" | Status)}
          minWidth={140}
        />
      </div>
    </div>
  );
}