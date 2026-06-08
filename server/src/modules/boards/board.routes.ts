import { Router } from "express";
import {
  BoardRole,
  createBoardSchema,
  updateBoardSchema,
  createColumnSchema,
  updateColumnSchema,
  createCardSchema,
  updateCardSchema,
  moveCardSchema,
  createInviteSchema,
  updateMemberRoleSchema,
  createLabelSchema,
} from "@devboard/shared";
import { requireAuth } from "../../middleware/requireAuth";
import { requireBoardRole } from "../../middleware/boardRole";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../utils/response";

import * as board from "./board.controller";
import * as column from "../columns/column.controller";
import * as card from "../cards/card.controller";
import * as invite from "../invites/invite.controller";
import * as activity from "../activity/activity.controller";
import * as label from "../labels/label.controller";

const r = Router();

// All board routes require an authenticated user.
r.use(requireAuth);

// --- Boards ---
r.get("/", asyncHandler(board.list));
r.post("/", validate(createBoardSchema), asyncHandler(board.create));
r.get(
  "/:boardId",
  requireBoardRole(BoardRole.VIEWER),
  asyncHandler(board.get)
);
r.patch(
  "/:boardId",
  requireBoardRole(BoardRole.EDITOR),
  validate(updateBoardSchema),
  asyncHandler(board.update)
);
r.delete(
  "/:boardId",
  requireBoardRole(BoardRole.OWNER),
  asyncHandler(board.remove)
);

// --- Activity & members (read: viewer) ---
r.get(
  "/:boardId/activity",
  requireBoardRole(BoardRole.VIEWER),
  asyncHandler(activity.list)
);
r.get(
  "/:boardId/members",
  requireBoardRole(BoardRole.VIEWER),
  asyncHandler(invite.listMembers)
);

// --- Columns (editor) ---
r.post(
  "/:boardId/columns",
  requireBoardRole(BoardRole.EDITOR),
  validate(createColumnSchema),
  asyncHandler(column.create)
);
r.patch(
  "/:boardId/columns/:columnId",
  requireBoardRole(BoardRole.EDITOR),
  validate(updateColumnSchema),
  asyncHandler(column.update)
);
r.delete(
  "/:boardId/columns/:columnId",
  requireBoardRole(BoardRole.EDITOR),
  asyncHandler(column.remove)
);

// --- Cards (editor) ---
r.post(
  "/:boardId/columns/:columnId/cards",
  requireBoardRole(BoardRole.EDITOR),
  validate(createCardSchema),
  asyncHandler(card.create)
);
r.patch(
  "/:boardId/cards/:cardId",
  requireBoardRole(BoardRole.EDITOR),
  validate(updateCardSchema),
  asyncHandler(card.update)
);
r.patch(
  "/:boardId/cards/:cardId/move",
  requireBoardRole(BoardRole.EDITOR),
  validate(moveCardSchema),
  asyncHandler(card.move)
);
r.delete(
  "/:boardId/cards/:cardId",
  requireBoardRole(BoardRole.EDITOR),
  asyncHandler(card.remove)
);

// --- Labels (editor) ---
r.post(
  "/:boardId/labels",
  requireBoardRole(BoardRole.EDITOR),
  validate(createLabelSchema),
  asyncHandler(label.create)
);
r.delete(
  "/:boardId/labels/:labelId",
  requireBoardRole(BoardRole.EDITOR),
  asyncHandler(label.remove)
);

// --- Sharing / membership (owner) ---
r.get(
  "/:boardId/invites",
  requireBoardRole(BoardRole.OWNER),
  asyncHandler(invite.listInvites)
);
r.post(
  "/:boardId/invites",
  requireBoardRole(BoardRole.OWNER),
  validate(createInviteSchema),
  asyncHandler(invite.create)
);
r.delete(
  "/:boardId/invites/:inviteId",
  requireBoardRole(BoardRole.OWNER),
  asyncHandler(invite.revoke)
);
r.patch(
  "/:boardId/members/:userId",
  requireBoardRole(BoardRole.OWNER),
  validate(updateMemberRoleSchema),
  asyncHandler(invite.updateRole)
);
r.delete(
  "/:boardId/members/:userId",
  requireBoardRole(BoardRole.OWNER),
  asyncHandler(invite.removeMember)
);

export default r;
