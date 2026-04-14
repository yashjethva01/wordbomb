/**
 * SoundToggle — receives muted state and toggle fn as props.
 * No internal state — truth comes from useSound hook in parent.
 */
export default function SoundToggle({ muted, onToggle, style: extra }) {
  return (
    <button>
      
      {muted ? '🔇' : '🔊'}
    </button>
  );
}
