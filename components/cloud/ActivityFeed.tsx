"use client";

import { CheckCircle2, Loader2, RefreshCw, XCircle, Zap } from "lucide-react";
import { cloudEngine } from "@/lib/cloud/engine";
import { getDestination } from "@/lib/cloud/destinations";
import { getTemplate } from "@/lib/cloud/templates";
import type { ExportJob, JobStage } from "@/lib/cloud/types";

const STAGE_LABEL: Record<JobStage, string> = {
  queued: "Queued",
  building: "Building report",
  transferring: "Transferring",
  verifying: "Verifying",
  complete: "Delivered",
  failed: "Failed",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function JobRow({ job }: { job: ExportJob }) {
  const destination = getDestination(job.destinationId);
  const template = getTemplate(job.templateId);
  const inFlight = job.stage !== "complete" && job.stage !== "failed";

  return (
    <li className="px-4 py-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0">
          {job.stage === "complete" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : job.stage === "failed" ? (
            <XCircle className="h-4 w-4 text-red-500" />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-xs font-medium text-slate-800">
              {template.name}
              <span className="text-slate-400"> → </span>
              {destination.name}
            </p>
            <span className="shrink-0 text-[10px] tabular-nums text-slate-400">
              {formatTime(job.createdAt)}
            </span>
          </div>

          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
            <span>{STAGE_LABEL[job.stage]}</span>
            <span className="text-slate-300">·</span>
            <span className="tabular-nums">{job.recordCount.toLocaleString()} records</span>
            <span className="text-slate-300">·</span>
            <span className="tabular-nums">{formatBytes(job.bytes)}</span>
            {job.triggeredBy === "schedule" && (
              <>
                <span className="text-slate-300">·</span>
                <span className="inline-flex items-center gap-1 text-indigo-600">
                  <Zap className="h-3 w-3" />
                  scheduled
                </span>
              </>
            )}
          </div>

          {inFlight && (
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-200"
                style={{ width: `${job.progress}%` }}
              />
            </div>
          )}

          {job.stage === "failed" && (
            <div className="mt-1.5 flex items-center gap-2">
              <p className="text-[11px] text-red-600">{job.error}</p>
              <button
                onClick={() => cloudEngine.retry(job.id)}
                className="inline-flex items-center gap-1 rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                <RefreshCw className="h-2.5 w-2.5" />
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

export function ActivityFeed({ jobs }: { jobs: ExportJob[] }) {
  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center">
        <p className="text-xs font-medium text-slate-500">No exports yet</p>
        <p className="mt-0.5 text-[11px] text-slate-400">
          Runs appear here with live progress and delivery status.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
        <span className="text-[11px] font-medium text-slate-500">
          {jobs.length} {jobs.length === 1 ? "run" : "runs"}
        </span>
        <button
          onClick={() => cloudEngine.clearHistory()}
          className="text-[11px] text-slate-400 transition-colors hover:text-slate-600"
        >
          Clear history
        </button>
      </div>
      <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
        {jobs.map((job) => (
          <JobRow key={job.id} job={job} />
        ))}
      </ul>
    </div>
  );
}
