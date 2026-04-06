'use strict';

// Load dictionary first
const { loadDictionary } = require('./src/utils/dictionary');
loadDictionary();

// Now test the WordValidator
const WordValidator = require('./src/engine/WordValidator');

console.log('\n=== WordValidator Test ===\n');

// Test 1: Valid word with combo
const result1 = WordValidator.validate('thunder', 'TH', new Set());
console.log('Test 1: validate("thunder", "TH", new Set())');
console.log(`Result: ${JSON.stringify(result1)}`);
console.log(`Expected: { valid: true }`);
console.log(`Pass: ${result1.valid === true}\n`);

// Test 2: Word too short
const result2 = WordValidator.validate('at', 'AT', new Set());
console.log('Test 2: validate("at", "AT", new Set()) - word too short');
console.log(`Result: ${JSON.stringify(result2)}`);
console.log(`Pass: ${result2.valid === false}\n`);

// Test 3: Word missing combo
const result3 = WordValidator.validate('apple', 'XY', new Set());
console.log('Test 3: validate("apple", "XY", new Set()) - missing combo');
console.log(`Result: ${JSON.stringify(result3)}`);
console.log(`Pass: ${result3.valid === false}\n`);

// Test 4: Word already used
const usedWords = new Set(['thunder']);
const result4 = WordValidator.validate('thunder', 'TH', usedWords);
console.log('Test 4: validate("thunder", "TH", usedWords) - word used');
console.log(`Result: ${JSON.stringify(result4)}`);
console.log(`Pass: ${result4.valid === false}\n`);

// Test 5: Profanity check
const result5 = WordValidator.validate('damn', 'DA', new Set());
console.log('Test 5: validate("damn", "DA", new Set()) - profanity');
console.log(`Result: ${JSON.stringify(result5)}`);
console.log(`Pass: ${result5.valid === false}\n`);

// Test 6: Valid word with lowercase combo
const result6 = WordValidator.validate('beach', 'be', new Set());
console.log('Test 6: validate("beach", "be", new Set()) - lowercase combo');
console.log(`Result: ${JSON.stringify(result6)}`);
console.log(`Pass: ${result6.valid === true}\n`);

console.log('=== All tests completed ===\n');
