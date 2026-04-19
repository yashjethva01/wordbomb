import { useState, useEffect, useRef } from 'react';
import { useGameState } from '../../hooks/useGameState';
import socketService from '../../services/socketService';

export default function WordInput({ onPlay, compact = false }) {
  const { state, dispatch } = useGameState();
  const [value, setValue]   = useState('');
  const [cls,   setCls]     = useState('');
  const ref = useRef(null);

  const isMyTurn     = state.myId !== null && state.currentPlayerId === state.myId;
  const isEliminated = state.players.find(p => p.id === state.myId)?.isEliminated ?? false;
  const canType      = isMyTurn && !isEliminated;

  useEffect(() => { if (isMyTurn && ref.current) ref.current.focus(); }, [isMyTurn, state.currentPlayerId]);
  useEffect(() => { setValue(''); setCls(''); }, [state.turnId]);
  useEffect(() => {
    if (!state.lastRejection) return;
    onPlay?.('error');
    setCls('word-input--rejected');
    const t = setTimeout(() => { setCls(''); dispatch({ type:'CLEAR_REJECTION' }); }, 850);
    return () => clearTimeout(t);
  }, [state.lastRejection, dispatch, onPlay]);

  const submit = () => {
    const w = value.trim();
    if (!w || !canType || !state.turnId) return;
    onPlay?.('tick');
    socketService.emit('submit_word', { word: w, turnId: state.turnId });
    setValue('');
  };

  const curPlayer = state.players.find(p => p.id === state.currentPlayerId);
  const hasVal    = value.trim().length > 0;

  const inputH    = compact ? '44px' : '52px';
  const fontSize  = compact ? 'clamp(14px,3.5vw,18px)' : 'clamp(16px,4vw,20px)';
  const btnPad    = compact ? '0 12px' : '0 18px';
  const btnFontSz = compact ? '12px' : '14px';

  return (
    <div style={{ width:'100%' }}>
      {/* Turn status label (hidden on compact layout) */}
      {!compact && (
        <div style={{ minHeight:'26px', marginBottom:'8px', textAlign:'center' }}>
          {isMyTurn ? (
            <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'5px 14px', borderRadius:'var(--r-full)', background:'var(--amber-low)', border:'1px solid var(--amber-mid)' }}>
              <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'var(--amber)', display:'inline-block', animation:'glowPulseFast 0.5s ease-in-out infinite' }} />
              <span style={{ fontFamily:'var(--font-heading)', fontWeight:700, fontSize:'13px', letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--amber)' }}>Your Turn — Type fast!</span>
            </div>
          ) : curPlayer ? (
            <span style={{ fontSize:'13px', color:'var(--text-muted)', fontFamily:'var(--font-body)' }}>
              Waiting for <strong style={{ color:'var(--cyan)', fontWeight:600 }}>{curPlayer.nickname}</strong>
            </span>
          ) : null}
        </div>
      )}

      {/* Smaller turn label for compact layout */}
      {compact && isMyTurn && (
        <div style={{ marginBottom:'5px', textAlign:'center' }}>
          <span style={{ fontFamily:'var(--font-heading)', fontWeight:700, fontSize:'11px', letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--amber)' }}>
            ⚡ Your Turn
          </span>
        </div>
      )}

      {/* Input and send button in one row */}
      <div style={{ display:'flex', gap:'7px', width:'100%' }}>
        <input
          ref={ref}
          value={value}
          onChange={e => setValue(e.target.value.toLowerCase())}
          onKeyDown={e => e.key === 'Enter' && submit()}
          disabled={!canType}
          placeholder={canType ? (compact ? state.combo?.toUpperCase() ?? '' : `Contains "${state.combo?.toUpperCase()}"…`) : ''}
          spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off"
          className={cls}
          style={{
            flex:         '1 1 0',
            minWidth:     '0',
            height:       inputH,
            background:   canType ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
            border:       `2px solid ${canType ? 'var(--amber-mid)' : 'var(--border-1)'}`,
            borderRadius: 'var(--r-lg)',
            color:        'var(--text-primary)',
            fontFamily:   'var(--font-mono)',
            fontWeight:   500,
            fontSize:     fontSize,
            padding:      '0 12px',
            outline:      'none',
            transition:   'border-color 0.22s, box-shadow 0.22s',
          }}
        />
        <button
          onClick={submit}
          disabled={!canType || !hasVal}
          style={{
            height:       inputH,
            padding:      btnPad,
            flexShrink:   0,
            borderRadius: 'var(--r-lg)',
            border:       'none',
            background:   canType && hasVal ? 'linear-gradient(135deg,#ffc040 0%,#cc7800 100%)' : 'var(--glass-1)',
            color:        canType && hasVal ? '#06080f' : 'var(--text-disabled)',
            fontFamily:   'var(--font-heading)',
            fontWeight:   700,
            fontSize:     btnFontSz,
            letterSpacing:'0.08em',
            textTransform:'uppercase',
            cursor:       canType && hasVal ? 'pointer' : 'not-allowed',
            transition:   'all var(--t-fast)',
            whiteSpace:   'nowrap',
          }}
        >
          {compact ? '↵' : 'Send ↵'}
        </button>
      </div>

      {/* Show latest rejection reason */}
      {state.lastRejection && (
        <div style={{ marginTop:'6px', textAlign:'center', animation:'fadeIn 0.2s ease' }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:`${compact ? '3px 10px' : '4px 12px'}`, borderRadius:'var(--r-full)', background:'var(--red-low)', border:'1px solid var(--red-mid)', fontSize:compact ? '11px' : '13px', color:'var(--red-bright)', fontFamily:'var(--font-body)' }}>
            ✕ {state.lastRejection.reason}
          </span>
        </div>
      )}
    </div>
  );
}
