import { useState, useCallback, useRef, useMemo , useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingDown, Send, ChevronDown, ChevronUp,
  Users, Lock, Zap, Info,
} from "lucide-react";

import { useAuth }           from "../context/AuthContext";
import { useRFQ }            from "../hooks/useRFQ";
import { useAuctionSocket }  from "../hooks/useAuctionSocket";
import { submitBid }         from "../api/bids";
import { inviteSuppliers, respondInvite, getAllSuppliers } from "../api/suppliers";

import { Layout }            from "../components/ui/Layout";
import { Button }            from "../components/ui/Button";
import { Input }             from "../components/ui/Input";
import { PageLoader }        from "../components/ui/Spinner";
import { Badge }             from "../components/ui/Badge";
import { useToast }          from "../components/ui/Toast";
import { useNotifications } from "../context/NotificationContext";


import { RFQHeader }         from "../components/rfq/RFQHeader";
import { BidLadder }         from "../components/auction/BidLadder";
import { ActivityFeed }      from "../components/auction/ActivityFeed";
import { ExtensionAlert }    from "../components/auction/ExtensionAlert";
import { QuoteBreakdown }    from "../components/auction/QuoteBreakdown";
import { CountdownTimer }    from "../components/auction/CountdownTimer";

import { formatINR }         from "../utils/currency";
import { clsx }              from "clsx";

export default function AuctionDetailPage() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const toast        = useToast();
  const { push: pushNotification } = useNotifications();
  const { user, isBuyer, isSupplier } = useAuth();

  const {
    rfq, bids, rankings, suppliers, activity,
    loading, error,
    refresh, activateRFQ, draftRFQ, closeAuction, forceClose,
  } = useRFQ(id);

  // Track prev ranks for delta animation
  const prevRanksRef = useRef(new Map());
  const [newBidIds,    setNewBidIds]    = useState(new Set());
  const [newEventIds,  setNewEventIds]  = useState(new Set());
  const [latestExt,    setLatestExt]    = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const displayBids = useMemo(() => {
  return rankings.length ? rankings : bids;
}, [rankings, bids]);

  const prevRanks = useMemo(() => {
    return new Map(displayBids.map((b) => [b.id, prevRanksRef.current.get(b.id) ?? b.rank]));
  }, [displayBids]);



  // ── WebSocket handlers ──────────────────────────────────
 const handleNewBid = useCallback((data) => {
  // Save current ranks before refresh (use displayBids — correct source of truth)
  displayBids.forEach((b) => {
    prevRanksRef.current.set(b.id, b.rank);
  });

  refresh(true);

  const incomingId = data.bid?.id || data.id;

  if (incomingId) {
    setNewBidIds((s) => {
      const next = new Set(s);
      next.add(incomingId);
      return next;
    });

    setTimeout(() => {
      setNewBidIds((s) => {
        const next = new Set(s);
        next.delete(incomingId);
        return next;
      });
    }, 3000);
  }

  const outbid = data.outbidSupplierId === user?.id;

  toast(
    outbid
      ? `You've been outbid! New L1: ${formatINR(data.bid?.bidAmount)}`
      : `New bid: ${formatINR(data.bid?.bidAmount)}`,
    outbid ? "outbid" : "info"
  );
  pushNotification(
  outbid
    ? `You've been outbid on ${rfq?.name} — New L1: ${formatINR(data.bid?.bidAmount)}`
    : `New bid on ${rfq?.name}: ${formatINR(data.bid?.bidAmount)}`,
  outbid ? "outbid" : "info"
);
}, [displayBids, refresh, toast, pushNotification]);

  const handleExtended = useCallback((data) => {
    refresh(true);
    setLatestExt({ ...data, triggeredAt: Date.now() });
    toast(`Auction extended +${data.extensionDuration}m`, "extension");
    pushNotification(`${rfq?.name} extended +${data.extensionDuration}m`, "extension");
    if (data.activityEvent?.id) {
      setNewEventIds((s) => new Set([...s, data.activityEvent.id]));
    }
  }, [refresh, toast, pushNotification]);

  const handleClosed = useCallback(() => {
    refresh(true);
    toast("Auction has closed", "info");
    pushNotification(`${rfq?.name} has closed`, "info");
  }, [refresh, toast, pushNotification]);

  useAuctionSocket(id, {
    onNewBid:   handleNewBid,
    onExtended: handleExtended,
    onClosed:   handleClosed,
  });

  // ── Buyer actions ────────────────────────────────────────
  const withLoading = (fn) => async () => {
    setActionLoading(true);
    try { await fn(); }
    catch (err) { toast(err.response?.data?.message || "Action failed", "error"); }
    finally { setActionLoading(false); }
  };

  if (loading) return <Layout><PageLoader /></Layout>;
  if (error || !rfq) return (
    <Layout>
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-ink-4">RFQ not found.</p>
      </div>
    </Layout>
  );

  const config = rfq.auctionConfig || {};

  return (
    <Layout>
      <ExtensionAlert
        extension={latestExt}
        onDismiss={() => setLatestExt(null)}
      />

      <RFQHeader
        rfq={rfq}
        supplierCount={suppliers.length}
        bidCount={bids.length}
        isBuyer={isBuyer}
        actionLoading={actionLoading}
        onBack={() => navigate("/")}
        onActivate={withLoading(activateRFQ)}
        onClose={withLoading(closeAuction)}
        onForceClose={withLoading(forceClose)}
      />

      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto flex flex-col gap-4">

          {/* ── Draft notice ── */}
          {rfq.status === "DRAFT" && isBuyer && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5 p-3 bg-draft-light border border-draft/20 rounded-lg"
            >
              <Info size={13} className="text-draft shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-draft">
                  This RFQ is in Draft
                </p>
                <p className="text-2xs text-draft/70 mt-0.5">
                  Invite suppliers below, then activate the auction to start accepting bids.
                </p>
              </div>
            </motion.div>
          )}

          {/* ── Main grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Left col — bid ladder + activity */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <BidLadder
                bids={displayBids}
                prevRanks={prevRanks}
                newBidIds={newBidIds}
                currentUserId={user?.id}
                initialPrice={rfq.initialPrice}
                loading={false}
              />

              {/* Buyer: quote breakdowns per supplier's latest bid */}
              {isBuyer && bids.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-ink">Quote details</p>
                  {rankings.slice(0, 5).map((bid) => (
                    <QuoteBreakdown key={bid.id} bid={bid} />
                  ))}
                </div>
              )}

              <ActivityFeed
                events={activity}
                newEventIds={newEventIds}
              />
            </div>

            {/* Right col */}
            <div className="flex flex-col gap-4">

              {/* Supplier: bid panel */}
              {isSupplier && (
                <SupplierBidPanel
                  rfq={rfq}
                  config={config}
                  userId={user?.id}
                  rankings={rankings}
                  bids={bids}
                  onBidPlaced={() => refresh(true)}
                />
              )}
              {isSupplier && (() => {
                const myInvite = suppliers.find(
                  (s) => (s.supplierId || s.id) === user?.id && s.status === "INVITED"
                );
                return myInvite ? (
                  <AcceptInviteBar
                    rfqId={id}
                    supplierId={myInvite.supplierId || myInvite.id}
                    onRefresh={() => refresh(true)}
                  />
                ) : null;
              })()}

              {/* Buyer: supplier management */}
              {isBuyer && (
                <SupplierPanel
                  rfqId={id}
                  suppliers={suppliers}
                  rfqStatus={rfq.status}
                  onRefresh={() => refresh(true)}
                />
              )}

              {/* Auction config card */}
              <AuctionConfigCard rfq={rfq} config={config} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// ── Supplier bid panel ────────────────────────────────────────
function SupplierBidPanel({ rfq, config, userId, rankings, bids, onBidPlaced }) {
  const toast = useToast();
  const isActive = rfq.status === "ACTIVE";

  const myLatestBid = rankings.find((b) => b.supplierId === userId);
  const l1          = rankings[0];
  const myRank      = myLatestBid?.rank;

  const suggestedBid = l1
    ? Math.max(0, l1.bidAmount - (config.minDecrement || 500))
    : rfq.initialPrice
      ? rfq.initialPrice - (config.minDecrement || 500)
      : "";


  const [form, setForm] = useState({
    bidAmount:           "",
    carrierName:         "",
    freightCharges:      "",
    originCharges:       "",
    destinationCharges:  "",
    transitTime:         "",
    validityDate:        "",
  });
  const [errors,     setErrors]     = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    const amt = Number(form.bidAmount);
    if (!form.bidAmount || isNaN(amt) || amt <= 0)
      e.bidAmount = "Enter a valid amount";
    if (rfq.initialPrice && amt >= rfq.initialPrice)
      e.bidAmount = `Must be below ${formatINR(rfq.initialPrice)}`;
    if (l1 && userId !== l1.supplierId && amt >= l1.bidAmount)
      e.bidAmount = `Must be below L1: ${formatINR(l1.bidAmount)}`;
    if (l1 && l1.bidAmount - amt < (config.minDecrement || 0) && amt < l1.bidAmount)
  e.bidAmount = `Min decrement: ${formatINR(config.minDecrement)}`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await submitBid(rfq.id, {
        bidAmount:          Number(form.bidAmount),
        carrierName:        form.carrierName || undefined,
        freightCharges:     form.freightCharges ? Number(form.freightCharges) : undefined,
        originCharges:      form.originCharges  ? Number(form.originCharges)  : undefined,
        destinationCharges: form.destinationCharges ? Number(form.destinationCharges) : undefined,
        transitTime:        form.transitTime ? Number(form.transitTime) : undefined,
        validityDate:       form.validityDate ? new Date(form.validityDate).toISOString() : undefined,
      });
      toast("Bid placed successfully!", "info");
      setForm({
        bidAmount: "", carrierName: "", freightCharges: "",
        originCharges: "", destinationCharges: "",
        transitTime: "", validityDate: "",
      });
      onBidPlaced?.();
    } catch (err) {
      toast(err.response?.data?.message || "Bid failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-surface-3 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-surface-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TrendingDown size={12} className="text-bid" />
          <span className="text-xs font-medium text-ink">Place bid</span>
        </div>
        {myRank && (
          <span className={clsx(
            "text-2xs font-medium px-1.5 py-0.5 rounded",
            myRank === 1 ? "bg-bid-light text-bid" : "bg-surface-2 text-ink-3"
          )}>
            Your rank: L{myRank}
          </span>
        )}
      </div>

      {!isActive ? (
        <div className="px-4 py-8 text-center">
          <Lock size={16} className="text-ink-4 mx-auto mb-2" />
          <p className="text-xs text-ink-4">
            {rfq.status === "DRAFT"
              ? "Auction hasn't started yet"
              : "Auction is closed"}
          </p>
        </div>
      ) : (
        <div className="p-4 flex flex-col gap-3">
          {/* Context */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-surface-1 rounded-md p-2.5">
              <p className="text-2xs text-ink-4">Ceiling price</p>
              <p className="text-xs font-mono font-medium text-ink mt-0.5">
                {formatINR(rfq.initialPrice)}
              </p>
            </div>
            <div className="bg-surface-1 rounded-md p-2.5">
              <p className="text-2xs text-ink-4">Current L1</p>
              <p className={clsx(
                "text-xs font-mono font-medium mt-0.5",
                l1 ? "text-bid" : "text-ink-4"
              )}>
                {l1 ? formatINR(l1.bidAmount) : "No bids yet"}
              </p>
            </div>
          </div>

          {/* Outbid warning */}
          <AnimatePresence>
            {myLatestBid && myRank > 1 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 p-2.5 bg-close-light border border-close/20 rounded-md"
              >
                <TrendingDown size={11} className="text-close shrink-0" />
                <p className="text-2xs text-close">
                  You've been outbid — currently L{myRank}.{" "}
                  Beat L1 by at least {formatINR(config.minDecrement)}.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bid amount */}
          <div className="flex flex-col gap-1.5">
            <Input
              label="Your bid amount"
              type="number"
              placeholder={suggestedBid || "Enter amount"}
              value={form.bidAmount}
              onChange={set("bidAmount")}
              error={errors.bidAmount}
              prefix="₹"
            />
            {/* Suggest button */}
            {suggestedBid > 0 && (
              <button
                onClick={() => setForm((f) => ({ ...f, bidAmount: String(suggestedBid) }))}
                className="text-2xs text-bid hover:underline text-left cursor-pointer"
              >
                Use suggested: {formatINR(suggestedBid)}
              </button>
            )}
          </div>

          {/* Carrier + detail toggle */}
          <Input
            label="Carrier name (optional)"
            placeholder="DHL, Blue Dart…"
            value={form.carrierName}
            onChange={set("carrierName")}
          />

          <button
            onClick={() => setShowDetail((o) => !o)}
            className="flex items-center gap-1 text-2xs text-ink-4 hover:text-ink transition-colors cursor-pointer"
          >
            {showDetail ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            {showDetail ? "Hide" : "Add"} cost breakdown
          </button>

          <AnimatePresence initial={false}>
            {showDetail && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden flex flex-col gap-2"
              >
                <Input label="Freight charges" type="number" prefix="₹"
                  value={form.freightCharges} onChange={set("freightCharges")} />
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Origin charges" type="number" prefix="₹"
                    value={form.originCharges} onChange={set("originCharges")} />
                  <Input label="Destination charges" type="number" prefix="₹"
                    value={form.destinationCharges} onChange={set("destinationCharges")} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Transit time (days)" type="number"
                    value={form.transitTime} onChange={set("transitTime")} />
                  <Input label="Valid until" type="date"
                    value={form.validityDate} onChange={set("validityDate")} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            variant="success"
            size="sm"
            loading={submitting}
            onClick={handleSubmit}
            icon={<Send size={11} />}
            className="w-full mt-1"
          >
            Submit bid
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Buyer: supplier management panel ─────────────────────────
function SupplierPanel({ rfqId, suppliers, rfqStatus, onRefresh }) {
  const toast = useToast();
  const [inviteInput, setInviteInput] = useState("");
  const [inviting,    setInviting]    = useState(false);
  const [availableSuppliers, setAvailableSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  useEffect(() => {
  if (!search.trim()) {
    setAvailableSuppliers([]);
    return;
  }

  const delay = setTimeout(async () => {
    try {
      const data = await getAllSuppliers(rfqId);

      // 🔥 Filter by search text
      const filtered = data.filter((s) =>
        `${s.name} ${s.email}`.toLowerCase().includes(search.toLowerCase())
      );

      // 🔥 Remove already invited suppliers
      const invitedIds = suppliers.map(s => s.supplierId || s.id);

      setAvailableSuppliers(
        filtered.filter((s) => !invitedIds.includes(s.id))
      );

    } catch (err) {
      console.error("Supplier fetch failed", err);
    }
  }, 300); // debounce

  return () => clearTimeout(delay);
}, [search, rfqId, suppliers]);

  const handleInvite = async () => {
    const manualIds = inviteInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const selectedIds = selected.map((s) => s.id);
    const ids = [...new Set([...manualIds, ...selectedIds])];

    if (!ids.length) return;
    setInviting(true); 
    try {
      await inviteSuppliers(rfqId, ids);
      toast(`Invited ${ids.length} supplier(s)`, "info");
      setInviteInput("");
      setSelected([]);
      onRefresh();
    } catch (err) {
      toast(err.response?.data?.message || "Invite failed", "error");
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="bg-white border border-surface-3 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-surface-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Users size={12} className="text-ink-4" />
          <span className="text-xs font-medium text-ink">Suppliers</span>
        </div>
        <span className="text-2xs text-ink-4">{suppliers.length} invited</span>
      </div>

      {/* Invite input */}
  {rfqStatus !== "CLOSED" && rfqStatus !== "FORCE_CLOSED" && (
    <div className="p-3 border-b border-surface-2 flex flex-col gap-2">

      {/* Search + Input */}
      <div className="flex gap-2 relative">
        <Input
          placeholder="Paste Supplier UUIDs (comma separated) or search..."
          value={inviteInput}
          onChange={(e) => {
            setInviteInput(e.target.value);
            setSearch(e.target.value);
          }}
          className="text-xs"
          containerClass="flex-1"
          onBlur={() => setTimeout(() => setSearch(""), 150)}
        />

        <Button
          size="sm"
          variant="ghost"
          loading={inviting}
          onClick={handleInvite}
        >
          Invite
        </Button>

        {/* Dropdown */}
        {search && availableSuppliers.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 w-full bg-white border border-surface-3 rounded-md shadow z-20 max-h-48 overflow-y-auto">
            {availableSuppliers.map((s) => (
              <div
                key={s.id}
                onClick={() => {
                  setSelected((prev) =>
                    prev.find((p) => p.id === s.id)
                      ? prev
                      : [...prev, s]
                  );
                  setSearch("");
                  setInviteInput("");
                }}
                className="px-3 py-2 text-xs hover:bg-surface-1 cursor-pointer"
              >
                {s.name} ({s.email})
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((s) => (
            <span
              key={s.id}
              className="text-2xs bg-surface-2 px-2 py-0.5 rounded flex items-center gap-1"
            >
              {s.name}
              <button
                onClick={() =>
                  setSelected((prev) =>
                    prev.filter((p) => p.id !== s.id)
                  )
                }
                className="text-ink-4 hover:text-ink cursor-pointer"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )}

      {/* Supplier list */}
      <div className="divide-y divide-surface-2 max-h-56 overflow-y-auto">
        {suppliers.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-xs text-ink-4">No suppliers invited yet</p>
          </div>
        ) : (
          suppliers.map((s) => (
            <div key={s.supplierId || s.id}
              className="flex items-center justify-between px-4 py-2.5">
              <div className="min-w-0">
                <p className="text-xs font-medium text-ink truncate">
                  {s.supplier?.name || s.name || s.supplierId}
                </p>
                <p className="text-2xs text-ink-4 truncate">
                  {s.supplier?.email || s.email || ""}
                </p>
              </div>
              <Badge status={s.status} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Auction config summary card ──────────────────────────────
function AuctionConfigCard({ rfq, config }) {
  const [open, setOpen] = useState(false);

  const rows = [
    ["Min decrement",    config.minDecrement ? formatINR(config.minDecrement) : "—"],
    ["Extension",        config.extensionEnabled ? "Enabled" : "Disabled"],
    config.extensionEnabled && ["Trigger window", `${config.extensionWindow} min`],
    config.extensionEnabled && ["Extension by",   `${config.extensionDuration} min`],
    config.extensionEnabled && ["Trigger type", config.extensionType?.replace(/_/g, " ")],
    config.extensionEnabled && ["Max extensions", config.maxExtensions ?? "—"],
    ["Auto-bidding",     config.autoBidEnabled ? "Enabled" : "Disabled"],
  ].filter(Boolean);

  return (
    <div className="bg-white border border-surface-3 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-1 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-1.5">
          <Zap size={12} className="text-ink-4" />
          <span className="text-xs font-medium text-ink">Auction config</span>
        </div>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={13} className="text-ink-4" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-surface-2 divide-y divide-surface-2">
              {rows.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between px-4 py-2">
                  <span className="text-2xs text-ink-4 capitalize">{label}</span>
                  <span className="text-xs font-medium text-ink">{value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
function AcceptInviteBar({ rfqId, supplierId, onRefresh }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const respond = async (status) => {
    setLoading(true);
    try {
      await respondInvite(rfqId, supplierId, status);
      toast(status === "ACCEPTED" ? "Invite accepted!" : "Invite declined", "info");
      onRefresh();
    } catch (err) {
      toast(err.response?.data?.message || "Failed to respond", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-warn/30 rounded-lg p-4 flex flex-col gap-2">
      <p className="text-xs font-medium text-ink">You have a pending invite</p>
      <p className="text-2xs text-ink-4">Accept to participate in this auction.</p>
      <div className="flex gap-2 mt-1">
        <Button size="sm" variant="success" loading={loading} onClick={() => respond("ACCEPTED")} className="flex-1">
          Accept
        </Button>
        <Button size="sm" variant="ghost" loading={loading} onClick={() => respond("REJECTED")} className="flex-1">
          Decline
        </Button>
      </div>
    </div>
  );
}