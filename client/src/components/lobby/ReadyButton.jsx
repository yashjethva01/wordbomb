import Button from '../ui/Button';
import { useGameState } from '../../hooks/useGameState';
import socketService from '../../services/socketService';

export default function ReadyButton() {
  const { state } = useGameState();
  const me      = state.players.find(p => p.id === state.myId);
  const isReady = me?.isReady ?? false;
  return (
    <Button variant={isReady?'secondary':'primary'} size="lg" fullWidth onClick={() => socketService.emit('player_ready', { ready:!isReady })}
      style={isReady?{ borderColor:'var(--green-mid)', background:'var(--green-low)', color:'var(--green)', border:'1px solid var(--green-mid)' }:{}}>
      {isReady ? '✓  Ready!' : 'Click to Ready Up'}
    </Button>
  );
}
