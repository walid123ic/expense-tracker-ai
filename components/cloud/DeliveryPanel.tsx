"use client";

import { CloudUpload, Loader2, Paperclip } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { DESTINATIONS, getDestination, requiresConnection } from "@/lib/cloud/destinations";
import type {
  Connection,
  DestinationId,
  TemplateDescriptor,
  TemplateResult,
} from "@/lib/cloud/types";

interface DeliveryPanelProps {
  template: TemplateDescriptor;
  result: TemplateResult;
  filename: string;
  bytes: number;
  destinationId: DestinationId;
  connections: Connection[];
  busy: boolean;
  onSelect: (id: DestinationId) => void;
  onRun: () => void;
}

function formatBytes(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

/** A small mock of what the destination will actually receive. */
function DeliveryPreview({
  destinationId,
  connection,
  template,
  result,
  filename,
  bytes,
}: {
  destinationId: DestinationId;
  connection: Connection;
  template: TemplateDescriptor;
  result: TemplateResult;
  filename: string;
  bytes: number;
}) {
  const account = connection.account;

  if (destinationId === "email") {
    return (
      <div className="rounded-lg border border-slate-200 bg-white text-xs">
        <div className="space-y-1 border-b border-slate-100 px-3 py-2">
          <p className="text-slate-500">
            To: <span className="text-slate-800">{account ?? "not connected"}</span>
          </p>
          <p className="text-slate-500">
            Subject:{" "}
            <span className="text-slate-800">
              {template.name} — {result.periodLabel}
            </span>
          </p>
        </div>
        <div className="px-3 py-2.5 leading-relaxed text-slate-600">
          <p>Here is your {template.name.toLowerCase()}.</p>
          <p className="mt-1 text-slate-500">{result.headline}</p>
          <span className="mt-2 inline-flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600">
            <Paperclip className="h-3 w-3" />
            {filename} · {formatBytes(bytes)}
          </span>
        </div>
      </div>
    );
  }

  if (destinationId === "google-sheets") {
    const preview = result.rows.slice(0, 3);
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-emerald-50/60 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="truncate text-[11px] font-medium text-emerald-800">
            {filename.replace(/\.[^.]+$/, "")}
          </span>
          <span className="ml-auto text-[10px] text-emerald-700/70">{account ?? "—"}</span>
        </div>
        <table className="w-full text-left text-[10px]">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="w-6 border-r border-slate-100 px-1 py-1 text-center font-normal text-slate-300">
                #
              </th>
              {result.columns.slice(0, 4).map((column) => (
                <th key={column.key} className="truncate px-2 py-1 font-semibold">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.map((row, index) => (
              <tr key={index} className="border-t border-slate-100">
                <td className="border-r border-slate-100 px-1 py-1 text-center text-slate-300">
                  {index + 2}
                </td>
                {result.columns.slice(0, 4).map((column) => (
                  <td key={column.key} className="max-w-[1px] truncate px-2 py-1 text-slate-600">
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="border-t border-slate-100 px-3 py-1 text-[10px] text-slate-400">
          {result.rows.length.toLocaleString()} rows will be written to Sheet1
        </p>
      </div>
    );
  }

  if (destinationId === "slack") {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs">
        <p className="text-[11px] font-medium text-violet-700">{account ?? "#channel"}</p>
        <p className="mt-1.5 text-slate-700">
          <span className="font-medium">{template.name}</span> is ready
        </p>
        <p className="mt-0.5 text-[11px] text-slate-500">
          {result.rows.length.toLocaleString()} rows · {formatCurrency(result.totalAmount)} ·{" "}
          {result.periodLabel}
        </p>
        <span className="mt-2 inline-flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600">
          <Paperclip className="h-3 w-3" />
          {filename}
        </span>
      </div>
    );
  }

  // Dropbox, OneDrive and local download all resolve to a file landing somewhere.
  const path = destinationId === "download" ? "Downloads" : account ?? "/";
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded bg-slate-100 text-[9px] font-bold uppercase text-slate-500">
        {filename.split(".").pop()}
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-800">{filename}</p>
        <p className="truncate font-mono text-[10px] text-slate-500">
          {path.replace(/\/$/, "")}/{filename} · {formatBytes(bytes)}
        </p>
      </div>
    </div>
  );
}

export function DeliveryPanel({
  template,
  result,
  filename,
  bytes,
  destinationId,
  connections,
  busy,
  onSelect,
  onRun,
}: DeliveryPanelProps) {
  const connectionFor = (id: DestinationId): Connection =>
    connections.find((c) => c.id === id) ?? {
      id,
      status: "disconnected",
      account: null,
      connectedAt: null,
      lastSyncAt: null,
    };

  const destination = getDestination(destinationId);
  const connection = connectionFor(destinationId);
  const needsConnection = requiresConnection(destinationId) && connection.status !== "connected";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap gap-1.5">
        {DESTINATIONS.map((option) => {
          const optionConnection = connectionFor(option.id);
          const ready =
            !requiresConnection(option.id) || optionConnection.status === "connected";
          const selected = option.id === destinationId;

          return (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                selected
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  ready ? "bg-emerald-500" : selected ? "bg-white/50" : "bg-slate-300"
                }`}
              />
              {option.name}
            </button>
          );
        })}
      </div>

      <div className="mt-3">
        <DeliveryPreview
          destinationId={destinationId}
          connection={connection}
          template={template}
          result={result}
          filename={filename}
          bytes={bytes}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="min-w-0 flex-1 truncate text-[11px] text-slate-400">
          {needsConnection
            ? `Connect ${destination.name} above to enable delivery`
            : `${result.rows.length.toLocaleString()} rows · ${formatBytes(bytes)}`}
        </p>
        <button
          onClick={onRun}
          disabled={needsConnection || busy || result.rows.length === 0}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
          {busy ? "Running" : `Send to ${destination.name}`}
        </button>
      </div>
    </div>
  );
}
