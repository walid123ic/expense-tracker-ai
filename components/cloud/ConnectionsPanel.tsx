"use client";

import { useState } from "react";
import {
  Cloud,
  HardDrive,
  Laptop,
  Loader2,
  Mail,
  MessageSquare,
  Sheet,
  Unplug,
  type LucideIcon,
} from "lucide-react";
import { DESTINATIONS } from "@/lib/cloud/destinations";
import { cloudEngine } from "@/lib/cloud/engine";
import type { Connection, DestinationId } from "@/lib/cloud/types";
import { SyncStatusBadge } from "./SyncStatusBadge";

const ICONS: Record<DestinationId, LucideIcon> = {
  email: Mail,
  "google-sheets": Sheet,
  dropbox: Cloud,
  onedrive: HardDrive,
  slack: MessageSquare,
  download: Laptop,
};

interface ConnectionsPanelProps {
  connections: Connection[];
}

export function ConnectionsPanel({ connections }: ConnectionsPanelProps) {
  const [expanded, setExpanded] = useState<DestinationId | null>(null);
  const [draft, setDraft] = useState("");

  const connectionFor = (id: DestinationId): Connection =>
    connections.find((c) => c.id === id) ?? {
      id,
      status: "disconnected",
      account: null,
      connectedAt: null,
      lastSyncAt: null,
    };

  async function handleConnect(id: DestinationId) {
    const value = draft.trim();
    if (!value) return;
    setExpanded(null);
    setDraft("");
    await cloudEngine.connect(id, value);
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {DESTINATIONS.map((destination) => {
        const connection = connectionFor(destination.id);
        const Icon = ICONS[destination.id];
        const isOpen = expanded === destination.id;
        const isConnecting = connection.status === "connecting";
        const isConnected = connection.status === "connected";
        const alwaysAvailable = destination.id === "download";

        return (
          <div
            key={destination.id}
            className={`rounded-xl border bg-white p-4 shadow-sm transition-colors ${
              isConnected ? "border-slate-200" : "border-slate-200/70"
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white ${destination.accent}`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate text-sm font-semibold text-slate-900">
                    {destination.name}
                  </h3>
                  <SyncStatusBadge connection={connection} alwaysAvailable={alwaysAvailable} />
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{destination.blurb}</p>
              </div>
            </div>

            {isConnected && connection.account && (
              <p className="mt-3 truncate rounded-lg bg-slate-50 px-2.5 py-1.5 font-mono text-[11px] text-slate-600">
                {connection.account}
              </p>
            )}

            {!alwaysAvailable && (
              <div className="mt-3">
                {isConnected ? (
                  <button
                    onClick={() => cloudEngine.disconnect(destination.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-red-600"
                  >
                    <Unplug className="h-3.5 w-3.5" />
                    Disconnect
                  </button>
                ) : isOpen ? (
                  <div className="space-y-2">
                    <input
                      autoFocus
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleConnect(destination.id);
                        if (e.key === "Escape") setExpanded(null);
                      }}
                      placeholder={destination.credentialPlaceholder}
                      aria-label={destination.credentialLabel}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleConnect(destination.id)}
                        disabled={!draft.trim()}
                        className="flex-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:bg-slate-300"
                      >
                        Authorize
                      </button>
                      <button
                        onClick={() => setExpanded(null)}
                        className="rounded-lg px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setExpanded(destination.id);
                      setDraft("");
                    }}
                    disabled={isConnecting}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Authorizing
                      </>
                    ) : (
                      "Connect"
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
