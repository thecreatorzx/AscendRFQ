import prisma from "../utils/db.js";

const getLogs = async (rfqId) => {
  const logs = await prisma.activityLog.findMany({
    where: {
      rfqId,
    },
    orderBy: { createdAt: "desc" },
  });
  return logs;
};

export { getLogs };
