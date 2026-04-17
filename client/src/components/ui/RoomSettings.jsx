/**
 * RoomSettings — pill-button selector groups for room creation.
 * No native <select> elements — uses button groups for premium feel.
 */

function PillGroup({ label, options, value, onChange }) {
  return (
    <div>
      <p style={{ fontSize:'11px', fontFamily:'var(--font-heading)', fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:'8px' }}>
        {label}
      </p>
      <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
        {options.map(opt => {
          const isActive = String(opt.value) === String(value);
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              style={{
                padding:        '7px 14px',
                borderRadius:   'var(--r-full)',
                border:         isActive ? '1.5px solid var(--cyan)' : '1px solid var(--border-1)',
                background:     isActive ? 'var(--cyan-low)' : 'var(--glass-1)',
                color:          isActive ? 'var(--cyan)' : 'var(--text-secondary)',
                fontFamily:     'var(--font-heading)',
                fontWeight:     isActive ? 700 : 600,
                fontSize:       '13px',
                letterSpacing:  '0.04em',
                cursor:         'pointer',
                transition:     'all var(--t-fast)',
                boxShadow:      isActive ? 'var(--cyan-glow-sm)' : 'none',
                transform:      isActive ? 'scale(1.04)' : 'scale(1)',
                whiteSpace:     'nowrap',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background   = 'var(--glass-hover)';
                  e.currentTarget.style.borderColor  = 'var(--border-2)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background   = 'var(--glass-1)';
                  e.currentTarget.style.borderColor  = 'var(--border-1)';
                }
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const LIVES_OPTS       = [1,2,3,4,5].map(v => ({ value: v, label: `${v} ♥` }));
const TURN_OPTS        = [7,10,15,20,30].map(v => ({ value: v, label: `${v}s` }));
const PLAYERS_OPTS     = [2,3,4,6,8].map(v => ({ value: v, label: `${v}` }));
const DIFFICULTY_OPTS  = [
  { value:'easy',   label:'Easy 🟢' },
  { value:'medium', label:'Medium 🟡' },
  { value:'hard',   label:'Hard 🔴' },
];

export default function RoomSettings({ settings, onChange }) {
  const set = (key, val) => onChange({ ...settings, [key]: val });

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-5)' }}>
      <PillGroup label="Lives per Player" options={LIVES_OPTS}      value={settings.lives}      onChange={v => set('lives', v)} />
      <PillGroup label="Turn Time"        options={TURN_OPTS}        value={settings.turnTime}   onChange={v => set('turnTime', v)} />
      <PillGroup label="Max Players"      options={PLAYERS_OPTS}     value={settings.maxPlayers} onChange={v => set('maxPlayers', v)} />
      <PillGroup label="Difficulty"       options={DIFFICULTY_OPTS}  value={settings.difficulty} onChange={v => set('difficulty', v)} />
    </div>
  );
}
