export default function SpectatorBanner() {
  return (
    <div style={{ background:'var(--amber-low)', border:'1px solid var(--amber-mid)', borderRadius:'var(--r-md)', padding:'10px var(--sp-4)', textAlign:'center', animation:'fadeInUp 0.3s ease', width:'100%' }}>
      <p style={{ fontFamily:'var(--font-heading)', fontWeight:600, fontSize:'14px', letterSpacing:'0.06em', color:'var(--amber)' }}>
        👁 You're spectating — you've been eliminated
      </p>
    </div>
  );
}
