import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3002';

let socket  = null;
// Track whether the current `connect` event is a reconnect (vs. first connect)
let _wasConnected = false;

function getSocket() {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect:          false,

      // ── Transport ────────────────────────────────────────────────────
      // Prefer WebSocket immediately — skip the polling upgrade dance that
      // adds latency and can cause the extra disconnect/reconnect cycle.
      transports:           ['websocket', 'polling'],
      upgrade:              true,

      // ── Reconnection ─────────────────────────────────────────────────
      reconnection:         true,
      reconnectionDelay:    1500,
      reconnectionDelayMax: 8000,
      reconnectionAttempts: 20,

      // ── Timeouts ─────────────────────────────────────────────────────
      // Match server-side values so they don't fight each other.
      timeout:              45000,
    });

    // Track connection state so callers can distinguish first-connect from
    // transport-reconnect inside the 'connect' event.
    socket.on('connect',    () => { _wasConnected = true;  });
    socket.on('disconnect', () => { /* keep _wasConnected = true so next
                                       connect is treated as a reconnect */ });
  }
  return socket;
}

function connect() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

function disconnect() {
  if (socket?.connected) socket.disconnect();
}

function emit(event, payload = {}) {
  const s = getSocket();
  if (!s.connected) {
    console.warn(`[Socket] emit '${event}' while disconnected — queuing on reconnect`);
    return;
  }
  s.emit(event, payload);
}

/**
 * Register a listener on the socket.
 * Returns a cleanup function that removes it.
 */
function on(event, handler) {
  getSocket().on(event, handler);
  return () => getSocket().off(event, handler);
}

function off(event, handler) {
  getSocket().off(event, handler);
}

/**
 * Register a one-time listener on the socket manager.
 * Used to listen for 'reconnect' which is emitted by the Manager, not socket.
 */
function onManager(event, handler) {
  const mgr = getSocket().io;
  mgr.on(event, handler);
  return () => mgr.off(event, handler);
}

function getSocketId()  { return socket?.id ?? null; }
function isConnected()  { return socket?.connected ?? false; }
function wasReconnect() { return _wasConnected; }

const socketService = {
  connect, disconnect, emit, on, off, onManager,
  getSocketId, isConnected, wasReconnect, getSocket,
};

export default socketService;
