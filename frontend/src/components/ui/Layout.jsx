import { useState, useRef,useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingDown, LayoutDashboard, Plus,
  LogOut, ChevronDown, Bell,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { clsx } from "clsx";

const NAV = [
  { to: "/", icon: <LayoutDashboard size={13} />, label: "Dashboard" },
];

export function Layout({ children }) {
  const { user, logout, isBuyer } = useAuth();
  const { notifications, unreadCount, markAllRead, clear } = useNotifications();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [userOpen, setUserOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);
  const userRef = useRef(null);

   useEffect(() => {
    if (!bellOpen) return;
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [bellOpen]);

  // Close user menu on outside click
  useEffect(() => {
    if (!userOpen) return;
    const handler = (e) => {
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [userOpen]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-surface-1 flex flex-col">
      {/* Top nav */}
      <header className="h-10 bg-white border-b border-surface-2 flex items-center px-4 gap-4 shrink-0 sticky top-0 z-30">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5 shrink-0">
          <TrendingDown size={13} className="text-ink" />
          <span className="text-xs font-medium tracking-tight">BritishRFQ</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-0.5 ml-2">
          {NAV.map((n) => {
            const active = location.pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={clsx(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors",
                  active
                    ? "bg-surface-2 text-ink font-medium"
                    : "text-ink-3 hover:text-ink hover:bg-surface-1"
                )}
              >
                {n.icon}
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* Buyer: create RFQ button */}
        {isBuyer && (
          <Link
            to="/rfqs/new"
            className="flex items-center gap-1 px-2.5 py-1 bg-ink text-white text-xs rounded hover:bg-ink/90 transition-colors"
          >
            <Plus size={11} />
            New RFQ
          </Link>
        )}

        {/* Notifications placeholder */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => { setBellOpen((o) => !o); setUserOpen(false); }}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-2 text-ink-4 hover:text-ink transition-colors relative cursor-pointer"
          >
            <Bell size={13} />
          </button>
          <AnimatePresence>
            {bellOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-8 w-64 bg-white border border-surface-3 rounded-lg shadow-sm overflow-hidden z-50"
              >
                <div className="px-3 py-2 border-b border-surface-2 flex items-center justify-between">
                  <p className="text-xs font-medium text-ink">Notifications</p>
                  {notifications.length > 0 && (
                    <button
                      onClick={clear}
                      className="text-2xs text-ink-4 hover:text-close transition-colors cursor-pointer"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-3 py-8 text-center">
                      <Bell size={16} className="text-ink-4 mx-auto mb-2" />
                      <p className="text-xs text-ink-4">No notifications yet</p>
                      <p className="text-2xs text-ink-4 mt-0.5">
                        Bid and auction events will appear here
                      </p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={clsx(
                          "flex items-start gap-2.5 px-3 py-2.5 border-b border-surface-2 last:border-0",
                          !n.read && "bg-surface-1"
                        )}
                      >
                        <span
                          className={clsx(
                            "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                            NOTIF_COLOR[n.type] || "text-ink-4 bg-surface-2"
                          )}
                        >
                          {NOTIF_ICON[n.type] || <Info size={11} />}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-ink leading-snug">{n.msg}</p>
                          <p className="text-2xs text-ink-4 mt-0.5">{timeAgo(n.time)}</p>
                        </div>
                        {!n.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-bid shrink-0 mt-1.5" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setUserOpen((o) => !o)}
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <div className="w-5 h-5 rounded-full bg-ink flex items-center justify-center">
              <span className="text-white text-2xs font-medium">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            <span className="text-xs text-ink hidden sm:block">
              {user?.name?.split(" ")[0]}
            </span>
            <ChevronDown size={10} className="text-ink-4" />
          </button>

          <AnimatePresence>
            {userOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0,  scale: 1 }}
                exit={{    opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-8 w-44 bg-white border border-surface-3 rounded-lg shadow-sm overflow-hidden z-50"
              >
                <div className="px-3 py-2 border-b border-surface-2">
                  <p className="text-xs font-medium text-ink truncate">
                    {user?.name}
                  </p>
                  <p className="text-2xs text-ink-4 truncate">{user?.email}</p>
                  <p className="text-2xs text-ink-4 mt-0.5">
                    {user?.role === "BUYER" ? "Buyer" : "Supplier"}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-ink-3 hover:text-close hover:bg-close-light transition-colors"
                >
                  <LogOut size={11} />
                  Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 flex flex-col">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex-1 flex flex-col"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}

// Reusable page header strip
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="border-b border-surface-2 bg-white px-6 py-4 flex items-center justify-between gap-4">
      <div>
        <h1 className="text-sm font-medium text-ink">{title}</h1>
        {subtitle && <p className="text-xs text-ink-4 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}