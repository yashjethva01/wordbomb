import { useEffect, useRef } from 'react';
import { useNavigate }       from 'react-router-dom';
import socketService          from '../services/socketService';
import { useGameState }       from './useGameState';

export function useSocket() {
  const { dispatch, state } = useGameState();
  const navigate            = useNavigate();

  // ── Session ref — always has the latest values without stale closure ──
  // This is the key fix for auto-rejoin after a transport reconnect:
  // we can't read `state` inside the socket event handlers (stale closure)
  // but we CAN read a ref that's updated every render.
  const sessionRef = useRef({
    roomCode: null,
    nickname: null,
  });

  // Keep sessionRef in sync with the latest state
  useEffect(() => {
    sessionRef.current = {
      roomCode: state.roomCode,
      nickname: state.nickname,
    };
  });

  useEffect(() => {
    const socket = socketService.connect();

    // ── Helper: attempt to rejoin the stored session ──────────────────
    // Called after EVERY 'connect' event. If the user has an active session
    // (roomCode in state) the server will recognise this as a reconnect via
    // the grace-period mechanism and restore their slot without creating a
    // duplicate player.
    function maybeRejoin() {
      const { roomCode, nickname } = sessionRef.current;
      if (!roomCode || !nickname) return;       // no session → nothing to do
      const avatar = localStorage.getItem('wb_avatar') ?? 'robot';
      console.log(`[useSocket] Auto-rejoin after reconnect: ${roomCode}`);
      socketService.emit('join_room', { nickname, roomCode, avatar });
    }

    // Track whether the first 'connect' has been handled so we only
    // auto-rejoin on the *second and subsequent* connect events
    // (i.e. true transport reconnects, not the initial connection).
    let initialConnectDone = false;

    const cleanups = [
      // ── Connection lifecycle ────────────────────────────────────────
      socketService.on('connect', () => {
        dispatch({ type: 'SOCKET_CONNECTED', payload: { socketId: socket.id } });

        if (initialConnectDone) {
          // This is a transport reconnect — auto-rejoin the room
          maybeRejoin();
        }
        initialConnectDone = true;
      }),

      socketService.on('disconnect', (reason) => {
        dispatch({ type: 'SOCKET_DISCONNECTED' });
        // Only show toast for unintentional disconnects
        if (reason !== 'io client disconnect' && reason !== 'io server disconnect') {
          dispatch({ type: 'ADD_TOAST', payload: { type: 'warn', message: 'Connection lost — reconnecting…' } });
        }
      }),

      // 'reconnect' fires on the Manager object, not the socket.
      // We expose this via socketService.onManager.
      socketService.onManager('reconnect', (attempt) => {
        console.log(`[useSocket] Transport reconnected after ${attempt} attempt(s)`);
        // The 'connect' handler above will call maybeRejoin(); no action needed here.
        // We DO want to show a toast only after a confirmed reconnect.
        dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: 'Reconnected!' } });
      }),

      socketService.onManager('reconnect_error', () => {
        // Suppress noisy intermediate errors — only log, no toast
        console.warn('[useSocket] Reconnect attempt failed, retrying…');
      }),

      socketService.onManager('reconnect_failed', () => {
        dispatch({ type: 'ADD_TOAST', payload: { type: 'error', message: 'Could not reconnect. Please refresh.' } });
      }),

      // ── Room entry ─────────────────────────────────────────────────
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
        // Only navigate if we are NOT on the correct page already (prevents
        // flicker when auto-rejoining after a transport reconnect)
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

      // ── Lobby events ───────────────────────────────────────────────
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

      // ── Reconnect ID re-key ────────────────────────────────────────
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

      // ── Game events ────────────────────────────────────────────────
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

      // ── Full state restore (reconnect / refresh) ───────────────────
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
