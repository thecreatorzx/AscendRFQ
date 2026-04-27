import { AnimatePresence, motion } from "framer-motion";
import { Zap, X } from "lucide-react";
import { useState, useEffect } from "react";
import { clsx } from "clsx";

/**
 * Floating banner that appears when auction is extended.
 * Props:
 *   extension — { extensionDuration, reason, triggeredAt } | null
 *   onDismiss — fn
 */
export function ExtensionAlert({ extension, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!extension) return;
    setVisible(true);
    const id = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 6000);
    return () => clearTimeout(id);
  }, [extension?.triggeredAt, onDismiss]);

  const reasonLabel = {
    BID_RECEIVED:    "bid received",
    ANY_RANK_CHANGE: "rank change",
    L1_CHANGE:       "L1 change",
  }[extension?.reason] || "bid activity";

  return (
    <AnimatePresence>
      {visible && extension && (
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0,   scale: 1    }}
          exit={{    opacity: 0, y: -12,  scale: 0.96 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className={clsx(
            "fixed top-14 left-1/2 -translate-x-1/2 z-50",
            "flex items-center gap-2.5 px-4 py-2.5",
            "bg-warn-light border border-warn/30 rounded-xl shadow-md",
            "max-w-xs w-full"
          )}
        >
          {/* Pulsing icon */}
          <span className="w-6 h-6 rounded-full bg-warn/20 flex items-center justify-center shrink-0">
            <Zap size={12} className="text-warn animate-pulse" />
          </span>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-warn">
              +{extension.extensionDuration}m extension triggered
            </p>
            <p className="text-2xs text-warn/70 capitalize">{reasonLabel}</p>
          </div>

          <button
            onClick={() => { setVisible(false); onDismiss?.(); }}
            className="text-warn/50 hover:text-warn transition-colors shrink-0 cursor-pointer"
          >
            <X size={12} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}