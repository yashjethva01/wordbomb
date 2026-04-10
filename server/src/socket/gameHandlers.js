'use strict';

const roomManager = require('../managers/RoomManager');
const { emitToRoom, emitError, sanitizeString } = require('./socketHelpers');

const ALLOWED_EMOJIS = new Set([
  '😂','😱','🔥','💀','👏','😤','🤯','😎','🥶','💩','🎉','👀',
  '😭','🤡','💪','🫡','❤️','⚡','🙏','😅',
]);

function registerGameHandlers(socket, io) {

  socket.on('submit_word', ({ word, turnId } = {}) => {
    const roomCode = socket.roomCode;
    if (!roomCode) return;
    const room = roomManager.getRoom(roomCode);
    if (!room || room.phase !== 'game' || !room.engine) return;

    const cleanWord = sanitizeString(word, 64);
    if (!cleanWord || typeof turnId !== 'string') return;

    room.engine.handleSubmission(socket.id, cleanWord, turnId);
  });

  socket.on('send_reaction', ({ emoji } = {}) => {
    const roomCode = socket.roomCode;
    if (!roomCode) return;
    const room = roomManager.getRoom(roomCode);
    if (!room) return;
    if (!ALLOWED_EMOJIS.has(emoji)) return;

    emitToRoom(io, roomCode, 'reaction_received', {
      playerId: socket.id,
      nickname: socket.nickname,
      emoji,
    });
  });

  socket.on('request_rematch', () => {
    const roomCode = socket.roomCode;
    if (!roomCode) return;
    const room = roomManager.getRoom(roomCode);
    if (!room || room.phase !== 'finished') return;

    const { voted, allVoted, votes, required } = roomManager.voteRematch(socket.id, roomCode);
    if (!voted) return;

    emitToRoom(io, roomCode, 'rematch_votes', { votes, required });

    if (allVoted) {
      const resetRoom = roomManager.resetForRematch(roomCode);
      if (resetRoom) {
        emitToRoom(io, roomCode, 'rematch_started', { roomState: roomManager.serializeRoom(resetRoom) });
        console.log(`[Game] Rematch started in ${roomCode}`);
      }
    }
  });

  socket.on('request_game_state', () => {
    const roomCode = socket.roomCode;
    if (!roomCode) return;
    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    const payload = { roomState: roomManager.serializeRoom(room), yourId: socket.id };
    if (room.phase === 'game' && room.engine) {
      payload.gameState = room.engine.getStateSnapshot();
    }
    socket.emit('game_state_restored', payload);
  });
}

module.exports = { registerGameHandlers };
