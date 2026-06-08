/**
 * Domain enums shared between client and server.
 * Kept in sync with the Prisma schema enums.
 */

export const BoardRole = {
  OWNER: "OWNER",
  EDITOR: "EDITOR",
  VIEWER: "VIEWER",
} as const;
export type BoardRole = (typeof BoardRole)[keyof typeof BoardRole];

/** Roles ordered by privilege (low → high). Used for access checks. */
export const ROLE_RANK: Record<BoardRole, number> = {
  VIEWER: 1,
  EDITOR: 2,
  OWNER: 3,
};

export const InviteStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  REVOKED: "REVOKED",
} as const;
export type InviteStatus = (typeof InviteStatus)[keyof typeof InviteStatus];

export const ActivityType = {
  BOARD_CREATED: "BOARD_CREATED",
  BOARD_UPDATED: "BOARD_UPDATED",
  COLUMN_CREATED: "COLUMN_CREATED",
  COLUMN_UPDATED: "COLUMN_UPDATED",
  COLUMN_DELETED: "COLUMN_DELETED",
  CARD_CREATED: "CARD_CREATED",
  CARD_UPDATED: "CARD_UPDATED",
  CARD_MOVED: "CARD_MOVED",
  CARD_DELETED: "CARD_DELETED",
  MEMBER_INVITED: "MEMBER_INVITED",
  MEMBER_JOINED: "MEMBER_JOINED",
  MEMBER_ROLE_CHANGED: "MEMBER_ROLE_CHANGED",
  MEMBER_REMOVED: "MEMBER_REMOVED",
} as const;
export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];
