import { getAvatarEmoji } from '../../utils/avatars';

export default function PlayerCard({ player, isHost, isCurrentUser }) {
  const emoji = getAvatarEmoji(player.avatar);

  return (
    <div className="glass-card" style={{ display:'flex', alignItems:'center', gap:'13px', padding:'12px 16px', borderColor: player.isReady ? 'var(--green-mid)' : 'var(--border-0)', transition:'all var(--t-mid)', opacity: player.isConnected === false ? 0.45 : 1, overflow:'hidden' }}>
      {/* Ready accent strip */}
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:'3px', background: player.isReady ? 'linear-gradient(180deg,var(--green) 0%,var(--green-mid) 100%)' : 'var(--border-1)', borderRadius:'var(--r-lg) 0 0 var(--r-lg)', transition:'background 0.35s' }} />

      {/* Avatar */}
      <span style={{ fontSize:'28px', lineHeight:1, flexShrink:0, filter: player.isReady ? 'drop-shadow(0 0 8px rgba(0,255,157,0.4))' : 'none', transition:'filter 0.3s' }}>
        {emoji}
      </span>

      {/* Name */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'3px' }}>
          <span style={{ fontFamily:'var(--font-heading)', fontWeight:600, fontSize:'16px', color: isCurrentUser ? 'var(--cyan)' : 'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{player.nickname}</span>
          {isCurrentUser && <span style={{ fontSize:'11px', color:'var(--text-muted)' }}>(you)</span>}
          {isHost && <span title="Host" style={{ fontSize:'14px' }}>👑</span>}
          {!player.isConnected && <span style={{ padding:'2px 7px', borderRadius:'var(--r-full)', background:'var(--red-low)', border:'1px solid var(--red-mid)', fontSize:'10px', fontFamily:'var(--font-heading)', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--red)' }}>Offline</span>}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <div style={{ width:'6px', height:'6px', borderRadius:'50%', background: player.isReady ? 'var(--green)' : 'var(--text-ghost)', boxShadow: player.isReady ? '0 0 8px rgba(0,255,157,0.7)' : 'none', flexShrink:0, transition:'background 0.3s, box-shadow 0.3s' }} />
          <span style={{ fontSize:'12px', fontFamily:'var(--font-body)', color: player.isReady ? 'var(--green)' : 'var(--text-muted)', transition:'color 0.3s' }}>{player.isReady ? 'Ready to play' : 'Not ready yet'}</span>
        </div>
      </div>

      {/* Ready badge */}
      {player.isReady
        ? <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'6px 13px', borderRadius:'var(--r-full)', background:'var(--green-low)', border:'1px solid var(--green-mid)', fontFamily:'var(--font-heading)', fontWeight:700, fontSize:'12px', letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--green)', flexShrink:0 }}>✓ Ready</span>
        : <span style={{ display:'inline-flex', padding:'6px 13px', borderRadius:'var(--r-full)', background:'var(--glass-1)', border:'1px solid var(--border-1)', fontFamily:'var(--font-heading)', fontWeight:600, fontSize:'12px', letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--text-muted)', flexShrink:0 }}>Waiting</span>
      }
    </div>
  );
}
