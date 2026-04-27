import {
  getAllSuppliers as getAll,
  getSuppliers as get,
  getSupplierBySupplierId as getById,
  inviteSuppliers as invite,
  updateSupplierStatus as updateStatus,
} from "../services/supplier.service.js";

const getAllSuppliers = async (req, res, next) => {
  try {
    const suppliers = await getAll();
    return res.json({ success: true, data: suppliers });
  } catch (error) {
    next(error);
  }
};

const getSuppliers = async (req, res, next) => {
  try {
    const rfqId = req.params.id;
    const results = await get(rfqId);
    return res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

const getSupplierBySupplierId = async (req, res, next) => {
  try {
    const rfqId = req.params.id;
    const supplierId = req.params.supplierId;
    const result = await getById(rfqId, supplierId);
    return res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const inviteSuppliers = async (req, res, next) => {
  try {
    const rfqId = req.params.id;
    const buyerId = req.user.userId;
    const { supplierIds } = req.body;
    await invite(rfqId, buyerId, supplierIds);
    res.json({ success: true, message: "Supplier invited successfully" });
  } catch (error) {
    next(error);
  }
};

const updateSupplierStatus = async (req, res, next) => {
  try {
    const rfqId = req.params.id;
    const supplierId = req.params.supplierId;
    const { status } = req.body;
    await updateStatus(rfqId, supplierId, status);
    res.json({ success: true, message: "Status updated successfully" });
  } catch (error) {
    next(error);
  }
};

export {
  getAllSuppliers,
  getSuppliers,
  getSupplierBySupplierId,
  inviteSuppliers,
  updateSupplierStatus,
};
