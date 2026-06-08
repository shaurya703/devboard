import crypto from "crypto";
import { ActivityType, BoardRole } from "@devboard/shared";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { logActivity } from "../activity/activity.service";
import { emitToBoard } from "../../realtime/emitter";
import { serializeInvite, serializeMember } from "../boards/serializers";

const INVITE_TTL_MS = 7 * 86_400_000; // 7 days

async function broadcastMembers(boardId: string) {
  const members = await prisma.boardMember.findMany({
    where: { boardId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
  const dto = members.map(serializeMember);
  emitToBoard(boardId, "member:changed", dto);
  return dto;
}

export async function listMembers(boardId: string) {
  const members = await prisma.boardMember.findMany({
    where: { boardId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
  return members.map(serializeMember);
}

export async function listInvites(boardId: string) {
  const invites = await prisma.invite.findMany({
    where: { boardId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
  return invites.map(serializeInvite);
}

/**
 * Invite a user by email. If they already have an account they're added as a
 * member immediately; otherwise a pending invite (with token) is created for
 * them to accept after they register.
 */
export async function createInvite(
  boardId: string,
  inviterId: string,
  email: string,
  role: BoardRole
) {
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    const already = await prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId: existingUser.id } },
    });
    if (already) throw ApiError.conflict("User is already a member");

    await prisma.boardMember.create({
      data: { boardId, userId: existingUser.id, role },
    });
    const activity = await logActivity({
      boardId,
      userId: inviterId,
      type: ActivityType.MEMBER_JOINED,
      metadata: { email, role },
    });
    emitToBoard(boardId, "activity:created", activity);
    const members = await broadcastMembers(boardId);
    return { type: "member" as const, members };
  }

  // No account yet — revoke any prior pending invite for this email, then
  // create a fresh one so the latest token/role wins.
  await prisma.invite.updateMany({
    where: { boardId, email, status: "PENDING" },
    data: { status: "REVOKED" },
  });
  const token = crypto.randomBytes(24).toString("hex");
  const invite = await prisma.invite.create({
    data: {
      boardId,
      email,
      role,
      token,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    },
  });

  const activity = await logActivity({
    boardId,
    userId: inviterId,
    type: ActivityType.MEMBER_INVITED,
    metadata: { email, role },
  });
  emitToBoard(boardId, "activity:created", activity);

  return { type: "invite" as const, invite: serializeInvite(invite) };
}

/** Accept a pending invite. The accepting user's email must match. */
export async function acceptInvite(token: string, userId: string) {
  const invite = await prisma.invite.findUnique({ where: { token } });
  if (!invite || invite.status !== "PENDING") {
    throw ApiError.notFound("Invite not found or already used");
  }
  if (invite.expiresAt.getTime() < Date.now()) {
    throw ApiError.badRequest("Invite has expired");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.email !== invite.email) {
    throw ApiError.forbidden("This invite was issued to a different email");
  }

  const existing = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId: invite.boardId, userId } },
  });
  if (!existing) {
    await prisma.boardMember.create({
      data: { boardId: invite.boardId, userId, role: invite.role },
    });
  }
  await prisma.invite.update({
    where: { id: invite.id },
    data: { status: "ACCEPTED" },
  });

  const activity = await logActivity({
    boardId: invite.boardId,
    userId,
    type: ActivityType.MEMBER_JOINED,
    metadata: { email: invite.email, role: invite.role },
  });
  emitToBoard(invite.boardId, "activity:created", activity);
  await broadcastMembers(invite.boardId);

  return { boardId: invite.boardId };
}

export async function revokeInvite(boardId: string, inviteId: string) {
  const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
  if (!invite || invite.boardId !== boardId) {
    throw ApiError.notFound("Invite not found");
  }
  await prisma.invite.update({
    where: { id: inviteId },
    data: { status: "REVOKED" },
  });
  return { id: inviteId };
}

export async function updateMemberRole(
  boardId: string,
  memberUserId: string,
  actorId: string,
  role: BoardRole
) {
  const member = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId: memberUserId } },
  });
  if (!member) throw ApiError.notFound("Member not found");
  if (member.role === BoardRole.OWNER) {
    throw ApiError.badRequest("Cannot change the owner's role");
  }

  await prisma.boardMember.update({
    where: { boardId_userId: { boardId, userId: memberUserId } },
    data: { role },
  });

  const activity = await logActivity({
    boardId,
    userId: actorId,
    type: ActivityType.MEMBER_ROLE_CHANGED,
    metadata: { userId: memberUserId, role },
  });
  emitToBoard(boardId, "activity:created", activity);
  const members = await broadcastMembers(boardId);
  return members;
}

export async function removeMember(
  boardId: string,
  memberUserId: string,
  actorId: string
) {
  const member = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId: memberUserId } },
  });
  if (!member) throw ApiError.notFound("Member not found");
  if (member.role === BoardRole.OWNER) {
    throw ApiError.badRequest("Cannot remove the board owner");
  }

  await prisma.boardMember.delete({
    where: { boardId_userId: { boardId, userId: memberUserId } },
  });

  const activity = await logActivity({
    boardId,
    userId: actorId,
    type: ActivityType.MEMBER_REMOVED,
    metadata: { userId: memberUserId },
  });
  emitToBoard(boardId, "activity:created", activity);
  const members = await broadcastMembers(boardId);
  return members;
}
