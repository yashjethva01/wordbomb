import { useEffect, useRef } from 'react';
import { useNavigate }       from 'react-router-dom';
import socketService          from '../services/socketService';
import { useGameState }       from './useGameState';

export function useSocket() {
  const { dispatch, state } = useGameState();
  const navigate            = useNavigate();

  // Store the latest room and nickname in a ref.
  // Event handlers can read this ref safely without stale state bugs.
  const sessionRef = useRef({
    roomCode: null,
    nickname: null,
  });

  // Update the ref whenever room or nickname changes.
  useEffect(() => {
    sessionRef.current = {
      roomCode: state.roomCode,
      nickname: state.nickname,
    };
  });

  useEffect(() => {
    const socket = socketService.connect();

    // Rejoin the room after reconnect when we still have session data.
    // The server handles this as a reconnect and restores the same player.
    function maybeRejoin() {
      const { roomCode, nickname } = sessionRef.current;
      if (!roomCode || !nickname) return; // No active session.
      const avatar = localStorage.getItem('wb_avatar') ?? 'robot';
      console.log(`[useSocket] Auto-rejoin after reconnect: ${roomCode}`);
      socketService.emit('join_room', { nickname, roomCode, avatar });
    }

    // Only auto-rejoin on reconnect, not the very first connect.
    let initialConnectDone = false;

    const cleanups = [
      // Connection lifecycle events
      socketService.on('connect', () => {
        dispatch({ type: 'SOCKET_CONNECTED', payload: { socketId: socket.id } });

        if (initialConnectDone) {
          // This is a reconnect, so try to restore the room session.
          maybeRejoin();
        }
        initialConnectDone = true;
      }),

      socketService.on('disconnect', (reason) => {
        dispatch({ type: 'SOCKET_DISCONNECTED' });
        // Show a warning only for unexpected disconnects.
        if (reason !== 'io client disconnect' && reason !== 'io server disconnect') {
          dispatch({ type: 'ADD_TOAST', payload: { type: 'warn', message: 'Connection lost — reconnecting…' } });
        }
      }),

      // reconnect is emitted by the Socket.IO manager, not the socket.
      socketService.onManager('reconnect', (attempt) => {
        console.log(`[useSocket] Transport reconnected after ${attempt} attempt(s)`);
        // connect already handles room rejoin; only show success feedback here.
        dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: 'Reconnected!' } });
      }),

      socketService.onManager('reconnect_error', () => {
        // Keep retries quiet to avoid toast spam.
        console.warn('[useSocket] Reconnect attempt failed, retrying…');
      }),

      socketService.onManager('reconnect_failed', () => {
        dispatch({ type: 'ADD_TOAST', payload: { type: 'error', message: 'Could not reconnect. Please refresh.' } });
      }),

      // Room join/create events
      socketService.on('room_created', (payload) => {
        const nickname = payload.roomState.players.find(p => p.id === payload.yourId)?.nickname ?? '';
        localStorage.setItem('wb_nickname', nickname);
        localStorage.setItem('wb_roomCode', payload.roomState.code);
        dispatch({ type: 'ROOM_CREATED', payload });
        navigate(`/lobby/${payload.roomState.code}`);
      }),

      socketService.on('room_joined', (payload) => {
        const nickname = payload.roomState.players.find(p => p.id === payload.yourId)?.nickname ?? '';
        localStorage.setItem('wb_nickname', nickname);
        localStorage.setItem('wb_roomCode', payload.roomState.code);
        dispatch({ type: 'ROOM_JOINED', payload });
        // Skip navigation when already on lobby/game to avoid UI flicker.
        const targetPath = `/${payload.roomState.phase === 'game' ? 'game' : 'lobby'}/${payload.roomState.code}`;
        if (!window.location.pathname.startsWith(`/game/`) && !window.location.pathname.startsWith(`/lobby/`)) {
          navigate(`/lobby/${payload.roomState.code}`);
        }
      }),

      socketService.on('room_error', ({ code, message }) => {
        dispatch({ type: 'ADD_TOAST', payload: { type: 'error', message } });
        if (code === 'AVATAR_TAKEN') {
          dispatch({ type: 'SET_AVATAR_ERROR', payload: { message } });
        }
      }),

      // Lobby updates
      socketService.on('player_joined', (payload) => {
        dispatch({ type: 'PLAYER_JOINED', payload });
      }),
      socketService.on('player_left', (payload) => {
        dispatch({ type: 'PLAYER_LEFT', payload });
        dispatch({ type: 'ADD_TOAST', payload: { type: 'info', message: `${payload.nickname} left the room` } });
      }),
      socketService.on('player_ready_changed', (payload) => {
        dispatch({ type: 'PLAYER_READY_CHANGED', payload });
      }),
      socketService.on('all_players_ready', () => {
        dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: 'All players ready!' } });
      }),
      socketService.on('host_migrated', (payload) => {
        dispatch({ type: 'HOST_MIGRATED', payload });
        dispatch({ type: 'ADD_TOAST', payload: { type: 'info', message: `${payload.newHostNickname} is now the host` } });
      }),

      // Reconnect identity updates
      socketService.on('player_reconnected', (payload) => {
        dispatch({ type: 'PLAYER_RECONNECTED', payload });
        dispatch({ type: 'ADD_TOAST', payload: { type: 'info', message: `${payload.nickname} reconnected` } });
      }),
      socketService.on('player_connection_changed', (payload) => {
        dispatch({ type: 'PLAYER_CONNECTION_CHANGED', payload });
        if (!payload.isConnected) {
          dispatch({ type: 'ADD_TOAST', payload: { type: 'warn', message: `${payload.nickname} disconnected` } });
        }
      }),

      // In-game events
      socketService.on('game_started', (payload) => {
        dispatch({ type: 'GAME_STARTED', payload });
        const roomCode = localStorage.getItem('wb_roomCode');
        if (roomCode) navigate(`/game/${roomCode}`);
      }),
      socketService.on('turn_started',    (payload) => dispatch({ type: 'TURN_STARTED',    payload })),
      socketService.on('timer_tick',      (payload) => dispatch({ type: 'TIMER_TICK',       payload })),
      socketService.on('word_accepted',   (payload) => dispatch({ type: 'WORD_ACCEPTED',   payload })),
      socketService.on('word_rejected',   (payload) => dispatch({ type: 'WORD_REJECTED',   payload })),

      socketService.on('bomb_exploded', (payload) => {
        dispatch({ type: 'BOMB_EXPLODED', payload });
        setTimeout(() => dispatch({ type: 'SET_EXPLODING', payload: { exploding: false } }), 1200);
      }),
      socketService.on('player_eliminated', (payload) => {
        dispatch({ type: 'PLAYER_ELIMINATED', payload });
        dispatch({ type: 'ADD_TOAST', payload: { type: 'warn', message: `💀 ${payload.nickname} eliminated` } });
      }),
      socketService.on('reaction_received', (payload) => dispatch({ type: 'REACTION_RECEIVED', payload })),

      socketService.on('game_over', (payload) => {
        dispatch({ type: 'GAME_OVER', payload });
        const roomCode = localStorage.getItem('wb_roomCode');
        if (roomCode) navigate(`/winner/${roomCode}`);
      }),

      socketService.on('rematch_votes',   (payload) => dispatch({ type: 'REMATCH_VOTES',   payload })),
      socketService.on('rematch_started', (payload) => {
        dispatch({ type: 'REMATCH_STARTED', payload });
        navigate(`/lobby/${payload.roomState.code}`);
      }),

      // Full state restore after reconnect or page refresh
      socketService.on('game_state_restored', (payload) => {
        dispatch({ type: 'STATE_RESTORED', payload });
        const phase = payload.roomState?.phase;
        const code  = payload.roomState?.code;
        if (!code) return;
        const current = window.location.pathname;
        if (phase === 'game'     && !current.startsWith(`/game/`))   navigate(`/game/${code}`);
        if (phase === 'finished' && !current.startsWith(`/winner/`)) navigate(`/winner/${code}`);
        if (phase === 'lobby'    && !current.startsWith(`/lobby/`))  navigate(`/lobby/${code}`);
      }),
    ];

    return () => {
      cleanups.forEach(fn => fn());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, navigate]);
}
