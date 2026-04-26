import express from "express";
import {
  getRFQs,
  getRFQById,
  createRFQ,
  updateRFQStatus,
} from "../controllers/rfq.controller.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import { getLogs } from "../controllers/rfq.controller.js";

const router = express.Router();

router.post("/", authenticate, authorize("BUYER"), createRFQ);
router.get("/", authenticate, getRFQs);
router.get("/:id", authenticate, getRFQById);
router.patch("/:id/status", authenticate, authorize("BUYER"), updateRFQStatus);
router.get("/:id/activity", authenticate, getLogs);
export default router;
