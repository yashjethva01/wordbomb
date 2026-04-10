'use strict';

function emitToRoom(io, roomCode, event, data)          { io.to(roomCode).emit(event, data); }
function emitToPlayer(io, socketId, event, data)        { io.to(socketId).emit(event, data); }
function emitToRoomExcept(socket, roomCode, event, data){ socket.to(roomCode).emit(event, data); }
function emitError(socket, code, message)               { socket.emit('room_error', { code, message }); }

function sanitizeString(value, maxLength = 64) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) return null;
  return trimmed;
}

module.exports = { emitToRoom, emitToPlayer, emitToRoomExcept, emitError, sanitizeString };
