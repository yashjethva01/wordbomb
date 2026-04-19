'use strict';

const { Server }                      = require('socket.io');
const { registerLobbyHandlers,
        handleLeaveOrDisconnect }     = require('./lobbyHandlers');
const { registerGameHandlers }        = require('./gameHandlers');

function initSocketIO(httpServer, clientUrl) {
  const io = new Server(httpServer, {
    cors: {
      origin:      clientUrl,
      methods:     ['GET', 'POST'],
      credentials: true,
    },

    // Heartbeat values are relaxed to reduce false disconnects.
    pingTimeout:     60000,   // Wait 60s for pong before disconnecting.
    pingInterval:    25000,   // Send ping every 25s.
    upgradeTimeout:  15000,

    // Prefer WebSocket first and keep polling as fallback.
    // This helps avoid unnecessary reconnect cycles.
    transports:      ['websocket', 'polling'],

    // Allow a larger message burst for busy turns.
    maxHttpBufferSize: 1e6,   // 1 MB buffer.

    // Let transport reconnect happen without forcing a new game session.
    // The grace-period logic handles restoring the player identity.
    connectTimeout:  45000,
  });

  io.use((socket, next) => {
    socket.connectedAt = Date.now();
    next();
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);
    socket.roomCode = null;
    socket.nickname = null;

    registerLobbyHandlers(socket, io);
    registerGameHandlers(socket, io);

    socket.on('disconnect', (reason) => {
      console.log(
        `[Socket] Disconnected: ${socket.id}` +
        ` (${socket.nickname || 'unnamed'}, reason: ${reason})`
      );
      handleLeaveOrDisconnect(socket, io, true);
    });

    socket.on('error', (err) => {
      console.error(`[Socket] Error on ${socket.id}:`, err);
    });
  });

  console.log('[Socket.IO] Initialised');
  return io;
}

module.exports = { initSocketIO };
