import { getDestination, requiresConnection } from "./destinations";
import { createId, readJson, STORAGE_KEYS, writeJson } from "./storage";
import type {
  BackupSchedule,
  Connection,
  DestinationId,
  ExportJob,
  JobStage,
  ScheduleFrequency,
  TemplateId,
} from "./types";

export interface CloudState {
  connections: Connection[];
  jobs: ExportJob[];
  schedules: BackupSchedule[];
}

const MAX_JOB_HISTORY = 30;
const TICK_MS = 140;

/** Progress thresholds at which a job moves to the next stage. */
const STAGE_BOUNDARIES: Array<{ upTo: number; stage: JobStage }> = [
  { upTo: 12, stage: "queued" },
  { upTo: 55, stage: "building" },
  { upTo: 88, stage: "transferring" },
  { upTo: 100, stage: "verifying" },
];

function stageForProgress(progress: number): JobStage {
  for (const boundary of STAGE_BOUNDARIES) {
    if (progress < boundary.upTo) return boundary.stage;
  }
  return "complete";
}

function emptyConnection(id: DestinationId): Connection {
  return { id, status: "disconnected", account: null, connectedAt: null, lastSyncAt: null };
}

/**
 * A simulated cloud backend living entirely in the browser.
 *
 * It exists so the UI can be built against realistic asynchronous behaviour --
 * connections that take time and can fail, jobs that move through stages, sync
 * timestamps that advance -- without any server. Everything is observable
 * through a single subscribe() so React just renders whatever state it is in.
 */
class CloudEngine {
  private state: CloudState = { connections: [], jobs: [], schedules: [] };
  private listeners = new Set<(state: CloudState) => void>();
  private timers = new Map<string, ReturnType<typeof setInterval>>();
  private hydrated = false;

  hydrate(): void {
    if (this.hydrated || typeof window === "undefined") return;
    this.hydrated = true;

    const connections = readJson<Connection[]>(STORAGE_KEYS.connections, []);
    const jobs = readJson<ExportJob[]>(STORAGE_KEYS.jobs, []);
    const schedules = readJson<BackupSchedule[]>(STORAGE_KEYS.schedules, []);

    // Jobs that were mid-flight when the tab closed cannot be resumed.
    const settled = jobs.map((job) =>
      job.stage === "complete" || job.stage === "failed"
        ? job
        : { ...job, stage: "failed" as JobStage, error: "Interrupted by page reload." }
    );

    this.state = { connections, jobs: settled, schedules };
    this.emit();
  }

  getState(): CloudState {
    return this.state;
  }

  subscribe(listener: (state: CloudState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener(this.state));
  }

  private update(partial: Partial<CloudState>, persist = true): void {
    this.state = { ...this.state, ...partial };
    if (persist) {
      writeJson(STORAGE_KEYS.connections, this.state.connections);
      writeJson(STORAGE_KEYS.jobs, this.state.jobs);
      writeJson(STORAGE_KEYS.schedules, this.state.schedules);
    }
    this.emit();
  }

  /* ------------------------------------------------------------ connections */

  getConnection(id: DestinationId): Connection {
    return this.state.connections.find((c) => c.id === id) ?? emptyConnection(id);
  }

  private setConnection(id: DestinationId, patch: Partial<Connection>): void {
    const existing = this.getConnection(id);
    const next = { ...existing, ...patch };
    const connections = [...this.state.connections.filter((c) => c.id !== id), next];
    this.update({ connections });
  }

  async connect(id: DestinationId, account: string): Promise<void> {
    const destination = getDestination(id);
    this.setConnection(id, { status: "connecting", account });

    await new Promise((resolve) => setTimeout(resolve, destination.latency));

    this.setConnection(id, {
      status: "connected",
      account,
      connectedAt: new Date().toISOString(),
    });
  }

  disconnect(id: DestinationId): void {
    this.setConnection(id, {
      status: "disconnected",
      account: null,
      connectedAt: null,
      lastSyncAt: null,
    });
  }

  /* ------------------------------------------------------------------- jobs */

  enqueue(input: {
    templateId: TemplateId;
    destinationId: DestinationId;
    recordCount: number;
    bytes: number;
    shareToken?: string | null;
    triggeredBy?: "manual" | "schedule";
  }): ExportJob {
    const job: ExportJob = {
      id: createId("job"),
      templateId: input.templateId,
      destinationId: input.destinationId,
      stage: "queued",
      progress: 0,
      recordCount: input.recordCount,
      bytes: input.bytes,
      createdAt: new Date().toISOString(),
      completedAt: null,
      error: null,
      shareToken: input.shareToken ?? null,
      triggeredBy: input.triggeredBy ?? "manual",
    };

    const jobs = [job, ...this.state.jobs].slice(0, MAX_JOB_HISTORY);
    this.update({ jobs });

    if (requiresConnection(job.destinationId) && this.getConnection(job.destinationId).status !== "connected") {
      this.failJob(job.id, `${getDestination(job.destinationId).name} is not connected.`);
      return job;
    }

    this.runJob(job.id);
    return job;
  }

  private patchJob(id: string, patch: Partial<ExportJob>): void {
    const jobs = this.state.jobs.map((job) => (job.id === id ? { ...job, ...patch } : job));
    this.update({ jobs });
  }

  private failJob(id: string, error: string): void {
    this.clearTimer(id);
    this.patchJob(id, { stage: "failed", error, completedAt: new Date().toISOString() });
  }

  private clearTimer(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(id);
    }
  }

  /** Advances a job through its stages on a timer, as a real upload would. */
  private runJob(id: string): void {
    const job = this.state.jobs.find((j) => j.id === id);
    if (!job) return;

    const destination = getDestination(job.destinationId);
    // Bigger payloads and slower services take longer, within sane bounds.
    const sizeFactor = Math.min(2.5, 1 + job.bytes / 60_000);
    const step = Math.max(3, 16 / ((destination.latency / 700) * sizeFactor));

    this.clearTimer(id);
    const timer = setInterval(() => {
      const current = this.state.jobs.find((j) => j.id === id);
      if (!current || current.stage === "failed") {
        this.clearTimer(id);
        return;
      }

      const progress = Math.min(100, current.progress + step);
      const stage = stageForProgress(progress);

      if (stage === "complete") {
        this.clearTimer(id);
        this.patchJob(id, { progress: 100, stage: "complete", completedAt: new Date().toISOString() });
        if (requiresConnection(job.destinationId)) {
          this.setConnection(job.destinationId, { lastSyncAt: new Date().toISOString() });
        }
        return;
      }

      this.patchJob(id, { progress, stage });
    }, TICK_MS);

    this.timers.set(id, timer);
  }

  retry(id: string): void {
    const job = this.state.jobs.find((j) => j.id === id);
    if (!job) return;

    if (requiresConnection(job.destinationId) && this.getConnection(job.destinationId).status !== "connected") {
      this.failJob(id, `${getDestination(job.destinationId).name} is not connected.`);
      return;
    }

    this.patchJob(id, { stage: "queued", progress: 0, error: null, completedAt: null });
    this.runJob(id);
  }

  clearHistory(): void {
    this.timers.forEach((_, id) => this.clearTimer(id));
    this.update({ jobs: [] });
  }

  /* -------------------------------------------------------------- schedules */

  addSchedule(input: {
    frequency: ScheduleFrequency;
    hour: number;
    destinationId: DestinationId;
    templateId: TemplateId;
  }): BackupSchedule {
    const schedule: BackupSchedule = {
      id: createId("sch"),
      enabled: true,
      frequency: input.frequency,
      hour: input.hour,
      destinationId: input.destinationId,
      templateId: input.templateId,
      lastRunAt: null,
      createdAt: new Date().toISOString(),
    };
    this.update({ schedules: [...this.state.schedules, schedule] });
    return schedule;
  }

  updateSchedule(id: string, patch: Partial<BackupSchedule>): void {
    this.update({
      schedules: this.state.schedules.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  }

  removeSchedule(id: string): void {
    this.update({ schedules: this.state.schedules.filter((s) => s.id !== id) });
  }

  markScheduleRun(id: string): void {
    this.updateSchedule(id, { lastRunAt: new Date().toISOString() });
  }
}

export const cloudEngine = new CloudEngine();
