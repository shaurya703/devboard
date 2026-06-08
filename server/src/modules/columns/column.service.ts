import { ActivityType } from "@devboard/shared";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { nextPosition } from "../../utils/position";
import { logActivity } from "../activity/activity.service";
import { emitToBoard } from "../../realtime/emitter";
import { columnInclude, serializeColumn } from "../boards/serializers";

/** Confirm a column belongs to the board (prevents cross-board tampering). */
async function assertColumnInBoard(columnId: string, boardId: string) {
  const column = await prisma.column.findUnique({ where: { id: columnId } });
  if (!column || column.boardId !== boardId) {
    throw ApiError.notFound("Column not found");
  }
  return column;
}

export async function createColumn(
  boardId: string,
  userId: string,
  title: string
) {
  const last = await prisma.column.findFirst({
    where: { boardId },
    orderBy: { position: "desc" },
  });

  const column = await prisma.column.create({
    data: { boardId, title, position: nextPosition(last?.position ?? null) },
    include: columnInclude,
  });

  const dto = serializeColumn(column);
  const activity = await logActivity({
    boardId,
    userId,
    type: ActivityType.COLUMN_CREATED,
    metadata: { columnId: column.id, title },
  });

  emitToBoard(boardId, "column:created", dto);
  emitToBoard(boardId, "activity:created", activity);
  return dto;
}

export async function updateColumn(
  boardId: string,
  columnId: string,
  userId: string,
  data: { title?: string; position?: number }
) {
  await assertColumnInBoard(columnId, boardId);

  const column = await prisma.column.update({
    where: { id: columnId },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.position !== undefined ? { position: data.position } : {}),
    },
    include: columnInclude,
  });

  const dto = serializeColumn(column);
  const activity = await logActivity({
    boardId,
    userId,
    type: ActivityType.COLUMN_UPDATED,
    metadata: { columnId, ...data },
  });

  emitToBoard(boardId, "column:updated", dto);
  emitToBoard(boardId, "activity:created", activity);
  return dto;
}

export async function deleteColumn(
  boardId: string,
  columnId: string,
  userId: string
) {
  await assertColumnInBoard(columnId, boardId);
  await prisma.column.delete({ where: { id: columnId } });

  const activity = await logActivity({
    boardId,
    userId,
    type: ActivityType.COLUMN_DELETED,
    metadata: { columnId },
  });

  emitToBoard(boardId, "column:deleted", { columnId });
  emitToBoard(boardId, "activity:created", activity);
  return { id: columnId };
}
