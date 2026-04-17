import { buildShareUrl } from './roomUtils';

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (_) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity  = '0';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch (__) { return false; }
  }
}

export function buildWinnerShareText(winnerNickname, stats, roomCode) {
  const url = buildShareUrl(roomCode);
  return (
    `🏆 ${winnerNickname} won WordBomb!\n` +
    `💣 ${stats?.totalTurns ?? 0} turns, ${stats?.uniqueWordsUsed ?? 0} unique words\n` +
    `Play now: ${url}`
  );
}

export async function shareWinner(winnerNickname, stats, roomCode) {
  const text = buildWinnerShareText(winnerNickname, stats, roomCode);
  if (navigator.share) {
    try { await navigator.share({ title: 'WordBomb 💣', text }); return 'shared'; }
    catch (_) { /* user cancelled */ }
  }
  const copied = await copyToClipboard(text);
  return copied ? 'copied' : 'failed';
}
