import prisma from "../utils/db.js";

const getAllSuppliers = async (req, res, next) => {
  const suppliers = await prisma.user.findMany({
    where: { role: "SUPPLIER" },
    select: { id: true, name: true, email: true },
  });
  return suppliers;
};
const getSuppliers = async (rfqId) => {
  const suppliers = await prisma.rFQSupplier.findMany({
    where: {
      rfqId,
    },
    orderBy: { lastActivityAt: "desc" },
  });
  return suppliers;
};

const getSupplierBySupplierId = async (rfqId, supplierId) => {
  const supplier = await prisma.rFQSupplier.findUnique({
    where: { rfqId_supplierId: { rfqId, supplierId } },
  });
  if (!supplier) throw new Error("The supplier doesn't exist in this RFQ");
  return supplier;
};

const inviteSuppliers = async (rfqId, buyerId, supplierIds) => {
  const rfq = await prisma.rFQ.findUnique({ where: { id: rfqId } });
  if (!rfq) throw new Error("RFQ not found");
  if (rfq.buyerId !== buyerId) throw new Error("Unauthorized");
  return await prisma.rFQSupplier.createMany({
    data: supplierIds.map((supplierId) => ({
      rfqId,
      supplierId,
      status: "INVITED",
    })),
    skipDuplicates: true,
  });
};

const updateSupplierStatus = async (rfqId, suppplierId, status) => {
  const RFQsupplier = await getSupplierBySupplierId(rfqId, suppplierId);
  return prisma.rFQSupplier.update({
    where: {
      id: RFQsupplier.id,
    },
    data: {
      status: status,
    },
  });
};

export {
  getAllSuppliers,
  getSuppliers,
  getSupplierBySupplierId,
  inviteSuppliers,
  updateSupplierStatus,
};
