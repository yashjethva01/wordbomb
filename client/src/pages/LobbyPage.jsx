import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameState, useSelectors } from '../hooks/useGameState';
import socketService from '../services/socketService';
import { getSavedSession } from '../utils/roomUtils';
import PlayerCard from '../components/lobby/PlayerCard';
import RoomCodeDisplay from '../components/lobby/RoomCodeDisplay';
import ReadyButton from '../components/lobby/ReadyButton';
import Button from '../components/ui/Button';
import SoundToggle from '../components/ui/SoundToggle';
import { useSound } from '../hooks/useSound';

const DIFFICULTY_LABELS = { easy:'Easy 🟢', medium:'Medium 🟡', hard:'Hard 🔴' };

export default function LobbyPage() {
  const { code }  = useParams();
  const navigate  = useNavigate();
  const { state } = useGameState();
  const { isHost, allReady } = useSelectors(state);
  const { play, toggleMute, muted } = useSound();

  useEffect(() => {
    if (!state.roomCode) {
      const s = getSavedSession();
      if (s && s.roomCode === code) {
        const avatar = localStorage.getItem('wb_avatar') ?? 'robot';
        socketService.emit('join_room', { nickname: s.nickname, roomCode: s.roomCode, avatar });
      } else { navigate('/'); }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStart = () => { play('tick'); socketService.emit('start_game', {}); };
  const handleLeave = () => { socketService.emit('leave_room', {}); navigate('/'); };

  const canStart  = isHost && allReady && state.players.filter(p => p.isConnected).length >= 2;
  const settings  = state.roomSettings ?? {};

  return (
    <div style={{ minHeight:'100dvh', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'fixed', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:0 }}>
        <div style={{ position:'absolute', top:'-60px', right:'-60px', width:'500px', height:'500px', borderRadius:'50%', background:'radial-gradient(circle,rgba(0,229,255,0.05) 0%,transparent 70%)', filter:'blur(10px)' }} />
      </div>

      <div className="lobby-layout" style={{ position:'relative', zIndex:1 }}>
        {/* Lobby header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'var(--sp-3)' }}>
          <div>
            <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(32px,6vw,44px)', letterSpacing:'0.06em', color:'var(--text-primary)', lineHeight:0.95 }}>WORDBOMB 💣</h1>
            <p style={{ fontSize:'13px', color:'var(--text-muted)', fontFamily:'var(--font-body)', marginTop:'4px' }}>Lobby · Waiting for players</p>
          </div>
          <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
            <SoundToggle muted={muted} onToggle={toggleMute} />
            <Button variant="ghost" size="sm" onClick={handleLeave}>Leave</Button>
          </div>
        </div>

        {/* Shareable room code */}
        <div className="glass-card" style={{ padding:'var(--sp-8)' }}>
          <RoomCodeDisplay roomCode={code ?? state.roomCode ?? '------'} />
        </div>

        {/* Quick summary of room settings */}
        {settings.difficulty && (
          <div className="glass-card" style={{ padding:'var(--sp-4)' }}>
            <p style={{ fontSize:'10px', fontFamily:'var(--font-heading)', fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:'10px' }}>Room Settings</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
              {[
                { label:'Difficulty', value: DIFFICULTY_LABELS[settings.difficulty] ?? settings.difficulty },
                { label:'Lives',      value: `${settings.lives} ♥` },
                { label:'Turn Time',  value: `${settings.turnTime}s` },
                { label:'Max Players',value: `${settings.maxPlayers}` },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding:'6px 14px', borderRadius:'var(--r-full)', background:'var(--glass-1)', border:'1px solid var(--border-1)', display:'flex', alignItems:'center', gap:'6px' }}>
                  <span style={{ fontSize:'11px', fontFamily:'var(--font-heading)', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--text-muted)' }}>{label}:</span>
                  <span style={{ fontSize:'13px', fontFamily:'var(--font-heading)', fontWeight:700, color:'var(--cyan)' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Player list */}
        <div className="glass-card" style={{ padding:'var(--sp-5)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'var(--sp-4)' }}>
            <p style={{ fontSize:'11px', fontFamily:'var(--font-heading)', fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-muted)' }}>Players</p>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:'12px', color:'var(--text-muted)' }}>{state.players.length} / {settings.maxPlayers ?? 8}</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-2)' }}>
            {state.players.map(p => (
              <PlayerCard key={p.id} player={p} isHost={p.id === state.hostId} isCurrentUser={p.id === state.myId} />
            ))}
            {state.players.length < 2 && (
              <div style={{ padding:'14px 18px', border:'1px dashed var(--border-1)', borderRadius:'var(--r-lg)', color:'var(--text-ghost)', fontSize:'13px', fontFamily:'var(--font-body)', textAlign:'center' }}>
                Waiting for another player…
              </div>
            )}
          </div>
        </div>

        {/* Ready and start controls */}
        <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-3)' }}>
          <ReadyButton />
          {isHost
            ? <Button variant={canStart ? 'primary' : 'secondary'} size="lg" fullWidth onClick={handleStart} disabled={!canStart}>{canStart ? '🚀 Start Game' : 'Waiting for all players to ready…'}</Button>
            : <p style={{ textAlign:'center', fontSize:'13px', color:'var(--text-muted)', fontFamily:'var(--font-body)' }}>Waiting for the host to start…</p>
          }
        </div>

        {/* Simple how-to-play guide */}
        <div className="glass-card" style={{ padding:'var(--sp-5)' }}>
          <p style={{ fontSize:'10px', fontFamily:'var(--font-heading)', fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:'var(--sp-4)' }}>How to Play</p>
          <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-3)' }}>
            {[
              { icon:'💣', text:'A letter combo appears — type any word containing it' },
              { icon:'⏱', text:'Beat the countdown before the bomb explodes on you' },
              { icon:`${settings.lives ?? 3} ♥`, text:`${settings.lives ?? 3} lives each — last one alive wins` },
              { icon:'⚡', text:'Fast answers earn the ⚡ badge' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display:'flex', alignItems:'flex-start', gap:'12px' }}>
                <span style={{ fontSize:'15px', flexShrink:0, marginTop:'1px', minWidth:'28px' }}>{icon}</span>
                <p style={{ fontSize:'13px', color:'var(--text-secondary)', fontFamily:'var(--font-body)', lineHeight:1.5 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
