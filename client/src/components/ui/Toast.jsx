import { useEffect, useState, useCallback } from 'react';
import { useGameState } from '../../hooks/useGameState';

// Duration per toast type — short enough to be non-intrusive
const DURATIONS = { success: 2200, info: 2500, warn: 3200, error: 4500 };
// Never show more than N toasts at once (oldest auto-removed)
const MAX_TOASTS = 3;

const ICONS  = { success:'✓', error:'✕', warn:'⚠', info:'ℹ' };
const COLORS = {
  success: { border:'var(--green-mid)', icon:'var(--green)', bg:'rgba(0,255,157,0.08)' },
  error:   { border:'var(--red-mid)',   icon:'var(--red)',   bg:'rgba(255,56,96,0.10)' },
  warn:    { border:'var(--amber-mid)', icon:'var(--amber)', bg:'rgba(255,170,0,0.08)' },
  info:    { border:'var(--border-2)',  icon:'var(--text-secondary)', bg:'var(--glass-2)' },
};

function ToastItem({ toast, onRemove }) {
  const [exiting, setExiting] = useState(false);
  const duration = DURATIONS[toast.type] ?? 2500;

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 260);
  }, [toast.id, onRemove]);

  // Auto-dismiss
  useEffect(() => {
    const t = setTimeout(dismiss, duration);
    return () => clearTimeout(t);
  }, [dismiss, duration]);

  const c = COLORS[toast.type] ?? COLORS.info;

  return (
    <div
      onClick={dismiss}
      style={{
        display:        'flex',
        alignItems:     'center',
        gap:            '10px',
        padding:        '10px 14px',
        borderRadius:   'var(--r-md)',
        background:     c.bg,
        border:         `1px solid ${c.border}`,
        backdropFilter: 'blur(20px)',
        boxShadow:      '0 4px 20px rgba(0,0,0,0.4)',
        cursor:         'pointer',
        userSelect:     'none',
        animation:      exiting
          ? 'toastOut 0.25s ease-in forwards'
          : 'toastIn 0.28s var(--ease-out-expo) forwards',
        maxWidth:       '320px',
        minWidth:       '220px',
      }}
    >
      <span style={{
        color:      c.icon,
        fontWeight: 700,
        fontSize:   '13px',
        flexShrink: 0,
        width:      '16px',
        textAlign:  'center',
      }}>
        {ICONS[toast.type]}
      </span>
      <p style={{
        fontSize:   '13px',
        color:      'var(--text-primary)',
        fontFamily: 'var(--font-body)',
        lineHeight: 1.35,
        flex:       1,
      }}>
        {toast.message}
      </p>
    </div>
  );
}

export default function Toast() {
  const { state, dispatch } = useGameState();
  const remove = useCallback((id) => dispatch({ type: 'REMOVE_TOAST', payload: { id } }), [dispatch]);

  // Keep at most MAX_TOASTS — auto-remove oldest
  const toasts = state.toasts.slice(-MAX_TOASTS);

  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onRemove={remove} />
      ))}
    </div>
  );
}
