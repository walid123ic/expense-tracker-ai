"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Link2, ShieldCheck } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { getShare, isExpired } from "@/lib/cloud/share";
import type { ShareSnapshot } from "@/lib/cloud/types";
import { Skeleton } from "@/components/ui/Skeleton";

type LoadState = { status: "loading" } | { status: "ready"; share: ShareSnapshot } | { status: "missing" };

export default function SharedSnapshotPage() {
  const params = useParams<{ token: string }>();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    const token = Array.isArray(params.token) ? params.token[0] : params.token;
    const share = token ? getShare(token) : null;
    setState(share ? { status: "ready", share } : { status: "missing" });
  }, [params]);

  if (state.status === "loading") {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (state.status === "missing") {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
        <Link2 className="mx-auto h-6 w-6 text-slate-300" />
        <h1 className="mt-3 text-base font-semibold text-slate-900">This link is not available</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Snapshots are stored in the browser that created them, so this link only opens on that
          device. It may also have been revoked.
        </p>
        <Link
          href="/export"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          Go to the export hub
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  const { share } = state;
  const expired = isExpired(share);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
              <ShieldCheck className="h-3 w-3" />
              Shared snapshot
            </span>
            <h1 className="mt-2 text-lg font-semibold text-slate-900">{share.title}</h1>
            <p className="mt-0.5 text-sm text-slate-500">{share.headline}</p>
          </div>

          <div className="text-right">
            <p className="text-xl font-semibold tabular-nums text-slate-900">
              {formatCurrency(share.totalAmount)}
            </p>
            <p className="text-[11px] text-slate-400">{share.periodLabel}</p>
          </div>
        </div>

        <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
          Frozen on {new Date(share.createdAt).toLocaleString()} ·{" "}
          {expired ? (
            <span className="text-red-500">expired</span>
          ) : (
            <>expires {new Date(share.expiresAt).toLocaleDateString()}</>
          )}{" "}
          · read-only
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                {share.columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={`px-3 py-2 font-semibold ${
                      column.align === "right" ? "text-right" : ""
                    }`}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {share.rows.map((row, index) => (
                <tr key={index} className="border-t border-slate-100">
                  {share.columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-3 py-2 text-xs text-slate-600 ${
                        column.align === "right" ? "text-right tabular-nums" : ""
                      }`}
                    >
                      {row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {share.rows.length === 0 && (
          <p className="px-4 py-8 text-center text-xs text-slate-400">
            This snapshot contains no rows.
          </p>
        )}
      </div>
    </div>
  );
}
