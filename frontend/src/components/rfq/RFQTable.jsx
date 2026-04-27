import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronRight, TrendingDown } from "lucide-react";
import { Badge } from "../ui/Badge";
import { CountdownTimer } from "../auction/CountdownTimer";
import { formatINR, formatCompact } from "../../utils/currency";
import { formatDateTime } from "../../utils/timeHelper";
import { clsx } from "clsx";

/**
 * Full-width table view of RFQs — used in DashboardPage list mode.
 * Props:
 *   rfqs — array of RFQ objects
 *   inviteStatuses — object mapping RFQ IDs to invite statuses
 */
export function RFQTable({ rfqs = [], inviteStatuses = {} }) {
  const navigate = useNavigate();

  if (rfqs.length === 0) return null;

  return (
    <div className="bg-white border border-surface-3 rounded-lg overflow-hidden">
      {/* Header row */}
      <div className="grid grid-cols-[1fr_120px_110px_110px_100px_28px] gap-3 px-4 py-2 border-b border-surface-2 bg-surface-1">
        {["RFQ", "Status", "Ceiling", "L1 bid", "Closes / date", ""].map((h) => (
          <span key={h} className="text-2xs text-ink-4 font-medium">{h}</span>
        ))}
      </div>

      {/* Data rows */}
      {rfqs.map((rfq, i) => {
        const config  = rfq.auctionConfig || {};
        const savings = rfq.lowestBid && rfq.initialPrice
          ? Math.round(((rfq.initialPrice - rfq.lowestBid) / rfq.initialPrice) * 100)
          : null;

        return (
          <motion.div
            key={rfq.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.025 }}
            onClick={() => navigate(`/rfqs/${rfq.id}`)}
            className="grid grid-cols-[1fr_120px_110px_110px_100px_28px] gap-3 px-4 py-2.5
                       border-b border-surface-2 last:border-0
                       hover:bg-surface-1 cursor-pointer transition-colors items-center"
          >
            {/* Name + ID */}
            <div className="min-w-0">
              <p className="text-xs font-medium text-ink truncate">{rfq.name}</p>
              <p className="text-2xs text-ink-4 font-mono">
                #{rfq.id.slice(-8).toUpperCase()}
              </p>
            </div>

            {/* Status */}
            <div className="flex items-center gap-1 flex-wrap">
              <Badge status={rfq.status} />
              {inviteStatuses[rfq.id] && (
                <Badge status={inviteStatuses[rfq.id]} />
              )}
            </div>

            {/* Ceiling price */}
            <p className="text-xs font-mono text-ink tabular-nums">
              {formatCompact(rfq.initialPrice)}
            </p>

            {/* L1 bid */}
            <div>
              {rfq.lowestBid ? (
                <>
                  <p className="text-xs font-mono text-bid tabular-nums">
                    {formatCompact(rfq.lowestBid)}
                  </p>
                  {savings != null && (
                    <p className="text-2xs text-bid/70">−{savings}%</p>
                  )}
                </>
              ) : (
                <span className="text-xs text-ink-4">—</span>
              )}
            </div>

            {/* Timer or date */}
            <div>
              {rfq.status === "ACTIVE" ? (
                <CountdownTimer
                  currentEndTime={rfq.currentEndTime}
                  forcedCloseTime={rfq.forcedCloseTime}
                  extensionWindow={config.extensionWindow}
                  status={rfq.status}
                  size="sm"
                />
              ) : (
                <span className="text-2xs text-ink-4">
                  {formatDateTime(rfq.startTime)}
                </span>
              )}
            </div>

            {/* Arrow */}
            <ChevronRight size={12} className="text-ink-4" />
          </motion.div>
        );
      })}
    </div>
  );
}