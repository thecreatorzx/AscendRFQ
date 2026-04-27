import api from "./axios";

export const getBids = (rfqId) =>
  api.get(`/rfqs/${rfqId}/bids`).then((r) => r.data);

export const getRankings = (rfqId) =>
  api.get(`/rfqs/${rfqId}/bids/rankings`).then((r) => r.data);

export const getLowestBid = (rfqId) =>
  api.get(`/rfqs/${rfqId}/bids/lowest`).then((r) => r.data);

export const submitBid = (rfqId, body) =>
  api.post(`/rfqs/${rfqId}/bids`, body).then((r) => r.data);
