import prisma from "../utils/db.js";
import { getIO } from "../utils/socket.js";

const checkAndExtend = async (rfq, newBid) => {
  const config = rfq.config;
  if (!config.extensionEnabled) return;
  const triggerWindowStart = new Date(
    rfq.currentEndTime.getTime() - config.extensionWindow * 60 * 1000,
  );
  if (newBid.createdAt < triggerWindowStart) return;
  if (config.extensionType === "ANY_RANK_CHANGE") {
    const anyRankChange = await prisma.bid.findMany({
      where: {
        rfqId: rfq.id,
        status: "VALID",
        bidId: { not: newBid.bidId },
      },
      orderBy: { bidAmount: "asc" },
      take: 10,
    });
    const rankChanged = anyRankChange.some(
      (b) => newBid.bidAmount < b.bidAmount,
    );
    if (!rankChanged) return;
  }
  if (config.extensionType === "L1_CHANGE") {
    const previousL1 = await prisma.bid.findFirst({
      where: {
        rfqId: rfq.id,
        status: "VALID",
        bidId: { not: newBid.bidId }, // exclude current bid
      },
      orderBy: { bidAmount: "asc" },
    });
    if (!previousL1 || previousL1.supplierId === newBid.supplierId) return;
  }
  const newEndTime = new Date(
    rfq.currentEndTime.getTime() + config.extensionDuration * 60 * 1000,
  );
  const cappedEndTime =
    newEndTime > rfq.forcedCloseTime ? rfq.forcedCloseTime : newEndTime;
  if (cappedEndTime <= rfq.currentEndTime) return;
  await prisma.rFQ.update({
    where: {
      id: rfq.id,
    },
    data: { currentEndTime: cappedEndTime },
  });

  // using websocket for live update after auction extension
  getIO().to(rfq.id).emit("auction_extended", {
    rfqId: rfq.id,
    newEndTime: cappedEndTime,
  });

  await prisma.auctionExtension.create({
    data: {
      rfqId: rfq.id,
      triggerType: config.extensionType,
      triggerTime: newBid.createdAt,
      oldEndTime: rfq.currentEndTime,
      newEndTime: cappedEndTime,
    },
  });

  await prisma.activityLog.create({
    data: {
      rfqId: rfq.id,
      eventType: "EXTENSION_TRIGGERED",
      eventCategory: "EXTENSION",
      actorType: "SYSTEM",
      oldValue: { endTime: rfq.currentEndTime },
      newValue: { endTime: cappedEndTime },
    },
  });
};

const closeAuction = async (rfqId, buyerId) => {
  const rfq = await prisma.rFQ.findUnique({
    where: { id: rfqId },
  });
  if (!rfq) throw new Error("RFQ not found");
  if (rfq.buyerId !== buyerId) throw new Error("Unauthorized");
  await prisma.rFQ.update({
    where: { id: rfqId },
    data: { status: "CLOSED" },
  });
  await prisma.activityLog.create({
    data: {
      rfqId,
      eventType: "AUCTION_CLOSED",
      eventCategory: "AUCTION",
      actorType: "SYSTEM",
    },
  });
  getIO().to(rfqId).emit("auction_closed", { rfqId });
};

const forceCloseAuction = async (rfqId, buyerId) => {
  const rfq = await prisma.rFQ.findUnique({
    where: { id: rfqId },
  });
  if (!rfq) throw new Error("RFQ not found");
  if (rfq.buyerId !== buyerId) throw new Error("Unauthorized");
  await prisma.rFQ.update({
    where: { id: rfqId },
    data: { status: "FORCED_CLOSED" },
  });
  await prisma.activityLog.create({
    data: {
      rfqId,
      eventType: "AUCTION_FORCED_CLOSED",
      eventCategory: "AUCTION",
      actorType: "SYSTEM",
    },
  });
  getIO().to(rfqId).emit("auction_force_closed", { rfqId });
};

const checkExpiredAuctions = async () => {
  const now = new Date();

  const forceClosedRFQs = await prisma.rFQ.findMany({
    where: { status: "ACTIVE", forcedCloseTime: { lte: now } },
  });
  for (const rfq of forceClosedRFQs) {
    await prisma.rFQ.update({
      where: { id: rfq.id },
      data: { status: "FORCED_CLOSED" },
    });
    getIO().to(rfq.id).emit("auction_force_closed", { rfqId: rfq.id });
  }

  const closedRFQs = await prisma.rFQ.findMany({
    where: { status: "ACTIVE", currentEndTime: { lte: now } },
  });
  for (const rfq of closedRFQs) {
    await prisma.rFQ.update({
      where: { id: rfq.id },
      data: { status: "CLOSED" },
    });
    getIO().to(rfq.id).emit("auction_closed", { rfqId: rfq.id });
  }
};

export {
  checkAndExtend,
  closeAuction,
  forceCloseAuction,
  checkExpiredAuctions,
};
