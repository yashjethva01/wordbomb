import { useMemo } from 'react';

const SPARKS = [
  { id:1, sx:'-14px', sy:'-18px', delay:'0s',    dur:'0.55s' },
  { id:2, sx:'10px',  sy:'-22px', delay:'0.18s', dur:'0.50s' },
  { id:3, sx:'-8px',  sy:'-16px', delay:'0.36s', dur:'0.60s' },
  { id:4, sx:'16px',  sy:'-14px', delay:'0.52s', dur:'0.48s' },
];

export default function BombDisplay({ isActive, isMyTurn, urgency, exploding, compact = false }) {
  const SIZE       = compact ? 100 : 170;
  const SVG_W      = compact ? 90  : 130;
  const SVG_H      = compact ? 100 : 140;
  const isUrgent   = urgency === 'critical';
  const isWarning  = urgency === 'warning';
  const showSparks = (isUrgent || isWarning) && !compact;
  const glowColor  = isMyTurn ? (isUrgent ? 'rgba(255,56,96,0.7)' : 'rgba(255,170,0,0.55)') : 'rgba(0,229,255,0.38)';
  const sparkColor = isUrgent ? '#ff3860' : isWarning ? '#ffaa00' : '#ffcc44';
  const floatAnim  = exploding
    ? 'bombExplode 0.6s cubic-bezier(0.16,1,0.3,1) forwards'
    : isUrgent
    ? 'bombUrgent 0.22s ease-in-out infinite'
    : 'bombFloat 3.2s ease-in-out infinite';

  return (
    <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center', width:`${SIZE}px`, height:`${SIZE}px`, animation:floatAnim, willChange:'transform', flexShrink:0 }}>
      {/* Glow floor */}
      {!compact && (
        <div style={{ position:'absolute', bottom:'-8px', left:'50%', transform:'translateX(-50%)', width:'90px', height:'18px', background:glowColor, filter:'blur(18px)', borderRadius:'50%', animation:'glowPulse 2.2s ease-in-out infinite', opacity:isActive?1:0.3, transition:'background 0.6s, opacity 0.6s' }} />
      )}
      {/* Radial glow */}
      <div style={{ position:'absolute', width: compact ? '80px' : '130px', height: compact ? '80px' : '130px', borderRadius:'50%', background:glowColor, filter:`blur(${isUrgent?'36px':isWarning?'24px':'16px'})`, animation:isUrgent?'glowPulseFast 0.5s ease-in-out infinite':'glowPulse 2.2s ease-in-out infinite', opacity:isActive?(isUrgent?0.95:0.7):0.25, transition:'background 0.5s, opacity 0.5s, filter 0.5s' }} />

      {showSparks && SPARKS.map(s => (
        <div key={s.id} style={{ '--sx':s.sx, '--sy':s.sy, position:'absolute', top:'28px', right:'28px', width:isUrgent?'5px':'4px', height:isUrgent?'5px':'4px', borderRadius:'50%', background:sparkColor, boxShadow:`0 0 6px 2px ${sparkColor}`, animation:`sparkFloat ${s.dur} ease-out infinite`, animationDelay:s.delay, opacity:0 }} />
      ))}

      <svg viewBox="0 0 130 140" width={SVG_W} height={SVG_H} xmlns="http://www.w3.org/2000/svg" style={{ position:'relative', zIndex:1, filter:'drop-shadow(0 8px 20px rgba(0,0,0,0.65))', overflow:'visible' }}>
        <defs>
          <radialGradient id="bodyGrad" cx="36%" cy="32%" r="68%">
            <stop offset="0%"   stopColor="#323560" />
            <stop offset="45%"  stopColor="#1a1c38" />
            <stop offset="100%" stopColor="#0b0c1c" />
          </radialGradient>
          <radialGradient id="bodyTint" cx="36%" cy="32%" r="68%">
            <stop offset="0%"   stopColor={isMyTurn ? 'rgba(255,170,0,0.14)' : 'rgba(0,229,255,0.10)'} />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <radialGradient id="shineGrad" cx="32%" cy="28%" r="40%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.22)" />
            <stop offset="55%"  stopColor="rgba(255,255,255,0.05)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <linearGradient id="fuseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"  stopColor="#6b4a12" />
            <stop offset="50%" stopColor="#9c6e1a" />
            <stop offset="100%" stopColor="#5a3e10" />
          </linearGradient>
        </defs>
        <path d="M 62 30 Q 74 20 80 12 Q 87 5 94 7" stroke="url(#fuseGrad)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M 62 30 Q 74 20 80 12 Q 87 5 94 7" stroke="rgba(180,130,40,0.45)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2.5 3.5" fill="none" />
        <circle cx="94" cy="7" r="5.5" fill={sparkColor} style={{ animation:`fuseFlicker ${isUrgent?'0.25s':'0.45s'} ease-in-out infinite`, filter:`drop-shadow(0 0 5px ${sparkColor})` }} />
        <circle cx="94" cy="7" r="2.5" fill="rgba(255,255,255,0.75)" />
        <rect x="53" y="26" width="18" height="9" rx="3.5" fill="#252840" stroke="rgba(255,255,255,0.08)" strokeWidth="0.75" />
        <circle cx="62" cy="78" r="43" fill="url(#bodyGrad)" />
        <circle cx="62" cy="78" r="43" fill="url(#bodyTint)" />
        <ellipse cx="48" cy="62" rx="16" ry="12" fill="url(#shineGrad)" />
        <circle cx="62" cy="78" r="43" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
        {isMyTurn && !compact && (
          <g>
            <ellipse cx="52" cy="76" rx="7" ry="7.5" fill="rgba(255,220,150,0.85)" />
            <ellipse cx="72" cy="76" rx="7" ry="7.5" fill="rgba(255,220,150,0.85)" />
            <circle cx="53" cy="77" r="4" fill="#0b0c1c" />
            <circle cx="73" cy="77" r="4" fill="#0b0c1c" />
            <circle cx="54.5" cy="75.5" r="1.5" fill="rgba(255,255,255,0.8)" />
            <circle cx="74.5" cy="75.5" r="1.5" fill="rgba(255,255,255,0.8)" />
            <path d="M 50 90 Q 62 98 74 90" stroke="rgba(180,130,0,0.75)" strokeWidth="2" strokeLinecap="round" fill="none" />
          </g>
        )}
        {isMyTurn && compact && (
          <g>
            <circle cx="53" cy="76" r="4.5" fill="rgba(255,220,150,0.7)" />
            <circle cx="71" cy="76" r="4.5" fill="rgba(255,220,150,0.7)" />
          </g>
        )}
        <circle cx="28" cy="68" r="2.5" fill="#1a1c30" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
        <circle cx="96" cy="68" r="2.5" fill="#1a1c30" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
      </svg>
    </div>
  );
}
