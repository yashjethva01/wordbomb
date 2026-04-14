import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameState, useSelectors } from '../hooks/useGameState';
import { useSound } from '../hooks/useSound';
import { useIsMobile } from '../hooks/useIsMobile';
import socketService from '../services/socketService';
import { getSavedSession } from '../utils/roomUtils';
import { getAvatarEmoji } from '../utils/avatars';

import GameStatusBar   from '../components/layout/GameStatusBar';
import PlayerSidebar   from '../components/layout/PlayerSidebar';
import SpectatorBanner from '../components/layout/SpectatorBanner';
import BombDisplay     from '../components/game/BombDisplay';
import CircularTimer   from '../components/game/CircularTimer';
import SubstringPrompt from '../components/game/SubstringPrompt';
import WordInput       from '../components/game/WordInput';
import EventFeed       from '../components/game/EventFeed';
import EmojiReactions  from '../components/game/EmojiReactions';
import SoundToggle     from '../components/ui/SoundToggle';

// ── Mobile player pill — compact avatar + name + hearts ──────────────────────
function MobilePlayerPill({ player, isActive, isMe, maxLives }) {
  const isOut  = player.isEliminated;
  const emoji  = getAvatarEmoji(player.avatar);
  const lives  = player.lives ?? 3;

  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      gap:            '2px',
      padding:        '5px 9px',
      borderRadius:   'var(--r-md)',
      background:     isActive && !isOut
        ? (isMe ? 'rgba(255,170,0,0.12)' : 'rgba(0,229,255,0.10)')
        : 'var(--glass-1)',
      border:         `1px solid ${
        isOut      ? 'var(--border-0)'
        : isActive && isMe ? 'var(--amber-mid)'
        : isActive ? 'var(--cyan-mid)'
        : 'var(--border-1)'
      }`,
      opacity:        isOut ? 0.4 : 1,
      flexShrink:     0,
      minWidth:       '58px',
      transition:     'all 0.25s',
      boxShadow:      isActive && !isOut
        ? (isMe ? '0 0 12px rgba(255,170,0,0.25)' : '0 0 12px rgba(0,229,255,0.2)')
        : 'none',
    }}>
      <span style={{ fontSize:'17px', lineHeight:1 }}>{emoji}</span>
      <span style={{
        fontFamily:  'var(--font-heading)',
        fontWeight:  isMe ? 700 : 600,
        fontSize:    '10px',
        color:       isMe ? 'var(--cyan)' : 'var(--text-secondary)',
        maxWidth:    '56px',
        overflow:    'hidden',
        textOverflow:'ellipsis',
        whiteSpace:  'nowrap',
        lineHeight:  1.2,
      }}>
        {player.nickname}
      </span>
      {!isOut && (
        <div style={{ display:'flex', gap:'1px' }}>
          {Array.from({ length: maxLives }).map((_, i) => (
            <span key={i} style={{ fontSize:'9px', color: i < lives ? 'var(--red)' : 'rgba(255,255,255,0.12)', lineHeight:1 }}>♥</span>
          ))}
        </div>
      )}
      {isOut && <span style={{ fontSize:'11px', lineHeight:1 }}>💀</span>}
    </div>
  );
}

// ── Mobile layout ─────────────────────────────────────────────────────────────
function MobileGame({ state, isMyTurn, isSpectating, urgency, currentPlayer, play, toggleMute, muted }) {
  const maxLives = state.roomSettings?.lives ?? 3;

  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      height:         '100dvh',
      maxHeight:      '100dvh',
      overflow:       'hidden',
      background:     'var(--bg-base)',
      padding:        '6px 6px 0',
      gap:            '6px',
      position:       'relative',
    }}>
      {state.bombExploding && <div className="screen-flash" />}

      {/* ── 1. Status bar (compact) ─────────────── */}
      <GameStatusBar compact />

      {/* ── 2. Player strip (horizontal scroll) ─── */}
      <div className="player-strip glass-card" style={{ borderRadius:'var(--r-md)', padding:'5px 8px' }}>
        {state.players.map(p => (
          <MobilePlayerPill
            key={p.id}
            player={p}
            isActive={p.id === state.currentPlayerId}
            isMe={p.id === state.myId}
            maxLives={maxLives}
          />
        ))}
      </div>

      {/* ── 3. Centre game area (flex:1) ─────────── */}
      <div style={{
        flex:           '1 1 0',
        minHeight:      '0',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'space-between',
        overflow:       'hidden',
        borderRadius:   'var(--r-lg)',
        background:     'var(--bg-card)',
        border:         '1px solid var(--border-1)',
        backdropFilter: 'blur(24px)',
        padding:        '10px 12px',
        position:       'relative',
        gap:            '6px',
      }}>
        <SoundToggle muted={muted} onToggle={toggleMute} style={{ position:'absolute', top:'8px', right:'8px', zIndex:2 }} />

        {isSpectating && (
          <div style={{ width:'100%', padding:'6px 12px', background:'var(--amber-low)', border:'1px solid var(--amber-mid)', borderRadius:'var(--r-sm)', textAlign:'center' }}>
            <p style={{ fontFamily:'var(--font-heading)', fontWeight:600, fontSize:'12px', color:'var(--amber)' }}>👁 Spectating</p>
          </div>
        )}

        {/* Turn indicator */}
        {currentPlayer && !isMyTurn && (
          <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'4px 12px', borderRadius:'var(--r-full)', background:'var(--cyan-low)', border:'1px solid var(--cyan-mid)', flexShrink:0 }}>
            <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'var(--cyan)', display:'inline-block', animation:'activeDotPulse 1.2s ease-in-out infinite', flexShrink:0 }} />
            <span style={{ fontFamily:'var(--font-heading)', fontWeight:700, fontSize:'12px', color:'var(--cyan)', whiteSpace:'nowrap' }}>
              {currentPlayer.nickname}'s turn
            </span>
          </div>
        )}

        {/* Bomb + timer — scaled for mobile */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'16px', flexShrink:0 }}>
          <BombDisplay isActive={!!state.currentPlayerId} isMyTurn={isMyTurn} urgency={urgency} exploding={state.bombExploding} compact />
          <CircularTimer compact />
        </div>

        {/* Combo */}
        <SubstringPrompt combo={state.combo} isMyTurn={isMyTurn} compact />

        {/* Input — bottom of center */}
        <div className="game-input-bar" style={{ width:'100%', flexShrink:0, paddingBottom:'8px' }}>
          <WordInput onPlay={play} compact />
        </div>
      </div>

      {/* ── 4. Bottom safe area spacer ───────────── */}
      <div style={{ height:'env(safe-area-inset-bottom, 0px)', flexShrink:0 }} />
    </div>
  );
}

// ── Desktop layout (unchanged) ────────────────────────────────────────────────
function DesktopGame({ state, isMyTurn, isSpectating, urgency, currentPlayer, play, toggleMute, muted }) {
  return (
    <div className="game-layout" style={{ position:'relative', background:'var(--bg-base)' }}>
      {state.bombExploding && <div className="screen-flash" />}

      <GameStatusBar />
      <PlayerSidebar />

      <main className="glass-card" style={{ gridArea:'center', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'var(--sp-5)', padding:'var(--sp-5) var(--sp-4)', position:'relative', overflowY:'auto' }}>
        {isSpectating && <SpectatorBanner />}

        {currentPlayer && !isMyTurn && (
          <div style={{ display:'inline-flex', alignItems:'center', gap:'10px', padding:'8px 20px', borderRadius:'var(--r-full)', background:'var(--cyan-low)', border:'1px solid var(--cyan-mid)', animation:'fadeIn 0.3s ease' }}>
            <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:'var(--cyan)', display:'inline-block', animation:'activeDotPulse 1.2s ease-in-out infinite' }} />
            <span style={{ fontFamily:'var(--font-heading)', fontWeight:700, fontSize:'14px', letterSpacing:'0.08em', color:'var(--cyan)' }}>
              {currentPlayer.nickname}'s turn
            </span>
          </div>
        )}

        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'clamp(12px,3vw,44px)', flexWrap:'wrap' }}>
          <BombDisplay isActive={!!state.currentPlayerId} isMyTurn={isMyTurn} urgency={urgency} exploding={state.bombExploding} />
          <CircularTimer />
        </div>

        <SubstringPrompt combo={state.combo} isMyTurn={isMyTurn} />
        <WordInput onPlay={play} />

        <SoundToggle muted={muted} onToggle={toggleMute} style={{ position:'absolute', top:'var(--sp-3)', right:'var(--sp-3)' }} />
      </main>

      <aside style={{ gridArea:'feed', display:'flex', flexDirection:'column', gap:'var(--sp-3)', overflowY:'auto', padding:'2px' }}>
        <div className="glass-card" style={{ padding:'var(--sp-4)', flex:1, minHeight:0, overflowY:'auto' }}>
          <EventFeed />
        </div>
        <div className="glass-card" style={{ padding:'var(--sp-3)', position:'relative', overflow:'hidden' }}>
          <p style={{ fontSize:'10px', fontFamily:'var(--font-heading)', fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:'var(--sp-2)' }}>Reactions</p>
          <EmojiReactions />
        </div>
      </aside>
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────
export default function GamePage() {
  const { code }   = useParams();
  const navigate   = useNavigate();
  const { state }  = useGameState();
  const { isMyTurn, isSpectating } = useSelectors(state);
  const { play, toggleMute, muted } = useSound();
  const isMobile   = useIsMobile(700);
  const prevTimeRef   = useRef(state.timeLeft);
  const prevExploding = useRef(false);

  // Lock body scroll during gameplay
  useEffect(() => {
    document.body.classList.add('game-active');
    return () => document.body.classList.remove('game-active');
  }, []);

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

  useEffect(() => {
    const prev = prevTimeRef.current;
    prevTimeRef.current = state.timeLeft;
    if (state.timeLeft > 0 && state.timeLeft < prev) {
      play(state.timeLeft <= 3 ? 'tick_urgent' : 'tick');
    }
  }, [state.timeLeft, play]);

  useEffect(() => {
    if (state.bombExploding && !prevExploding.current) play('explosion');
    prevExploding.current = state.bombExploding;
  }, [state.bombExploding, play]);

  const urgency       = state.timeLeft <= 3 ? 'critical' : state.timeLeft <= 6 ? 'warning' : 'normal';
  const currentPlayer = state.players.find(p => p.id === state.currentPlayerId);

  const sharedProps = { state, isMyTurn, isSpectating, urgency, currentPlayer, play, toggleMute, muted };

  return isMobile
    ? <MobileGame {...sharedProps} />
    : <DesktopGame {...sharedProps} />;
}
