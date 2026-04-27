import { motion } from "framer-motion";
import { clsx } from "clsx";
import { RankIndicator } from "./RankIndicator";
import { formatINR } from "../../utils/currency";
import { formatTime } from "../../utils/timeHelper";

/**
 * A single row in the bid ladder.
 * Props:
 *   bid        — { id, supplierId, supplierName, bidAmount, rank, createdAt }
 *   prevRank   — number | null  (for delta animation)
 *   isOwn      — bool (highlight if it's the logged-in supplier's bid)
 *   isNew      — bool (flash animation on first render)
 *   initialPrice — number (to compute savings %)
 */
export function BidRow({ bid, prevRank = null, isOwn = false, isNew = false, initialPrice }) {
  const savings = initialPrice
  ? Math.round(((initialPrice - bid.bidAmount) / initialPrice) * 100)
  : null;

  return (
    <motion.div
      layout
      layoutId={bid.id}
      initial={isNew ? { opacity: 0, x: -12, backgroundColor: "#e1f5ee" } : { opacity: 1 }}
      animate={{ opacity: 1, x: 0, backgroundColor: "transparent" }}
      transition={{ layout: { type: "spring", stiffness: 400, damping: 35 }, duration: 0.4 }}
      className={clsx(
        "grid grid-cols-[40px_1fr_110px_80px_60px] gap-3 px-4 py-2.5 items-center",
        "border-b border-surface-2 last:border-0 transition-colors",
        isOwn   && "bg-bid-light/40",
        !isOwn  && "hover:bg-surface-1"
      )}
    >
      {/* Rank */}
      <RankIndicator rank={bid.rank} prevRank={prevRank} size="sm" />

      {/* Supplier name */}
      <div className="min-w-0">
        <p className={clsx(
          "text-xs font-medium truncate",
          isOwn ? "text-bid" : "text-ink"
        )}>
          {bid.supplierName || `Supplier ${bid.supplierId?.slice(-4)}`}
          {isOwn && (
            <span className="ml-1.5 text-2xs text-bid/70 font-normal">(you)</span>
          )}
        </p>
        {bid.carrierName && (
          <p className="text-2xs text-ink-4 truncate">{bid.carrierName}</p>
        )}
      </div>

      {/* Bid amount */}
      <p className={clsx(
        "text-xs font-mono font-semibold tabular-nums",
        bid.rank === 1 ? "text-bid" : "text-ink"
      )}>
        {formatINR(bid.bidAmount)}
      </p>

      {/* Savings */}
      <p className={clsx(
        "text-2xs font-mono tabular-nums",
        savings > 0 ? "text-bid/80" : "text-ink-4"
      )}>
        {savings != null ? `−${savings}%` : "—"}
      </p>

      {/* Time */}
      <p className="text-2xs text-ink-4 font-mono">
        {formatTime(bid.createdAt)}
      </p>
    </motion.div>
  );
}