import { useState } from 'react';
import { copyToClipboard } from '../../utils/shareUtils';
import { buildShareUrl } from '../../utils/roomUtils';

export default function RoomCodeDisplay({ roomCode }) {
  const [copied, setCopied] = useState(false);

  const handle = async () => {
    const ok = await copyToClipboard(buildShareUrl(roomCode));
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div style={{ textAlign:'center' }}>
      <p style={{ fontSize:'10px', fontFamily:'var(--font-heading)', fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:'14px' }}>
        Room Code — Share to Invite
      </p>
      <button onClick={handle} style={{ background:'transparent', border:'none', cursor:'pointer', padding:0, display:'inline-block' }}>
        <div
          onMouseEnter={e=>{ if(!copied){e.currentTarget.style.boxShadow='0 0 60px rgba(0,229,255,0.18), inset 0 0 40px rgba(0,229,255,0.05)'; e.currentTarget.style.borderColor='var(--cyan-soft)'; e.currentTarget.style.transform='translateY(-1px)'; }}}
          onMouseLeave={e=>{ e.currentTarget.style.boxShadow='0 0 40px rgba(0,229,255,0.10), inset 0 0 30px rgba(0,229,255,0.03)'; e.currentTarget.style.borderColor='var(--cyan-mid)'; e.currentTarget.style.transform=''; }}
          style={{ display:'inline-flex', flexDirection:'column', alignItems:'center', gap:'12px', padding:'18px 36px', borderRadius:'var(--r-xl)', background:copied?'rgba(0,255,157,0.06)':'rgba(0,229,255,0.05)', border:`1.5px solid ${copied?'var(--green-mid)':'var(--cyan-mid)'}`, boxShadow:'0 0 40px rgba(0,229,255,0.10), inset 0 0 30px rgba(0,229,255,0.03)', transition:'all var(--t-mid)' }}>
          <span style={{ fontFamily:'var(--font-mono)', fontWeight:600, fontSize:'clamp(28px,6vw,40px)', letterSpacing:'0.26em', color:copied?'var(--green)':'var(--cyan)', textShadow:copied?'0 0 24px rgba(0,255,157,0.6)':'0 0 24px rgba(0,229,255,0.55)', lineHeight:1, paddingRight:'0.26em', transition:'color 0.3s, text-shadow 0.3s' }}>
            {roomCode}
          </span>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', fontFamily:'var(--font-heading)', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:copied?'var(--green)':'var(--text-muted)', transition:'color 0.25s' }}>
            <span style={{ fontSize:'14px' }}>{copied?'✓':'📋'}</span>
            {copied?'Link copied!':'Click to copy link'}
          </div>
        </div>
      </button>
    </div>
  );
}
