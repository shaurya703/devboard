import { Router } from "express";
import authRoutes from "./modules/auth/auth.routes";

/** Mounts all feature routers under /api. */
const api = Router();

api.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

api.use("/auth", authRoutes);

// Board / column / card / invite / activity routers mount here in Step 4.

export default api;
