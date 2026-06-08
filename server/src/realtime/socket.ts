import { Server } from "socket.io";
import type http from "http";
import {
  ServerToClientEvents,
  ClientToServerEvents,
  SOCKET_EVENTS,
  boardRoom,
} from "@devboard/shared";
import { allowedOrigins } from "../config/env";
import { verifyAccessToken } from "../lib/jwt";
import { prisma } from "../lib/prisma";
import { registerIo } from "./emitter";

interface SocketData {
  userId: string;
  email: string;
}

/**
 * Attach a Socket.IO server to the HTTP server.
 *
 * - Handshake auth: the client sends its access token in `auth.token`;
 *   an invalid/missing token rejects the connection.
 * - Rooms: clients join `board:<id>` only after a membership check, so a user
 *   can't subscribe to a board they can't access.
 */
export function attachSocket(server: http.Server): Server {
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
  >(server, {
    cors: { origin: allowedOrigins, credentials: true },
  });

  // Authenticate every connection from the access token.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Unauthorized"));
    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.sub;
      socket.data.email = payload.email;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.on(SOCKET_EVENTS.JOIN_BOARD, async (boardId) => {
      // Only allow joining boards the user is a member of.
      const membership = await prisma.boardMember.findUnique({
        where: {
          boardId_userId: { boardId, userId: socket.data.userId },
        },
      });
      if (membership) socket.join(boardRoom(boardId));
    });

    socket.on(SOCKET_EVENTS.LEAVE_BOARD, (boardId) => {
      socket.leave(boardRoom(boardId));
    });
  });

  registerIo(io);
  return io;
}
