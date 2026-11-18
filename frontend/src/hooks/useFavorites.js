import { useCallback, useMemo, useSyncExternalStore } from "react";

export const FAVORITES_STORAGE_KEY = "idx.favorites";

// The card fields worth keeping when a property is saved. Storing this small
// snapshot means the favorites view renders instantly and still works when a
// listing drops out of the current page of results.
const SAVED_FIELDS = [
  "L_ListingID",
  "L_DisplayId",
  "L_Address",
  "L_City",
  "L_State",
  "L_Zip",
  "L_SystemPrice",
  "L_Keyword2",
  "LM_Dec_3",
  "LM_Int2_3",
  "YearBuilt",
  "L_Status",
  "PhotoCount",
  "L_Photos",
];

const EMPTY = Object.freeze([]);

let snapshot = readSnapshot();
const listeners = new Set();

function getStorage() {
  try {
    return window.localStorage;
  } catch {
    // Private mode and disabled storage throw on access.
    return null;
  }
}

function normaliseEntry(entry) {
  if (!entry || typeof entry !== "object") return null;

  const property = entry.property;
  if (!property || typeof property !== "object") return null;

  const rawId = entry.id ?? property.L_ListingID ?? property.id;
  if (rawId === undefined || rawId === null || String(rawId).trim() === "") {
    return null;
  }

  return {
    id: String(rawId),
    savedAt: typeof entry.savedAt === "string" ? entry.savedAt : null,
    property,
  };
}

function readSnapshot() {
  const storage = getStorage();
  if (!storage) return EMPTY;

  let raw = null;
  try {
    raw = storage.getItem(FAVORITES_STORAGE_KEY);
  } catch {
    return EMPTY;
  }
  if (!raw) return EMPTY;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;

    const entries = parsed.map(normaliseEntry).filter(Boolean);
    return entries.length > 0 ? entries : EMPTY;
  } catch {
    // Hand edited or half written value: start clean rather than crash the app.
    return EMPTY;
  }
}

function notify() {
  listeners.forEach((listener) => listener());
}

function commit(next) {
  snapshot = next.length > 0 ? next : EMPTY;

  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Quota or disabled storage: the in-memory list still works for this visit.
    }
  }

  notify();
}

// Keeping every tab in step: another tab writing the key fires this event here.
function handleStorageEvent(event) {
  if (event.key !== null && event.key !== FAVORITES_STORAGE_KEY) return;
  snapshot = readSnapshot();
  notify();
}

function subscribe(listener) {
  listeners.add(listener);

  if (listeners.size === 1 && typeof window !== "undefined") {
    window.addEventListener("storage", handleStorageEvent);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorageEvent);
    }
  };
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return EMPTY;
}

function toSavedProperty(property) {
  const saved = {};
  for (const field of SAVED_FIELDS) {
    if (property[field] !== undefined) saved[field] = property[field];
  }
  return saved;
}

export function getFavorites() {
  return snapshot;
}

export function isFavorite(id) {
  if (id === undefined || id === null) return false;
  const key = String(id);
  return snapshot.some((entry) => entry.id === key);
}

export function toggleFavorite(property) {
  if (!property || typeof property !== "object") return;

  const listingId = property.L_ListingID ?? property.id;
  if (listingId === undefined || listingId === null) return;

  const key = String(listingId);

  if (snapshot.some((entry) => entry.id === key)) {
    commit(snapshot.filter((entry) => entry.id !== key));
    return;
  }

  commit([
    {
      id: key,
      savedAt: new Date().toISOString(),
      property: toSavedProperty(property),
    },
    ...snapshot,
  ]);
}

export function removeFavorite(id) {
  if (id === undefined || id === null) return;
  const key = String(id);
  if (!snapshot.some((entry) => entry.id === key)) return;
  commit(snapshot.filter((entry) => entry.id !== key));
}

export function clearFavorites() {
  commit([]);
}

export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ids = useMemo(
    () => new Set(favorites.map((entry) => entry.id)),
    [favorites]
  );

  const isSaved = useCallback((id) => ids.has(String(id)), [ids]);

  return {
    favorites,
    count: favorites.length,
    isFavorite: isSaved,
    toggleFavorite,
    removeFavorite,
    clearFavorites,
  };
}

export default useFavorites;
