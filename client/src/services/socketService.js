import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3002';

let socket  = null;
// Remembers if we have connected before, so callers can detect reconnects.
let _wasConnected = false;

function getSocket() {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect:          false,

      // Transport settings.
      // Prefer WebSocket early to reduce latency and reconnect noise.
      transports:           ['websocket', 'polling'],
      upgrade:              true,

      // Reconnect strategy.
      reconnection:         true,
      reconnectionDelay:    1500,
      reconnectionDelayMax: 8000,
      reconnectionAttempts: 20,

      // Keep timeout values aligned with server settings.
      timeout:              45000,
    });

    // Track whether the socket has connected at least once.
    socket.on('connect',    () => { _wasConnected = true;  });
    socket.on('disconnect', () => { /* Keep _wasConnected true for reconnect detection. */ });
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
 * Registers a socket event listener.
 *
 * @param {string} event Socket event name.
 * @param {(payload: any) => void} handler Event callback.
 * @returns {() => void} Cleanup function that removes the listener.
 */
function on(event, handler) {
  getSocket().on(event, handler);
  return () => getSocket().off(event, handler);
}

function off(event, handler) {
  getSocket().off(event, handler);
}

/**
 * Registers a manager-level event listener.
 * Use this for events such as reconnect that are emitted by the manager.
 *
 * @param {string} event Manager event name.
 * @param {(payload: any) => void} handler Event callback.
 * @returns {() => void} Cleanup function that removes the listener.
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
