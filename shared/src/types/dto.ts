/**
 * Serialized entity shapes returned by the API (dates as ISO strings).
 * These are what the client actually receives over the wire.
 */
import { BoardRole, InviteStatus, ActivityType } from "./enums";
import { PublicUser } from "../schemas/auth";

export interface LabelDTO {
  id: string;
  boardId: string;
  name: string;
  color: string;
}

export interface CardDTO {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  position: number;
  assigneeId: string | null;
  assignee: PublicUser | null;
  labels: LabelDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface ColumnDTO {
  id: string;
  boardId: string;
  title: string;
  position: number;
  cards: CardDTO[];
}

export interface BoardMemberDTO {
  id: string;
  boardId: string;
  userId: string;
  role: BoardRole;
  user: PublicUser;
}

/** Summary used in the board list (no nested columns/cards). */
export interface BoardSummaryDTO {
  id: string;
  title: string;
  ownerId: string;
  role: BoardRole;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Full board with columns, cards, labels, members. */
export interface BoardDetailDTO extends BoardSummaryDTO {
  columns: ColumnDTO[];
  labels: LabelDTO[];
  members: BoardMemberDTO[];
}

export interface InviteDTO {
  id: string;
  boardId: string;
  email: string;
  role: BoardRole;
  status: InviteStatus;
  createdAt: string;
  expiresAt: string;
}

export interface ActivityDTO {
  id: string;
  boardId: string;
  userId: string | null;
  user: PublicUser | null;
  type: ActivityType;
  metadata: Record<string, unknown>;
  createdAt: string;
}
