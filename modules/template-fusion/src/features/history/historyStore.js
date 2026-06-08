import { HISTORY_LIMIT, STORAGE_KEYS } from "../../config/constants.js";

export function readHistory() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.history);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function writeHistory(items) {
  window.localStorage.setItem(
    STORAGE_KEYS.history,
    JSON.stringify(items.slice(0, HISTORY_LIMIT))
  );
}
