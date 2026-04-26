import prisma from "../utils/db.js";

const createRFQ = async (rfqData) => {
  const {
    buyerId,
    name,
    startTime,
    bidCloseTime,
    forcedCloseTime,
    initialPrice,
    currency,
    pickupDate,
    extensionWindow,
    extensionDuration,
    maxExtensions,
    extensionType,
    minDecrement,
    extensionEnabled,
    autoBidEnabled,
  } = rfqData;
  return await prisma.rFQ.create({
    data: {
      name,
      buyerId,
      startTime,
      bidCloseTime,
      forcedCloseTime,
      currentEndTime: bidCloseTime,
      status: "DRAFT",
      initialPrice,
      currency,
      pickupDate,
      config: {
        create: {
          extensionWindow,
          extensionDuration,
          maxExtensions,
          extensionType,
          minDecrement,
          extensionEnabled,
          autoBidEnabled,
        },
      },
    },
    include: {
      config: true,
    },
  });
};

const getRFQs = async (status) => {
  return await prisma.rFQ.findMany({
    where: status ? { status } : {},
    include: {
      config: true,
    },
    orderBy: { startTime: "desc" },
  });
};
const getRFQById = async (id) => {
  const rfq = await prisma.rFQ.findUnique({
    where: {
      id,
    },
    include: { config: true, bids: true },
  });
  if (!rfq) throw new Error("RFQ not found");
  return rfq;
};

const updateRFQStatus = async (id, buyerId, status) => {
  const rfq = await prisma.rFQ.findUnique({
    where: { id: id },
  });
  if (!rfq) throw new Error("RFQ not found");
  if (rfq.buyerId !== buyerId) throw new Error("Unauthorized");
  return await prisma.rFQ.update({
    where: {
      id,
    },
    data: { status },
  });
};
export { createRFQ, getRFQs, getRFQById, updateRFQStatus };
