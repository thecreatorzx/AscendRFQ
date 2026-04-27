import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { clsx } from "clsx";

/**
 * Shows rank badge (L1, L2…) with animated position-change delta.
 * Props:
 *   rank      — number  (1 = L1, best)
 *   prevRank  — number | null
 *   size      — "sm" | "lg"
 *   flash     — bool  (brief green/red flash on change)
 */
export function RankIndicator({ rank, prevRank = null, size = "sm", flash = false }) {
  const isL1    = rank === 1;
  const isTop3  = rank <= 3;

  // positive = moved up (rank number went down), negative = dropped
  const delta = prevRank != null && prevRank !== rank
    ? prevRank - rank
    : null;

  const flashRef  = useRef(false);
  useEffect(() => {
    if (delta !== null) flashRef.current = true;
  }, [delta]);

  const rankColors = {
    1: "bg-bid text-white shadow-sm shadow-bid/30",
    2: "bg-surface-2 text-ink-3 border border-surface-3",
    3: "bg-surface-2 text-ink-3 border border-surface-3",
  };

  const sizeClass = size === "lg"
    ? "w-10 h-10 text-sm rounded-lg"
    : "w-6  h-6  text-2xs rounded";

  return (
    <div className="flex items-center gap-1">
      {/* Rank badge */}
      <AnimatePresence mode="wait">
        <motion.span
          key={rank}
          initial={flash ? { scale: 1.3, opacity: 0.6 } : { scale: 1 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={clsx(
            "inline-flex items-center justify-center font-mono font-semibold shrink-0",
            sizeClass,
            rankColors[rank] || "bg-surface-2 text-ink-4 border border-surface-3"
          )}
        >
          L{rank}
        </motion.span>
      </AnimatePresence>

      {/* Delta indicator */}
      <AnimatePresence>
        {delta !== null && (
          <motion.span
            initial={{ opacity: 0, x: -4, scale: 0.8 }}
            animate={{ opacity: 1, x: 0,  scale: 1   }}
            exit={{    opacity: 0,         scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className={clsx(
              "flex items-center gap-0.5 font-medium",
              size === "lg" ? "text-xs" : "text-2xs",
              delta > 0 ? "text-bid" : "text-close"
            )}
          >
            {delta > 0
              ? <TrendingUp  size={size === "lg" ? 11 : 9} />
              : <TrendingDown size={size === "lg" ? 11 : 9} />
            }
            <span>{Math.abs(delta)}</span>
          </motion.span>
        )}

        {/* No change marker — only show on lg */}
        {delta === null && prevRank != null && size === "lg" && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-ink-4"
          >
            <Minus size={11} />
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}