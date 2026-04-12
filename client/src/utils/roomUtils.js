export function getSavedSession() {
  const nickname = localStorage.getItem('wb_nickname');
  const roomCode = localStorage.getItem('wb_roomCode');
  if (nickname && roomCode) return { nickname, roomCode };
  return null;
}

export function clearSession() {
  localStorage.removeItem('wb_nickname');
  localStorage.removeItem('wb_roomCode');
}

export function saveSession(nickname, roomCode) {
  localStorage.setItem('wb_nickname', nickname);
  localStorage.setItem('wb_roomCode', roomCode);
}

export function buildShareUrl(roomCode) {
  return `${window.location.origin}/?join=${roomCode}`;
}

export function validateNickname(value) {
  const trimmed = (value ?? '').trim();
  if (trimmed.length === 0) return { ok: false, error: 'Nickname is required' };
  if (trimmed.length > 20)  return { ok: false, error: 'Max 20 characters' };
  if (!/^[a-zA-Z0-9 _-]+$/.test(trimmed)) {
    return { ok: false, error: 'Letters, numbers, spaces, _ and - only' };
  }
  return { ok: true };
}
