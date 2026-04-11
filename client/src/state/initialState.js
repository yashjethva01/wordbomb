const initialState = {
  connected: false, socketId: null,
  myId: null, nickname: null, avatar: null,

  roomCode: null, phase: null, hostId: null,
  players: [],
  roomSettings: { lives: 3, turnTime: 15, maxPlayers: 8, difficulty: 'medium' },

  currentPlayerId: null, combo: null, turnId: null, timeLeft: 0, timeLimit: 15,

  recentWords: [],
  eventFeed:   [],    // live event log
  streak: 0,

  lastRejection: null, bombExploding: false, avatarError: null,
  reactions: [],

  winnerId: null, winnerNickname: null, gameStats: null,
  rematchVotes: 0, rematchRequired: 0,

  toasts: [],
};

export default initialState;
