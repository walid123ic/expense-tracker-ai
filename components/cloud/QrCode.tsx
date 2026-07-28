"use client";

import { useMemo } from "react";
import { encodeQr } from "@/lib/qr/encoder";

interface QrCodeProps {
  value: string;
  /** Rendered edge length in pixels. */
  size?: number;
  className?: string;
}

const QUIET_ZONE = 4;

export function QrCode({ value, size = 148, className }: QrCodeProps) {
  const result = useMemo(() => {
    try {
      return encodeQr(value);
    } catch {
      return null;
    }
  }, [value]);

  if (!result) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`flex items-center justify-center rounded-lg border border-dashed border-slate-200 text-center text-[10px] text-slate-400 ${className ?? ""}`}
      >
        Link too long to encode
      </div>
    );
  }

  const total = result.size + QUIET_ZONE * 2;
  const rects: string[] = [];

  // One path per dark module, merged into a single <path> for a light DOM.
  for (let row = 0; row < result.size; row++) {
    for (let col = 0; col < result.size; col++) {
      if (result.matrix[row][col]) {
        rects.push(`M${col + QUIET_ZONE} ${row + QUIET_ZONE}h1v1h-1z`);
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${total} ${total}`}
      width={size}
      height={size}
      role="img"
      aria-label={`QR code for ${value}`}
      shapeRendering="crispEdges"
      className={className}
    >
      <rect width={total} height={total} fill="#ffffff" />
      <path d={rects.join("")} fill="#0f172a" />
    </svg>
  );
}
