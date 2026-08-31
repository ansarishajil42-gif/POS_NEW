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
import purchasingRouter from "./routes/purchasing.js";
import usersRouter from "./routes/users.js";
import { publicRouter as blogPublicRouter, adminRouter as blogAdminRouter } from "./routes/blog.js";
import customersRouter from "./routes/customers.js";
import promotionsRouter from "./routes/promotions.js";
import priceRequestsRouter from "./routes/price-requests.js";
import auditLogsRouter from "./routes/audit-logs.js";
import storeManagerRouter from "./routes/store-manager.js";

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
// Root endpoint
app.get("/", (req, res) => {
  res.send("POS Backend API is running successfully!");
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});





// API Routes
app.use("/api/auth", authRouter);
app.use("/api/tenants", tenantsRouter);
app.use("/api/branches", branchesRouter);
app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/vendors", vendorsRouter);
app.use("/api/purchasing", purchasingRouter);
app.use("/api/users", usersRouter);
app.use("/api/blog", blogPublicRouter);
app.use("/api/blog-admin", blogAdminRouter);
app.use("/api/customers", customersRouter);
app.use("/api/promotions", promotionsRouter);
app.use("/api/price-requests", priceRequestsRouter);
app.use("/api/audit-logs", auditLogsRouter);
app.use("/api/store-manager", storeManagerRouter);

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
