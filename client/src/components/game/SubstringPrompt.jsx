import { useEffect, useState } from 'react';

export default function SubstringPrompt({ combo, isMyTurn, compact = false }) {
  const [key, setKey] = useState(0);
  useEffect(() => { setKey(k => k + 1); }, [combo]);

  if (!combo) return (
    <div style={{ textAlign:'center', padding: compact ? '8px 0' : '28px 0' }}>
      <p style={{ fontSize:'13px', color:'var(--text-muted)', fontFamily:'var(--font-body)' }}>
        Waiting for game to start…
      </p>
    </div>
  );

  const glowColor  = isMyTurn ? 'var(--amber)'   : 'var(--cyan)';
  const glowShadow = isMyTurn
    ? '0 0 22px rgba(255,170,0,0.65), 0 0 50px rgba(255,170,0,0.22)'
    : '0 0 22px rgba(0,229,255,0.60), 0 0 50px rgba(0,229,255,0.20)';
  const bgGlow = isMyTurn ? 'rgba(255,170,0,0.07)' : 'rgba(0,229,255,0.05)';
  const border = isMyTurn ? 'rgba(255,170,0,0.24)' : 'rgba(0,229,255,0.18)';

  const fontSize = compact ? 'clamp(32px, 8vw, 44px)' : 'clamp(48px, 9vw, 72px)';

  return (
    <div style={{ textAlign:'center', width:'100%', flexShrink: compact ? 1 : undefined }}>
      {!compact && (
        <p style={{ fontSize:'11px', fontFamily:'var(--font-heading)', fontWeight:600, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:'10px' }}>
          Word must contain
        </p>
      )}
      <div style={{ display:'inline-block', padding: compact ? '6px 20px' : '10px 32px', borderRadius:'var(--r-xl)', background:bgGlow, border:`1px solid ${border}`, boxShadow:`0 0 30px ${bgGlow}` }}>
        <div key={key} className="combo-text" style={{ fontSize, color:glowColor, textShadow:glowShadow, animation:`comboReveal 0.42s cubic-bezier(0.34,1.56,0.64,1) forwards, comboPulse 2.5s ease-in-out 0.42s infinite`, display:'block' }}>
          {combo.toUpperCase()}
        </div>
      </div>
    </div>
  );
}
