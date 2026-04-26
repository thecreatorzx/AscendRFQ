import {
  createRFQ as create,
  getRFQs as get,
  getRFQById as getById,
  updateRFQStatus as updateStatus,
} from "../services/rfq.service.js";
import { getLogs as logs } from "../services/activitylog.service.js";

const getRFQs = async (req, res, next) => {
  try {
    const status = req.query.status;
    const results = await get(status);
    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

const getRFQById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const result = await getById(id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const createRFQ = async (req, res, next) => {
  try {
    const result = await create({ ...req.body, buyerId: req.user.userId });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const updateRFQStatus = async (req, res, next) => {
  try {
    const { id } = req.params.id;
    const buyerId = req.user.userId;
    const { status } = req.body;
    const result = await updateStatus(id, buyerId, status);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getLogs = async (req, res, next) => {
  try {
    const logs = await logs(req.params.id);
    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

export { getRFQs, getRFQById, createRFQ, updateRFQStatus, getLogs };
