import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth";
import { asyncHandler } from "../../utils/response";
import * as invite from "./invite.controller";

// Accepting an invite is done by the invitee, who has no board membership yet,
// so this lives outside the board-scoped (role-gated) routes.
const r = Router();
r.use(requireAuth);
r.post("/:token/accept", asyncHandler(invite.accept));

export default r;
