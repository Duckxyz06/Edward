// Chạy: node tests/grammar.test.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ctx = { window: {}, console, Math };
vm.createContext(ctx);
for (const f of ['data.js', 'grammar.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f });
}
const { DATA, Grammar } = ctx.window.EW;

const bank = {};
const add = (c) => { (bank[c.type + ':' + c.word] = c); };
DATA.subjects.forEach(add); DATA.auxes.forEach(add); DATA.times.forEach(add); DATA.linkers.forEach(add);
Object.values(DATA.topics).forEach((t) => [...t.verbs, ...t.nouns, ...t.adjs].forEach(add));

// "S:she AUX:is V:read@ing N:a book" ; V mặc định form base
function items(spec) {
  return spec.split('|').map((s) => {
    const [key, form] = s.trim().split('@');
    const card = bank[key];
    if (!card) throw new Error('Không có thẻ: ' + key);
    return { card, form: form || 'base' };
  });
}

let pass = 0, fail = 0;
function check(spec, ok, text, code) {
  const r = Grammar.validate(items(spec));
  const good = r.ok === ok && (!text || r.text === text) && (!code || r.errors.some((e) => e.code === code));
  if (good) pass++;
  else { fail++; console.log('✗', spec, '\n   →', r.text, r.ok, JSON.stringify(r.errors.map((e) => e.code + ': ' + e.vi))); }
}

// ---- Câu đúng ----
check('S:she|V:read@s|N:a book|T:every day', true, 'She reads a book every day.');
check('S:I|V:eat|N:rice|T:yesterday', false, null, 'TENSE');
check('S:I|V:eat@past|N:rice|T:yesterday', true, 'I ate rice yesterday.');
check('T:yesterday|S:I|V:eat@past|A:delicious|N:bread', true, 'Yesterday, I ate delicious bread.');
check('S:we|AUX:will|V:visit|N:Da Lat|T:next summer', true, 'We will visit Da Lat next summer.');
check('S:my mother|AUX:is|V:cook@ing|N:breakfast|A:in the kitchen|T:now', true, 'My mother is cooking breakfast in the kitchen now.');
check('S:they|AUX:have|T:already|V:finish@pp|N:the report', true, 'They have already finished the report.');
check('S:he|T:always|V:study@s|N:English|A:carefully', true, 'He always studies English carefully.');
check('S:she|AUX:is|T:always|A:happy', true, 'She is always happy.');
check('AUX:do|S:you|V:play|N:football', true, 'Do you play football?');
check('AUX:does|S:Lan|V:speak|N:English|A:well', true, 'Does Lan speak English well?');
check('S:I|AUX:was|A:tired|L:so|S:I|V:sleep@past|A:at home', true, 'I was tired, so I slept at home.');
check('S:I|V:feel|A:happy|L:because|S:we|AUX:will|V:travel to|N:the beach|T:tomorrow', true);
check('A:new|N:students|V:go to@base|N:school', false, null, 'MEANING'); // adj 'new' không dành cho người
check('N:English|AUX:is|A:interesting', true, 'English is interesting.');
check('N:the report|AUX:was|V:write@pp|T:last week', true, 'The report was written last week.');
check('S:Nam|AUX:can|V:swim|A:fast', true, 'Nam can swim fast.');
check('S:I|V:buy|A:new|N:a phone', true, 'I buy a new phone.');
check('S:she|V:write@s|A:interesting|N:an email', true, 'She writes an interesting email.');
check('S:we|AUX:didn\'t|V:watch|N:the news|T:last night', true, "We didn't watch the news last night.");

// ---- Câu sai: đúng loại lỗi ----
check('S:I|AUX:did|V:ask|A:happy|S:my classmates', false, null, 'ADJ_ADV');
check('S:she|AUX:has|V:eat@pp|T:in the morning', false, null, 'TENSE');
check('S:she|V:eat|N:rice', false, null, 'AGREEMENT');
check('S:she|V:read|N:a book', true, 'She read a book.'); // read = V2
check('S:I|V:read@s|N:a book', false, null, 'AGREEMENT');
check('S:they|AUX:does|V:play|N:football', false, null, 'AGREEMENT');
check('S:he|AUX:will|V:play@s|N:football', false, null, 'VERB_FORM');
check('S:I|AUX:have|V:visit@past|N:Da Lat|T:yesterday', false, null, 'TENSE');
check('S:she|AUX:is|V:cook|N:rice', false, null, 'VERB_FORM');
check('S:I|V:drink|N:the library', false, null, 'MEANING');
check('S:he|V:go to@s|A:quickly', false, null, 'OBJECT');
check('S:I|V:sleep|N:rice', false, null, 'OBJECT');
check('S:she|V:speak@s|A:good|N:English', true, 'She speaks good English.');
check('S:she|V:eat@s|A:tired|N:rice', false, null, 'MEANING');
check('S:she|V:eat@s|A:quickly|N:rice', false, null, 'WORD_ORDER');
check('S:I|V:play|T:always|N:football', false, null, 'WORD_ORDER');
check('S:she|AUX:is|A:happily', false, null, 'ADJ_ADV');
check('S:he|V:speak@s|N:English|A:good', false, null, 'ADJ_ADV');
check('S:I|A:happy', false, null, 'STRUCTURE');
check('S:I|V:eat@ing|N:rice', false, null, 'VERB_FORM');
check('L:and|S:I|V:eat|N:rice', false, null, 'STRUCTURE');
check('S:I|AUX:don\'t|T:never|V:eat|N:rice', false, null, 'STRUCTURE');
check('S:I|V:help|S:she', false, null, 'OBJECT');
check('S:we|AUX:are|V:watch@ing|N:a movie|T:yesterday', false, null, 'TENSE');

const fix = Grammar.suggestFix(items('S:she|V:eat|N:rice|T:every day'));
if (fix === 'She eats rice every day.') pass++; else { fail++; console.log('✗ suggestFix', fix); }

console.log(`\n${pass} đạt, ${fail} lỗi`);
process.exit(fail ? 1 : 0);
