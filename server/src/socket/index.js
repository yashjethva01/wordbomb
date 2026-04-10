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

    // ── Heartbeat tuning ───────────────────────────────────────────────
    // Generous values prevent false disconnects when the server is busy
    // processing game events for 3+ simultaneous players.
    pingTimeout:     60000,   // wait 60s for a pong before declaring dead
    pingInterval:    25000,   // send ping every 25s (down from 10s)
    upgradeTimeout:  15000,

    // Always prefer WebSocket; fall back to polling only if WS unavailable.
    // Mixing transports mid-session triggers unnecessary reconnects.
    transports:      ['websocket', 'polling'],

    // Larger buffer so a burst of game events doesn't stall the connection.
    maxHttpBufferSize: 1e6,   // 1 MB

    // Allow socket.io to reconnect at the transport layer without creating
    // a new application-level session. The client grace-period handles app
    // level re-association.
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
