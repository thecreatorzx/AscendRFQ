// Format ms remaining into mm:ss or hh:mm:ss
export function formatCountdown(ms) {
  if (ms <= 0) return "00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

// True if currentEndTime is within extensionWindow minutes
export function isInExtensionWindow(currentEndTime, extensionWindow) {
  const msRemaining = new Date(currentEndTime) - Date.now();
  const windowMs = extensionWindow * 60 * 1000;
  return msRemaining > 0 && msRemaining <= windowMs;
}

// True if past forcedCloseTime
export function isForcedClosed(forcedCloseTime) {
  return Date.now() >= new Date(forcedCloseTime);
}

export function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
