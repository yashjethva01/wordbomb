'use strict';

const { COMBO_EASY_MIN_MATCHES, COMBO_MEDIUM_MIN_MATCHES, COMBO_HARD_MIN_MATCHES, DIFFICULTY_MEDIUM_THRESHOLD, DIFFICULTY_HARD_THRESHOLD } = require('../config/constants');

class ComboGenerator {
  constructor(dictionary) {
    this.pools = { easy: [], medium: [], hard: [] };
    this._buildPools(dictionary);
    console.log(`[ComboGenerator] easy:${this.pools.easy.length} medium:${this.pools.medium.length} hard:${this.pools.hard.length}`);
  }

  _buildPools(dictionary) {
    const counts = new Map();
    for (const word of dictionary) {
      const seen = new Set();
      for (let len = 2; len <= 3; len++) {
        for (let i = 0; i <= word.length - len; i++) {
          const sub = word.substring(i, i + len).toUpperCase();
          if (!/^[A-Z]+$/.test(sub)) continue;
          if (!seen.has(sub)) { seen.add(sub); counts.set(sub, (counts.get(sub) || 0) + 1); }
        }
      }
    }
    for (const [combo, count] of counts) {
      if (count >= COMBO_EASY_MIN_MATCHES)        this.pools.easy.push(combo);
      else if (count >= COMBO_MEDIUM_MIN_MATCHES) this.pools.medium.push(combo);
      else if (count >= COMBO_HARD_MIN_MATCHES)   this.pools.hard.push(combo);
    }
    if (this.pools.easy.length === 0) this.pools.easy = ['TH','ER','IN','AN','RE','ON','EN'];
  }

  /**
    * Generates the next combo based on room difficulty and turn count.
    *
   * @param {number} turnsCompleted
   * @param {string|null} lastCombo
    * @param {'easy'|'medium'|'hard'} difficulty Room difficulty setting.
    * @returns {string} Next combo token.
   */
  generate(turnsCompleted = 0, lastCombo = null, difficulty = 'medium') {
    let pool;

    if (difficulty === 'easy') {
      // Easy mode always uses easy combos.
      pool = this.pools.easy;
    } else if (difficulty === 'hard') {
      // Hard mode can pick from all combo pools immediately.
      pool = [...this.pools.easy, ...this.pools.medium, ...this.pools.hard];
    } else {
      // Medium mode scales difficulty as turns increase.
      if (turnsCompleted >= DIFFICULTY_HARD_THRESHOLD) {
        pool = [...this.pools.easy, ...this.pools.medium, ...this.pools.hard];
      } else if (turnsCompleted >= DIFFICULTY_MEDIUM_THRESHOLD) {
        pool = [...this.pools.easy, ...this.pools.medium];
      } else {
        pool = this.pools.easy;
      }
    }

    if (!pool || pool.length === 0) pool = this.pools.easy;

    const filtered = lastCombo ? pool.filter(c => c !== lastCombo) : pool;
    const source   = filtered.length > 0 ? filtered : pool;
    return source[Math.floor(Math.random() * source.length)];
  }
}

module.exports = ComboGenerator;
