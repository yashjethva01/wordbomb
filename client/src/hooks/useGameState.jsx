 import { createContext, useContext, useReducer } from 'react';
import gameReducer from '../state/gameReducer';
import initialState from '../state/initialState';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameState() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameState must be used inside <GameProvider>');
  return ctx;
}

export function useSelectors(state) {
  const me = state.players.find(p => p.id === state.myId) ?? null;
  const isMyTurn     = state.myId !== null && state.currentPlayerId === state.myId;
  const isAlive      = me !== null && me.isEliminated !== true;
  const isSpectating = me !== null && me.isEliminated === true;
  const isHost       = state.myId !== null && state.hostId === state.myId;
  const alivePlayers = state.players.filter(p => !p.isEliminated);
  const allReady     = state.players.length >= 2 && state.players.filter(p => p.isConnected).every(p => p.isReady);
  return { isMyTurn, isAlive, isSpectating, isHost, alivePlayers, me, allReady };
}
