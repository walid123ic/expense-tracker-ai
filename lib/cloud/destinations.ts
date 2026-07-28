import type { DestinationDescriptor, DestinationId } from "./types";

export const DESTINATIONS: DestinationDescriptor[] = [
  {
    id: "email",
    name: "Email",
    blurb: "Send the report as an attachment to any address.",
    accent: "bg-rose-500",
    credentialLabel: "Recipient address",
    credentialPlaceholder: "finance@company.com",
    supportsSchedule: true,
    supportsShareLink: false,
    latency: 900,
  },
  {
    id: "google-sheets",
    name: "Google Sheets",
    blurb: "Create a live spreadsheet and keep it in sync.",
    accent: "bg-emerald-600",
    credentialLabel: "Google account",
    credentialPlaceholder: "you@gmail.com",
    supportsSchedule: true,
    supportsShareLink: true,
    latency: 1400,
  },
  {
    id: "dropbox",
    name: "Dropbox",
    blurb: "Drop files into a folder your team already watches.",
    accent: "bg-blue-500",
    credentialLabel: "Destination folder",
    credentialPlaceholder: "/Finance/Exports",
    supportsSchedule: true,
    supportsShareLink: true,
    latency: 1100,
  },
  {
    id: "onedrive",
    name: "OneDrive",
    blurb: "Store alongside the rest of your Microsoft 365 files.",
    accent: "bg-sky-600",
    credentialLabel: "Destination folder",
    credentialPlaceholder: "/Documents/Expenses",
    supportsSchedule: true,
    supportsShareLink: true,
    latency: 1250,
  },
  {
    id: "slack",
    name: "Slack",
    blurb: "Post the summary straight into a channel.",
    accent: "bg-violet-500",
    credentialLabel: "Channel",
    credentialPlaceholder: "#finance",
    supportsSchedule: true,
    supportsShareLink: false,
    latency: 700,
  },
  {
    id: "download",
    name: "This device",
    blurb: "No connection needed. Downloads straight to your machine.",
    accent: "bg-slate-600",
    credentialLabel: "",
    credentialPlaceholder: "",
    supportsSchedule: false,
    supportsShareLink: true,
    latency: 300,
  },
];

export function getDestination(id: DestinationId): DestinationDescriptor {
  const destination = DESTINATIONS.find((d) => d.id === id);
  if (!destination) throw new Error(`Unknown destination: ${id}`);
  return destination;
}

/** "This device" is always available; everything else needs a connection. */
export function requiresConnection(id: DestinationId): boolean {
  return id !== "download";
}
