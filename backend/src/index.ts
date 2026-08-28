import express from "express";
import cors from "cors";
import "dotenv/config";

// Route imports
import authRouter from "./routes/auth.js";
import tenantsRouter from "./routes/tenants.js";
import branchesRouter from "./routes/branches.js";
import productsRouter from "./routes/products.js";
import ordersRouter from "./routes/orders.js";
import vendorsRouter from "./routes/vendors.js";
import usersRouter from "./routes/users.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Global Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get("/", (req, res) => {
  res.send("POS Backend API is running successfully!");
});


// API Routes
app.use("/api/auth", authRouter);
app.use("/api/tenants", tenantsRouter);
app.use("/api/branches", branchesRouter);
app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/vendors", vendorsRouter);
app.use("/api/users", usersRouter);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 POS Backend Server is running on port ${PORT}`);
  console.log(`📁 Health Check: http://localhost:${PORT}/health`);
  console.log(`===============================================`);
});
