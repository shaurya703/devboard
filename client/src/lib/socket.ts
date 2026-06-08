import { io, Socket } from "socket.io-client";
import {
  ServerToClientEvents,
  ClientToServerEvents,
} from "@devboard/shared";
import { getAccessToken, API_URL } from "./api";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? API_URL;

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

/** Lazily create the singleton socket, authenticating with the access token. */
export function getSocket(): AppSocket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      withCredentials: true,
      auth: (cb) => cb({ token: getAccessToken() ?? "" }),
    });
  }
  return socket;
}

export function connectSocket(): void {
  const s = getSocket();
  if (!s.connected) s.connect();
}

export function disconnectSocket(): void {
  socket?.disconnect();
}
