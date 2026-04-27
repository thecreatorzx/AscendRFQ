import { motion } from "framer-motion";
import {
  TrendingDown, Clock, Calendar,
  Users, Zap, AlertTriangle, ChevronLeft,
} from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { CountdownTimer } from "../auction/CountdownTimer";
import { formatINR, formatCompact } from "../../utils/currency";
import { formatDateTime } from "../../utils/timeHelper";
import { clsx } from "clsx";

/**
 * Sticky header for AuctionDetailPage.
 * Props:
 *   rfq          — full rfq object
 *   supplierCount — number
 *   bidCount      — number
 *   isBuyer       — bool
 *   onActivate    — fn
 *   onClose       — fn
 *   onForceClose  — fn
 *   onBack        — fn
 *   actionLoading — bool
 */
export function RFQHeader({
  rfq,
  supplierCount = 0,
  bidCount = 0,
  isBuyer,
  onActivate,
  onClose,
  onForceClose,
  onBack,
  actionLoading = false,
}) {
  if (!rfq) return null;

  const config   = rfq.auctionConfig || {};
  const isActive = rfq.status === "ACTIVE";
  const isDraft  = rfq.status === "DRAFT";
  const isClosed = rfq.status === "CLOSED" || rfq.status === "FORCE_CLOSED";

  const savings =
    rfq.lowestBid && rfq.initialPrice
      ? Math.round(((rfq.initialPrice - rfq.lowestBid) / rfq.initialPrice) * 100)
      : null;

  return (
    <div className="bg-white border-b border-surface-2 sticky top-10 z-20">
      {/* Main header row */}
      <div className="px-6 py-3 flex items-center gap-4">
        {/* Back */}
        <button
          onClick={onBack}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-2 text-ink-4 hover:text-ink transition-colors shrink-0"
        >
          <ChevronLeft size={14} />
        </button>

        {/* Title + badge */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-sm font-medium text-ink truncate">{rfq.name}</h1>
            <Badge status={rfq.status} />
            {config.extensionEnabled && (
              <span className="inline-flex items-center gap-0.5 text-2xs text-warn bg-warn-light px-1.5 py-0.5 rounded border border-warn/20">
                <Zap size={9} />
                Auto-ext
              </span>
            )}
          </div>
          <p className="text-2xs text-ink-4 font-mono mt-0.5">
            #{rfq.id?.slice(-10).toUpperCase()}
          </p>
        </div>

        {/* Live timer */}
        {isActive && (
          <div className="shrink-0">
            <p className="text-2xs text-ink-4 mb-0.5 text-right">Closes in</p>
            <CountdownTimer
              currentEndTime={rfq.currentEndTime}
              forcedCloseTime={rfq.forcedCloseTime}
              extensionWindow={config.extensionWindow}
              status={rfq.status}
              size="lg"
            />
          </div>
        )}

        {/* Buyer action buttons */}
        {isBuyer && (
          <div className="flex items-center gap-2 shrink-0">
            {isDraft && (
              <Button
                size="sm"
                variant="success"
                loading={actionLoading}
                onClick={onActivate}
                icon={<TrendingDown size={11} />}
              >
                Activate
              </Button>
            )}
            {isActive && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  loading={actionLoading}
                  onClick={onClose}
                >
                  Close auction
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  loading={actionLoading}
                  onClick={onForceClose}
                  icon={<AlertTriangle size={11} />}
                >
                  Force close
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Stats strip */}
      <div className="px-6 py-2 border-t border-surface-2 bg-surface-1 flex items-center gap-6 overflow-x-auto">
        {[
          {
            label: "Starting price",
            value: formatINR(rfq.initialPrice),
            mono: true,
          },
          {
            label: "Current L1",
            value: rfq.lowestBid ? formatINR(rfq.lowestBid) : "—",
            mono: true,
            accent: rfq.lowestBid ? "text-bid" : "text-ink-4",
          },
          savings != null && {
            label: "Savings",
            value: `${savings}%`,
            accent: "text-bid",
            mono: true,
          },
          {
            label: "Suppliers",
            value: supplierCount,
            icon: <Users size={10} />,
          },
          {
            label: "Bids",
            value: bidCount,
            icon: <TrendingDown size={10} />,
          },
          {
            label: "Forced close",
            value: formatDateTime(rfq.forcedCloseTime),
            icon: <AlertTriangle size={10} className="text-close" />,
          },
          config.extensionEnabled && {
            label: "Extension",
            value: `${config.extensionWindow}m window · +${config.extensionDuration}m`,
            icon: <Zap size={10} className="text-warn" />,
          },
        ]
          .filter(Boolean)
          .map((s) => (
            <div key={s.label} className="shrink-0">
              <p className="text-2xs text-ink-4 flex items-center gap-1">
                {s.icon}
                {s.label}
              </p>
              <p
                className={clsx(
                  "text-xs font-medium mt-0.5",
                  s.mono && "font-mono tabular-nums",
                  s.accent || "text-ink"
                )}
              >
                {s.value}
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}