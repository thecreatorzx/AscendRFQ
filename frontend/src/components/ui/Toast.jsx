import { AnimatePresence, motion } from "framer-motion";
import { createContext, useCallback, useContext, useState } from "react";
import { X, Clock, TrendingDown, Bell } from "lucide-react";
import { clsx } from "clsx";

const ToastCtx = createContext(null);

const icons = {
  extension: <Clock size={13} />,
  outbid:    <TrendingDown size={13} />,
  info:      <Bell size={13} />,
  error:     <X size={13} />,
};

const styles = {
  extension: "border-warn/30  bg-warn-light  text-warn",
  outbid:    "border-close/30 bg-close-light text-close",
  info:      "border-bid/30   bg-bid-light   text-bid",
  error:     "border-close/30 bg-close-light text-close",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((msg, type = "info", duration = 4000) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), duration);
  }, []);

  const remove = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40, scale: 0.94 }}
              animate={{ opacity: 1, x: 0,  scale: 1 }}
              exit={{    opacity: 0, x: 40,  scale: 0.94 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={clsx(
                "pointer-events-auto flex items-center gap-2",
                "border rounded-lg px-3 py-2 text-xs font-medium shadow-sm",
                "max-w-70",
                styles[t.type]
              )}
            >
              {icons[t.type]}
              <span className="flex-1">{t.msg}</span>
              <button
                onClick={() => remove(t.id)}
                className="opacity-60 hover:opacity-100 transition-opacity ml-1 cursor-pointer"
              >
                <X size={11} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be inside ToastProvider");
  return ctx;
};