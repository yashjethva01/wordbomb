'use strict';

const { RECONNECT_GRACE_WINDOW_MS } = require('../config/constants');
const roomManager = require('./RoomManager');

/**
 * ReconnectHandler manages 30-second grace windows.
 *
 * Key: `${nickname.toLowerCase()}:${roomCode}`
 *
 * Bug-proofing notes:
 *  - startGracePeriod always cancels any existing period first (idempotent)
 *  - handleReconnect is guarded: if the player is already in the room with
 *    the new socket ID (e.g. double-fire), it returns ok=true safely.
 *  - removePlayer called by grace expiry only after re-checking that the
 *    player is still marked as disconnected.
 */
class ReconnectHandler {
  constructor() {
    /** @type {Map<string, { timer: NodeJS.Timeout, oldSocketId: string }>} */
    this.gracePeriods = new Map();
  }

  _key(nickname, roomCode) {
    return `${nickname.toLowerCase()}:${roomCode}`;
  }

  /**
   * Start a grace period. Cancels any existing one for the same key first.
   */
  startGracePeriod(nickname, roomCode, socketId, io) {
    const key = this._key(nickname, roomCode);
    this.cancelGracePeriod(nickname, roomCode);   // always idempotent

    const timer = setTimeout(() => {
      this.gracePeriods.delete(key);

      const room = roomManager.getRoom(roomCode);
      if (!room) return;

      // Only remove if the player is still marked as disconnected.
      // If they reconnected successfully, their socketId was already swapped
      // and they would not be found under the old socketId.
      const player = room.players.get(socketId);
      if (!player || player.isConnected) {
        // Player already reconnected — nothing to do
        return;
      }

      if (room.phase === 'game' && room.engine) {
        room.engine.eliminateDisconnected(socketId);
      }

      roomManager.removePlayer(socketId, roomCode, io);
      console.log(`[ReconnectHandler] Grace expired: ${nickname} removed from ${roomCode}`);
    }, RECONNECT_GRACE_WINDOW_MS);

    this.gracePeriods.set(key, { timer, oldSocketId: socketId });
    console.log(`[ReconnectHandler] Grace started: ${nickname} in ${roomCode} (${RECONNECT_GRACE_WINDOW_MS / 1000}s)`);
  }

  cancelGracePeriod(nickname, roomCode) {
    const key   = this._key(nickname, roomCode);
    const entry = this.gracePeriods.get(key);
    if (entry) {
      clearTimeout(entry.timer);
      this.gracePeriods.delete(key);
    }
  }

  getGracePeriodSocketId(nickname, roomCode) {
    const entry = this.gracePeriods.get(this._key(nickname, roomCode));
    return entry ? entry.oldSocketId : null;
  }

  /**
   * Full reconnect flow:
   *  1. Cancel grace period
   *  2. Swap socket IDs in room.players
   *  3. Notify game engine
   *  4. Re-emit full state to reconnected socket
   *
   * @returns {{ ok: boolean, error?: string }}
   */
  handleReconnect(socket, nickname, roomCode) {
    const oldSocketId = this.getGracePeriodSocketId(nickname, roomCode);
    if (!oldSocketId) {
      // Check if the player is already in the room with a current socket
      // (double-fire protection — client sent join_room twice)
      const room = roomManager.getRoom(roomCode);
      if (room) {
        const existingPlayer = roomManager.findPlayerByNickname(roomCode, nickname);
        if (existingPlayer && existingPlayer.id === socket.id && existingPlayer.isConnected) {
          // Already correctly in the room — just re-send state
          const payload = { roomState: roomManager.serializeRoom(room), yourId: socket.id };
          if (room.phase === 'game' && room.engine) payload.gameState = room.engine.getStateSnapshot();
          socket.emit('game_state_restored', payload);
          return { ok: true };
        }
      }
      return { ok: false, error: 'Reconnect window expired or not found' };
    }

    const room = roomManager.getRoom(roomCode);
    if (!room) return { ok: false, error: 'Room no longer exists' };

    this.cancelGracePeriod(nickname, roomCode);

    const newSocketId = socket.id;

    // Guard: if old and new ID are the same (shouldn't happen but be safe)
    if (oldSocketId !== newSocketId) {
      const player = room.players.get(oldSocketId);
      if (player) {
        player.id             = newSocketId;
        player.isConnected    = true;
        player.disconnectedAt = null;
        room.players.delete(oldSocketId);
        room.players.set(newSocketId, player);
      }

      if (room.hostId === oldSocketId) room.hostId = newSocketId;
    }

    socket.join(roomCode);
    socket.roomCode = roomCode;
    socket.nickname = nickname;

    if (room.phase === 'game' && room.engine) {
      room.engine.handlePlayerReconnect(oldSocketId, newSocketId);
    }

    const payload = { roomState: roomManager.serializeRoom(room), yourId: newSocketId };
    if (room.phase === 'game' && room.engine) {
      payload.gameState = room.engine.getStateSnapshot();
    }

    socket.emit('game_state_restored', payload);
    console.log(`[ReconnectHandler] ${nickname} reconnected to ${roomCode} (${oldSocketId} → ${newSocketId})`);
    return { ok: true };
  }
}

module.exports = new ReconnectHandler();
