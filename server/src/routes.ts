import { Router } from "express";
import authRoutes from "./modules/auth/auth.routes";
import boardRoutes from "./modules/boards/board.routes";
import inviteRoutes from "./modules/invites/invite.routes";

/** Mounts all feature routers under /api. */
const api = Router();

api.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

api.use("/auth", authRoutes);
api.use("/boards", boardRoutes);
api.use("/invites", inviteRoutes);

export default api;
