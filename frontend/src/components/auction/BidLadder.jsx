import { useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TrendingDown, Users } from "lucide-react";
import { BidRow } from "./BidRow";
import { clsx } from "clsx";

/**
 * Live-updating ranked list of all bids.
 * Props:
 *   bids         — array sorted by rank asc
 *   prevRanks    — Map<bidId, prevRank>  (tracked by parent)
 *   newBidIds    — Set<bidId>            (flash new ones)
 *   currentUserId — string              (highlight own bids)
 *   initialPrice  — number
 *   loading       — bool
 */
export function BidLadder({
  bids = [],
  prevRanks = new Map(),
  newBidIds = new Set(),
  currentUserId,
  initialPrice,
  loading = false,
}) {
  const topRef = useRef(null);

  // Scroll to top when a new bid arrives
  useEffect(() => {
    if (newBidIds.size > 0) {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [newBidIds.size]);

  return (
    <div className="bg-white border border-surface-3 rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-surface-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TrendingDown size={12} className="text-bid" />
          <span className="text-xs font-medium text-ink">Bid ladder</span>
        </div>
        <span className="text-2xs text-ink-4">
          {bids.length} {bids.length === 1 ? "bid" : "bids"}
        </span>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[40px_1fr_110px_80px_60px] gap-3 px-4 py-1.5 bg-surface-1 border-b border-surface-2">
        {["Rank", "Supplier", "Amount", "Savings", "Time"].map((h) => (
          <span key={h} className="text-2xs text-ink-4 font-medium">{h}</span>
        ))}
      </div>

      {/* Rows */}
      <div ref={topRef} className="flex-1 overflow-y-auto max-h-105">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span className="w-5 h-5 border-2 border-surface-3 border-t-ink/40 rounded-full animate-spin" />
          </div>
        ) : bids.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Users size={18} className="text-ink-4" />
            <p className="text-xs text-ink-4">No bids yet</p>
            <p className="text-2xs text-ink-4">Waiting for suppliers to place bids</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {bids.map((bid) => (
              <BidRow
                key={bid.id}
                bid={bid}
                prevRank={prevRanks.get(bid.id) ?? null}
                isNew={newBidIds.has(bid.id)}
                isOwn={bid.supplierId === currentUserId}
                initialPrice={initialPrice}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}