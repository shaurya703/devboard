import { ActivityType } from "@devboard/shared";
import { prisma } from "../../lib/prisma";
import { serializeActivity } from "../boards/serializers";

/**
 * Record a board activity entry and return the serialized DTO (so callers can
 * broadcast it over Socket.IO). Never throws into the request path — logging
 * failures shouldn't fail the underlying mutation.
 */
export async function logActivity(params: {
  boardId: string;
  userId: string | null;
  type: ActivityType;
  metadata?: Record<string, unknown>;
}) {
  const activity = await prisma.activity.create({
    data: {
      boardId: params.boardId,
      userId: params.userId,
      type: params.type,
      metadata: (params.metadata ?? {}) as object,
    },
    include: { user: true },
  });
  return serializeActivity(activity);
}

export async function listActivity(boardId: string, limit = 50) {
  const items = await prisma.activity.findMany({
    where: { boardId },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return items.map(serializeActivity);
}
