import { useTimer } from '../../hooks/useTimer';

const UC = {
  normal:   { ring:'#00ff9d', center:'var(--text-primary)', shadow:'rgba(0,255,157,0.55)' },
  warning:  { ring:'#ffaa00', center:'#ffaa00',             shadow:'rgba(255,170,0,0.60)' },
  critical: { ring:'#ff3860', center:'#ff3860',             shadow:'rgba(255,56,96,0.70)' },
};

function makeGeometry(sz, sw) {
  const R     = (sz - sw * 2 - 4) / 2;
  const cx    = sz / 2;
  const cy    = sz / 2;
  const circ  = 2 * Math.PI * R;
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a     = (i / 12) * 2 * Math.PI - Math.PI / 2;
    const inner = R + sw / 2 + 3;
    const outer = R + sw / 2 + 7;
    return { x1: cx + inner * Math.cos(a), y1: cy + inner * Math.sin(a), x2: cx + outer * Math.cos(a), y2: cy + outer * Math.sin(a) };
  });
  return { R, cx, cy, circ, ticks };
}

export default function CircularTimer({ compact = false }) {
  const { displayTime, percentage, urgency } = useTimer();
  const SZ  = compact ? 86 : 148;
  const SW  = compact ? 6  : 9;
  const { R, cx, cy, circ, ticks } = makeGeometry(SZ, SW);
  const C   = UC[urgency];
  const off = circ - circ * percentage;

  return (
    <div style={{ position:'relative', width:`${SZ}px`, height:`${SZ}px`, flexShrink:0 }}>
      <svg width={SZ} height={SZ} viewBox={`0 0 ${SZ} ${SZ}`} style={{ overflow:'visible' }}>
        {!compact && (
          <circle cx={cx} cy={cy} r={R + SW / 2 + 12} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        )}
        {!compact && ticks.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" strokeLinecap="round" />
        ))}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={SW} />
        <circle cx={cx} cy={cy} r={R - SW / 2} fill="rgba(255,255,255,0.025)" />
        <circle cx={cx} cy={cy} r={R} fill="none" strokeWidth={SW} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off} transform={`rotate(-90 ${cx} ${cy})`} className={`timer-ring timer-ring--${urgency}`} style={{ transition:'stroke-dashoffset 0.95s linear, stroke 0.55s ease' }} />
        {percentage > 0.03 && (() => {
          const a   = (1 - percentage) * 2 * Math.PI - Math.PI / 2;
          return <circle cx={cx + R * Math.cos(a)} cy={cy + R * Math.sin(a)} r={SW / 2 + (compact ? 0 : 1)} fill={C.ring} style={{ filter:`drop-shadow(0 0 5px ${C.shadow})`, transition:'cx 0.95s linear, cy 0.95s linear, fill 0.55s ease' }} />;
        })()}
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize:   compact ? '26px' : (urgency === 'critical' ? '48px' : '44px'),
          lineHeight: 1,
          color:      C.center,
          textShadow: urgency !== 'normal' ? `0 0 14px ${C.shadow}` : 'none',
          transition: 'color 0.5s, font-size 0.2s',
          animation:  urgency === 'critical' ? 'glowPulseFast 0.5s ease-in-out infinite' : 'none',
        }}>
          {displayTime}
        </span>
        {!compact && (
          <span style={{ fontFamily:'var(--font-heading)', fontWeight:600, fontSize:'10px', letterSpacing:'0.14em', textTransform:'uppercase', color: urgency !== 'normal' ? C.ring : 'var(--text-muted)', opacity:0.8 }}>sec</span>
        )}
      </div>
    </div>
  );
}
