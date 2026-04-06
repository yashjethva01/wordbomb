'use strict';

const { hasWord } = require('../config/dictionary');
const { MIN_WORD_LENGTH } = require('../config/constants');

const PROFANITY = new Set([
  'fuck','shit','bitch','cunt','dick','cock','pussy','nigger','nigga',
  'faggot','fag','bastard','whore','slut','piss','arse','bollocks',
  'wank','twat','prick','retard','spaz','rape',
]);

class WordValidator {
  validate(word, combo, usedWords) {
    const normalized = word.toLowerCase().trim();

    const lengthCheck = this._validateLength(normalized);
    if (!lengthCheck.valid) return lengthCheck;

    const charsCheck = this._validateCharacters(normalized);
    if (!charsCheck.valid) return charsCheck;

    const substringCheck = this._validateSubstring(normalized, combo);
    if (!substringCheck.valid) return substringCheck;

    const usedCheck = this._validateNotUsed(normalized, usedWords);
    if (!usedCheck.valid) return usedCheck;

    const profanityCheck = this._validateProfanity(normalized);
    if (!profanityCheck.valid) return profanityCheck;

    const dictCheck = this._validateDictionary(normalized);
    if (!dictCheck.valid) return dictCheck;

    return { valid: true };
  }

  _validateLength(word) {
    if (word.length < MIN_WORD_LENGTH) {
      return { valid: false, reason: `Word must be at least ${MIN_WORD_LENGTH} letters` };
    }
    return { valid: true };
  }

  _validateCharacters(word) {
    if (!/^[a-z]+$/.test(word)) {
      return { valid: false, reason: 'Word must contain only letters' };
    }
    return { valid: true };
  }

  _validateSubstring(word, combo) {
    if (!word.includes(combo.toLowerCase())) {
      return { valid: false, reason: `Word must contain "${combo.toUpperCase()}"` };
    }
    return { valid: true };
  }

  _validateNotUsed(word, usedWords) {
    if (usedWords.has(word)) {
      return { valid: false, reason: 'Word already used this game' };
    }
    return { valid: true };
  }

  _validateProfanity(word) {
    if (PROFANITY.has(word)) {
      return { valid: false, reason: 'Word not allowed' };
    }
    return { valid: true };
  }

  _validateDictionary(word) {
    if (!hasWord(word)) {
      return { valid: false, reason: 'Not a valid word' };
    }
    return { valid: true };
  }
}

module.exports = WordValidator;
