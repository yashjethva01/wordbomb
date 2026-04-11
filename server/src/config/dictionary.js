'use strict';

const path = require('path');

let wordSet = null;

function loadDictionary() {
  if (wordSet) return wordSet;

  const raw = require(path.join(__dirname, '../data/dictionary.json'));

  wordSet = new Set(
    raw
      .map((w) => w.toLowerCase().trim())
      .filter((w) => w.length >= 3 && /^[a-z]+$/.test(w))
  );

  console.log(`[Dictionary] Loaded ${wordSet.size} words`);
  return wordSet;
}

function getWordSet() {
  if (!wordSet) loadDictionary();
  return wordSet;
}

function hasWord(word) {
  return getWordSet().has(word.toLowerCase().trim());
}

module.exports = { loadDictionary, getWordSet, hasWord };
