import type { Server } from "socket.io";
import {
  ServerToClientEvents,
  ClientToServerEvents,
  boardRoom,
} from "@devboard/shared";

type IO = Server<ClientToServerEvents, ServerToClientEvents>;

let io: IO | null = null;

/** Called once during bootstrap (Step 5) to register the Socket.IO server. */
export function registerIo(server: IO): void {
  io = server;
}

/**
 * Emit an event to everyone in a board room. No-ops if Socket.IO hasn't been
 * attached (e.g. in unit tests), so services can emit unconditionally.
 */
export function emitToBoard<E extends keyof ServerToClientEvents>(
  boardId: string,
  event: E,
  ...args: Parameters<ServerToClientEvents[E]>
): void {
  if (!io) return;
  io.to(boardRoom(boardId)).emit(event, ...args);
}
