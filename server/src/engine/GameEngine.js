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

    // Normalize room settings and apply safe defaults.
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
    this.turnStartedAt  = null;   // Used to detect fast answers.

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

  // Public methods used by socket handlers and room manager.

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

  handlePlayerDisconnect(socketId) {
    if (this.destroyed) return;
    const player = this.gamePlayers.get(socketId);
    if (!player || player.isEliminated) return;
    player.isConnected = false;
    const wasTheirTurn = this.turnActive && socketId === this._getCurrentPlayerId();
    if (wasTheirTurn) { this.turnActive = false; this.timer.stop(); this.turnsCompleted++; this._scheduleNextTurn(BOMB_EXPLODE_DELAY_MS); }
  }

  handlePlayerReconnect(oldSocketId, newSocketId) {
    if (this.destroyed) return;
    const player = this.gamePlayers.get(oldSocketId);
    if (!player) return;
    player.id          = newSocketId;
    player.isConnected = true;
    this.gamePlayers.delete(oldSocketId);
    this.gamePlayers.set(newSocketId, player);
    const idx = this.turnOrder.indexOf(oldSocketId);
    if (idx !== -1) this.turnOrder[idx] = newSocketId;
  }

  eliminateDisconnected(socketId) {
    if (this.destroyed) return;
    const player = this.gamePlayers.get(socketId);
    if (!player || player.isEliminated) return;
    player.lives        = 0;
    player.isEliminated = true;
    this._emitToRoom('player_eliminated', { playerId: socketId, nickname: player.nickname, reason: 'disconnected' });
    const winner = this._checkWinCondition();
    if (winner) { this._endGame(winner); return; }
    const wasTheirTurn = this.turnActive && socketId === this._getCurrentPlayerId();
    if (wasTheirTurn) { this.turnActive = false; this.timer.stop(); this.turnsCompleted++; this._scheduleNextTurn(0); }
  }

  getStateSnapshot() {
    return {
      players:         this._serializePlayers(),
      currentPlayerId: this._getCurrentPlayerId(),
      combo:           this.currentCombo,
      turnId:          this.currentTurnId,
      timeLeft:        this.timer.getTimeLeft(),
      turnsCompleted:  this.turnsCompleted,
      recentWords:     this.recentWords,
      settings:        this.settings,
    };
  }

  destroy() {
    this.destroyed  = true;
    this.turnActive = false;
    this.timer.stop();
    this.gamePlayers.clear();
    this.usedWords.clear();
  }

  // Internal helpers for turn flow and game state.

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

  _handleTimeout() {
    if (this.destroyed || !this.turnActive) return;
    this.turnActive = false;

    const playerId = this._getCurrentPlayerId();
    const player   = playerId ? this.gamePlayers.get(playerId) : null;

    if (!player || player.isEliminated) { this.turnsCompleted++; this._scheduleNextTurn(BOMB_EXPLODE_DELAY_MS); return; }

    player.lives--;
    const isEliminated = player.lives <= 0;
    if (isEliminated) player.isEliminated = true;
    this.turnsCompleted++;

    this._emitToRoom('bomb_exploded', { playerId, nickname: player.nickname, avatar: player.avatar, livesLeft: player.lives, isEliminated });
    if (isEliminated) this._emitToRoom('player_eliminated', { playerId, nickname: player.nickname, reason: 'timeout' });

    const winner = this._checkWinCondition();
    if (winner) { setTimeout(() => this._endGame(winner), BOMB_EXPLODE_DELAY_MS); return; }
    this._scheduleNextTurn(BOMB_EXPLODE_DELAY_MS);
  }

  _scheduleNextTurn(delayMs) {
    if (this.destroyed) return;
    setTimeout(() => { if (this.destroyed) return; this._advanceIndex(); this._startTurn(); }, delayMs);
  }

  _advanceIndex() {
    let attempts = 0;
    do {
      this.turnIndex = (this.turnIndex + 1) % this.turnOrder.length;
      attempts++;
    } while (attempts < this.turnOrder.length && this._isPlayerEliminated(this.turnOrder[this.turnIndex]));
  }

  _getCurrentPlayerId()       { return this.turnOrder[this.turnIndex] || null; }
  _isPlayerEliminated(id)     { const p = this.gamePlayers.get(id); return !p || p.isEliminated; }
  _getAlivePlayers()          { return [...this.gamePlayers.values()].filter(p => !p.isEliminated); }
  _checkWinCondition()        { const a = this._getAlivePlayers(); return a.length <= 1 ? (a[0] ?? null) : null; }

  _endGame(winner) {
    this.destroyed  = true;
    this.turnActive = false;
    this.timer.stop();
    if (this.onGameOver) { try { this.onGameOver(); } catch(e) { console.error('[GameEngine] onGameOver:', e); } }

    this._emitToRoom('game_over', {
      winnerId:       winner?.id       ?? null,
      winnerNickname: winner?.nickname ?? null,
      stats: { totalTurns: this.turnsCompleted, uniqueWordsUsed: this.usedWords.size, players: this._serializePlayers() },
    });
  }

  _addRecentWord(word, player) {
    this.recentWords.unshift({ word, nickname: player.nickname, playerId: player.id, avatar: player.avatar });
    if (this.recentWords.length > RECENT_WORDS_FEED_SIZE) this.recentWords.pop();
  }

  _serializePlayers() {
    return [...this.gamePlayers.values()].map(p => ({
      id: p.id, nickname: p.nickname, avatar: p.avatar,
      lives: p.lives, wordsSubmitted: p.wordsSubmitted,
      isEliminated: p.isEliminated, isConnected: p.isConnected,
    }));
  }

  _emitToRoom(event, data)             { this.io.to(this.roomCode).emit(event, data); }
  _emitToPlayer(socketId, event, data) { this.io.to(socketId).emit(event, data); }
}

module.exports = GameEngine;
