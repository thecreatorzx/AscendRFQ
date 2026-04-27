import express from "express";
import {
  getSuppliers,
  getSupplierBySupplierId,
  inviteSuppliers,
  updateSupplierStatus,
  getAllSuppliers,
} from "../controllers/supplier.controller.js";
import { authenticate, authorize } from "../middlewares/auth.js";

const router = express.Router({ mergeParams: true });

router.post("/", authenticate, authorize("BUYER"), inviteSuppliers);
router.get("/", authenticate, getSuppliers);
router.get("/all", authenticate, getAllSuppliers);
router.get("/:supplierId", authenticate, getSupplierBySupplierId);
router.patch(
  "/:supplierId",
  authenticate,
  authorize("BUYER", "SUPPLIER"),
  updateSupplierStatus,
);

export default router;
