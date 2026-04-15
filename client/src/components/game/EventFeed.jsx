import { useGameState } from '../../hooks/useGameState';

const TYPE_META = {
  word_accepted:     { icon:'✓',  color:'var(--green)',        bg:'rgba(0,255,157,0.07)',  border:'rgba(0,255,157,0.18)' },
  word_rejected:     { icon:'✕',  color:'var(--red-bright)',   bg:'rgba(255,56,96,0.06)',  border:'rgba(255,56,96,0.15)' },
  bomb_exploded:     { icon:'💥', color:'var(--amber)',         bg:'rgba(255,170,0,0.07)',  border:'rgba(255,170,0,0.18)' },
  player_eliminated: { icon:'💀', color:'var(--red)',           bg:'rgba(255,56,96,0.05)',  border:'rgba(255,56,96,0.14)' },
  player_joined:     { icon:'👋', color:'var(--cyan)',          bg:'rgba(0,229,255,0.05)',  border:'rgba(0,229,255,0.14)' },
  player_left:       { icon:'🚪', color:'var(--text-muted)',   bg:'var(--glass-1)',         border:'var(--border-0)' },
  player_reconnected:{ icon:'🔄', color:'var(--cyan)',          bg:'rgba(0,229,255,0.05)',  border:'rgba(0,229,255,0.14)' },
  game_started:      { icon:'🚀', color:'var(--purple)',        bg:'rgba(179,71,255,0.06)', border:'rgba(179,71,255,0.18)' },
  game_over:         { icon:'🏆', color:'var(--amber)',         bg:'rgba(255,170,0,0.07)',  border:'rgba(255,170,0,0.18)' },
  fast_answer:       { icon:'⚡', color:'var(--amber-bright)',  bg:'rgba(255,170,0,0.07)',  border:'rgba(255,170,0,0.18)' },
  default:           { icon:'·',  color:'var(--text-muted)',   bg:'var(--glass-1)',         border:'var(--border-0)' },
};

function relTime(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 4)   return 'now';
  if (s < 60)  return `${s}s`;
  if (s < 120) return '1m';
  return `${Math.floor(s / 60)}m`;
}

function EventCard({ event }) {
  const meta = TYPE_META[event.type] ?? TYPE_META.default;
  return (
    <div
      className="word-feed-entry"
      style={{
        display:      'flex',
        alignItems:   'flex-start',
        gap:          '8px',
        padding:      '7px 10px',
        borderRadius: 'var(--r-md)',
        background:   meta.bg,
        border:       `1px solid ${meta.border}`,
        flexShrink:   0,
      }}
    >
      <span style={{ fontSize:'13px', lineHeight:1.5, flexShrink:0, color:meta.color, minWidth:'16px', textAlign:'center' }}>
        {meta.icon}
      </span>
      <p style={{ fontSize:'12px', color:'var(--text-secondary)', fontFamily:'var(--font-body)', lineHeight:1.4, flex:1, minWidth:0, wordBreak:'break-word' }}>
        {event.message}
        {event.type === 'word_accepted' && event.fast && (
          <span style={{ marginLeft:'5px', fontSize:'10px', fontFamily:'var(--font-heading)', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--amber)', background:'var(--amber-low)', border:'1px solid var(--amber-mid)', padding:'1px 5px', borderRadius:'var(--r-full)' }}>
            ⚡ Fast
          </span>
        )}
      </p>
      <span style={{ fontSize:'10px', color:'var(--text-muted)', fontFamily:'var(--font-mono)', flexShrink:0, marginTop:'2px', minWidth:'24px', textAlign:'right' }}>
        {relTime(event.timestamp)}
      </span>
    </div>
  );
}

export default function EventFeed() {
  const { state } = useGameState();
  const events    = state.eventFeed ?? [];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'5px', overflowY:'auto', maxHeight:'100%' }}>
      <p style={{ fontSize:'10px', fontFamily:'var(--font-heading)', fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:'4px', flexShrink:0 }}>
        Live Feed
      </p>

      {events.length === 0 ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'var(--sp-5) 0', flexDirection:'column', gap:'8px', opacity:0.6 }}>
          <span style={{ fontSize:'22px' }}>📡</span>
          <p style={{ fontSize:'12px', color:'var(--text-muted)', fontFamily:'var(--font-body)', textAlign:'center' }}>
            Game events will appear here
          </p>
        </div>
      ) : (
        events.map(evt => <EventCard key={evt.id} event={evt} />)
      )}
    </div>
  );
}
