"use client";

import { useState } from "react";
import { CalendarClock, Plus, Trash2 } from "lucide-react";
import { cloudEngine } from "@/lib/cloud/engine";
import { DESTINATIONS, getDestination } from "@/lib/cloud/destinations";
import { getTemplate, TEMPLATES } from "@/lib/cloud/templates";
import {
  describeCountdown,
  describeSchedule,
  FREQUENCIES,
  nextRunAt,
} from "@/lib/cloud/schedules";
import type {
  BackupSchedule,
  Connection,
  DestinationId,
  ScheduleFrequency,
  TemplateId,
} from "@/lib/cloud/types";

const selectClass =
  "rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30";

interface ScheduleManagerProps {
  schedules: BackupSchedule[];
  connections: Connection[];
}

export function ScheduleManager({ schedules, connections }: ScheduleManagerProps) {
  const [adding, setAdding] = useState(false);
  const [frequency, setFrequency] = useState<ScheduleFrequency>("weekly");
  const [hour, setHour] = useState(9);
  const [destinationId, setDestinationId] = useState<DestinationId>("google-sheets");
  const [templateId, setTemplateId] = useState<TemplateId>("monthly-summary");

  const schedulable = DESTINATIONS.filter((d) => d.supportsSchedule);

  const isConnected = (id: DestinationId) =>
    connections.find((c) => c.id === id)?.status === "connected";

  function handleAdd() {
    cloudEngine.addSchedule({ frequency, hour, destinationId, templateId });
    setAdding(false);
  }

  return (
    <div className="space-y-3">
      {schedules.length === 0 && !adding && (
        <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
          <CalendarClock className="mx-auto h-5 w-5 text-slate-300" />
          <p className="mt-2 text-xs font-medium text-slate-500">No automatic backups</p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Schedule a recurring export so a fresh copy is always waiting.
          </p>
        </div>
      )}

      {schedules.map((schedule) => {
        const next = nextRunAt(schedule);
        const destination = getDestination(schedule.destinationId);
        const connected = isConnected(schedule.destinationId);

        return (
          <div
            key={schedule.id}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white ${destination.accent}`}
            >
              <CalendarClock className="h-4 w-4" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-slate-800">
                {getTemplate(schedule.templateId).name} → {destination.name}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {describeSchedule(schedule)}
                {schedule.enabled && (
                  <>
                    <span className="text-slate-300"> · </span>
                    next run {describeCountdown(next)}
                  </>
                )}
                {!connected && (
                  <>
                    <span className="text-slate-300"> · </span>
                    <span className="text-amber-600">destination not connected</span>
                  </>
                )}
              </p>
            </div>

            <button
              role="switch"
              aria-checked={schedule.enabled}
              aria-label={`${schedule.enabled ? "Disable" : "Enable"} schedule`}
              onClick={() => cloudEngine.updateSchedule(schedule.id, { enabled: !schedule.enabled })}
              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                schedule.enabled ? "bg-indigo-600" : "bg-slate-200"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  schedule.enabled ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>

            <button
              onClick={() => cloudEngine.removeSchedule(schedule.id)}
              aria-label="Remove schedule"
              className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}

      {adding ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value as TemplateId)}
              className={selectClass}
              aria-label="Template"
            >
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            <span className="text-xs text-slate-400">to</span>

            <select
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value as DestinationId)}
              className={selectClass}
              aria-label="Destination"
            >
              {schedulable.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as ScheduleFrequency)}
              className={selectClass}
              aria-label="Frequency"
            >
              {FREQUENCIES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>

            <select
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              className={selectClass}
              aria-label="Hour"
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {h.toString().padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={handleAdd}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700"
            >
              Create schedule
            </button>
            <button
              onClick={() => setAdding(false)}
              className="rounded-lg px-3 py-1.5 text-xs text-slate-500 transition-colors hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          <Plus className="h-3.5 w-3.5" />
          New backup schedule
        </button>
      )}
    </div>
  );
}
