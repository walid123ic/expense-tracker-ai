"use client";

import { useEffect, useState } from "react";
import { Copy, ExternalLink, Link2, ShieldCheck, Trash2 } from "lucide-react";
import { CATEGORIES } from "@/lib/types";
import { createShare, isExpired, listShares, revokeShare, shareUrl } from "@/lib/cloud/share";
import type { ShareSnapshot, TemplateDescriptor, TemplateResult } from "@/lib/cloud/types";
import { QrCode } from "./QrCode";

interface SharePanelProps {
  template: TemplateDescriptor;
  result: TemplateResult;
  onShareCreated?: (share: ShareSnapshot) => void;
}

function daysLeft(share: ShareSnapshot): number {
  return Math.max(
    0,
    Math.ceil((new Date(share.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );
}

export function SharePanel({ template, result, onShareCreated }: SharePanelProps) {
  const [shares, setShares] = useState<ShareSnapshot[]>([]);
  const [active, setActive] = useState<ShareSnapshot | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stored = listShares();
    setShares(stored);
    setActive(stored[0] ?? null);
  }, []);

  function handleCreate() {
    const share = createShare(template, result, [...CATEGORIES]);
    setShares(listShares());
    setActive(share);
    setCopied(false);
    onShareCreated?.(share);
  }

  function handleRevoke(token: string) {
    revokeShare(token);
    const remaining = listShares();
    setShares(remaining);
    if (active?.token === token) setActive(remaining[0] ?? null);
  }

  async function handleCopy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard can be blocked; the input below still allows manual copying.
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Share a snapshot</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Freezes <span className="font-medium text-slate-700">{template.name}</span> as it looks
            right now and publishes it at a link.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-800"
        >
          <Link2 className="h-3.5 w-3.5" />
          Create link
        </button>
      </div>

      {active && (
        <div className="mt-4 flex flex-col gap-4 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center">
          <QrCode value={shareUrl(active.token)} size={132} className="mx-auto shrink-0 rounded-lg bg-white p-2 shadow-sm sm:mx-0" />

          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-800">{active.title}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">{active.headline}</p>

            <div className="mt-2.5 flex items-center gap-1.5">
              <input
                readOnly
                value={shareUrl(active.token)}
                onFocus={(e) => e.currentTarget.select()}
                aria-label="Share link"
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-[11px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
              <button
                onClick={() => handleCopy(shareUrl(active.token))}
                className="shrink-0 rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition-colors hover:bg-slate-100"
                aria-label="Copy link"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <a
                href={shareUrl(active.token)}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition-colors hover:bg-slate-100"
                aria-label="Open link"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            <p className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400">
              <ShieldCheck className="h-3 w-3" />
              {copied ? "Copied to clipboard" : `Expires in ${daysLeft(active)} days · scan or open`}
            </p>
          </div>
        </div>
      )}

      {shares.length > 0 && (
        <ul className="mt-3 divide-y divide-slate-100 border-t border-slate-100 pt-1">
          {shares.map((share) => (
            <li key={share.token} className="flex items-center gap-2 py-1.5">
              <button
                onClick={() => setActive(share)}
                className={`min-w-0 flex-1 truncate text-left text-[11px] transition-colors ${
                  active?.token === share.token
                    ? "font-medium text-slate-800"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {share.title}
                <span className="ml-1.5 font-mono text-slate-400">/{share.token}</span>
              </button>
              <span
                className={`shrink-0 text-[10px] ${
                  isExpired(share) ? "text-red-500" : "text-slate-400"
                }`}
              >
                {isExpired(share) ? "expired" : `${daysLeft(share)}d left`}
              </span>
              <button
                onClick={() => handleRevoke(share.token)}
                aria-label={`Revoke ${share.title} link`}
                className="shrink-0 rounded p-1 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
