import { useGameState } from '../../hooks/useGameState';

const PAL = ['#00e5ff','#ffaa00','#ff3860','#00ff9d','#b347ff','#ff6b35','#4ecdc4','#ffd93d'];
const pal = (n='') => PAL[[...n].reduce((a,c)=>a+c.charCodeAt(0),0)%PAL.length];

export default function WordFeed() {
  const { state } = useGameState();
  const words = state.recentWords;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-2)', overflowY:'auto', maxHeight:'100%' }}>
      <p style={{ fontSize:'10px', fontFamily:'var(--font-heading)', fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:'2px', flexShrink:0 }}>Word Feed</p>
      {words.length===0 ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'var(--sp-6) 0', flexDirection:'column', gap:'8px' }}>
          <span style={{ fontSize:'24px', opacity:0.3 }}>📝</span>
          <p style={{ fontSize:'12px', color:'var(--text-muted)', fontFamily:'var(--font-body)' }}>No words yet</p>
        </div>
      ) : words.map((e,i) => {
        const color = pal(e.nickname);
        const first = i===0;
        return (
          <div key={`${e.word}-${i}`} className="word-feed-entry" style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 11px', background:first?`linear-gradient(135deg,${color}12,transparent 70%),var(--glass-1)`:'var(--glass-1)', border:`1px solid ${first?`${color}35`:'var(--border-0)'}`, borderRadius:'var(--r-md)', animationDelay:'0s' }}>
            <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:`${color}18`, border:`1.5px solid ${color}50`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', color, fontFamily:'var(--font-display)', flexShrink:0, boxShadow:first?`0 0 10px ${color}30`:'none' }}>
              {e.nickname[0]?.toUpperCase()}
            </div>
            <div style={{ minWidth:0, flex:1 }}>
              <span style={{ fontFamily:'var(--font-mono)', fontWeight:600, fontSize:'15px', color:first?'var(--green-bright)':'var(--green)', display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textShadow:first?'0 0 12px rgba(0,255,157,0.4)':'none' }}>{e.word}</span>
              <span style={{ fontSize:'11px', color:'var(--text-muted)', fontFamily:'var(--font-body)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'block' }}>{e.nickname}</span>
            </div>
            {first && <span style={{ fontSize:'14px', flexShrink:0, filter:'drop-shadow(0 0 6px rgba(0,255,157,0.5))' }}>✓</span>}
          </div>
        );
      })}
    </div>
  );
}
