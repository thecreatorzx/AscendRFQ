import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  TrendingDown, Users, Calendar,
  Clock, ChevronRight, Zap, Mail,
} from "lucide-react";
import { Badge } from "../ui/Badge";
import { CountdownTimer } from "../auction/CountdownTimer";
import { formatINR, formatCompact } from "../../utils/currency";
import { formatDateTime } from "../../utils/timeHelper";
import { clsx } from "clsx";

export function RFQCard({ rfq, index = 0, myInviteStatus }) {
  const navigate = useNavigate();

  const {
    id, name, status,
    currentEndTime, forcedCloseTime, startTime,
    initialPrice,
    auctionConfig,
    _count,
    lowestBid,
  } = rfq;

  const config     = auctionConfig || {};
  const bidCount   = _count?.bids ?? 0;
  const supplierCount = _count?.suppliers ?? 0;
  const savings = rfq.lowestBid && rfq.initialPrice && rfq.initialPrice > 0
  ? Math.round(((rfq.initialPrice - rfq.lowestBid) / rfq.initialPrice) * 100)
  : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      onClick={() => navigate(`/rfqs/${id}`)}
      className={clsx(
        "bg-white border border-surface-3 rounded-lg p-4 cursor-pointer",
        "hover:border-ink/20 hover:shadow-sm transition-all duration-150",
        "flex flex-col gap-3"
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <Badge status={status} />
            {config.extensionEnabled && (
              <span className="inline-flex items-center gap-0.5 text-2xs text-warn bg-warn-light px-1.5 py-0.5 rounded border border-warn/20">
                <Zap size={9} />
                Auto-ext
              </span>
            )}
            {myInviteStatus === "INVITED" && (
              <span className="inline-flex items-center gap-0.5 text-2xs text-warn bg-warn-light px-1.5 py-0.5 rounded border border-warn/20">
                <Mail size={9} />
                Invited
              </span>
            )}
            {myInviteStatus === "ACCEPTED" && (
              <span className="inline-flex items-center gap-0.5 text-2xs text-bid bg-bid-light px-1.5 py-0.5 rounded border border-bid/20">
                <Mail size={9} />
                Accepted
              </span>
            )}
            {myInviteStatus === "REJECTED" && (
              <span className="inline-flex items-center gap-0.5 text-2xs text-close bg-close-light px-1.5 py-0.5 rounded border border-close/20">
                <Mail size={9} />
                Declined
              </span>
            )}
          </div>
          <h3 className="text-sm font-medium text-ink truncate leading-tight">
            {name}
          </h3>
          <p className="text-2xs text-ink-4 mt-0.5 font-mono">
            #{id.slice(-8).toUpperCase()}
          </p>
        </div>
        <ChevronRight size={13} className="text-ink-4 shrink-0 mt-1" />
      </div>

      {/* Price row */}
      <div className="flex items-end gap-4">
        <div>
          <p className="text-2xs text-ink-4 mb-0.5">Starting price</p>
          <p className="text-xs font-medium text-ink font-mono">
            {formatINR(initialPrice)}
          </p>
        </div>
        {lowestBid != null && (
          <>
            <div className="flex-1 flex items-center justify-center">
              <TrendingDown size={11} className="text-bid" />
            </div>
            <div className="text-right">
              <p className="text-2xs text-ink-4 mb-0.5">Current L1</p>
              <p className="text-xs font-medium text-bid font-mono">
                {formatINR(lowestBid)}
              </p>
              <p className="text-2xs text-bid/70">
                {savings != null ? `−${savings}%` : "—"} saved
              </p>
            </div>
          </>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-surface-2" />

      {/* Bottom row */}
      <div className="flex items-center justify-between">
        {/* Meta */}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-2xs text-ink-4">
            <Users size={10} />
            {supplierCount}
          </span>
          <span className="flex items-center gap-1 text-2xs text-ink-4">
            <TrendingDown size={10} />
            {bidCount} {bidCount === 1 ? "bid" : "bids"}
          </span>
          {config.extensionEnabled && (
            <span className="text-2xs text-ink-4">
              +{config.extensionDuration}m ext
            </span>
          )}
        </div>

        {/* Timer or date */}
        {status === "ACTIVE" ? (
          <CountdownTimer
            currentEndTime={currentEndTime}
            forcedCloseTime={forcedCloseTime}
            extensionWindow={config.extensionWindow}
            status={status}
            size="sm"
          />
        ) : (
          <span className="flex items-center gap-1 text-2xs text-ink-4">
            <Calendar size={10} />
            {formatDateTime(startTime)}
          </span>
        )}
      </div>
    </motion.div>
  );
}