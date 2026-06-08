/**
 * Typed Socket.IO contract shared by server and client.
 *
 * Rooms are keyed by `board:<boardId>`. A client joins a board room and
 * receives every mutation other members make. The server is the source of
 * truth: it emits the canonical entity, clients reconcile their cache.
 */
import {
  BoardDetailDTO,
  CardDTO,
  ColumnDTO,
  ActivityDTO,
  BoardMemberDTO,
} from "./types/dto";

export const SOCKET_EVENTS = {
  // client → server
  JOIN_BOARD: "board:join",
  LEAVE_BOARD: "board:leave",
  // server → client
  CARD_CREATED: "card:created",
  CARD_UPDATED: "card:updated",
  CARD_MOVED: "card:moved",
  CARD_DELETED: "card:deleted",
  COLUMN_CREATED: "column:created",
  COLUMN_UPDATED: "column:updated",
  COLUMN_DELETED: "column:deleted",
  BOARD_UPDATED: "board:updated",
  MEMBER_CHANGED: "member:changed",
  ACTIVITY_CREATED: "activity:created",
} as const;

export const boardRoom = (boardId: string) => `board:${boardId}`;

// --- Payloads (server → client) ---
export interface CardMovedPayload {
  card: CardDTO;
  fromColumnId: string;
  toColumnId: string;
}
export interface CardDeletedPayload {
  cardId: string;
  columnId: string;
}
export interface ColumnDeletedPayload {
  columnId: string;
}

export interface ServerToClientEvents {
  [SOCKET_EVENTS.CARD_CREATED]: (card: CardDTO) => void;
  [SOCKET_EVENTS.CARD_UPDATED]: (card: CardDTO) => void;
  [SOCKET_EVENTS.CARD_MOVED]: (payload: CardMovedPayload) => void;
  [SOCKET_EVENTS.CARD_DELETED]: (payload: CardDeletedPayload) => void;
  [SOCKET_EVENTS.COLUMN_CREATED]: (column: ColumnDTO) => void;
  [SOCKET_EVENTS.COLUMN_UPDATED]: (column: ColumnDTO) => void;
  [SOCKET_EVENTS.COLUMN_DELETED]: (payload: ColumnDeletedPayload) => void;
  [SOCKET_EVENTS.BOARD_UPDATED]: (board: BoardDetailDTO) => void;
  [SOCKET_EVENTS.MEMBER_CHANGED]: (members: BoardMemberDTO[]) => void;
  [SOCKET_EVENTS.ACTIVITY_CREATED]: (activity: ActivityDTO) => void;
}

export interface ClientToServerEvents {
  [SOCKET_EVENTS.JOIN_BOARD]: (boardId: string) => void;
  [SOCKET_EVENTS.LEAVE_BOARD]: (boardId: string) => void;
}
