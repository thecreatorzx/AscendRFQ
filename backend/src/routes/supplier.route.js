import express from "express";
import {
  getSuppliers,
  getSupplierBySupplierId,
  inviteSuppliers,
  updateSupplierStatus,
} from "../controllers/supplier.controller";
import { authenticate, authorize } from "../middlewares/auth";

const router = express.Router({ mergeParams: true });

router.post("/", authenticate, authorize("BUYER"), inviteSuppliers);
router.get("/", authenticate, getSuppliers);
router.get("/:supplierId", authenticate, getSupplierBySupplierId);
router.patch(
  "/:supplierId",
  authenticate,
  authorize("BUYER", "SUPPLIER"),
  updateSupplierStatus,
);

export default router;
