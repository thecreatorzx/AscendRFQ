import express from "express";
import {
  closeAuction,
  forceCloseAuction,
} from "../controllers/auction.controller";
import { authenticate, authorize } from "../middlewares/auth";

const router = express.Router();

router.post("/close", authenticate, authorize("BUYER"), closeAuction);
router.post(
  "/force-close",
  authenticate,
  authorize("BUYER"),
  forceCloseAuction,
);

export default router;
