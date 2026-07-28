"use client";

import { useMemo, useState } from "react";
import { CalendarClock, History, Radio, Share2, Table } from "lucide-react";
import { useExpenses } from "@/context/expenses-context";
import { useCloud } from "@/hooks/use-cloud";
import { todayIso } from "@/lib/format";
import { cloudEngine } from "@/lib/cloud/engine";
import { getTemplate, TEMPLATES } from "@/lib/cloud/templates";
import { downloadCsv, estimateBytes, suggestFilename, templateToCsv } from "@/lib/cloud/serialize";
import type { DestinationId, TemplateId, TemplateResult } from "@/lib/cloud/types";
import { ConnectionsPanel } from "@/components/cloud/ConnectionsPanel";
import { TemplateGallery } from "@/components/cloud/TemplateGallery";
import { DeliveryPanel } from "@/components/cloud/DeliveryPanel";
import { ActivityFeed } from "@/components/cloud/ActivityFeed";
import { ScheduleManager } from "@/components/cloud/ScheduleManager";
import { SharePanel } from "@/components/cloud/SharePanel";
import { Skeleton } from "@/components/ui/Skeleton";

function SectionHeading({
  icon: Icon,
  title,
  hint,
}: {
  icon: typeof Radio;
  title: string;
  hint?: string;
}) {
  return (
    <div className="mb-3 flex items-baseline gap-2">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Icon className="h-4 w-4 text-slate-400" />
        {title}
      </h2>
      {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
    </div>
  );
}

export default function ExportHubPage() {
  const { expenses, isLoading } = useExpenses();
  const { connections, jobs, schedules } = useCloud();

  const today = useMemo(() => todayIso(), []);
  const [templateId, setTemplateId] = useState<TemplateId>("tax-report");
  const [destinationId, setDestinationId] = useState<DestinationId>("download");

  const results = useMemo(() => {
    const map = new Map<TemplateId, TemplateResult>();
    for (const template of TEMPLATES) map.set(template.id, template.build(expenses, today));
    return map;
  }, [expenses, today]);

  const template = getTemplate(templateId);
  const result = results.get(templateId)!;
  const filename = suggestFilename(templateId, today);
  const bytes = useMemo(() => (result ? estimateBytes(result) : 0), [result]);

  const connectedCount = connections.filter((c) => c.status === "connected").length;
  const busy = jobs.some((job) => job.stage !== "complete" && job.stage !== "failed");

  function handleRun() {
    cloudEngine.enqueue({
      templateId,
      destinationId,
      recordCount: result.rows.length,
      bytes,
    });

    // "This device" is the one destination that is not simulated.
    if (destinationId === "download") {
      downloadCsv(filename, templateToCsv(result));
    }
  }

  if (isLoading || !result) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16" />
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Export hub</h1>
          <p className="mt-1 text-sm text-slate-500">
            Connect a service, pick a report, and deliver it once or on a schedule.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs shadow-sm">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              connectedCount > 0 ? "bg-emerald-500" : "bg-slate-300"
            }`}
          />
          <span className="text-slate-600">
            {connectedCount} {connectedCount === 1 ? "service" : "services"} connected
          </span>
        </div>
      </div>

      <section>
        <SectionHeading icon={Radio} title="Connected services" hint="simulated OAuth" />
        <ConnectionsPanel connections={connections} />
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <SectionHeading icon={Table} title="Report template" hint="live row counts" />
          <TemplateGallery
            templates={TEMPLATES}
            results={results}
            selected={templateId}
            onSelect={setTemplateId}
          />

          <div className="mt-4">
            <SectionHeading icon={Share2} title="Delivery" />
            <DeliveryPanel
              template={template}
              result={result}
              filename={filename}
              bytes={bytes}
              destinationId={destinationId}
              connections={connections}
              busy={busy}
              onSelect={setDestinationId}
              onRun={handleRun}
            />
          </div>
        </section>

        <section className="lg:col-span-2">
          <SectionHeading icon={History} title="Export history" hint="live progress" />
          <ActivityFeed jobs={jobs} />

          <div className="mt-6">
            <SectionHeading icon={CalendarClock} title="Automatic backups" />
            <ScheduleManager schedules={schedules} connections={connections} />
          </div>
        </section>
      </div>

      <section>
        <SharePanel template={template} result={result} />
      </section>
    </div>
  );
}
