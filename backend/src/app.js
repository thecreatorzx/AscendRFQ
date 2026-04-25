import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.route.js";
import rfqRoutes from "./routes/rfq.route.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes (we'll add these as we build)
app.use("/api/auth", authRoutes);
app.use("/api/rfqs", rfqRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export default app;
