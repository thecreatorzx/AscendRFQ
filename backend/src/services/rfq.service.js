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

  return await prisma.rfq.create({
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

const getRFQs = async () => {
  return await prisma.rfq.findMany({
    include: {
      config: true,
    },
    orderBy: { startTime: "desc" },
  });
};
const getRFQById = async (id) => {
  const rfq = await prisma.rfq.findUnique({
    where: {
      id,
    },
    include: { config: true, bids: true },
  });
  if (!rfq) throw new Error("RFQ not found");
  return rfq;
};

const updateRFQStatus = async (id, status) => {
  return await prisma.rfq.update({
    where: {
      id,
    },
    data: { status },
  });
};
export { createRFQ, getRFQs, getRFQById, updateRFQStatus };
