import { useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";

/**
 * Connects to the auction WebSocket room for a given rfqId.
 * Calls the provided handlers on events:
 *   onNewBid(bid)        — new_bid
 *   onExtended(data)     — auction_extended
 *   onClosed(data)       — auction_closed
 */
export function useAuctionSocket(
  rfqId,
  { onNewBid, onExtended, onClosed } = {},
) {
  const socketRef = useRef(null);

  const stableNewBid = useRef(onNewBid);
  const stableExtended = useRef(onExtended);
  const stableClosed = useRef(onClosed);

  // Keep refs fresh without re-subscribing
  useEffect(() => {
    stableNewBid.current = onNewBid;
  }, [onNewBid]);
  useEffect(() => {
    stableExtended.current = onExtended;
  }, [onExtended]);
  useEffect(() => {
    stableClosed.current = onClosed;
  }, [onClosed]);

  useEffect(() => {
    if (!rfqId) return;

    const socket = io(import.meta.env.VITE_WS_URL || "http://localhost:5000", {
      withCredentials: true,
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_auction", { rfqId });
    });

    socket.on("new_bid", (data) => {
      stableNewBid.current?.(data);
    });

    socket.on("auction_extended", (data) => {
      stableExtended.current?.(data);
    });

    socket.on("auction_closed", (data) => {
      stableClosed.current?.(data);
    });

    return () => {
      socket.emit("leave_auction", { rfqId });
      socket.disconnect();
    };
  }, [rfqId]);

  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { emit };
}
