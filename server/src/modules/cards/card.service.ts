import { ActivityType, CreateCardInput, UpdateCardInput } from "@devboard/shared";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { nextPosition } from "../../utils/position";
import { logActivity } from "../activity/activity.service";
import { emitToBoard } from "../../realtime/emitter";
import { cardInclude, serializeCard } from "../boards/serializers";

async function assertColumnInBoard(columnId: string, boardId: string) {
  const column = await prisma.column.findUnique({ where: { id: columnId } });
  if (!column || column.boardId !== boardId) {
    throw ApiError.notFound("Column not found");
  }
  return column;
}

/** Load a card and verify it lives on the given board. */
async function assertCardInBoard(cardId: string, boardId: string) {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { column: true },
  });
  if (!card || card.column.boardId !== boardId) {
    throw ApiError.notFound("Card not found");
  }
  return card;
}

/** Labels must belong to this board. Returns validated ids. */
async function assertLabelsInBoard(labelIds: string[], boardId: string) {
  if (labelIds.length === 0) return;
  const count = await prisma.label.count({
    where: { id: { in: labelIds }, boardId },
  });
  if (count !== labelIds.length) {
    throw ApiError.badRequest("One or more labels do not belong to this board");
  }
}

/** Assignee must be a member of the board. */
async function assertAssigneeIsMember(assigneeId: string, boardId: string) {
  const member = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId: assigneeId } },
  });
  if (!member) {
    throw ApiError.badRequest("Assignee must be a member of the board");
  }
}

export async function createCard(
  boardId: string,
  columnId: string,
  userId: string,
  input: CreateCardInput
) {
  await assertColumnInBoard(columnId, boardId);
  if (input.labelIds?.length) await assertLabelsInBoard(input.labelIds, boardId);
  if (input.assigneeId) await assertAssigneeIsMember(input.assigneeId, boardId);

  const last = await prisma.card.findFirst({
    where: { columnId },
    orderBy: { position: "desc" },
  });

  const card = await prisma.card.create({
    data: {
      columnId,
      title: input.title,
      description: input.description ?? null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      assigneeId: input.assigneeId ?? null,
      position: nextPosition(last?.position ?? null),
      labels: input.labelIds?.length
        ? { create: input.labelIds.map((labelId) => ({ labelId })) }
        : undefined,
    },
    include: cardInclude,
  });

  const dto = serializeCard(card);
  const activity = await logActivity({
    boardId,
    userId,
    type: ActivityType.CARD_CREATED,
    metadata: { cardId: card.id, title: card.title },
  });

  emitToBoard(boardId, "card:created", dto);
  emitToBoard(boardId, "activity:created", activity);
  return dto;
}

export async function updateCard(
  boardId: string,
  cardId: string,
  userId: string,
  input: UpdateCardInput
) {
  await assertCardInBoard(cardId, boardId);
  if (input.labelIds) await assertLabelsInBoard(input.labelIds, boardId);
  if (input.assigneeId) await assertAssigneeIsMember(input.assigneeId, boardId);

  const card = await prisma.card.update({
    where: { id: cardId },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.dueDate !== undefined
        ? { dueDate: input.dueDate ? new Date(input.dueDate) : null }
        : {}),
      ...(input.assigneeId !== undefined
        ? { assigneeId: input.assigneeId }
        : {}),
      // Replace the full label set when provided.
      ...(input.labelIds
        ? {
            labels: {
              deleteMany: {},
              create: input.labelIds.map((labelId) => ({ labelId })),
            },
          }
        : {}),
    },
    include: cardInclude,
  });

  const dto = serializeCard(card);
  const activity = await logActivity({
    boardId,
    userId,
    type: ActivityType.CARD_UPDATED,
    metadata: { cardId, title: card.title },
  });

  emitToBoard(boardId, "card:updated", dto);
  emitToBoard(boardId, "activity:created", activity);
  return dto;
}

export async function moveCard(
  boardId: string,
  cardId: string,
  userId: string,
  input: { toColumnId: string; position: number }
) {
  const existing = await assertCardInBoard(cardId, boardId);
  await assertColumnInBoard(input.toColumnId, boardId);

  const fromColumnId = existing.columnId;
  const card = await prisma.card.update({
    where: { id: cardId },
    data: { columnId: input.toColumnId, position: input.position },
    include: cardInclude,
  });

  const dto = serializeCard(card);
  const activity = await logActivity({
    boardId,
    userId,
    type: ActivityType.CARD_MOVED,
    metadata: { cardId, fromColumnId, toColumnId: input.toColumnId },
  });

  emitToBoard(boardId, "card:moved", {
    card: dto,
    fromColumnId,
    toColumnId: input.toColumnId,
  });
  emitToBoard(boardId, "activity:created", activity);
  return dto;
}

export async function deleteCard(
  boardId: string,
  cardId: string,
  userId: string
) {
  const existing = await assertCardInBoard(cardId, boardId);
  await prisma.card.delete({ where: { id: cardId } });

  const activity = await logActivity({
    boardId,
    userId,
    type: ActivityType.CARD_DELETED,
    metadata: { cardId },
  });

  emitToBoard(boardId, "card:deleted", {
    cardId,
    columnId: existing.columnId,
  });
  emitToBoard(boardId, "activity:created", activity);
  return { id: cardId };
}
