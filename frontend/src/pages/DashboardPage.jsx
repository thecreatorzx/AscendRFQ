import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, RefreshCw, LayoutGrid, List,
  TrendingDown, Activity, Archive, FileText,
  ChevronRight,
} from "lucide-react";
import { useAuth }         from "../context/AuthContext";
import { getRFQs }         from "../api/rfq";
import { Layout, PageHeader } from "../components/ui/Layout";
import { Button }          from "../components/ui/Button";
import { Badge }           from "../components/ui/Badge";
import { RFQCard }         from "../components/rfq/RFQCard";
import { RFQTable }        from "../components/rfq/RFQTable";
import { EmptyState }      from "../components/ui/EmptyState";
import { PageLoader }      from "../components/ui/Spinner";
import { CountdownTimer }  from "../components/auction/CountdownTimer";
import { formatCompact }   from "../utils/currency";
import { clsx }            from "clsx";

const TABS = [
  { key: "ALL",          label: "All",           icon: <LayoutGrid size={11} /> },
  { key: "ACTIVE",       label: "Active",         icon: <Activity size={11} />  },
  { key: "DRAFT",        label: "Draft",          icon: <FileText size={11} />  },
  { key: "CLOSED",       label: "Closed",         icon: <Archive size={11} />   },
  { key: "FORCE_CLOSED", label: "Force closed",   icon: <Archive size={11} />   },
];

const EMPTY = {
  ALL:          { title: "No RFQs yet",              description: "Create your first RFQ to start a British Auction." },
  ACTIVE:       { title: "No active auctions",       description: "Activate a draft RFQ to start receiving bids."    },
  DRAFT:        { title: "No drafts",                description: "Create an RFQ to see it here."                    },
  CLOSED:       { title: "No closed auctions",       description: "Completed auctions will appear here."             },
  FORCE_CLOSED: { title: "No force-closed auctions", description: "Auctions closed at the hard deadline."            },
};

export default function DashboardPage() {
  const { isBuyer, isSupplier, user } = useAuth();
  const navigate    = useNavigate();

  const [rfqs,       setRfqs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState("ALL");
  const [view,       setView]       = useState("grid");
  const [refreshing, setRefreshing] = useState(false);
  const [inviteStatuses, setInviteStatuses] = useState({});

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await getRFQs({});
      const list   = data.data || data;
      setRfqs(list);

      if (isSupplier) {
        const map = {};
        list.forEach((r) => {
          if (r.myInviteStatus) map[r.id] = r.myInviteStatus;
        });
        setInviteStatuses(map);
      };
    } catch {
      // handled globally
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (tab !== "ACTIVE") return;
    const id = setInterval(() => load(true), 30_000);
    return () => clearInterval(id);
  }, [tab, load]);

  const stats = {
    total:  rfqs.length,
    active: rfqs.filter((r) => r.status === "ACTIVE").length,
    draft:  rfqs.filter((r) => r.status === "DRAFT").length,
  };

  const avgSavings = (() => {
    const closed = rfqs.filter((r) => r.lowestBid && r.initialPrice);
    if (!closed.length) return "—";
    const avg = closed.reduce(
      (s, r) => s + ((r.initialPrice - r.lowestBid) / r.initialPrice) * 100, 0
    ) / closed.length;
    return `${Math.round(avg)}%`;
  })();

  // Filter rfqs by active tab (API may return all, filter client-side)
  const displayed = tab === "ALL"
    ? rfqs
    : rfqs.filter((r) => r.status === tab);

  return (
    <Layout>
      <PageHeader
        title="Auctions"
        subtitle={`${stats.total} total · ${stats.active} live · ${stats.draft} draft`}
        actions={
          <>
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-2 text-ink-4 hover:text-ink transition-colors"
            >
              <RefreshCw size={12} className={clsx(refreshing && "animate-spin")} />
            </button>
            {isBuyer && (
              <Button
                size="sm"
                icon={<Plus size={11} />}
                onClick={() => navigate("/rfqs/new")}
              >
                New RFQ
              </Button>
            )}
          </>
        }
      />

      {/* Stats strip — buyer only */}
      {isBuyer && rfqs.length > 0 && (
        <div className="border-b border-surface-2 bg-white px-6 py-3">
          <div className="flex gap-6">
            {[
              { label: "Total RFQs",    value: stats.total  },
              { label: "Live auctions", value: stats.active },
              { label: "Drafts",        value: stats.draft  },
              { label: "Avg savings",   value: avgSavings   },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xs text-ink-4">{s.label}</p>
                <p className="text-sm font-medium text-ink tabular-nums">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs + view toggle */}
      <div className="border-b border-surface-2 bg-white px-6 flex items-center justify-between">
        <div className="flex items-center gap-0.5 -mb-px overflow-x-auto">
          {TABS.map((t) => {
            const count = t.key === "ALL"
              ? rfqs.length
              : rfqs.filter((r) => r.status === t.key).length;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-2.5 text-xs border-b-2 transition-all whitespace-nowrap",
                  tab === t.key
                    ? "border-ink text-ink font-medium"
                    : "border-transparent text-ink-4 hover:text-ink-3"
                )}
              >
                {t.icon}
                {t.label}
                {count > 0 && (
                  <span className={clsx(
                    "text-2xs px-1 rounded",
                    tab === t.key ? "bg-ink text-white" : "bg-surface-2 text-ink-4"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-0.5 ml-4 shrink-0">
          {[
            { k: "grid", icon: <LayoutGrid size={12} /> },
            { k: "list", icon: <List size={12} />        },
          ].map(({ k, icon }) => (
            <button
              key={k}
              onClick={() => setView(k)}
              className={clsx(
                "w-7 h-7 flex items-center justify-center rounded transition-colors",
                view === k ? "bg-surface-2 text-ink" : "text-ink-4 hover:text-ink"
              )}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {loading ? (
          <PageLoader />
        ) : displayed.length === 0 ? (
          <EmptyState
            icon={<TrendingDown size={18} />}
            title={EMPTY[tab].title}
            description={EMPTY[tab].description}
            action={
              isBuyer && tab !== "CLOSED" && tab !== "FORCE_CLOSED" ? (
                <Button
                  size="sm"
                  icon={<Plus size={11} />}
                  onClick={() => navigate("/rfqs/new")}
                >
                  Create RFQ
                </Button>
              ) : null
            }
          />
        ) : view === "grid" ? (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayed.map((rfq, i) => (
                <RFQCard
                  key={rfq.id}
                  rfq={rfq}
                  index={i}
                  myInviteStatus={inviteStatuses[rfq.id] ?? rfq.myInviteStatus}
                />
              ))}
            </div>
          </AnimatePresence>
        ) : (
          <RFQTable rfqs={displayed} inviteStatuses={inviteStatuses} />
        )}
      </div>
    </Layout>
  );
}