'use strict';

const { RECONNECT_GRACE_WINDOW_MS } = require('../config/constants');
const roomManager = require('./RoomManager');

/**
 * Manages temporary disconnect grace windows for players.
 *
 * Storage key format: `${nickname.toLowerCase()}:${roomCode}`
 *
 * Safety behavior:
 * - Starting a grace period always clears an older one first.
 * - Reconnect flow is guarded against duplicate join events.
 * - A player is removed on timeout only if still disconnected.
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
    * Starts a reconnect grace period for a disconnected player.
    * Cancels any existing grace period for the same player first.
    *
    * @param {string} nickname Player nickname.
    * @param {string} roomCode Room code.
    * @param {string} socketId Disconnected socket id.
    * @param {import('socket.io').Server} io Socket.IO server instance.
   */
  startGracePeriod(nickname, roomCode, socketId, io) {
    const key = this._key(nickname, roomCode);
    this.cancelGracePeriod(nickname, roomCode); // Safe to call repeatedly.

    const timer = setTimeout(() => {
      this.gracePeriods.delete(key);

      const room = roomManager.getRoom(roomCode);
      if (!room) return;

      // Remove only if the player is still disconnected.
      // Reconnected players are already remapped to a new socket id.
      const player = room.players.get(socketId);
      if (!player || player.isConnected) {
        // Player already reconnected.
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
    * Runs the full reconnect flow:
   * 1. Cancel grace period.
   * 2. Swap player socket id in room state.
   * 3. Notify game engine about id change.
   * 4. Send the restored state to the reconnected client.
   *
    * @param {import('socket.io').Socket} socket Reconnected socket.
    * @param {string} nickname Player nickname.
    * @param {string} roomCode Room code.
   * @returns {{ ok: boolean, error?: string }}
   */
  handleReconnect(socket, nickname, roomCode) {
    const oldSocketId = this.getGracePeriodSocketId(nickname, roomCode);
    if (!oldSocketId) {
      // Guard against duplicate join_room events.
      const room = roomManager.getRoom(roomCode);
      if (room) {
        const existingPlayer = roomManager.findPlayerByNickname(roomCode, nickname);
        if (existingPlayer && existingPlayer.id === socket.id && existingPlayer.isConnected) {
          // Player is already restored, so send current state again.
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

    // Extra guard in case old and new socket ids match.
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
