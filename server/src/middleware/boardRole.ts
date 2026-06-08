import { RequestHandler } from "express";
import { BoardRole, ROLE_RANK } from "@devboard/shared";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";

/**
 * Ensure the authenticated user is a member of the board named by
 * `req.params[paramName]` with at least `minRole`. Attaches the user's role
 * to `req.boardRole`. Must run after requireAuth.
 *
 * Returns 404 (not 403) when the user has no membership at all, so members
 * can't probe which board ids exist.
 */
export const requireBoardRole =
  (minRole: BoardRole, paramName = "boardId"): RequestHandler =>
  async (req, _res, next) => {
    try {
      const boardId = req.params[paramName];
      const userId = req.user!.id;

      const membership = await prisma.boardMember.findUnique({
        where: { boardId_userId: { boardId, userId } },
      });

      if (!membership) {
        return next(ApiError.notFound("Board not found"));
      }
      if (ROLE_RANK[membership.role] < ROLE_RANK[minRole]) {
        return next(
          ApiError.forbidden(`Requires ${minRole} access to this board`)
        );
      }

      req.boardRole = membership.role;
      next();
    } catch (err) {
      next(err);
    }
  };
