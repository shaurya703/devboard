import { Prisma } from "@prisma/client";
import {
  BoardDetailDTO,
  BoardSummaryDTO,
  CardDTO,
  ColumnDTO,
  LabelDTO,
  BoardMemberDTO,
  ActivityDTO,
  InviteDTO,
  BoardRole,
} from "@devboard/shared";
import { toPublicUser } from "../auth/auth.service";

// --- Reusable include shapes (keep serializers and queries in lockstep) ---

export const cardInclude = {
  assignee: true,
  labels: { include: { label: true } },
} satisfies Prisma.CardInclude;

export const columnInclude = {
  cards: { include: cardInclude, orderBy: { position: "asc" } },
} satisfies Prisma.ColumnInclude;

export const boardDetailInclude = {
  columns: { include: columnInclude, orderBy: { position: "asc" } },
  labels: true,
  members: { include: { user: true } },
} satisfies Prisma.BoardInclude;

type CardWith = Prisma.CardGetPayload<{ include: typeof cardInclude }>;
type ColumnWith = Prisma.ColumnGetPayload<{ include: typeof columnInclude }>;
type BoardWith = Prisma.BoardGetPayload<{ include: typeof boardDetailInclude }>;
type MemberWith = Prisma.BoardMemberGetPayload<{ include: { user: true } }>;
type ActivityWith = Prisma.ActivityGetPayload<{ include: { user: true } }>;

// --- Serializers ---

export const serializeLabel = (l: {
  id: string;
  boardId: string;
  name: string;
  color: string;
}): LabelDTO => ({
  id: l.id,
  boardId: l.boardId,
  name: l.name,
  color: l.color,
});

export const serializeCard = (c: CardWith): CardDTO => ({
  id: c.id,
  columnId: c.columnId,
  title: c.title,
  description: c.description,
  dueDate: c.dueDate ? c.dueDate.toISOString() : null,
  position: c.position,
  assigneeId: c.assigneeId,
  assignee: c.assignee ? toPublicUser(c.assignee) : null,
  labels: c.labels.map((cl) => serializeLabel(cl.label)),
  createdAt: c.createdAt.toISOString(),
  updatedAt: c.updatedAt.toISOString(),
});

export const serializeColumn = (col: ColumnWith): ColumnDTO => ({
  id: col.id,
  boardId: col.boardId,
  title: col.title,
  position: col.position,
  cards: col.cards.map(serializeCard),
});

export const serializeMember = (m: MemberWith): BoardMemberDTO => ({
  id: m.id,
  boardId: m.boardId,
  userId: m.userId,
  role: m.role as BoardRole,
  user: toPublicUser(m.user),
});

export const serializeBoardDetail = (
  b: BoardWith,
  role: BoardRole
): BoardDetailDTO => ({
  id: b.id,
  title: b.title,
  ownerId: b.ownerId,
  role,
  memberCount: b.members.length,
  createdAt: b.createdAt.toISOString(),
  updatedAt: b.updatedAt.toISOString(),
  columns: b.columns.map(serializeColumn),
  labels: b.labels.map(serializeLabel),
  members: b.members.map(serializeMember),
});

export const serializeBoardSummary = (
  b: {
    id: string;
    title: string;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
    _count: { members: number };
  },
  role: BoardRole
): BoardSummaryDTO => ({
  id: b.id,
  title: b.title,
  ownerId: b.ownerId,
  role,
  memberCount: b._count.members,
  createdAt: b.createdAt.toISOString(),
  updatedAt: b.updatedAt.toISOString(),
});

export const serializeActivity = (a: ActivityWith): ActivityDTO => ({
  id: a.id,
  boardId: a.boardId,
  userId: a.userId,
  user: a.user ? toPublicUser(a.user) : null,
  type: a.type,
  metadata: (a.metadata as Record<string, unknown>) ?? {},
  createdAt: a.createdAt.toISOString(),
});

export const serializeInvite = (i: {
  id: string;
  boardId: string;
  email: string;
  role: string;
  status: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
}): InviteDTO => ({
  id: i.id,
  boardId: i.boardId,
  email: i.email,
  role: i.role as BoardRole,
  status: i.status as InviteDTO["status"],
  token: i.token,
  createdAt: i.createdAt.toISOString(),
  expiresAt: i.expiresAt.toISOString(),
});
