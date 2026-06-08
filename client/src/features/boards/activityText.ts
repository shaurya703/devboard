import { ActivityDTO, ActivityType } from "@devboard/shared";

/** Human-readable sentence for an activity entry. */
export function describeActivity(a: ActivityDTO): string {
  const who = a.user?.name ?? "Someone";
  const m = a.metadata as Record<string, string>;
  switch (a.type) {
    case ActivityType.BOARD_CREATED:
      return `${who} created the board`;
    case ActivityType.BOARD_UPDATED:
      return `${who} renamed the board to “${m.title}”`;
    case ActivityType.COLUMN_CREATED:
      return `${who} added column “${m.title}”`;
    case ActivityType.COLUMN_UPDATED:
      return `${who} updated a column`;
    case ActivityType.COLUMN_DELETED:
      return `${who} deleted a column`;
    case ActivityType.CARD_CREATED:
      return `${who} created card “${m.title}”`;
    case ActivityType.CARD_UPDATED:
      return `${who} updated card “${m.title}”`;
    case ActivityType.CARD_MOVED:
      return `${who} moved a card`;
    case ActivityType.CARD_DELETED:
      return `${who} deleted a card`;
    case ActivityType.MEMBER_INVITED:
      return `${who} invited ${m.email} as ${String(m.role).toLowerCase()}`;
    case ActivityType.MEMBER_JOINED:
      return `${who} added ${m.email ?? "a member"} to the board`;
    case ActivityType.MEMBER_ROLE_CHANGED:
      return `${who} changed a member's role to ${String(m.role).toLowerCase()}`;
    case ActivityType.MEMBER_REMOVED:
      return `${who} removed a member`;
    default:
      return `${who} made a change`;
  }
}
