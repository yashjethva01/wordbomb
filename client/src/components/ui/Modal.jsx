import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, width=460 }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key==='Escape') onClose?.(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(6,8,15,0.75)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:'var(--z-modal)', padding:'var(--sp-4)', animation:'fadeIn 0.2s ease' }}>
      <div onClick={e=>e.stopPropagation()} className="gradient-border" style={{ width:'100%', maxWidth:`${width}px`, padding:'var(--sp-8)', animation:'scaleIn 0.25s ease' }}>
        {title && <h2 style={{ fontFamily:'var(--font-heading)', fontWeight:700, fontSize:'22px', letterSpacing:'0.04em', marginBottom:'var(--sp-6)', color:'var(--text-primary)' }}>{title}</h2>}
        {children}
      </div>
    </div>
  );
}
