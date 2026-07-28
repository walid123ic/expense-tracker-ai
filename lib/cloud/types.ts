import type { Category, Expense } from "@/lib/types";

/* ---------------------------------------------------------------- services */

export type DestinationId =
  | "email"
  | "google-sheets"
  | "dropbox"
  | "onedrive"
  | "slack"
  | "download";

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

export interface Connection {
  id: DestinationId;
  status: ConnectionStatus;
  /** The simulated account or target the connection points at. */
  account: string | null;
  connectedAt: string | null;
  lastSyncAt: string | null;
}

export interface DestinationDescriptor {
  id: DestinationId;
  name: string;
  blurb: string;
  /** Colour used for the service tile, as Tailwind classes. */
  accent: string;
  /** What the connect dialog asks for. */
  credentialLabel: string;
  credentialPlaceholder: string;
  /** Destinations that hold files can host a recurring backup. */
  supportsSchedule: boolean;
  supportsShareLink: boolean;
  /** Simulated round-trip in ms, so different services feel different. */
  latency: number;
}

/* --------------------------------------------------------------- templates */

export type TemplateId = "tax-report" | "monthly-summary" | "category-analysis" | "raw-ledger";

export interface TemplateColumn {
  key: string;
  label: string;
  align?: "left" | "right";
}

export interface TemplateResult {
  columns: TemplateColumn[];
  rows: Array<Record<string, string>>;
  recordCount: number;
  totalAmount: number;
  periodLabel: string;
  /** Short human summary shown on the template card and in the share view. */
  headline: string;
}

export interface TemplateDescriptor {
  id: TemplateId;
  name: string;
  purpose: string;
  accent: string;
  /** Projects raw expenses into the shape this template exists to produce. */
  build: (expenses: Expense[], today: string) => TemplateResult;
}

/* -------------------------------------------------------------------- jobs */

export type JobStage =
  | "queued"
  | "building"
  | "transferring"
  | "verifying"
  | "complete"
  | "failed";

export interface ExportJob {
  id: string;
  templateId: TemplateId;
  destinationId: DestinationId;
  stage: JobStage;
  progress: number;
  recordCount: number;
  bytes: number;
  createdAt: string;
  completedAt: string | null;
  error: string | null;
  shareToken: string | null;
  /** Set when the job was started by a schedule rather than by hand. */
  triggeredBy: "manual" | "schedule";
}

/* --------------------------------------------------------------- schedules */

export type ScheduleFrequency = "daily" | "weekly" | "monthly";

export interface BackupSchedule {
  id: string;
  enabled: boolean;
  frequency: ScheduleFrequency;
  /** 0-23, in the viewer's local time. */
  hour: number;
  destinationId: DestinationId;
  templateId: TemplateId;
  lastRunAt: string | null;
  createdAt: string;
}

/* ------------------------------------------------------------------- share */

export interface ShareSnapshot {
  token: string;
  createdAt: string;
  expiresAt: string;
  templateId: TemplateId;
  title: string;
  headline: string;
  periodLabel: string;
  columns: TemplateColumn[];
  rows: Array<Record<string, string>>;
  totalAmount: number;
  recordCount: number;
  categories: Category[];
}
