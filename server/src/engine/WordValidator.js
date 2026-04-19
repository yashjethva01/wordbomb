'use strict';

const { hasWord } = require('../config/dictionary');
const { MIN_WORD_LENGTH } = require('../config/constants');

class WordValidator {
  validate(word, combo, usedWords) {
    const normalized = typeof word === 'string' ? word.toLowerCase().trim() : '';
    const requiredCombo = typeof combo === 'string' ? combo.toLowerCase().trim() : '';
    const seenWords = usedWords instanceof Set ? usedWords : new Set();

    if (!normalized) {
      return { valid: false, reason: 'Enter a word' };
    }

    if (normalized.length < MIN_WORD_LENGTH) {
      return { valid: false, reason: `Word must be at least ${MIN_WORD_LENGTH} letters` };
    }

    if (!/^[a-z]+$/.test(normalized)) {
      return { valid: false, reason: 'Use letters only' };
    }

    if (seenWords.has(normalized)) {
      return { valid: false, reason: 'Word already used' };
    }

    if (requiredCombo && !normalized.includes(requiredCombo)) {
      return { valid: false, reason: `Word must include ${requiredCombo.toUpperCase()}` };
    }

    if (!hasWord(normalized)) {
      return { valid: false, reason: 'Word not in dictionary' };
    }

    return { valid: true };
  }
}

module.exports = WordValidator;
