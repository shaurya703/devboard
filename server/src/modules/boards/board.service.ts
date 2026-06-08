import { ActivityType, BoardRole } from "@devboard/shared";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { POSITION_GAP } from "../../utils/position";
import { logActivity } from "../activity/activity.service";
import { emitToBoard } from "../../realtime/emitter";
import {
  boardDetailInclude,
  serializeBoardDetail,
  serializeBoardSummary,
} from "./serializers";

const DEFAULT_COLUMNS = ["To Do", "In Progress", "Done"];

/** All boards the user can see, with their role and member count. */
export async function listBoards(userId: string) {
  const memberships = await prisma.boardMember.findMany({
    where: { userId },
    include: {
      board: { include: { _count: { select: { members: true } } } },
    },
    orderBy: { board: { updatedAt: "desc" } },
  });

  return memberships.map((m) =>
    serializeBoardSummary(m.board, m.role as BoardRole)
  );
}

export async function createBoard(userId: string, title: string) {
  const board = await prisma.board.create({
    data: {
      title,
      ownerId: userId,
      members: { create: { userId, role: BoardRole.OWNER } },
      columns: {
        create: DEFAULT_COLUMNS.map((t, i) => ({
          title: t,
          position: (i + 1) * POSITION_GAP,
        })),
      },
    },
    include: boardDetailInclude,
  });

  await logActivity({
    boardId: board.id,
    userId,
    type: ActivityType.BOARD_CREATED,
    metadata: { title },
  });

  return serializeBoardDetail(board, BoardRole.OWNER);
}

export async function getBoard(boardId: string, role: BoardRole) {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: boardDetailInclude,
  });
  if (!board) throw ApiError.notFound("Board not found");
  return serializeBoardDetail(board, role);
}

export async function updateBoard(
  boardId: string,
  userId: string,
  role: BoardRole,
  title: string
) {
  const board = await prisma.board.update({
    where: { id: boardId },
    data: { title },
    include: boardDetailInclude,
  });

  const dto = serializeBoardDetail(board, role);
  const activity = await logActivity({
    boardId,
    userId,
    type: ActivityType.BOARD_UPDATED,
    metadata: { title },
  });

  emitToBoard(boardId, "board:updated", dto);
  emitToBoard(boardId, "activity:created", activity);
  return dto;
}

/** Only the owner may delete a board (enforced in the route via OWNER role). */
export async function deleteBoard(boardId: string) {
  await prisma.board.delete({ where: { id: boardId } });
  return { id: boardId };
}
