import express from "express";
import {
  closeAuction,
  forceCloseAuction,
} from "../controllers/auction.controller.js";
import { authenticate, authorize } from "../middlewares/auth.js";

const router = express.Router({ mergeParams: true });

router.post("/close", authenticate, authorize("BUYER"), closeAuction);
router.post(
  "/force-close",
  authenticate,
  authorize("BUYER"),
  forceCloseAuction,
);

export default router;
