import {
  createRFQ as create,
  getRFQs as get,
  getRFQById as getById,
  updateRFQStatus as updateStatus,
} from "../services/rfq.service.js";

const getRFQs = async (req, res, next) => {
  try {
    const result = await get();
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getRFQsById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const result = await getById(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const createRFQ = async (req, res, next) => {
  try {
    const result = await create({ ...req.body, buyerId: req.user.userId });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const updateRFQStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await updateStatus(id, status);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export { getRFQs, getRFQsById, createRFQ, updateRFQStatus };
