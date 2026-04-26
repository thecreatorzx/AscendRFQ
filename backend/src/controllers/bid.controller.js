import {
  submitBid as addBid,
  getBids as bids,
  getRankings as rankings,
} from "../services/bid.service.js";

const submitBid = async (req, res, next) => {
  try {
    const rfqId = req.params.id;
    const supplierId = req.user.userId;
    const bidData = req.body;
    const result = await addBid(rfqId, supplierId, bidData);
    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getBids = async (req, res, next) => {
  try {
    const rfqId = req.params.id;
    const results = await bids(rfqId);
    return res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

const getRankings = async (req, res, next) => {
  try {
    const rfqId = req.params.id;
    const results = await rankings(rfqId);
    return res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

export { submitBid, getBids, getRankings };
