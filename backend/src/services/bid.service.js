import prisma from "../utils/db.js";
import { getIO } from "../utils/socket.js";
import { getRFQById } from "./rfq.service.js";
import { checkAndExtend } from "./auction.service.js";
import { getSupplierBySupplierId } from "./supplier.service.js";

const submitBid = async (rfqId, supplierId, bidData) => {
  const rfq = await getRFQById(rfqId);
  if (rfq.status !== "ACTIVE")
    throw new Error("Auction is currently not active");
  const now = new Date();
  if (now > rfq.currentEndTime) throw new Error("Auction has ended");

  const rfqSupplier = await getSupplierBySupplierId(rfqId, supplierId);
  if (!rfqSupplier || rfqSupplier.status !== "ACCEPTED")
    throw new Error("Supplier not authorized to bid");
  const bidFields = {
    rfqId,
    supplierId,
    bidAmount: bidData.bidAmount,
    status: "VALID",
    bidSource: "MANUAL",
  };
  const quoteFields = {
    freightCharges: bidData.freightCharges,
    originCharges: bidData.originCharges,
    destinationCharges: bidData.destinationCharges,
    transitTime: bidData.transitTime,
    validityDate: bidData.validityDate,
    versionNumber: 1,
    status: "ACTIVE",
    isLatest: true,
    carrierName: bidData.carrierName,
  };
  const newBid = await prisma.bid.create({
    data: {
      ...bidFields,
      quote: {
        create: { ...quoteFields },
      },
    },
    include: { quote: true },
  });

  getIO().to(rfqId).emit("new_bid", {
    rfqId,
    bidId: newBid.bidId,
    supplierId: newBid.supplierId,
    bidAmount: newBid.bidAmount.toString(),
    createdAt: newBid.createdAt,
    quote: newBid.quote,
  });

  await checkAndExtend(rfq, newBid);
  return newBid;
};

const getBids = async (rfqId) => {
  return await prisma.bid.findMany({
    where: { rfqId, status: "VALID" },
    include: { quote: true },
    orderBy: { bidAmount: "asc" },
  });
};

const getRankings = async (rfqId) => {
  const bids = await getBids(rfqId);
  return bids.map((bid, index) => ({
    rank: index + 1,
    supplierId: bid.supplierId,
    bidAmount: bid.bidAmount,
    quote: bid.quote,
  }));
};

export { submitBid, getBids, getRankings };
