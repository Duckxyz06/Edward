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
const add = (c) => { if (!bank[c.type + ':' + c.word]) bank[c.type + ':' + c.word] = c; };
DATA.subjects.forEach(add); DATA.auxes.forEach(add); DATA.times.forEach(add); DATA.linkers.forEach(add);
Object.values(DATA.topics).forEach((t) => [...t.verbs, ...t.nouns, ...t.adjs].forEach(add));

// "S:she|AUX:is|V:buy@ing|N:shoes" ; dạng mặc định: V base, N dạng đầu tiên, A tính từ
function items(spec) {
  return spec.split('|').map((s) => {
    const [key, form] = s.trim().split('@');
    const card = bank[key];
    if (!card) throw new Error('Không có thẻ: ' + key);
    return { card, form: form || Grammar.defaultForm(card) };
  });
}

let pass = 0, fail = 0;
function check(spec, ok, text, code, rule = null) {
  const r = Grammar.validate(items(spec), { rule });
  const good = r.ok === ok && (!text || r.text === text) && (!code || r.errors.some((e) => e.code === code));
  if (good) pass++;
  else { fail++; console.log('✗', spec, '\n   →', r.text, r.ok, JSON.stringify(r.errors.map((e) => e.code + ': ' + e.vi))); }
}

// ---- Câu đúng: Shopping ----
check('S:she|V:buy@s|N:clothes|T:every weekend', true, 'She buys clothes every weekend.');
check('S:I|V:go|N:supermarket@the|T:every day', true, 'I go to the supermarket every day.');
check('S:we|V:go@past|N:open-air market@a|T:yesterday', true, 'We went to an open-air market yesterday.');
check('S:they|V:spend@past|N:money|T:last week', true, 'They spent money last week.');
check('S:he|V:choose@s|A:cheap|N:shoes', true, 'He chooses cheap shoes.');
check('S:I|V:buy|A:expensive|N:online shop@a', false, null, 'MEANING'); // không “mua cửa hàng”
check('S:she|V:bargain@s|A:good@adv', true, 'She bargains well.');
check('N:website@the|AUX:is|A:popular', true, 'The website is popular.');
check('N:supermarket@pl|AUX:are|A:convenient', true, 'Supermarkets are convenient.');
check('AUX:do|S:you|V:visit|N:online shop@pl', true, 'Do you visit online shops?');
check('S:we|AUX:will|V:save|N:money|T:next week', true, 'We will save money next week.');
check('S:I|AUX:am|V:pay@ing|T:now', true, 'I am paying now.');
check('S:they|AUX:have|V:sell@pp|N:shoes@the', true, 'They have sold the shoes.');

// ---- Câu đúng: Thiên tai & Môi trường ----
check('N:storm@the|V:destroy@past|N:road@the', true, 'The storm destroyed the road.');
check('A:strong|N:earthquake@a|V:damage@past|N:building@pl', true, 'A strong earthquake damaged buildings.');
check('S:we|AUX:should|V:prepare|N:emergency kit@a', true, 'We should prepare an emergency kit.');
check('N:victim@pl|AUX:were|A:safe', true, 'Victims were safe.');
check('N:people|V:evacuate@past|A:safe@adv', true, 'People evacuated safely.');
check('S:we|V:recycle|N:plastic waste|T:every day', true, 'We recycle plastic waste every day.');
check('S:she|AUX:is|V:pick up@ing|N:rubbish', true, 'She is picking up rubbish.');
check('N:pollution|AUX:is|A:harmful', true, 'Pollution is harmful.');
check('S:they|V:protect|N:endangered species@pl', true, 'They protect endangered species.');
check('N:endangered species@a|AUX:is|A:dangerous', false, null, 'MEANING');

// ---- Câu sai: đúng loại lỗi ----
check('S:she|V:buy|N:clothes', false, null, 'AGREEMENT');
check('S:I|V:buy@s|N:shoes', false, null, 'AGREEMENT');
check('S:they|AUX:does|V:pay', false, null, 'AGREEMENT');
check('S:he|AUX:will|V:buy@s|N:shoes', false, null, 'VERB_FORM');
check('S:I|AUX:have|V:visit@past|N:supermarket@the|T:yesterday', false, null, 'TENSE');
check('S:she|AUX:is|V:sell|N:clothes', false, null, 'VERB_FORM');
check('S:I|V:spend|N:supermarket@the', false, null, 'MEANING');
check('S:he|V:visit@s|A:cheap@adv', false, null, 'OBJECT');
check('S:I|V:bargain|N:money', false, null, 'OBJECT');
check('S:she|V:buy@s|A:cheap@adv|N:shoes', false, null, 'WORD_ORDER');
check('S:I|V:buy|T:always|N:clothes', false, null, 'WORD_ORDER');
check('N:website@the|AUX:is|A:popular@adv', false, null, 'ADJ_ADV');
check('S:he|V:bargain@s|A:good', false, null, 'ADJ_ADV');
check('S:I|A:cheap', false, null, 'STRUCTURE');
check('N:supermarket@pl|AUX:is|A:convenient', false, null, 'AGREEMENT');
check('N:storm@the|AUX:are|A:dangerous', false, null, 'AGREEMENT');

// ---- Luật quản trò ----
check('S:she|V:buy@s|N:clothes', true, null, null, 'present');
check('S:she|V:buy@past|N:clothes|T:yesterday', false, null, 'RULE', 'present');
check('S:we|AUX:will|V:buy|N:shoes', true, null, null, 'future');
check('S:we|V:buy|N:shoes', false, null, 'RULE', 'future');

// ---- Gợi ý sửa ----
const fix = Grammar.suggestFix(items('S:she|V:buy|N:clothes|T:every day'), { rule: 'present' });
if (fix === 'She buys clothes every day.') pass++; else { fail++; console.log('✗ suggestFix', fix); }
const fix2 = Grammar.suggestFix(items('S:I|V:go|N:supermarket@pl|AUX:is'));
if (fix2 === null || typeof fix2 === 'string') pass++; else fail++;

console.log(`\n${pass} đạt, ${fail} lỗi`);
process.exit(fail ? 1 : 0);
