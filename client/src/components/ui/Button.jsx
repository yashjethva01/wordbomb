/**
 * Button — single source of truth for all interactive buttons.
 * variants: 'primary' | 'secondary' | 'danger' | 'ghost'
 * sizes:    'sm' | 'md' | 'lg'
 */
export default function Button({
  children, variant = 'primary', size = 'md',
  disabled = false, loading = false, fullWidth = false,
  onClick, type = 'button', style: extra, ...rest
}) {
  const base = {
    display:        'inline-flex',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '7px',
    border:         'none',
    borderRadius:   'var(--r-md)',
    fontFamily:     'var(--font-heading)',
    fontWeight:     700,
    letterSpacing:  '0.06em',
    textTransform:  'uppercase',
    cursor:         disabled || loading ? 'not-allowed' : 'pointer',
    transition:     'transform 0.15s ease, box-shadow 0.18s ease, background 0.18s ease, color 0.18s ease, border-color 0.18s ease, opacity 0.18s ease',
    userSelect:     'none',
    whiteSpace:     'nowrap',
    width:          fullWidth ? '100%' : undefined,
    position:       'relative',
    overflow:       'hidden',
    outline:        'none',
  };

  const sizes = {
    sm: { padding:'7px 14px',  fontSize:'12px', height:'32px' },
    md: { padding:'10px 22px', fontSize:'14px', height:'40px' },
    lg: { padding:'13px 28px', fontSize:'16px', height:'50px' },
  };

  const variants = {
    primary: {
      background: 'linear-gradient(135deg, var(--cyan) 0%, #0090cc 100%)',
      color:      '#06080f',
      boxShadow:  disabled ? 'none' : '0 2px 14px rgba(0,229,255,0.28)',
      opacity:    disabled ? 0.45 : 1,
    },
    secondary: {
      background:  'var(--glass-1)',
      color:       'var(--text-primary)',
      border:      '1px solid var(--border-1)',
      boxShadow:   'var(--shadow-sm)',
      opacity:     disabled ? 0.45 : 1,
    },
    danger: {
      background:  'linear-gradient(135deg, var(--red) 0%, #cc1a3a 100%)',
      color:       '#fff',
      boxShadow:   disabled ? 'none' : '0 2px 14px rgba(255,56,96,0.28)',
      opacity:     disabled ? 0.45 : 1,
    },
    ghost: {
      background:  'transparent',
      color:       'var(--text-secondary)',
      border:      '1px solid transparent',
      opacity:     disabled ? 0.35 : 1,
    },
  };

  const handleHoverIn = (e) => {
    if (disabled || loading) return;
    const el = e.currentTarget;
    if (variant === 'primary') {
      el.style.transform  = 'translateY(-1px) scale(1.01)';
      el.style.boxShadow  = '0 6px 22px rgba(0,229,255,0.40)';
    } else if (variant === 'secondary') {
      el.style.background   = 'var(--glass-hover)';
      el.style.borderColor  = 'var(--border-2)';
    } else if (variant === 'danger') {
      el.style.transform  = 'translateY(-1px)';
      el.style.boxShadow  = '0 6px 22px rgba(255,56,96,0.38)';
    } else if (variant === 'ghost') {
      el.style.color       = 'var(--text-primary)';
      el.style.background  = 'var(--glass-1)';
      el.style.borderColor = 'var(--border-1)';
    }
  };

  const handleHoverOut = (e) => {
    const el = e.currentTarget;
    if (variant === 'primary') {
      el.style.transform = '';
      el.style.boxShadow = disabled ? 'none' : '0 2px 14px rgba(0,229,255,0.28)';
    } else if (variant === 'secondary') {
      el.style.background   = 'var(--glass-1)';
      el.style.borderColor  = 'var(--border-1)';
    } else if (variant === 'danger') {
      el.style.transform = '';
      el.style.boxShadow = disabled ? 'none' : '0 2px 14px rgba(255,56,96,0.28)';
    } else if (variant === 'ghost') {
      el.style.color       = 'var(--text-secondary)';
      el.style.background  = 'transparent';
      el.style.borderColor = 'transparent';
    }
  };

  const handleMouseDown = (e) => {
    if (disabled || loading) return;
    e.currentTarget.style.transform = 'translateY(0) scale(0.98)';
  };

  const handleMouseUp = (e) => {
    if (disabled || loading) return;
    e.currentTarget.style.transform = '';
  };

  return (
    <button
      type={type}
      onClick={!disabled && !loading ? onClick : undefined}
      disabled={disabled || loading}
      style={{ ...base, ...sizes[size], ...variants[variant], ...extra }}
      onMouseEnter={handleHoverIn}
      onMouseLeave={handleHoverOut}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      {...rest}
    >
      {loading ? (
        <span style={{ opacity: 0.6, letterSpacing: '0.18em' }}>···</span>
      ) : children}
    </button>
  );
}
