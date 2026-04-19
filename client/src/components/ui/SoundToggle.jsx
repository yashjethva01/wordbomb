/**
 * Stateless mute/unmute toggle button.
 * Parent components provide state and handler.
 */
export default function SoundToggle({ muted, onToggle, style: extra }) {
  return (
    <button
      onClick={onToggle}
      title={muted ? 'Unmute sounds' : 'Mute sounds'}
      style={{
        background:   'var(--glass-1)',
        border:       '1px solid var(--border-1)',
        borderRadius: 'var(--r-sm)',
        color:        muted ? 'var(--text-muted)' : 'var(--text-secondary)',
        cursor:       'pointer',
        padding:      '7px 10px',
        fontSize:     '16px',
        lineHeight:   1,
        transition:   'all var(--t-fast)',
        ...extra,
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-2)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-1)'}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}
