"use client";

import { useEffect, useState } from "react";
import type { Connection } from "@/lib/cloud/types";

/** "just now", "4 min ago", "2 h ago" -- refreshed on a timer while mounted. */
function relativeTime(iso: string, now: number): string {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

interface SyncStatusBadgeProps {
  connection: Connection;
  alwaysAvailable?: boolean;
}

export function SyncStatusBadge({ connection, alwaysAvailable }: SyncStatusBadgeProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  if (alwaysAvailable) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
        Always on
      </span>
    );
  }

  if (connection.status === "connecting") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
        Authorizing
      </span>
    );
  }

  if (connection.status === "connected") {
    return (
      <span
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700"
        title={connection.lastSyncAt ? `Last sync ${connection.lastSyncAt}` : "Connected"}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {connection.lastSyncAt ? `Synced ${relativeTime(connection.lastSyncAt, now)}` : "Connected"}
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
      Not connected
    </span>
  );
}
