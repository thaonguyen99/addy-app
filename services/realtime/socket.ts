import { io, type Socket } from "socket.io-client";

import { API_BASE_URL } from "@/lib/env";
import type {
  ClientToServerEvents,
  MemoryJoinAck,
  ServerToClientEvents,
} from "@/services/notifications/notifications.contract";

type AddySocket = Socket<ServerToClientEvents, ClientToServerEvents>;
type EventName = keyof ServerToClientEvents;

let socket: AddySocket | null = null;
/** Memory rooms the app wants to be in; re-joined after every reconnect. */
const rooms = new Map<string, (ack: MemoryJoinAck) => void>();
/** Listeners added before the socket existed, or kept across reconnects. */
const listeners = new Map<EventName, Set<(...args: never[]) => void>>();

type Lifecycle = {
  connect: () => void;
  connectError: (error: Error) => void;
  disconnect: (reason: Socket.DisconnectReason) => void;
};
let lifecycle: Lifecycle | null = null;

function emitJoin(memoryId: string) {
  const onAck = rooms.get(memoryId);
  socket?.emit("memory:join", memoryId, (ack) => onAck?.(ack));
}

function create(token: string): AddySocket {
  const next: AddySocket = io(API_BASE_URL, {
    auth: { token },
    transports: ["websocket"],
    autoConnect: false,
  });
  next.on("connect", () => {
    for (const memoryId of rooms.keys()) emitJoin(memoryId);
    lifecycle?.connect();
  });
  next.on("connect_error", (error) => lifecycle?.connectError(error));
  next.on("disconnect", (reason) => lifecycle?.disconnect(reason));
  for (const [event, handlers] of listeners) {
    for (const handler of handlers) next.on(event, handler as never);
  }
  return next;
}

/**
 * The single Socket.IO connection to the API. The RealtimeProvider owns its
 * lifecycle; screens only join rooms and subscribe to events.
 */
export const realtime = {
  /** Connect, or reconnect with a new token. */
  connect(token: string) {
    if (!socket) socket = create(token);
    socket.auth = { token };
    if (socket.connected) socket.disconnect();
    socket.connect();
  },

  /** Use this token on the next (re)connect without dropping the connection. */
  setToken(token: string) {
    if (socket) socket.auth = { token };
  },

  disconnect() {
    socket?.disconnect();
  },

  /** Sign-out: drop the socket and every room. Listeners stay registered. */
  reset() {
    socket?.disconnect();
    socket?.removeAllListeners();
    socket = null;
    rooms.clear();
  },

  get connected() {
    return socket?.connected ?? false;
  },

  joinMemory(memoryId: string, onAck: (ack: MemoryJoinAck) => void) {
    rooms.set(memoryId, onAck);
    if (socket?.connected) emitJoin(memoryId);
  },

  leaveMemory(memoryId: string) {
    rooms.delete(memoryId);
    if (socket?.connected) socket.emit("memory:leave", memoryId);
  },

  on<E extends EventName>(event: E, handler: ServerToClientEvents[E]) {
    const set = listeners.get(event) ?? new Set();
    set.add(handler as never);
    listeners.set(event, set);
    socket?.on(event, handler as never);
    return () => {
      set.delete(handler as never);
      socket?.off(event, handler as never);
    };
  },

  /** Connection lifecycle callbacks; the RealtimeProvider sets them once. */
  setLifecycle(next: Lifecycle | null) {
    lifecycle = next;
  },
};
