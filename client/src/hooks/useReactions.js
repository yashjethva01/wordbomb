import { useEffect } from 'react';
import { useGameState } from './useGameState';

export function useReactions() {
  const { state, dispatch } = useGameState();

  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'PRUNE_REACTIONS' });
    }, 500);
    return () => clearInterval(interval);
  }, [dispatch]);

  return state.reactions;
}
