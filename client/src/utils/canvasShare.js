import { getAvatarEmoji } from './avatars';

/**
 * Draw a rounded rectangle path (polyfill for ctx.roundRect).
 */
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Generate a premium leaderboard canvas.
 * Returns a HTMLCanvasElement.
 */
export function generateLeaderboardCanvas(winnerId, winnerNickname, players, stats) {
  const W    = 780;
  const ROW  = 56;
  const TOP  = 220;
  const sorted = (players ?? []).slice().sort((a, b) => {
    if (a.id === winnerId) return -1;
    if (b.id === winnerId) return 1;
    return (b.lives ?? 0) - (a.lives ?? 0);
  });
  const H = TOP + sorted.length * ROW + 80;

  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // ── Background ──────────────────────────────────────────────
  ctx.fillStyle = '#05070e';
  ctx.fillRect(0, 0, W, H);

  // subtle grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.025)';
  ctx.lineWidth   = 1;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // top gradient bar
  const topBar = ctx.createLinearGradient(0, 0, W, 0);
  topBar.addColorStop(0,   'rgba(0,229,255,0.7)');
  topBar.addColorStop(0.5, 'rgba(179,71,255,0.4)');
  topBar.addColorStop(1,   'rgba(255,170,0,0.7)');
  ctx.fillStyle = topBar;
  ctx.fillRect(0, 0, W, 4);

  // ── Logo ─────────────────────────────────────────────────────
  ctx.font      = 'bold 14px monospace';
  ctx.fillStyle = 'rgba(234,240,255,0.28)';
  ctx.fillText('WORDBOMB.APP', 36, 40);

  ctx.font      = 'bold 30px monospace';
  ctx.fillStyle = '#00e5ff';
  ctx.shadowColor = 'rgba(0,229,255,0.6)';
  ctx.shadowBlur  = 18;
  ctx.fillText('WORDBOMB 💣', 36, 75);
  ctx.shadowBlur = 0;

  ctx.font      = '13px sans-serif';
  ctx.fillStyle = 'rgba(234,240,255,0.38)';
  ctx.fillText('Game Results', 36, 98);

  // ── Winner hero ──────────────────────────────────────────────
  const winnerAvatar = players.find(p => p.id === winnerId)?.avatar;
  const winnerEmoji  = winnerAvatar ? getAvatarEmoji(winnerAvatar) : '';

  ctx.font = '42px sans-serif';
  ctx.fillText('🏆', 36, 160);

  ctx.font         = 'bold 42px sans-serif';
  ctx.fillStyle    = '#00e5ff';
  ctx.shadowColor  = 'rgba(0,229,255,0.7)';
  ctx.shadowBlur   = 24;
  ctx.fillText((winnerEmoji ? winnerEmoji + ' ' : '') + winnerNickname, 100, 160);
  ctx.shadowBlur   = 0;

  ctx.font      = '13px sans-serif';
  ctx.fillStyle = 'rgba(234,240,255,0.40)';
  ctx.fillText(
    `${stats?.totalTurns ?? 0} turns  ·  ${stats?.uniqueWordsUsed ?? 0} unique words`,
    100, 185
  );

  // ── Divider ───────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.fillRect(36, 200, W - 72, 1);

  // ── Column headers ────────────────────────────────────────────
  ctx.font      = 'bold 11px sans-serif';
  ctx.fillStyle = 'rgba(234,240,255,0.3)';
  ctx.fillText('RANK',     42,       215);
  ctx.fillText('PLAYER',   130,      215);
  ctx.fillText('WORDS',    W - 200,  215);
  ctx.fillText('LIVES',    W - 130,  215);
  ctx.fillText('STATUS',   W - 66,   215);

  // ── Player rows ───────────────────────────────────────────────
  const rankEmojis = ['🥇','🥈','🥉'];

  sorted.forEach((p, i) => {
    const y      = TOP + i * ROW;
    const isWin  = p.id === winnerId;
    const alive  = !p.isEliminated;
    const avatar = p.avatar ? getAvatarEmoji(p.avatar) : '';
    const words  = p.wordsSubmitted ?? 0;
    const lives  = p.lives ?? 0;

    // row bg
    rr(ctx, 30, y + 2, W - 60, ROW - 6, 8);
    ctx.fillStyle = isWin
      ? 'rgba(0,229,255,0.07)'
      : i % 2 === 0
      ? 'rgba(255,255,255,0.025)'
      : 'rgba(255,255,255,0.012)';
    ctx.fill();

    if (isWin) {
      rr(ctx, 30, y + 2, W - 60, ROW - 6, 8);
      ctx.strokeStyle = 'rgba(0,229,255,0.30)';
      ctx.lineWidth   = 1;
      ctx.stroke();
    }

    // rank
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText(rankEmojis[i] ?? `#${i + 1}`, 38, y + 30);

    // avatar + nickname
    if (avatar) {
      ctx.font = '18px sans-serif';
      ctx.fillText(avatar, 95, y + 30);
    }
    ctx.font         = isWin ? 'bold 17px sans-serif' : '16px sans-serif';
    ctx.fillStyle    = isWin ? '#00e5ff' : '#eaf0ff';
    ctx.shadowColor  = isWin ? 'rgba(0,229,255,0.4)' : 'transparent';
    ctx.shadowBlur   = isWin ? 10 : 0;
    ctx.fillText(p.nickname, 130, y + 30);
    ctx.shadowBlur   = 0;

    // words
    ctx.font      = '14px monospace';
    ctx.fillStyle = 'rgba(234,240,255,0.55)';
    ctx.textAlign = 'right';
    ctx.fillText(words, W - 185, y + 30);

    // lives hearts
    ctx.font      = '15px sans-serif';
    const full    = '♥'.repeat(Math.max(0, lives));
    const empty   = '♡'.repeat(Math.max(0, 3 - lives));
    ctx.fillStyle = lives > 0 ? '#ff3860' : 'rgba(255,255,255,0.18)';
    ctx.fillText(full + empty, W - 110, y + 30);

    // status
    ctx.font      = '12px sans-serif';
    ctx.fillStyle = isWin
      ? '#ffc040'
      : alive
      ? '#00ff9d'
      : 'rgba(255,56,96,0.65)';
    ctx.fillText(isWin ? '👑 Winner' : alive ? '✓ Survived' : '💀 Out', W - 44, y + 30);

    ctx.textAlign = 'left';
  });

  // ── Footer ────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.fillRect(36, H - 44, W - 72, 1);

  ctx.font      = '11px monospace';
  ctx.fillStyle = 'rgba(234,240,255,0.18)';
  ctx.textAlign = 'center';
  ctx.fillText('Play at wordbomb.app', W / 2, H - 18);
  ctx.textAlign = 'left';

  return canvas;
}

/**
 * Download the canvas as a PNG.
 */
export function downloadCanvas(canvas, filename = 'wordbomb-results.png') {
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }, 'image/png');
}

/**
 * Share the canvas via Web Share API with file + text.
 * Returns 'shared' | 'downloaded' | 'failed'.
 */
export async function shareCanvas(canvas, text) {
  return new Promise(resolve => {
    canvas.toBlob(async blob => {
      const file = new File([blob], 'wordbomb-results.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ title: 'WordBomb 💣', text, files: [file] });
          resolve('shared');
          return;
        } catch (_) { /* user cancelled or not supported */ }
      }
      // fallback: download
      downloadCanvas(canvas);
      resolve('downloaded');
    }, 'image/png');
  });
}
