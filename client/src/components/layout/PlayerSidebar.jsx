import { useGameState } from '../../hooks/useGameState';
import { getAvatarEmoji } from '../../utils/avatars';

function Hearts({ lives, max = 3 }) {
  return (
    <div style={{ display:'flex', gap:'3px' }}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{ fontSize:'13px', color: i < lives ? 'var(--red)' : 'rgba(255,255,255,0.10)', filter: i < lives ? 'drop-shadow(0 0 4px rgba(255,56,96,0.65))' : 'none', transition:'color 0.35s, filter 0.35s', lineHeight:1 }}>♥</span>
      ))}
    </div>
  );
}

export default function PlayerSidebar() {
  const { state } = useGameState();
  const { players, currentPlayerId, myId, hostId, phase } = state;
  const inGame = phase === 'game';

  return (
    <aside style={{ gridArea:'sidebar', display:'flex', flexDirection:'column', gap:'var(--sp-2)', overflowY:'auto', padding:'2px' }}>
      <p style={{ fontSize:'10px', fontFamily:'var(--font-heading)', fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-muted)', padding:'0 6px', marginBottom:'4px', flexShrink:0 }}>
        Players · {players.length}
      </p>

      {players.map(player => {
        const isActive = inGame && player.id === currentPlayerId;
        const isMe     = player.id === myId;
        const isHost   = player.id === hostId;
        const isOut    = player.isEliminated;
        const emoji    = getAvatarEmoji(player.avatar);
        let cardClass  = 'glass-card';
        if (isOut)               cardClass += ' glass-card--eliminated';
        else if (isMe && isActive) cardClass += ' glass-card--my-turn';
        else if (isActive)       cardClass += ' glass-card--active';

        return (
          <div key={player.id} className={cardClass} style={{ padding:'0', overflow:'hidden', transition:'all var(--t-mid)', opacity: player.isConnected === false && !isOut ? 0.5 : 1, flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px' }}>
              {/* Active dot */}
              <div style={{ width:'7px', height:'7px', borderRadius:'50%', flexShrink:0, background: isOut ? 'transparent' : isActive ? (isMe ? 'var(--amber)' : 'var(--cyan)') : 'var(--border-1)', boxShadow: isActive && !isOut ? (isMe ? 'var(--amber-glow-sm)' : 'var(--cyan-glow-sm)') : 'none', transition:'all 0.3s', animation: isActive && !isOut ? 'activeDotPulse 1.4s ease-in-out infinite' : 'none', color: isMe ? 'var(--amber)' : 'var(--cyan)' }} />

              {/* Avatar emoji */}
              <span style={{ fontSize:'22px', lineHeight:1, flexShrink:0, filter: isActive ? 'drop-shadow(0 0 8px rgba(255,255,255,0.3))' : 'none', transition:'filter 0.3s' }}>
                {emoji}
              </span>

              {/* Info */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'5px', marginBottom: inGame && !isOut ? '4px' : 0 }}>
                  {isHost && <span style={{ fontSize:'11px' }}>👑</span>}
                  <span style={{ fontFamily:'var(--font-heading)', fontWeight:600, fontSize:'14px', color: isOut ? 'var(--text-muted)' : isMe ? 'var(--cyan)' : 'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', lineHeight:1.2 }}>
                    {player.nickname}
                    {isMe && <span style={{ color:'var(--text-muted)', fontWeight:400, fontSize:'11px' }}> ·you</span>}
                  </span>
                </div>
                {inGame && !isOut && <Hearts lives={player.lives ?? 3} max={state.roomSettings?.lives ?? 3} />}
                {isOut && <span style={{ fontSize:'11px', color:'var(--text-muted)', fontFamily:'var(--font-heading)', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>Eliminated</span>}
              </div>

              {/* Status */}
              <div style={{ flexShrink:0 }}>
                {isOut ? <span style={{ fontSize:'16px' }}>💀</span>
                  : !player.isConnected ? <span style={{ display:'inline-block', width:'7px', height:'7px', borderRadius:'50%', background:'var(--red)', boxShadow:'var(--red-glow-sm)' }} />
                  : isActive ? <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 8px', borderRadius:'var(--r-full)', background: isMe ? 'var(--amber-low)' : 'var(--cyan-low)', border:`1px solid ${isMe ? 'var(--amber-mid)' : 'var(--cyan-mid)'}`, fontSize:'10px', fontFamily:'var(--font-heading)', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color: isMe ? 'var(--amber)' : 'var(--cyan)' }}>✎</span>
                  : null}
              </div>
            </div>
          </div>
        );
      })}
    </aside>
  );
}
