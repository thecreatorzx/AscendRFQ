import api from "./axios";

export const getRFQs = (params) =>
  api.get("/rfqs", { params }).then((r) => r.data);

export const getRFQ = (id) => api.get(`/rfqs/${id}`).then((r) => r.data);

export const createRFQ = (body) => api.post("/rfqs", body).then((r) => r.data);

export const updateRFQStatus = (id, status) =>
  api.patch(`/rfqs/${id}/status`, { status }).then((r) => r.data);

export const closeRFQ = (id) =>
  api.post(`/rfqs/${id}/close`).then((r) => r.data);

export const forceCloseRFQ = (id) =>
  api.post(`/rfqs/${id}/force-close`).then((r) => r.data);

export const getRFQActivity = (id) =>
  api.get(`/rfqs/${id}/activity`).then((r) => r.data);

export const getRFQExtensions = (id) =>
  api.get(`/rfqs/${id}/extensions`).then((r) => r.data);

export const getRFQConfig = (id) =>
  api.get(`/rfqs/${id}/config`).then((r) => r.data);
