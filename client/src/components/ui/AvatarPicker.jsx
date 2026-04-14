import { AVATARS } from '../../utils/avatars';

/**
 * AvatarPicker — grid of selectable emoji avatars.
 *
 * Props:
 *   selected    {string}   current avatar id
 *   takenIds    {string[]} avatar ids already taken in the room
 *   onSelect    {fn}       (id) => void
 *   error       {string}   optional error message
 */
export default function AvatarPicker({ selected, takenIds = [], onSelect, error }) {
  return (
    <div>
      <label style={{ display:'block', marginBottom:'8px', fontSize:'12px', fontFamily:'var(--font-heading)', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text-secondary)' }}>
        Choose Avatar
      </label>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(8,1fr)', gap:'6px' }}>
        {AVATARS.map(av => {
          const isTaken    = takenIds.includes(av.id) && av.id !== selected;
          const isSelected = av.id === selected;
          return (
            <button
              key={av.id}
              title={isTaken ? `${av.label} — taken` : av.label}
              disabled={isTaken}
              onClick={() => !isTaken && onSelect(av.id)}
              style={{
                width:          '100%',
                aspectRatio:    '1',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                fontSize:       '22px',
                borderRadius:   'var(--r-md)',
                border:         isSelected
                  ? '2px solid var(--cyan)'
                  : '2px solid var(--border-1)',
                background:     isSelected
                  ? 'var(--cyan-low)'
                  : 'var(--glass-1)',
                boxShadow:      isSelected
                  ? 'var(--cyan-glow-sm), 0 0 20px rgba(0,229,255,0.1)'
                  : 'none',
                cursor:         isTaken ? 'not-allowed' : 'pointer',
                opacity:        isTaken ? 0.28 : 1,
                transition:     'all var(--t-mid)',
                transform:      isSelected ? 'scale(1.08)' : 'scale(1)',
                position:       'relative',
                padding:        0,
              }}
              onMouseEnter={e => {
                if (!isTaken && !isSelected) {
                  e.currentTarget.style.background   = 'var(--glass-hover)';
                  e.currentTarget.style.borderColor  = 'var(--border-2)';
                  e.currentTarget.style.transform    = 'scale(1.06)';
                }
              }}
              onMouseLeave={e => {
                if (!isSelected) {
                  e.currentTarget.style.background   = 'var(--glass-1)';
                  e.currentTarget.style.borderColor  = 'var(--border-1)';
                  e.currentTarget.style.transform    = 'scale(1)';
                }
              }}
            >
              {av.emoji}
              {isTaken && (
                <span style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', background:'rgba(6,8,15,0.6)', borderRadius:'inherit', color:'var(--text-muted)' }}>
                  ✕
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <p style={{ marginTop:'6px', fontSize:'12px', color:'var(--red)', fontFamily:'var(--font-body)', display:'flex', alignItems:'center', gap:'5px' }}>
          <span>⚠</span> {error}
        </p>
      )}

      {selected && (
        <p style={{ marginTop:'6px', fontSize:'12px', color:'var(--cyan)', fontFamily:'var(--font-body)' }}>
          Selected: {AVATARS.find(a => a.id === selected)?.emoji} {AVATARS.find(a => a.id === selected)?.label}
        </p>
      )}
    </div>
  );
}
