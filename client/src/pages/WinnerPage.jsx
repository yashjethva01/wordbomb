import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameState } from '../hooks/useGameState';
import { useSound } from '../hooks/useSound';
import { buildWinnerShareText } from '../utils/shareUtils';
import { getSavedSession } from '../utils/roomUtils';
import { generateLeaderboardCanvas, downloadCanvas, shareCanvas } from '../utils/canvasShare';
import socketService from '../services/socketService';
import Button from '../components/ui/Button';
import { getAvatarEmoji } from '../utils/avatars';

const PAL = ['#00e5ff','#ffaa00','#ff3860','#00ff9d','#b347ff','#ff6b35','#4ecdc4','#ffd93d'];

function Confetti({ count = 60 }) {
  const pts = useRef(Array.from({ length: count }, (_, i) => ({
    id: i, left:`${Math.random()*100}%`, color: PAL[i%PAL.length],
    size:`${5+Math.random()*9}px`, dur:`${2.4+Math.random()*2.2}s`,
    delay:`${Math.random()*1.6}s`, rz:`${(Math.random()>.5?1:-1)*(360+Math.random()*360)}deg`,
    rx:`${Math.random()*360}deg`, shape:['circle','square','diamond'][i%3],
  })));
  return (
    <div style={{ position:'fixed', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:0 }}>
      {pts.current.map(p => (
        <div key={p.id} className="confetti-particle" style={{ left:p.left, width:p.size, height:p.size, background:p.color, borderRadius:p.shape==='circle'?'50%':p.shape==='diamond'?'3px':'2px', transform:p.shape==='diamond'?'rotate(45deg)':'none', animationDuration:p.dur, animationDelay:p.delay, '--rz':p.rz, '--rx':p.rx }} />
      ))}
    </div>
  );
}

export default function WinnerPage() {
  const { code }   = useParams();
  const navigate   = useNavigate();
  const { state }  = useGameState();
  const { play }   = useSound();
  const [shareMsg, setShareMsg] = useState('');
  const [voted,    setVoted]    = useState(false);
  const [imgUrl,   setImgUrl]   = useState(null);
  const played  = useRef(false);
  const canvasRef = useRef(null);

  const isWinner = state.myId === state.winnerId;
  const stats    = state.gameStats;

  useEffect(() => {
    if (!state.roomCode) {
      const s = getSavedSession();
      if (s) {
        const avatar = localStorage.getItem('wb_avatar') ?? 'robot';
        socketService.emit('join_room', { nickname: s.nickname, roomCode: s.roomCode, avatar });
      } else navigate('/');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Play win sound once + generate canvas
  useEffect(() => {
    if (!played.current && state.winnerId && stats) {
      played.current = true;
      setTimeout(() => play('success'), 200);

      // Generate leaderboard canvas
      try {
        const canvas  = generateLeaderboardCanvas(state.winnerId, state.winnerNickname, stats.players ?? [], stats);
        canvasRef.current = canvas;

        // Preview image
        const url = canvas.toDataURL('image/png');
        setImgUrl(url);
      } catch (e) {
        console.warn('[WinnerPage] Canvas generation failed:', e);
      }
    }
  }, [state.winnerId, stats, play, state.winnerNickname]);

  const handleRematch = () => {
    if (voted) return;
    setVoted(true);
    socketService.emit('request_rematch', {});
  };

  const handleDownload = useCallback(() => {
    if (canvasRef.current) {
      downloadCanvas(canvasRef.current);
      setShareMsg('Image saved!');
    } else {
      setShareMsg('Image not ready yet');
    }
    setTimeout(() => setShareMsg(''), 2500);
  }, []);

  const handleShare = useCallback(async () => {
    const text = buildWinnerShareText(state.winnerNickname, stats, code ?? state.roomCode ?? '');
    if (canvasRef.current) {
      const result = await shareCanvas(canvasRef.current, text);
      setShareMsg(result === 'shared' ? '🎉 Shared!' : result === 'downloaded' ? '📥 Saved to device!' : 'Copied link!');
    } else {
      // fallback text only
      await navigator.clipboard?.writeText(text).catch(() => {});
      setShareMsg('Link copied!');
    }
    setTimeout(() => setShareMsg(''), 2800);
  }, [state.winnerNickname, stats, code, state.roomCode]);

  const handleHome = () => { socketService.emit('leave_room', {}); navigate('/'); };

  const sorted = (stats?.players ?? []).slice().sort((a, b) => {
    if (a.id === state.winnerId) return -1;
    if (b.id === state.winnerId) return 1;
    return (b.lives ?? 0) - (a.lives ?? 0);
  });

  const rankEmoji = ['🥇','🥈','🥉'];
  const maxLives  = state.roomSettings?.lives ?? 3;

  return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'clamp(16px,4vw,32px)', position:'relative', overflowX:'hidden' }}>
      <Confetti count={isWinner ? 70 : 40} />
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, background: isWinner ? 'radial-gradient(ellipse 70% 55% at 50% 40%,rgba(0,229,255,0.08) 0%,transparent 65%)' : 'radial-gradient(ellipse 70% 55% at 50% 40%,rgba(255,170,0,0.06) 0%,transparent 65%)' }} />

      <div className="gradient-border" style={{ padding:'clamp(28px,4vw,52px) clamp(20px,4vw,44px)', maxWidth:'580px', width:'100%', zIndex:1, textAlign:'center', animation:'fadeInUp 0.5s var(--ease-out-expo)', marginTop:'var(--sp-4)' }}>

        {/* Trophy */}
        <div style={{ fontSize: isWinner ? '72px' : '52px', marginBottom:'10px', animation:'crownBounce 2.8s ease-in-out infinite', lineHeight:1 }}>
          {isWinner ? '🏆' : '🏅'}
        </div>

        <p style={{ fontSize:'11px', fontFamily:'var(--font-heading)', fontWeight:700, letterSpacing:'0.20em', textTransform:'uppercase', color: isWinner ? 'var(--amber)' : 'var(--text-muted)', marginBottom:'6px', animation:'fadeIn 0.6s ease 0.3s both' }}>
          {isWinner ? '🎉 You Won!' : 'Winner'}
        </p>

        {/* Winner name + avatar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'12px', marginBottom:'var(--sp-8)', animation:'winnerReveal 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.15s both' }}>
          {sorted[0]?.avatar && (
            <span style={{ fontSize:'clamp(36px,6vw,52px)', lineHeight:1, filter:'drop-shadow(0 0 16px rgba(0,229,255,0.4))' }}>
              {getAvatarEmoji(sorted[0].avatar)}
            </span>
          )}
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(40px,9vw,72px)', letterSpacing:'0.05em', color:'var(--cyan)', textShadow:'var(--cyan-glow-lg)', lineHeight:0.95 }}>
            {state.winnerNickname ?? '???'}
          </h1>
        </div>

        {/* Stats row */}
        {stats && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'var(--sp-3)', marginBottom:'var(--sp-5)' }}>
            {[{ e:'🔄', l:'Turns', v: stats.totalTurns ?? 0 },{ e:'📝', l:'Words', v: stats.uniqueWordsUsed ?? 0 },{ e:'👥', l:'Players', v: stats.players?.length ?? 0 }].map(({ e, l, v }) => (
              <div key={l} className="glass-card" style={{ padding:'var(--sp-4) var(--sp-3)', animation:'fadeInUp 0.6s var(--ease-out-expo) 0.3s both' }}>
                <div style={{ fontSize:'20px', marginBottom:'4px' }}>{e}</div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:'clamp(24px,4vw,34px)', color:'var(--text-primary)', lineHeight:1, marginBottom:'3px' }}>{v}</div>
                <div style={{ fontSize:'10px', fontFamily:'var(--font-heading)', fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--text-muted)' }}>{l}</div>
              </div>
            ))}
          </div>
        )}

        {/* Standings */}
        {sorted.length > 0 && (
          <div style={{ marginBottom:'var(--sp-5)', animation:'fadeInUp 0.6s var(--ease-out-expo) 0.55s both' }}>
            <p style={{ fontSize:'10px', fontFamily:'var(--font-heading)', fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:'var(--sp-3)' }}>Final Standings</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
              {sorted.map((p, i) => {
                const isW = p.id === state.winnerId;
                const isM = p.id === state.myId;
                return (
                  <div key={p.id} className="glass-card" style={{ display:'flex', alignItems:'center', gap:'var(--sp-3)', padding:'10px 14px', borderColor: isW ? 'var(--cyan-mid)' : 'var(--border-0)', background: isW ? 'rgba(0,229,255,0.04)' : undefined }}>
                    <span style={{ fontSize:'18px', flexShrink:0 }}>{rankEmoji[i] ?? '💀'}</span>
                    {p.avatar && <span style={{ fontSize:'20px', lineHeight:1, flexShrink:0 }}>{getAvatarEmoji(p.avatar)}</span>}
                    <span style={{ fontFamily:'var(--font-heading)', fontWeight:600, fontSize:'15px', color: isW ? 'var(--cyan)' : 'var(--text-primary)', flex:1, textAlign:'left', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {p.nickname}{isM && <span style={{ color:'var(--text-muted)', fontWeight:400, fontSize:'12px' }}> (you)</span>}
                    </span>
                    {/* Words submitted */}
                    {p.wordsSubmitted > 0 && (
                      <span style={{ fontSize:'12px', color:'var(--text-muted)', fontFamily:'var(--font-mono)', flexShrink:0 }}>{p.wordsSubmitted}w</span>
                    )}
                    {/* Hearts */}
                    <div style={{ display:'flex', gap:'2px', flexShrink:0 }}>
                      {Array.from({ length: maxLives }).map((_, li) => (
                        <span key={li} style={{ fontSize:'12px', color: li < (p.lives ?? 0) ? 'var(--red)' : 'rgba(255,255,255,0.1)' }}>♥</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Leaderboard image preview */}
        {imgUrl && (
          <div style={{ marginBottom:'var(--sp-5)', animation:'fadeInUp 0.5s ease 0.7s both' }}>
            <p style={{ fontSize:'10px', fontFamily:'var(--font-heading)', fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:'var(--sp-3)' }}>Result Card</p>
            <img
              src={imgUrl}
              alt="Game leaderboard"
              style={{ width:'100%', borderRadius:'var(--r-lg)', border:'1px solid var(--border-1)', display:'block' }}
            />
          </div>
        )}

        {/* Rematch votes */}
        {state.rematchVotes > 0 && (
          <div style={{ marginBottom:'var(--sp-4)', padding:'10px 18px', background:'var(--green-low)', border:'1px solid var(--green-mid)', borderRadius:'var(--r-md)' }}>
            <p style={{ fontSize:'13px', color:'var(--green)', fontFamily:'var(--font-body)' }}>🔄 {state.rematchVotes} / {state.rematchRequired} players want a rematch</p>
          </div>
        )}

        {shareMsg && (
          <p style={{ fontSize:'13px', color:'var(--green)', fontFamily:'var(--font-body)', marginBottom:'var(--sp-3)', animation:'fadeIn 0.2s ease' }}>✓ {shareMsg}</p>
        )}

        {/* Actions */}
        <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-3)', animation:'fadeInUp 0.6s var(--ease-out-expo) 0.75s both' }}>
          <Button variant={voted ? 'secondary' : 'primary'} size="lg" fullWidth onClick={handleRematch} disabled={voted}>
            {voted ? '✓ Vote cast — waiting for others…' : '🔄 Play Again (Rematch)'}
          </Button>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--sp-3)' }}>
            <Button variant="secondary" size="md" fullWidth onClick={handleDownload}>📥 Save Image</Button>
            <Button variant="secondary" size="md" fullWidth onClick={handleShare}>📤 Share Result</Button>
          </div>
          <Button variant="ghost" size="md" fullWidth onClick={handleHome}>← Back to Home</Button>
        </div>
      </div>
    </div>
  );
}
