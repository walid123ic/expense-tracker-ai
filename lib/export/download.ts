/**
 * Hand a Blob to the browser as a file download.
 *
 * The object URL is revoked on the next tick rather than immediately: Safari
 * aborts the download if the URL disappears in the same frame as the click.
 */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 0);
}
