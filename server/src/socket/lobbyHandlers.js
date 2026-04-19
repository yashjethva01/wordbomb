'use strict';

const roomManager      = require('../managers/RoomManager');
const reconnectHandler = require('../managers/ReconnectHandler');
const { emitToRoom, emitToRoomExcept, emitError, sanitizeString } = require('./socketHelpers');
const { MIN_PLAYERS_TO_START } = require('../config/constants');

function registerLobbyHandlers(socket, io) {

  // Create a new room.
  socket.on('create_room', ({ nickname, avatar, settings } = {}) => {
    const cleanNickname = sanitizeString(nickname, 20);
    if (!cleanNickname) return emitError(socket, 'INVALID_NICKNAME', 'Nickname must be 1–20 characters');
    if (!/^[a-zA-Z0-9 _-]+$/.test(cleanNickname)) return emitError(socket, 'INVALID_NICKNAME', 'Nickname contains invalid characters');

    // If this socket already has a room, return that room state.
    if (socket.roomCode) {
      const existing = roomManager.getRoom(socket.roomCode);
      if (existing) {
        socket.emit('room_created', { roomState: roomManager.serializeRoom(existing), yourId: socket.id });
        return;
      }
    }

    const { room, player } = roomManager.createRoom(socket.id, cleanNickname, avatar, settings);
    socket.join(room.code);
    socket.roomCode = room.code;
    socket.nickname = cleanNickname;
    socket.emit('room_created', { roomState: roomManager.serializeRoom(room), yourId: socket.id });
    console.log(`[Lobby] Room ${room.code} created by ${cleanNickname}`);
  });

  // Join an existing room.
  socket.on('join_room', ({ nickname, roomCode, avatar } = {}) => {
    const cleanNickname = sanitizeString(nickname, 20);
    const cleanCode     = sanitizeString(roomCode, 6);

    if (!cleanNickname) return emitError(socket, 'INVALID_NICKNAME', 'Nickname must be 1–20 characters');
    if (!cleanCode)     return emitError(socket, 'INVALID_CODE',     'Invalid room code');
    if (!/^[a-zA-Z0-9 _-]+$/.test(cleanNickname)) return emitError(socket, 'INVALID_NICKNAME', 'Nickname contains invalid characters');

    const upperCode = cleanCode.toUpperCase();

    // If already in this room, just send the latest state again.
    if (socket.roomCode === upperCode) {
      const room = roomManager.getRoom(upperCode);
      if (room) {
        const payload = { roomState: roomManager.serializeRoom(room), yourId: socket.id };
        if (room.phase === 'game' && room.engine) payload.gameState = room.engine.getStateSnapshot();
        socket.emit('room_joined', payload);
        return;
      }
    }

    // If grace period is active, treat this as a reconnect.
    const oldSocketId = reconnectHandler.getGracePeriodSocketId(cleanNickname, upperCode);
    if (oldSocketId) {
      const result = reconnectHandler.handleReconnect(socket, cleanNickname, upperCode);
      if (!result.ok) return emitError(socket, 'RECONNECT_FAILED', result.error);

      emitToRoomExcept(socket, upperCode, 'player_reconnected', {
        oldPlayerId: oldSocketId,
        newPlayerId: socket.id,
        nickname:    cleanNickname,
      });
      console.log(`[Lobby] ${cleanNickname} reconnected to ${upperCode}`);
      return;
    }

    // Normal join flow.
    const result = roomManager.joinRoom(socket.id, cleanNickname, upperCode, avatar);
    if (!result.ok) {
      const code = result.code === 'AVATAR_TAKEN' ? 'AVATAR_TAKEN' : 'JOIN_FAILED';
      return emitError(socket, code, result.error);
    }

    socket.join(upperCode);
    socket.roomCode = upperCode;
    socket.nickname = cleanNickname;
    socket.emit('room_joined', { roomState: roomManager.serializeRoom(result.room), yourId: socket.id });
    emitToRoomExcept(socket, upperCode, 'player_joined', { player: roomManager.serializePlayer(result.player) });
    console.log(`[Lobby] ${cleanNickname} (${result.player.avatar}) joined ${upperCode}`);
  });

  // Update ready state in the lobby.
  socket.on('player_ready', ({ ready } = {}) => {
    const roomCode = socket.roomCode;
    if (!roomCode) return;
    const room = roomManager.getRoom(roomCode);
    if (!room || room.phase !== 'lobby') return;

    const { ok, allReady } = roomManager.setPlayerReady(socket.id, roomCode, Boolean(ready));
    if (!ok) return;

    emitToRoom(io, roomCode, 'player_ready_changed', { playerId: socket.id, nickname: socket.nickname, ready: Boolean(ready) });
    if (allReady) emitToRoom(io, roomCode, 'all_players_ready', {});
  });

  // Start game (host only).
  socket.on('start_game', () => {
    const roomCode = socket.roomCode;
    if (!roomCode) return;
    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    if (room.hostId !== socket.id) return emitError(socket, 'NOT_HOST', 'Only the host can start the game');
    if (room.phase !== 'lobby')    return emitError(socket, 'ALREADY_STARTED', 'Game already in progress');

    const connected = [...room.players.values()].filter(p => p.isConnected);
    if (connected.length < MIN_PLAYERS_TO_START) {
      return emitError(socket, 'NOT_ENOUGH_PLAYERS', `Need at least ${MIN_PLAYERS_TO_START} players`);
    }
    if (connected.some(p => !p.isReady)) {
      return emitError(socket, 'PLAYERS_NOT_READY', 'Not all players are ready');
    }

    const startResult = roomManager.startGame(roomCode, io);
    if (!startResult.ok) return emitError(socket, 'START_FAILED', startResult.error);
    console.log(`[Lobby] Game started in ${roomCode}`);
  });

  // Leave room request from client.
  socket.on('leave_room', () => { handleLeaveOrDisconnect(socket, io, false); });
}

function handleLeaveOrDisconnect(socket, io, isDisconnect = false) {
  const roomCode = socket.roomCode;
  if (!roomCode) return;

  const room = roomManager.getRoom(roomCode);
  if (!room) return;

  const player = room.players.get(socket.id);
  if (!player) return;

  if (isDisconnect && room.phase === 'game' && room.engine) {
    // During a live game, start grace period instead of removing instantly.
    player.isConnected    = false;
    player.disconnectedAt = Date.now();

    room.engine.handlePlayerDisconnect(socket.id);

    // Start only one grace timer per player to avoid duplicate timeouts.
    if (!reconnectHandler.getGracePeriodSocketId(socket.nickname, roomCode)) {
      reconnectHandler.startGracePeriod(socket.nickname, roomCode, socket.id, io);
    }

    emitToRoomExcept(socket, roomCode, 'player_connection_changed', {
      playerId:    socket.id,
      nickname:    socket.nickname,
      isConnected: false,
    });
    console.log(`[Lobby] ${socket.nickname} disconnected from ${roomCode} (grace started)`);
    return;
  }

  // Permanent leave path (lobby exit or explicit leave_room).
  reconnectHandler.cancelGracePeriod(socket.nickname, roomCode);
  const { roomEmpty } = roomManager.removePlayer(socket.id, roomCode, io);

  if (!roomEmpty) {
    emitToRoom(io, roomCode, 'player_left', {
      playerId: socket.id,
      nickname: socket.nickname || player.nickname,
    });
  }

  socket.leave(roomCode);
  socket.roomCode = null;
  socket.nickname = null;
  console.log(`[Lobby] ${player.nickname} left ${roomCode}`);
}

module.exports = { registerLobbyHandlers, handleLeaveOrDisconnect };
