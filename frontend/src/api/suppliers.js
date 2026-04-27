import api from "./axios";

export const getAllSuppliers = (rfqId) =>
  api.get(`/rfqs/${rfqId}/suppliers/all`).then((r) => r.data);

export const getSuppliers = (rfqId) =>
  api.get(`/rfqs/${rfqId}/suppliers`).then((r) => r.data);

export const inviteSuppliers = (rfqId, supplierIds) =>
  api.post(`/rfqs/${rfqId}/suppliers`, { supplierIds }).then((r) => r.data);

export const respondInvite = (rfqId, supplierId, status) =>
  api
    .patch(`/rfqs/${rfqId}/suppliers/${supplierId}`, { status })
    .then((r) => r.data);
