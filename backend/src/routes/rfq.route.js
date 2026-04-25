import express from "express";
import {
  getRFQs,
  getRFQsById,
  createRFQ,
  updateRFQStatus,
} from "../controllers/rfq.controller.js";
import { authenticate, authorize } from "../middlewares/auth.jss";

const router = express.Router();

router.get("/", authenticate, getRFQs);
router.get("/:id", authenticate, getRFQsById);
router.post("/", authenticate, authorize("BUYER"), createRFQ);
router.patch("/:id/status", authenticate, authorize("BUYER"), updateRFQStatus);

export default router;
