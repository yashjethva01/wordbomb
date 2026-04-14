import { useGameState } from '../../hooks/useGameState';

export default function GameStatusBar({ compact = false }) {
  const { state } = useGameState();
  const { streak, players, roomCode } = state;
  const alive     = players.filter(p => !p.isEliminated);
  const heatPct   = Math.min(100, streak * 11);
  const heatColor = streak >= 7
    ? 'linear-gradient(90deg, var(--amber), var(--red))'
    : streak >= 4
    ? 'linear-gradient(90deg, var(--cyan), var(--amber))'
    : 'linear-gradient(90deg, var(--cyan-soft), var(--cyan))';

  if (compact) {
    // ── Compact mobile status bar ──────────────────────────────────────────
    return (
      <header style={{
        flexShrink:  0,
        display:     'flex',
        alignItems:  'center',
        gap:         '8px',
        padding:     '0 10px',
        height:      '38px',
        borderRadius:'var(--r-md)',
        background:  'var(--bg-card)',
        border:      '1px solid var(--border-1)',
        backdropFilter:'blur(20px)',
        overflow:    'hidden',
        marginBottom:'0',
      }}>
        {/* Logo */}
        <span style={{ fontFamily:'var(--font-display)', fontSize:'16px', letterSpacing:'0.06em', color:'var(--cyan)', flexShrink:0, lineHeight:1 }}>
          WORDBOMB 💣
        </span>

        <div style={{ width:'1px', height:'18px', background:'var(--border-1)', flexShrink:0 }} />

        {/* Alive count */}
        <span style={{ fontFamily:'var(--font-heading)', fontWeight:700, fontSize:'12px', color:'var(--text-secondary)', flexShrink:0 }}>
          🧍 {alive.length}
        </span>

        {/* Heat bar */}
        {heatPct > 0 && (
          <>
            <span style={{ fontSize:'12px', flexShrink:0 }}>🔥</span>
            <div style={{ flex:1, height:'4px', background:'var(--glass-1)', borderRadius:'var(--r-full)', overflow:'hidden', maxWidth:'80px' }}>
              <div className="heat-fill" style={{ height:'100%', width:`${heatPct}%`, background:heatColor }} />
            </div>
          </>
        )}

        {/* Streak badge */}
        {streak >= 3 && (
          <span style={{ fontFamily:'var(--font-heading)', fontWeight:700, fontSize:'11px', color: streak >= 7 ? 'var(--red-bright)' : streak >= 4 ? 'var(--amber-bright)' : 'var(--cyan)', flexShrink:0 }}>
            ×{streak}
          </span>
        )}

        {/* Room code — pushed right */}
        {roomCode && (
          <span style={{ fontFamily:'var(--font-mono)', fontSize:'11px', color:'var(--text-muted)', letterSpacing:'0.08em', marginLeft:'auto', flexShrink:0 }}>
            #{roomCode}
          </span>
        )}
      </header>
    );
  }

  // ── Full desktop status bar ─────────────────────────────────────────────────
  return (
    <header className="glass-card" style={{ gridArea:'statusbar', display:'flex', alignItems:'center', gap:'var(--sp-5)', padding:'10px 18px', flexWrap:'wrap', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'8px', flexShrink:0 }}>
        <span style={{ fontFamily:'var(--font-display)', fontSize:'22px', letterSpacing:'0.08em', color:'var(--cyan)', textShadow:'0 0 16px rgba(0,229,255,0.5)', lineHeight:1 }}>WORDBOMB</span>
        <span style={{ fontSize:'18px', lineHeight:1 }}>💣</span>
      </div>

      <div style={{ width:'1px', height:'22px', background:'var(--border-1)', flexShrink:0 }} />

      <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'4px 11px', borderRadius:'var(--r-full)', background:'var(--glass-1)', border:'1px solid var(--border-1)', flexShrink:0 }}>
        <span style={{ fontSize:'12px' }}>🧍</span>
        <span style={{ fontFamily:'var(--font-heading)', fontWeight:700, fontSize:'13px', color:'var(--text-secondary)', letterSpacing:'0.04em' }}>{alive.length} alive</span>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:'10px', flex:1, minWidth:'130px' }}>
        <span style={{ fontSize:'14px', flexShrink:0, filter:streak>=4?'drop-shadow(0 0 4px rgba(255,100,0,0.7))':'none' }}>🔥</span>
        <div style={{ flex:1, height:'5px', background:'var(--glass-1)', border:'1px solid var(--border-0)', borderRadius:'var(--r-full)', overflow:'hidden', maxWidth:'180px' }}>
          <div className="heat-fill" style={{ height:'100%', width:`${heatPct}%`, background:heatColor, minWidth:heatPct>0?'4px':'0' }} />
        </div>
        {streak >= 3 && (
          <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 9px', borderRadius:'var(--r-full)', background:streak>=7?'var(--red-low)':streak>=4?'var(--amber-low)':'var(--cyan-low)', border:`1px solid ${streak>=7?'var(--red-mid)':streak>=4?'var(--amber-mid)':'var(--cyan-mid)'}`, fontFamily:'var(--font-heading)', fontWeight:700, fontSize:'12px', letterSpacing:'0.06em', color:streak>=7?'var(--red-bright)':streak>=4?'var(--amber-bright)':'var(--cyan)', whiteSpace:'nowrap', flexShrink:0 }}>
            ×{streak} streak
          </span>
        )}
      </div>

      {roomCode && (
        <span style={{ fontFamily:'var(--font-mono)', fontSize:'12px', color:'var(--text-muted)', letterSpacing:'0.10em', flexShrink:0, padding:'4px 10px', background:'var(--glass-1)', border:'1px solid var(--border-0)', borderRadius:'var(--r-sm)' }}>
          #{roomCode}
        </span>
      )}
    </header>
  );
}
