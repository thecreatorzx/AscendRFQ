import { useState, useEffect, useCallback, useRef } from "react";
import {
  getRFQ,
  getRFQActivity,
  updateRFQStatus,
  closeRFQ,
  forceCloseRFQ,
} from "../api/rfq";
import { getBids, getRankings } from "../api/bids";
import { getSuppliers } from "../api/suppliers";

export function useRFQ(rfqId) {
  const [rfq, setRfq] = useState(null);
  const [bids, setBids] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  const fetchAll = useCallback(
    async (silent = false) => {
      if (!rfqId) return;
      if (!silent) setLoading(true);
      let cancelled = false;
      try {
        const [rfqData, bidsData, rankData, suppData, actData] =
          await Promise.all([
            getRFQ(rfqId),
            getBids(rfqId),
            getRankings(rfqId),
            getSuppliers(rfqId),
            getRFQActivity(rfqId),
          ]);
        if (cancelled) return;
        setRfq(rfqData.data || rfqData);
        setBids(bidsData.data || bidsData || []);
        setRankings(rankData.data || rankData || []);
        setSuppliers(suppData.data || suppData || []);
        setActivity(actData.data || actData || []);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
      return () => {
        cancelled = true;
      };
    },
    [rfqId],
  );

  const refreshLive = useCallback(async () => {
    if (!rfqId) return;
    try {
      const [rfqData, bidsData, rankData, actData] = await Promise.all([
        getRFQ(rfqId),
        getBids(rfqId),
        getRankings(rfqId),
        getRFQActivity(rfqId),
      ]);
      setRfq(rfqData.data || rfqData);
      setBids(bidsData.data || bidsData || []);
      setRankings(rankData.data || rankData || []);
      setActivity(actData.data || actData || []);
    } catch {
      /* silent */
    }
  }, [rfqId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Poll every 10s when ACTIVE
  useEffect(() => {
    clearInterval(pollRef.current);
    if (rfq?.status === "ACTIVE") {
      pollRef.current = setInterval(refreshLive, 10_000);
    }
    return () => clearInterval(pollRef.current);
  }, [rfq?.status, refreshLive]);

  const activateRFQ = async () => {
    await updateRFQStatus(rfqId, "ACTIVE");
    await fetchAll(true);
  };

  const draftRFQ = async () => {
    await updateRFQStatus(rfqId, "DRAFT");
    await fetchAll(true);
  };

  const closeAuction = async () => {
    await closeRFQ(rfqId);
    await fetchAll(true);
  };

  const forceClose = async () => {
    await forceCloseRFQ(rfqId);
    await fetchAll(true);
  };

  return {
    rfq,
    bids,
    rankings,
    suppliers,
    activity,
    loading,
    error,
    refresh: fetchAll,
    refreshLive,
    activateRFQ,
    draftRFQ,
    closeAuction,
    forceClose,
  };
}
