import { useReactions } from '../../hooks/useReactions';
import socketService from '../../services/socketService';

const EMOJIS = ['😂','😱','🔥','💀','👏','😤','🤯','😎','🎉','💪','😭','⚡'];

export default function EmojiReactions() {
  const reactions = useReactions();
  return (
    <>
      <div className="reaction-overlay">
        {reactions.map(r => (
          <div key={r.id} className="reaction-emoji" style={{ left:`${r.x}%` }} title={r.nickname}>{r.emoji}</div>
        ))}
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:'var(--sp-1)', padding:'var(--sp-2)', background:'var(--glass-1)', borderRadius:'var(--r-md)', border:'1px solid var(--border-0)' }}>
        {EMOJIS.map(e => (
          <button key={e} onClick={() => socketService.emit('send_reaction',{emoji:e})} title={e}
            onMouseEnter={ev=>{ev.currentTarget.style.transform='scale(1.35)'; ev.currentTarget.style.background='var(--glass-hover)';}}
            onMouseLeave={ev=>{ev.currentTarget.style.transform=''; ev.currentTarget.style.background='transparent';}}
            style={{ background:'transparent', border:'none', cursor:'pointer', fontSize:'20px', padding:'4px', borderRadius:'var(--r-sm)', transition:'transform 0.15s', lineHeight:1 }}>
            {e}
          </button>
        ))}
      </div>
    </>
  );
}
