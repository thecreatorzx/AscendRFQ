import express from "express";
import {
  submitBid,
  getBids,
  getRankings,
} from "../controllers/bid.controller.js";
import { authenticate, authorize } from "../middlewares/auth.js";

const router = express.Router({ mergeParams: true });

router.post("/", authenticate, authorize("SUPPLIER"), submitBid);
router.get("/", authenticate, getBids);
router.get("/rankings", authenticate, getRankings);

export default router;
