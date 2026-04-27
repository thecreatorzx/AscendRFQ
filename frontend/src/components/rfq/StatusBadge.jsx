import { motion, AnimatePresence } from "framer-motion";
import { Activity, FileText, Archive, AlertTriangle, Clock } from "lucide-react";
import { clsx } from "clsx";

const CONFIG = {
  ACTIVE: {
    icon:  <Activity size={11} />,
    label: "Active",
    class: "bg-bid-light text-bid border-bid/20",
    pulse: true,
  },
  DRAFT: {
    icon:  <FileText size={11} />,
    label: "Draft",
    class: "bg-draft-light text-draft border-draft/20",
    pulse: false,
  },
  CLOSED: {
    icon:  <Archive size={11} />,
    label: "Closed",
    class: "bg-surface-2 text-ink-3 border-surface-3",
    pulse: false,
  },
  FORCE_CLOSED: {
    icon:  <AlertTriangle size={11} />,
    label: "Force closed",
    class: "bg-close-light text-close border-close/20",
    pulse: false,
  },
};

/**
 * Richer status badge with icon + live pulse dot for ACTIVE.
 * Props:
 *   status — "ACTIVE" | "DRAFT" | "CLOSED" | "FORCE_CLOSED"
 *   size   — "sm" | "md"
 */
export function StatusBadge({ status, size = "sm" }) {
  const cfg = CONFIG[status] || {
    icon:  <Clock size={11} />,
    label: status,
    class: "bg-surface-2 text-ink-3 border-surface-3",
    pulse: false,
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 border rounded-full font-medium",
        size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-2xs",
        cfg.class
      )}
    >
      {cfg.pulse && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bid opacity-60" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-bid" />
        </span>
      )}
      {cfg.icon}
      {cfg.label}
    </span>
  );
}