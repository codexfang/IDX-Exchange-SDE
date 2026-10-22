/**
 * L_Photos is a longtext column that holds a JSON array of image URLs.
 * Not every row is well formed:
 *   - 211 rows contain an empty string instead of "[]"
 *   - some rows contain null
 *   - the array can hold non-string entries
 * This helper never throws and always returns a usable array of URLs.
 */
export function parsePhotos(raw) {
  if (raw === null || raw === undefined) return [];

  if (Array.isArray(raw)) {
    return raw.filter((entry) => typeof entry === "string" && entry.trim() !== "");
  }

  if (typeof raw !== "string") return [];

  const trimmed = raw.trim();
  if (trimmed === "") return [];

  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  return parsed.filter(
    (entry) => typeof entry === "string" && entry.trim() !== ""
  );
}

export function firstPhoto(raw) {
  const photos = parsePhotos(raw);
  return photos.length > 0 ? photos[0] : null;
}
