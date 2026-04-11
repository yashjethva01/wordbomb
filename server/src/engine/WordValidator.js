'use strict';

const GameEngine    = require('../engine/GameEngine');
const { MAX_PLAYERS_PER_ROOM, EMPTY_ROOM_TTL_MS } = require('../config/constants');

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function generateRoomCode() {
  let c = '';
  for (let i = 0; i < 6; i++) c += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return c;
}

function validateSettings(raw) {
  const s = raw ?? {};
  return {
    lives:      Math.min(5, Math.max(1, parseInt(s.lives) || 3)),
    turnTime:   Math.min(30, Math.max(5, parseInt(s.turnTime) || 15)),
    maxPlayers: Math.min(8, Math.max(2, parseInt(s.maxPlayers) || 8)),
    difficulty: ['easy','medium','hard'].includes(s.difficulty) ? s.difficulty : 'medium',
  };
}

const VALID_AVATARS = new Set(['cat','dog','fox','frog','lion','tiger','bear','panda','unicorn','dragon','eagle','octopus','shark','wolf','robot','alien']);

class RoomManager {
  constructor() { this.rooms = new Map(); }

  createRoom(hostSocketId, nickname, avatar, settings) {
    let code;
    do { code = generateRoomCode(); } while (this.rooms.has(code));

    const safeAvatar = VALID_AVATARS.has(avatar) ? avatar : 'robot';
    const safeSets   = validateSettings(settings);
    const player = { id: hostSocketId, nickname, avatar: safeAvatar, isReady: false, isConnected: true, disconnectedAt: null };
    const room   = { code, hostId: hostSocketId, phase: 'lobby', players: new Map([[hostSocketId, player]]), settings: safeSets, engine: null, rematchVotes: new Set(), createdAt: Date.now(), emptyRoomTimer: null };

    this.rooms.set(code, room);
    return { room, player };
  }

  joinRoom(socketId, nickname, roomCode, avatar) {
    const room = this.rooms.get(roomCode);
    if (!room) return { ok: false, error: 'Room not found' };
    if (room.phase !== 'lobby') return { ok: false, error: 'Game already in progress' };
    if (room.players.size >= (room.settings?.maxPlayers ?? MAX_PLAYERS_PER_ROOM)) return { ok: false, error: 'Room is full' };

    for (const p of room.players.values()) {
      if (p.nickname.toLowerCase() === nickname.toLowerCase()) return { ok: false, error: 'Nickname already taken in this room' };
    }

    const safeAvatar = VALID_AVATARS.has(avatar) ? avatar : 'robot';
    for (const p of room.players.values()) {
      if (p.avatar === safeAvatar) return { ok: false, error: 'Avatar already taken. Choose another!', code: 'AVATAR_TAKEN' };
    }

    const player = { id: socketId, nickname, avatar: safeAvatar, isReady: false, isConnected: true, disconnectedAt: null };
    room.players.set(socketId, player);
    this._cancelEmptyRoomTimer(room);
    return { ok: true, room, player };
  }

  removePlayer(socketId, roomCode, io) {
    const room = this.rooms.get(roomCode);
    if (!room) return { room: null, wasHost: false, roomEmpty: true };

    const wasHost = room.hostId === socketId;
    room.players.delete(socketId);

    if (room.players.size === 0) { this._scheduleEmptyRoomDestroy(room); return { room, wasHost, roomEmpty: true }; }

    if (wasHost) {
      const newHost = [...room.players.values()].find(p => p.isConnected) || room.players.values().next().value;
      room.hostId = newHost.id;
      io.to(roomCode).emit('host_migrated', { newHostId: newHost.id, newHostNickname: newHost.nickname });
    }

    return { room, wasHost, roomEmpty: false };
  }

  startGame(roomCode, io) {
    const room = this.rooms.get(roomCode);
    if (!room) return { ok: false, error: 'Room not found' };
    if (room.phase !== 'lobby') return { ok: false, error: 'Already started' };

    const connected = [...room.players.values()].filter(p => p.isConnected);
    if (connected.length < 2) return { ok: false, error: 'Need at least 2 players' };

    room.phase  = 'game';
    room.engine = new GameEngine(roomCode, connected, io, () => { room.phase = 'finished'; }, room.settings);
    room.engine.startGame();
    return { ok: true };
  }

  resetForRematch(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return null;
    if (room.engine) { room.engine.destroy(); room.engine = null; }
    for (const p of room.players.values()) p.isReady = false;
    room.phase = 'lobby';
    room.rematchVotes = new Set();
    return room;
  }

  voteRematch(socketId, roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return { voted:false, allVoted:false, votes:0, required:0 };
    room.rematchVotes.add(socketId);
    const connected = [...room.players.values()].filter(p => p.isConnected).length;
    const allVoted  = room.rematchVotes.size >= connected;
    return { voted:true, allVoted, votes:room.rematchVotes.size, required:connected };
  }

  setPlayerReady(socketId, roomCode, ready) {
    const room = this.rooms.get(roomCode);
    if (!room) return { ok:false, allReady:false };
    const player = room.players.get(socketId);
    if (!player) return { ok:false, allReady:false };
    player.isReady = ready;
    const connected = [...room.players.values()].filter(p => p.isConnected);
    const allReady  = connected.length >= 2 && connected.every(p => p.isReady);
    return { ok:true, allReady };
  }

  getRoom(roomCode)             { return this.rooms.get(roomCode) || null; }
  getPlayer(roomCode, socketId) { return this.rooms.get(roomCode)?.players.get(socketId) || null; }

  findPlayerByNickname(roomCode, nickname) {
    const room = this.rooms.get(roomCode);
    if (!room) return null;
    for (const p of room.players.values()) { if (p.nickname.toLowerCase() === nickname.toLowerCase()) return p; }
    return null;
  }

  serializeRoom(room) {
    return { code: room.code, hostId: room.hostId, phase: room.phase, settings: room.settings, players: [...room.players.values()].map(p => this.serializePlayer(p)) };
  }

  serializePlayer(player) {
    return { id: player.id, nickname: player.nickname, avatar: player.avatar, isReady: player.isReady, isConnected: player.isConnected };
  }

  destroyRoom(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return;
    if (room.engine) { room.engine.destroy(); room.engine = null; }
    this._cancelEmptyRoomTimer(room);
    this.rooms.delete(roomCode);
    console.log(`[RoomManager] Room ${roomCode} destroyed`);
  }

  _scheduleEmptyRoomDestroy(room) {
    this._cancelEmptyRoomTimer(room);
    room.emptyRoomTimer = setTimeout(() => {
      if (this.rooms.has(room.code) && room.players.size === 0) this.destroyRoom(room.code);
    }, EMPTY_ROOM_TTL_MS);
  }

  _cancelEmptyRoomTimer(room) {
    if (room.emptyRoomTimer) { clearTimeout(room.emptyRoomTimer); room.emptyRoomTimer = null; }
  }
}

module.exports = new RoomManager();
