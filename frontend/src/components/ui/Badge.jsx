import { clsx } from "clsx";

const styles = {
  ACTIVE:       "bg-bid-light    text-bid      border-bid/20",
  DRAFT:        "bg-draft-light  text-draft    border-draft/20",
  CLOSED:       "bg-surface-2    text-ink-3    border-surface-3",
  FORCE_CLOSED: "bg-close-light  text-close    border-close/20",
  INVITED:      "bg-warn-light   text-warn     border-warn/20",
  ACCEPTED:     "bg-bid-light    text-bid      border-bid/20",
  REJECTED:     "bg-close-light  text-close    border-close/20",
  // Extension trigger types
  BID_RECEIVED:    "bg-bid-light   text-bid   border-bid/20",
  ANY_RANK_CHANGE: "bg-warn-light  text-warn  border-warn/20",
  L1_CHANGE:       "bg-draft-light text-draft border-draft/20",
};

const labels = {
  ACTIVE:          "Active",
  DRAFT:           "Draft",
  CLOSED:          "Closed",
  FORCE_CLOSED:    "Force closed",
  INVITED:         "Invited",
  ACCEPTED:        "Accepted",
  REJECTED:        "Rejected",
  BID_RECEIVED:    "Bid received",
  ANY_RANK_CHANGE: "Any rank change",
  L1_CHANGE:       "L1 change",
};

export function Badge({ status, children, className }) {
  const key = status || children;
  return (
    <span
      className={clsx(
        "inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-medium border",
        styles[key] || "bg-surface-2 text-ink-3 border-surface-3",
        className
      )}
    >
      {labels[key] || children || status}
    </span>
  );
}