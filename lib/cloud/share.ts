import type { Category } from "@/lib/types";
import { createId, readJson, STORAGE_KEYS, writeJson } from "./storage";
import type { ShareSnapshot, TemplateDescriptor, TemplateResult } from "./types";

const DEFAULT_TTL_DAYS = 7;

/**
 * Share links are real, not mocked: the snapshot is frozen at creation time and
 * served by the /shared/[token] route. There is no server, so the store is
 * local -- the link opens on this browser, and the UI says so plainly.
 */
export function createShare(
  template: TemplateDescriptor,
  result: TemplateResult,
  categories: Category[],
  ttlDays = DEFAULT_TTL_DAYS
): ShareSnapshot {
  const now = new Date();
  const expires = new Date(now);
  expires.setDate(expires.getDate() + ttlDays);

  const snapshot: ShareSnapshot = {
    token: createId("shr").replace("shr_", ""),
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    templateId: template.id,
    title: template.name,
    headline: result.headline,
    periodLabel: result.periodLabel,
    columns: result.columns,
    rows: result.rows,
    totalAmount: result.totalAmount,
    recordCount: result.recordCount,
    categories,
  };

  const all = listShares();
  writeJson(STORAGE_KEYS.shares, [snapshot, ...all].slice(0, 20));
  return snapshot;
}

export function listShares(): ShareSnapshot[] {
  return readJson<ShareSnapshot[]>(STORAGE_KEYS.shares, []);
}

export function getShare(token: string): ShareSnapshot | null {
  return listShares().find((share) => share.token === token) ?? null;
}

export function revokeShare(token: string): void {
  writeJson(
    STORAGE_KEYS.shares,
    listShares().filter((share) => share.token !== token)
  );
}

export function isExpired(share: ShareSnapshot, now: Date = new Date()): boolean {
  return new Date(share.expiresAt).getTime() < now.getTime();
}

export function shareUrl(token: string): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/shared/${token}`;
}
