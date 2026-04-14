import { forwardRef } from 'react';

const Input = forwardRef(function Input({ label, error, prefix, suffix, fullWidth=true, style:extra, containerStyle, ...props }, ref) {
  return (
    <div style={{ width:fullWidth?'100%':undefined, ...containerStyle }}>
      {label && (
        <label style={{ display:'block', marginBottom:'6px', fontSize:'12px', fontFamily:'var(--font-heading)', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
        {prefix && <span style={{ position:'absolute', left:'14px', color:'var(--text-muted)', fontSize:'15px', pointerEvents:'none' }}>{prefix}</span>}
        <input ref={ref}
          style={{ width:'100%', height:'46px', background:'rgba(255,255,255,0.04)', border:`1px solid ${error?'var(--red)':'var(--border-1)'}`, borderRadius:'var(--r-md)', color:'var(--text-primary)', fontFamily:'var(--font-body)', fontSize:'15px', padding:`0 ${suffix?'44px':'14px'} 0 ${prefix?'40px':'14px'}`, outline:'none', transition:'border-color var(--t-fast), box-shadow var(--t-fast)', boxShadow:error?'0 0 0 2px var(--red-mid)':'none', ...extra }}
          onFocus={e=>{ if(!error){e.target.style.borderColor='var(--cyan)'; e.target.style.boxShadow='0 0 0 2px var(--cyan-low)';} }}
          onBlur={e=>{ if(!error){e.target.style.borderColor='var(--border-1)'; e.target.style.boxShadow='none';} }}
          {...props}
        />
        {suffix && <span style={{ position:'absolute', right:'14px', color:'var(--text-muted)', fontSize:'15px', pointerEvents:'none' }}>{suffix}</span>}
      </div>
      {error && <p style={{ marginTop:'5px', fontSize:'12px', color:'var(--red)', fontFamily:'var(--font-body)' }}>{error}</p>}
    </div>
  );
});

export default Input;
