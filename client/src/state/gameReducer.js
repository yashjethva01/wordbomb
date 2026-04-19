import initialState from './initialState';

let toastId = 0;
let evtId   = 0;

function mkEvt(type, message, extra = {}) {
  return { id: `e${++evtId}`, type, message, timestamp: Date.now(), ...extra };
}

function addEvent(state, evt) {
  const feed = [evt, ...state.eventFeed].slice(0, 40);
  return { ...state, eventFeed: feed };
}

export default function gameReducer(state, action) {
  switch (action.type) {

    case 'SOCKET_CONNECTED':   return { ...state, connected: true, socketId: action.payload.socketId };
    case 'SOCKET_DISCONNECTED':return { ...state, connected: false };

    case 'ROOM_CREATED':
    case 'ROOM_JOINED': {
      const { roomState, yourId } = action.payload;
      return {
        ...state,
        myId: yourId, roomCode: roomState.code, phase: roomState.phase,
        hostId: roomState.hostId, players: roomState.players,
        roomSettings: roomState.settings ?? state.roomSettings,
        nickname: roomState.players.find(p => p.id === yourId)?.nickname ?? state.nickname,
        avatar:   roomState.players.find(p => p.id === yourId)?.avatar   ?? state.avatar,
        avatarError: null,
      };
    }

    case 'SET_AVATAR_ERROR':  return { ...state, avatarError: action.payload.message };
    case 'CLEAR_AVATAR_ERROR':return { ...state, avatarError: null };

    case 'PLAYER_JOINED': {
      const { player } = action.payload;
      if (state.players.some(p => p.id === player.id)) return state;
      return addEvent(
        { ...state, players: [...state.players, player] },
        mkEvt('player_joined', `${player.nickname} joined the room`)
      );
    }

    case 'PLAYER_LEFT': {
      const { playerId, nickname } = action.payload;
      return addEvent(
        { ...state, players: state.players.filter(p => p.id !== playerId) },
        mkEvt('player_left', `${nickname} left the room`)
      );
    }

    case 'PLAYER_READY_CHANGED':
      return { ...state, players: state.players.map(p => p.id === action.payload.playerId ? { ...p, isReady: action.payload.ready } : p) };

    case 'HOST_MIGRATED':
      return { ...state, hostId: action.payload.newHostId };

    case 'PLAYER_RECONNECTED': {
      const { oldPlayerId, newPlayerId, nickname } = action.payload;
      return addEvent({
        ...state,
        players: state.players.map(p => p.id === oldPlayerId ? { ...p, id: newPlayerId, isConnected: true } : p),
        currentPlayerId: state.currentPlayerId === oldPlayerId ? newPlayerId : state.currentPlayerId,
        hostId:          state.hostId          === oldPlayerId ? newPlayerId : state.hostId,
      }, mkEvt('player_reconnected', `${nickname} reconnected`));
    }

    case 'PLAYER_CONNECTION_CHANGED':
      return { ...state, players: state.players.map(p => p.id === action.payload.playerId ? { ...p, isConnected: action.payload.isConnected } : p) };

    case 'GAME_STARTED': {
      const s = addEvent({
        ...state,
        phase: 'game', players: action.payload.players,
        currentPlayerId: null, combo: null, turnId: null, timeLeft: 0, timeLimit: 15,
        bombExploding: false, lastRejection: null, recentWords: [],
        streak: 0, reactions: [], eventFeed: [],
        winnerId: null, winnerNickname: null, gameStats: null, rematchVotes: 0, rematchRequired: 0,
        roomSettings: action.payload.settings ?? state.roomSettings,
      }, mkEvt('game_started', 'Game started! 🚀'));
      return s;
    }

    case 'TURN_STARTED':
      return { ...state, currentPlayerId: action.payload.playerId, combo: action.payload.combo, turnId: action.payload.turnId, timeLeft: action.payload.timeLimit, timeLimit: action.payload.timeLimit, lastRejection: null, bombExploding: false };

    case 'TIMER_TICK':
      if (action.payload.turnId !== state.turnId) return state;
      return { ...state, timeLeft: action.payload.timeLeft };

    case 'WORD_ACCEPTED': {
      const { recentWords, nickname, word, fast } = action.payload;
      const msg = fast ? `⚡ ${nickname} · ${word}` : `${nickname} · ${word}`;
      return addEvent(
        { ...state, recentWords, streak: state.streak + 1, lastRejection: null },
        mkEvt('word_accepted', msg, { fast: !!fast })
      );
    }

    case 'WORD_REJECTED': {
      const { word, reason } = action.payload;
      return addEvent(
        { ...state, lastRejection: { word, reason } },
        mkEvt('word_rejected', `You tried "${word}" — ${reason}`)
      );
    }

    case 'CLEAR_REJECTION': return { ...state, lastRejection: null };

    case 'BOMB_EXPLODED': {
      const { playerId, nickname, livesLeft, isEliminated } = action.payload;
      return addEvent({
        ...state,
        streak: 0,
        bombExploding: true,
        players: state.players.map(p => p.id === playerId ? { ...p, lives: livesLeft, isEliminated: isEliminated ?? p.isEliminated } : p),
      }, mkEvt('bomb_exploded', `💥 ${nickname} — ${livesLeft} ${livesLeft === 1 ? 'life' : 'lives'} left`));
    }

    case 'SET_EXPLODING': return { ...state, bombExploding: action.payload.exploding };

    case 'PLAYER_ELIMINATED': {
      const { playerId, nickname, reason } = action.payload;
      const msg = reason === 'disconnected' ? `💀 ${nickname} eliminated (disconnected)` : `💀 ${nickname} eliminated`;
      return addEvent(
        { ...state, players: state.players.map(p => p.id === playerId ? { ...p, isEliminated: true, lives: 0 } : p) },
        mkEvt('player_eliminated', msg)
      );
    }

    case 'REACTION_RECEIVED': {
      const { playerId, nickname, emoji } = action.payload;
      return { ...state, reactions: [...state.reactions, { id:`r${Date.now()}-${Math.random()}`, emoji, playerId, nickname, x: 10 + Math.random() * 80, createdAt: Date.now() }] };
    }

    case 'PRUNE_REACTIONS': {
      const cut = Date.now() - 2700;
      return { ...state, reactions: state.reactions.filter(r => r.createdAt > cut) };
    }

    case 'GAME_OVER': {
      const { winnerId, winnerNickname, stats } = action.payload;
      return addEvent({
        ...state, phase: 'finished', currentPlayerId: null, combo: null, turnId: null, bombExploding: false,
        winnerId, winnerNickname, gameStats: stats,
      }, mkEvt('game_over', `🏆 ${winnerNickname} wins!`));
    }

    case 'REMATCH_VOTES':   return { ...state, rematchVotes: action.payload.votes, rematchRequired: action.payload.required };

    case 'REMATCH_STARTED': {
      const { roomState } = action.payload;
      return { ...initialState, connected: state.connected, socketId: state.socketId, myId: state.myId, nickname: state.nickname, avatar: state.avatar, roomCode: roomState.code, phase: roomState.phase, hostId: roomState.hostId, players: roomState.players, roomSettings: roomState.settings ?? state.roomSettings };
    }

    case 'STATE_RESTORED': {
      const { roomState, yourId, gameState } = action.payload;
      const base = { ...state, myId: yourId, roomCode: roomState.code, phase: roomState.phase, hostId: roomState.hostId, players: roomState.players, roomSettings: roomState.settings ?? state.roomSettings, nickname: roomState.players.find(p => p.id === yourId)?.nickname ?? state.nickname, avatar: roomState.players.find(p => p.id === yourId)?.avatar ?? state.avatar };
      if (gameState) return { ...base, players: gameState.players ?? base.players, currentPlayerId: gameState.currentPlayerId ?? null, combo: gameState.combo ?? null, turnId: gameState.turnId ?? null, timeLeft: gameState.timeLeft ?? 0, recentWords: gameState.recentWords ?? [], roomSettings: gameState.settings ?? base.roomSettings };
      return base;
    }

    case 'ADD_TOAST': {
      const { type = 'info', message } = action.payload;
      // Skip duplicate toast messages already on screen.
      if (state.toasts.some(t => t.message === message)) return state;
      const toast = { id: `t${++toastId}`, type, message };
      // Keep up to four toasts and drop the oldest one first.
      const toasts = [...state.toasts, toast].slice(-4);
      return { ...state, toasts };
    }
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload.id) };

    default: return state;
  }
}
