import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.route.js";
import rfqRoutes from "./routes/rfq.route.js";
import bidRoutes from "./routes/bid.route.js";
import supplierRoutes from "./routes/supplier.route.js";
import auctionRoutes from "./routes/auction.route.js";
import errorHandler from "./middlewares/error.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Routes (we'll add these as we build)
app.use("/api/auth", authRoutes);
app.use("/api/rfqs", rfqRoutes);
app.use("/api/rfqs/:id", auctionRoutes);
app.use("/api/rfqs/:id/bids", bidRoutes);
app.use("/api/rfqs/:id/suppliers", supplierRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use(errorHandler);

export default app;
