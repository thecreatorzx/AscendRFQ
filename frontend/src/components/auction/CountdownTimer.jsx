import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, AlertTriangle } from "lucide-react";
import { clsx } from "clsx";
import {
  formatCountdown,
  isInExtensionWindow,
} from "../../utils/timeHelper";

export function CountdownTimer({
  currentEndTime,
  forcedCloseTime,
  extensionWindow = 10,
  status,
  size = "sm", // "sm" | "lg"
}) {
  const [ms, setMs]           = useState(0);
  const [inWindow, setInWindow] = useState(false);
  const [forced, setForced]   = useState(false);

  useEffect(() => {
if (status === "CLOSED" || status === "FORCE_CLOSED") {
    setMs(0);
    return;
  }
    const tick = () => {
  const remaining = new Date(currentEndTime) - Date.now();
  setMs(Math.max(0, remaining));
  setInWindow(isInExtensionWindow(currentEndTime, extensionWindow));
  const forcedMs = new Date(forcedCloseTime) - Date.now();
  setForced(forcedMs > 0 && forcedMs < 5 * 60_000);
};


    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [currentEndTime, forcedCloseTime, extensionWindow, status]);

  const closed  = status === "CLOSED" || status === "FORCE_CLOSED";
  const expired = ms === 0 && !closed;

  if (closed) {
    return (
      <span
        className={clsx(
          "inline-flex items-center gap-1 font-mono text-ink-4",
          size === "lg" ? "text-sm" : "text-2xs"
        )}
      >
        <Clock size={size === "lg" ? 13 : 10} />
        Closed
      </span>
    );
  }

  const isUrgent = ms > 0 && ms < 60_000;          // < 1 min
  const isWarn   = inWindow && !isUrgent;

  return (
    <div className="flex items-center gap-1.5">
      {/* Pulsing dot */}
      {(isUrgent || isWarn) && (
        <span
          className={clsx(
            "w-1.5 h-1.5 rounded-full shrink-0",
            isUrgent ? "bg-close animate-pulse" : "bg-warn animate-pulse-slow"
          )}
        />
      )}

      <AnimatePresence mode="wait">
        <motion.span
          key={formatCountdown(ms)}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{    opacity: 0, y:  4 }}
          transition={{ duration: 0.15 }}
          className={clsx(
            "font-mono font-medium tabular-nums",
            size === "lg" ? "text-2xl tracking-tight" : "text-xs",
            isUrgent          && "text-close",
            isWarn            && "text-warn",
            !isUrgent && !isWarn && "text-ink"
          )}
        >
          {expired ? "00:00" : formatCountdown(ms)}
        </motion.span>
      </AnimatePresence>

      {/* Extension window label — only on large size */}
      {size === "lg" && isWarn && (
        <motion.span
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xs text-warn bg-warn-light border border-warn/20 px-1.5 py-0.5 rounded"
        >
          Extension window
        </motion.span>
      )}

      {/* Forced close approaching */}
      {size === "lg" && forced && (
        <span className="flex items-center gap-1 text-2xs text-close">
          <AlertTriangle size={10} />
          Force-close reached
        </span>
      )}
    </div>
  );
}