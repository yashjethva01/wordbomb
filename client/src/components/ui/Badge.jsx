export default function Badge({ children, variant='dim', style:extra }) {
  const colors = {
    cyan:   { background:'var(--cyan-low)',   color:'var(--cyan)',   border:'var(--cyan-mid)' },
    amber:  { background:'var(--amber-low)',  color:'var(--amber)',  border:'var(--amber-mid)' },
    red:    { background:'var(--red-low)',    color:'var(--red)',    border:'var(--red-mid)' },
    green:  { background:'var(--green-low)',  color:'var(--green)',  border:'var(--green-mid)' },
    purple: { background:'var(--purple-low)', color:'var(--purple)', border:'var(--purple-mid)' },
    dim:    { background:'var(--glass-1)',    color:'var(--text-secondary)', border:'var(--border-0)' },
  };
  const c = colors[variant] ?? colors.dim;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'3px 9px', borderRadius:'var(--r-full)', fontSize:'11px', fontFamily:'var(--font-heading)', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', background:c.background, color:c.color, border:`1px solid ${c.border}`, ...extra }}>
      {children}
    </span>
  );
}
