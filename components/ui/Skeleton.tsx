// components/Skeleton.tsx
"use client";

/**
 * Base shimmer block. Use directly for custom shapes (avatars, badges, etc.)
 * or via the SkeletonText / SkeletonTableRows helpers below for common cases.
 */
export function Skeleton({
  width = "100%",
  height = 14,
  radius = 6,
  style,
}: {
  width?: string | number;
  height?: string | number;
  radius?: number;
  style?: React.CSSProperties;
}) {
  return (
    <>
      <span
        className="skeleton-shimmer"
        style={{
          display: "inline-block",
          width,
          height,
          borderRadius: radius,
          ...style,
        }}
      />
      <style jsx global>{`
        .skeleton-shimmer {
          background: linear-gradient(
            90deg,
            var(--color-bg-soft) 25%,
            var(--color-border) 37%,
            var(--color-bg-soft) 63%
          );
          background-size: 400% 100%;
          animation: skeleton-shimmer 1.4s ease infinite;
        }
        @keyframes skeleton-shimmer {
          0% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </>
  );
}

/** A line of text-shaped skeleton, e.g. for headings or labels. */
export function SkeletonText({ width = "60%", height = 14 }: { width?: string | number; height?: string | number }) {
  return <Skeleton width={width} height={height} radius={4} />;
}

/**
 * Skeleton table rows matching a given column count. Pass `widths` to vary
 * bar width per column (defaults to a mix so it doesn't look uniform/robotic).
 */
export function SkeletonTableRows({
  rows = 6,
  columns,
  widths,
}: {
  rows?: number;
  columns: number;
  widths?: (string | number)[];
}) {
  const defaultWidths = ["70%", "50%", "40%", "55%", "45%", "60%", "40%", "30%"];
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: columns }).map((_, c) => (
            <td key={c}>
              <Skeleton width={widths?.[c] ?? defaultWidths[c % defaultWidths.length]} height={13} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}