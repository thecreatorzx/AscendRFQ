import { AnimatePresence, motion } from "framer-motion";
import {
  TrendingDown, Clock, AlertTriangle,
  UserCheck, Lock, Zap,
} from "lucide-react";
import { formatTime } from "../../utils/timeHelper";
import { formatCompact } from "../../utils/currency";
import { clsx } from "clsx";

const EVENT_CONFIG = {
  BID_SUBMITTED: {
    icon: <TrendingDown size={11} />,
    color: "text-bid",
    bg:    "bg-bid-light",
    label: (e) =>
      `${e.supplierName || "Supplier"} bid ${formatCompact(e.bidAmount)}${e.rank ? ` · L${e.rank}` : ""}`,
  },
  AUCTION_EXTENDED: {
    icon: <Zap size={11} />,
    color: "text-warn",
    bg:    "bg-warn-light",
    label: (e) =>
      `Extended +${e.extensionDuration ?? "?"}m · ${e.reason || "bid received"}`,
  },
  AUCTION_ACTIVATED: {
    icon: <Clock size={11} />,
    color: "text-draft",
    bg:    "bg-draft-light",
    label: () => "Auction activated — bidding open",
  },
  AUCTION_CLOSED: {
    icon: <Lock size={11} />,
    color: "text-ink-3",
    bg:    "bg-surface-2",
    label: () => "Auction closed",
  },
  AUCTION_FORCE_CLOSED: {
    icon: <AlertTriangle size={11} />,
    color: "text-close",
    bg:    "bg-close-light",
    label: () => "Force-closed at hard deadline",
  },
  SUPPLIER_INVITED: {
    icon: <UserCheck size={11} />,
    color: "text-ink-3",
    bg:    "bg-surface-2",
    label: (e) => `${e.supplierName || "Supplier"} invited`,
  },
  SUPPLIER_ACCEPTED: {
    icon: <UserCheck size={11} />,
    color: "text-bid",
    bg:    "bg-bid-light",
    label: (e) => `${e.supplierName || "Supplier"} accepted invite`,
  },
};

function ActivityItem({ event, isNew }) {
  const config = EVENT_CONFIG[event.type] || {
    icon: <Clock size={11} />,
    color: "text-ink-4",
    bg: "bg-surface-2",
    label: (e) => e.type,
  };

  return (
    <motion.div
      layout
      initial={isNew ? { opacity: 0, y: -8 } : { opacity: 1 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex items-start gap-2.5 px-4 py-2.5 border-b border-surface-2 last:border-0"
    >
      {/* Icon dot */}
      <span
        className={clsx(
          "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
          config.bg, config.color
        )}
      >
        {config.icon}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-ink leading-snug">
          {config.label(event)}
        </p>
        {event.metadata && (
          <p className="text-2xs text-ink-4 mt-0.5 truncate">{event.metadata}</p>
        )}
      </div>

      {/* Time */}
      <span className="text-2xs text-ink-4 font-mono shrink-0 mt-0.5">
        {formatTime(event.createdAt || event.timestamp)}
      </span>
    </motion.div>
  );
}

export function ActivityFeed({ events = [], newEventIds = new Set(), maxHeight = 360 }) {
  return (
    <div className="bg-white border border-surface-3 rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-surface-2 flex items-center justify-between">
        <span className="text-xs font-medium text-ink">Activity</span>
        <span className="text-2xs text-ink-4">{events.length} events</span>
      </div>

      <div
        className="overflow-y-auto flex flex-col"
        style={{ maxHeight }}
      >
        {events.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-xs text-ink-4">No activity yet</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {events.map((e) => (
              <ActivityItem
                key={e.id || e.createdAt}
                event={e}
                isNew={newEventIds.has(e.id)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}