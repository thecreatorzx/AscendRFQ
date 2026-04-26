import {
  closeAuction as close,
  forceCloseAuction as forceClose,
} from "../services/auction.service";

const closeAuction = async (req, res, next) => {
  try {
    const rfqId = req.params.id;
    const buyerId = req.user.userId;
    await close(rfqId, buyerId);
    res.json({ success: true, message: "Auction closed" });
  } catch (error) {
    next(error);
  }
};
const forceCloseAuction = async (req, res, next) => {
  try {
    const rfqId = req.params.id;
    const buyerId = req.user.userId;
    await forceClose(rfqId, buyerId);
    res.json({ success: true, message: "Auction forcefully closed" });
  } catch (error) {
    next(error);
  }
};

export { closeAuction, forceCloseAuction };
