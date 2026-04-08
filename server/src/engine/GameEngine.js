'use strict';

const { randomUUID } = require('crypto');
const TimerEngine    = require('./TimerEngine');
const WordValidator  = require('./WordValidator');
const ComboGenerator = require('./ComboGenerator');
const { getWordSet } = require('../config/dictionary');
const { STARTING_LIVES, BASE_TURN_DURATION_MS, MIN_TURN_DURATION_MS, TURN_DURATION_DECREMENT_MS, WORD_ACCEPTED_DELAY_MS, BOMB_EXPLODE_DELAY_MS, RECENT_WORDS_FEED_SIZE } = require('../config/constants');

class GameEngine {
  constructor(roomCode, lobbyPlayers, io, onGameOver, settings = {}) {
    this.roomCode   = roomCode;
    this.io         = io;
    this.onGameOver = typeof onGameOver === 'function' ? onGameOver : null;

    // Normalise settings with safe defaults
    this.settings = {
      lives:      Math.min(5, Math.max(1, parseInt(settings.lives)      || STARTING_LIVES)),
      turnTime:   Math.min(30, Math.max(5, parseInt(settings.turnTime)  || Math.round(BASE_TURN_DURATION_MS/1000))),
      maxPlayers: parseInt(settings.maxPlayers) || 8,
      difficulty: ['easy','medium','hard'].includes(settings.difficulty) ? settings.difficulty : 'medium',
    };

    this.gamePlayers    = new Map();
    this.turnOrder      = [];
    this.turnIndex      = 0;
    this.currentTurnId  = null;
    this.currentCombo   = null;
    this.turnActive     = false;
    this.turnsCompleted = 0;
    this.turnStartedAt  = null;   // for fast-answer detection

    this.usedWords   = new Set();
    this.recentWords = [];
    this.destroyed   = false;

    this.timer     = new TimerEngine();
    this.validator = new WordValidator();
    this.combogen  = new ComboGenerator(getWordSet());

    const shuffled = [...lobbyPlayers].sort(() => Math.random() - 0.5);
    for (const p of shuffled) {
      this.gamePlayers.set(p.id, {
        id:             p.id,
        nickname:       p.nickname,
        avatar:         p.avatar || 'robot',
        lives:          this.settings.lives,
        wordsSubmitted: 0,
        isEliminated:   false,
        isConnected:    true,
      });
      this.turnOrder.push(p.id);
    }
  }

  // ─────────────────────────────────────────────── public API ───

  startGame() {
    this._emitToRoom('game_started', {
      players:           this._serializePlayers(),
      firstTurnPlayerId: this.turnOrder[0],
      settings:          this.settings,
    });
    this._startTurn();
  }

  handleSubmission(socketId, word, turnId) {
    if (this.destroyed)                          return;
    if (!this.turnActive)                        return;
    if (turnId !== this.currentTurnId)           return;
    if (socketId !== this._getCurrentPlayerId()) return;

    const normalized = word.toLowerCase().trim();
    const result     = this.validator.validate(normalized, this.currentCombo, this.usedWords);

    if (!result.valid) {
      this._emitToPlayer(socketId, 'word_rejected', { word: normalized, reason: result.reason });
      return;
    }

    this.turnActive = false;
    this.timer.stop();

    const player = this.gamePlayers.get(socketId);
    this.usedWords.add(normalized);
    this._addRecentWord(normalized, player);
    player.wordsSubmitted++;
    this.turnsCompleted++;

    const responseMs = this.turnStartedAt ? Date.now() - this.turnStartedAt : 9999;
    const fast       = responseMs < 3000;

    this._emitToRoom('word_accepted', {
      word:        normalized,
      playerId:    socketId,
      nickname:    player.nickname,
      avatar:      player.avatar,
      recentWords: this.recentWords,
      fast,
      responseMs,
    });

    this._scheduleNextTurn(WORD_ACCEPTED_DELAY_MS);
  }


  // ─────────────────────────────────────────────── private ───

  _startTurn() {
    if (this.destroyed) return;
    const winner = this._checkWinCondition();
    if (winner) { this._endGame(winner); return; }

    const playerId = this._getCurrentPlayerId();
    if (!playerId) { console.error('[GameEngine] _startTurn: no current player'); return; }

    const player = this.gamePlayers.get(playerId);
    if (!player || player.isEliminated) { this._advanceIndex(); this._startTurn(); return; }

    const baseDuration = this.settings.turnTime * 1000;
    const minDuration  = Math.max(MIN_TURN_DURATION_MS, Math.round(baseDuration * 0.5));
    const turnDuration = Math.max(minDuration, baseDuration - this.turnsCompleted * TURN_DURATION_DECREMENT_MS);

    this.currentTurnId = randomUUID();
    this.currentCombo  = this.combogen.generate(this.turnsCompleted, this.currentCombo, this.settings.difficulty);
    this.turnActive    = true;
    this.turnStartedAt = Date.now();

    this._emitToRoom('turn_started', { playerId, nickname: player.nickname, avatar: player.avatar, combo: this.currentCombo, turnId: this.currentTurnId, timeLimit: Math.round(turnDuration / 1000) });

    this.timer.start(
      turnDuration,
      (timeLeftSec) => { this._emitToRoom('timer_tick', { timeLeft: timeLeftSec, turnId: this.currentTurnId }); },
      () => this._handleTimeout(),
    );
  }

}



