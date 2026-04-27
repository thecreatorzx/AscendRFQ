import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Package } from "lucide-react";
import { formatINR } from "../../utils/currency";
import { formatDateTime } from "../../utils/timeHelper";
import { clsx } from "clsx";

/**
 * Expandable breakdown of a single bid's cost components.
 * Props:
 *   bid — full bid object with freight/origin/destination charges
 *   defaultOpen — bool
 */
export function QuoteBreakdown({ bid, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  if (!bid) return null;

  const lines = [
    { label: "Freight charges",     value: bid.freightCharges,     color: "text-ink" },
    { label: "Origin charges",      value: bid.originCharges,      color: "text-ink" },
    { label: "Destination charges", value: bid.destinationCharges, color: "text-ink" },
  ].filter((l) => l.value != null);

  const hasBreakdown = lines.length > 0;

  return (
    <div className="bg-white border border-surface-3 rounded-lg overflow-hidden">
      {/* Header / toggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={!hasBreakdown}
        className={clsx(
          "w-full flex items-center justify-between px-4 py-3 text-left transition-colors bg-white",
          hasBreakdown ? "hover:bg-surface-1 cursor-pointer" : "cursor-default"
        )}
      >
        <div className="flex items-center gap-2">
          <Package size={12} className="text-ink-4" />
          <span className="text-xs font-medium text-ink">Quote breakdown</span>
          {bid.carrierName && (
            <span className="text-2xs text-ink-4 bg-surface-2 px-1.5 py-0.5 rounded">
              {bid.carrierName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-semibold text-bid">
            {formatINR(bid.bidAmount)}
          </span>
          {hasBreakdown && (
            <motion.span
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-ink-4"
            >
              <ChevronDown size={13} />
            </motion.span>
          )}
        </div>
      </button>

      {/* Expandable detail */}
      <AnimatePresence initial={false}>
        {open && hasBreakdown && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{    height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-surface-2 divide-y divide-surface-2">
              {lines.map(({ label, value, color }) => (
                <div
                  key={label}
                  className="flex items-center justify-between px-4 py-2"
                >
                  <span className="text-2xs text-ink-4">{label}</span>
                  <span className={clsx("text-xs font-mono tabular-nums", color)}>
                    {formatINR(value)}
                  </span>
                </div>
              ))}

              {/* Total check row */}
              <div className="flex items-center justify-between px-4 py-2 bg-surface-1">
                <span className="text-2xs font-medium text-ink-3">Total bid</span>
                <span className="text-xs font-mono font-semibold text-ink">
                  {formatINR(bid.bidAmount)}
                </span>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-0 divide-x divide-surface-2">
                {bid.transitTime != null && (
                  <div className="px-4 py-2">
                    <p className="text-2xs text-ink-4">Transit time</p>
                    <p className="text-xs font-medium text-ink mt-0.5">
                      {bid.transitTime} {bid.transitTime === 1 ? "day" : "days"}
                    </p>
                  </div>
                )}
                {bid.validityDate && (
                  <div className="px-4 py-2">
                    <p className="text-2xs text-ink-4">Valid until</p>
                    <p className="text-xs font-medium text-ink mt-0.5">
                      {formatDateTime(bid.validityDate)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}