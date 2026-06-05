import exifr from "exifr";

export type PhotoDateResult =
  | { ok: true; source: "exif" | "lastModified" }
  | { ok: false; reason: "old_exif" | "old_file" | "no_metadata" };

const FRESH_CAPTURE_MS = 60 * 60 * 1000; // 1 hour fallback window when EXIF is missing

function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Verifies that the file was captured today.
 *
 * Logic:
 *  1. Try EXIF `DateTimeOriginal` (the moment the shutter was pressed).
 *     - Present → must fall on today's local date.
 *  2. No EXIF (videos, stripped images) → accept only if the file's
 *     `lastModified` is today **and** within the last hour (i.e. a fresh
 *     camera capture, not a re-picked gallery file).
 */
export async function verifyTakenToday(file: File): Promise<PhotoDateResult> {
  const now = new Date();

  if (file.type.startsWith("image/")) {
    try {
      const tags = await exifr.parse(file, ["DateTimeOriginal", "CreateDate", "DateTime"]);
      const taken: Date | undefined =
        tags?.DateTimeOriginal || tags?.CreateDate || tags?.DateTime;
      if (taken instanceof Date && !isNaN(taken.getTime())) {
        return isSameLocalDay(taken, now)
          ? { ok: true, source: "exif" }
          : { ok: false, reason: "old_exif" };
      }
    } catch {
      // ignore — fall through to lastModified heuristic
    }
  }

  const modified = new Date(file.lastModified);
  if (!isSameLocalDay(modified, now)) {
    return { ok: false, reason: "old_file" };
  }
  if (now.getTime() - modified.getTime() > FRESH_CAPTURE_MS) {
    return { ok: false, reason: "no_metadata" };
  }
  return { ok: true, source: "lastModified" };
}
