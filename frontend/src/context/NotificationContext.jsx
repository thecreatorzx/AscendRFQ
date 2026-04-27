import { createContext, useContext, useState, useCallback } from "react";

const NotificationCtx = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const push = useCallback((msg, type = "info") => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [
      { id, msg, type, time: new Date(), read: false },
      ...prev,
    ].slice(0, 50)); // cap at 50
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clear = useCallback(() => setNotifications([]), []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationCtx.Provider value={{ notifications, push, markAllRead, clear, unreadCount }}>
      {children}
    </NotificationCtx.Provider>
  );
}

export const useNotifications = () => useContext(NotificationCtx);