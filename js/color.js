/* EdWords – chế độ "Đấu màu" (bộ bài 117 lá của nhóm: Bộ bài board game)
 * Bốn màu chủ đề, mỗi màu 19 lá từ vựng mang số Level 0–9 và các lá Draw 2, Skip, Reverse;
 * thêm lá Wild và Wild draw 4.
 * Luật: đánh lá cùng màu, cùng Level, hoặc cùng loại lá chức năng; Wild đánh lúc nào cũng được.
 * Người hết bài trước thắng. Để gắn với việc học: mỗi lần đánh lá từ vựng phải trả lời đúng
 * câu hỏi về từ đó (nghĩa / số nhiều / nghe), trả lời sai thì giữ lá và rút phạt 1 lá.
 * Ghi chú: bỏ lá "Game" (dùng hình nhân vật có bản quyền); lá mèo in nhầm chữ "Baby" dùng tên "Cat".
 */
(function () {
  const EW = (window.EW = window.EW || {});
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const img = (n) => `assets/cards/color/${n}.webp`;

  const COLORS = {
    red: { name: 'Đỏ', vi: 'Gia đình & quần áo', hex: '#e2363f', start: 1 },
    blue: { name: 'Xanh dương', vi: 'Đồ dùng học tập & nhà cửa', hex: '#2f7de1', start: 30 },
    green: { name: 'Xanh lá', vi: 'Động vật, thiên nhiên & đồ chơi', hex: '#3fb54a', start: 59 },
    yellow: { name: 'Vàng', vi: 'Đồ ăn & phương tiện', hex: '#f2b11b', start: 88 },
  };
  // [từ, số nhiều (null = không đếm được), nghĩa]
  const WORDS = {
    red: [['baby', 'babies', 'em bé'], ['mother', 'mothers', 'mẹ'], ['father', 'fathers', 'bố'], ['brother', 'brothers', 'anh/em trai'], ['sister', 'sisters', 'chị/em gái'],
      ['grandmother', 'grandmothers', 'bà'], ['grandfather', 'grandfathers', 'ông'], ['friend', 'friends', 'bạn bè'], ['teacher', 'teachers', 'giáo viên'], ['shirt', 'shirts', 'áo sơ mi'],
      ['T-shirt', 'T-shirts', 'áo phông'], ['dress', 'dresses', 'váy liền'], ['skirt', 'skirts', 'chân váy'], ['trousers', 'trousers', 'quần dài'], ['coat', 'coats', 'áo khoác'],
      ['hat', 'hats', 'mũ'], ['sock', 'socks', 'tất (vớ)'], ['shoe', 'shoes', 'giày'], ['glasses', 'glasses', 'kính mắt']],
    blue: [['book', 'books', 'quyển sách'], ['pencil', 'pencils', 'bút chì'], ['pen', 'pens', 'bút mực'], ['ruler', 'rulers', 'thước kẻ'], ['eraser', 'erasers', 'cục tẩy'],
      ['crayon', 'crayons', 'bút sáp màu'], ['scissors', 'scissors', 'cái kéo'], ['notebook', 'notebooks', 'quyển vở'], ['desk', 'desks', 'bàn học'], ['board', 'boards', 'cái bảng'],
      ['bed', 'beds', 'giường'], ['sofa', 'sofas', 'ghế sofa'], ['table', 'tables', 'cái bàn'], ['window', 'windows', 'cửa sổ'], ['door', 'doors', 'cửa ra vào'],
      ['mirror', 'mirrors', 'gương'], ['lamp', 'lamps', 'đèn bàn'], ['fridge', 'fridges', 'tủ lạnh'], ['clock', 'clocks', 'đồng hồ treo tường']],
    green: [['cat', 'cats', 'con mèo'], ['dog', 'dogs', 'con chó'], ['rabbit', 'rabbits', 'con thỏ'], ['bird', 'birds', 'con chim'], ['fish', 'fish', 'con cá'],
      ['duck', 'ducks', 'con vịt'], ['cow', 'cows', 'con bò'], ['horse', 'horses', 'con ngựa'], ['tree', 'trees', 'cái cây'], ['flower', 'flowers', 'bông hoa'],
      ['ball', 'balls', 'quả bóng'], ['kite', 'kites', 'con diều'], ['doll', 'dolls', 'búp bê'], ['robot', 'robots', 'người máy'], ['car', 'cars', 'ô tô'],
      ['puzzle', 'puzzles', 'trò ghép hình'], null, ['yo-yo', 'yo-yos', 'con quay yo-yo'], ['card', 'cards', 'lá bài, tấm thiệp']],
    yellow: [['apple', 'apples', 'quả táo'], ['banana', 'bananas', 'quả chuối'], ['orange', 'oranges', 'quả cam'], ['strawberry', 'strawberries', 'quả dâu tây'], ['watermelon', 'watermelons', 'quả dưa hấu'],
      ['bread', null, 'bánh mì'], ['rice', null, 'cơm, gạo'], ['egg', 'eggs', 'quả trứng'], ['cake', 'cakes', 'bánh ngọt'], ['milk', null, 'sữa'],
      ['bus', 'buses', 'xe buýt'], ['watch', 'watches', 'đồng hồ đeo tay'], ['train', 'trains', 'tàu hỏa'], ['bicycle', 'bicycles', 'xe đạp'], ['boat', 'boats', 'con thuyền'],
      ['plane', 'planes', 'máy bay'], ['phone', 'phones', 'điện thoại'], ['key', 'keys', 'chìa khóa'], ['camera', 'cameras', 'máy ảnh']],
  };
  const ACT_IMG = { red: [20, 21, 22], blue: [49, 50, 51], green: [78, 79, 80], yellow: [107, 108, 109] };
  const ACT_NAME = { draw2: 'Draw 2', skip: 'Skip', reverse: 'Reverse', wild: 'Wild', wild4: 'Wild draw 4' };
  const ACT_VI = {
    draw2: 'Người kế tiếp rút 2 lá và mất lượt.', skip: 'Người kế tiếp mất lượt.', reverse: 'Đảo chiều lượt chơi.',
    wild: 'Chọn màu tiếp theo.', wild4: 'Người kế tiếp rút 4 lá, mất lượt; bạn chọn màu tiếp theo.',
  };
  const LEVELS = { easy: { name: 'Dễ', acc: 0.65 }, normal: { name: 'Vừa', acc: 0.82 }, hard: { name: 'Khó', acc: 0.94 } };

  let uid = 0;
  function buildDeck() {
    const cards = [];
    Object.entries(WORDS).forEach(([color, list]) => {
      list.forEach((w, i) => {
        if (!w) return; // lá "Game" đã bỏ
        const pos = i + 1;
        cards.push({ uid: 'k' + ++uid, kind: 'word', color, level: pos <= 10 ? pos - 1 : pos - 10, word: w[0], plural: w[1], vi: w[2], img: img(COLORS[color].start + i) });
      });
      ['draw2', 'skip', 'reverse'].forEach((a, k) => { for (let n = 0; n < 2; n++) cards.push({ uid: 'k' + ++uid, kind: a, color, img: img(ACT_IMG[color][k]) }); });
      for (let n = 0; n < 2; n++) {
        cards.push({ uid: 'k' + ++uid, kind: 'wild', color: null, img: img(23) });
        cards.push({ uid: 'k' + ++uid, kind: 'wild4', color: null, img: img(24) });
      }
    });
    return shuffle(cards);
  }
  const allWords = () => Object.values(WORDS).flat().filter(Boolean);

  // ---------- Câu hỏi từ vựng ----------
  function pluralDistractors(w, correct) {
    const c = new Set([correct]);
    const cands = [w + 's', w + 'es', w.replace(/y$/, 'ies'), w.replace(/f$|fe$/, 'ves'), w, w + 'en', w.replace(/s$/, '') + 'ses'];
    return shuffle(cands.filter((x) => x && !c.has(x) && (c.add(x) || true))).slice(0, 2);
  }
  function makeQuiz(card, type) {
    if (type === 'mix') type = card.plural && Math.random() < 0.45 ? 'plural' : Math.random() < 0.25 ? 'listen' : 'meaning';
    if (type === 'plural' && !card.plural) type = 'meaning';
    const others = shuffle(allWords().filter((x) => x[0] !== card.word));
    if (type === 'plural') {
      if (card.plural === card.word) {
        return { type, q: `Dạng số nhiều của “${card.word}” là gì?`, options: shuffle([card.plural, card.word + 's', card.word + 'es']), answer: card.plural, hint: `“${card.word}” có số nhiều giống số ít.` };
      }
      return { type, q: `Dạng số nhiều của “${card.word}” là gì?`, options: shuffle([card.plural, ...pluralDistractors(card.word, card.plural)]), answer: card.plural };
    }
    if (type === 'listen') {
      return { type, q: 'Nghe phát âm và chọn từ đúng:', say: card.word, options: shuffle([card.word, others[0][0], others[1][0]]), answer: card.word };
    }
    return { type: 'meaning', q: `“${card.word}” nghĩa là gì?`, options: shuffle([card.vi, others[0][2], others[1][2]]), answer: card.vi };
  }

  // ---------- Trận đấu ----------
  class ColorGame {
    constructor(cfg) {
      this.cfg = cfg;
      this.deck = buildDeck();
      this.discard = [];
      this.dir = 1;
      this.turn = 0;
      this.current = 0;
      this.over = false;
      this.records = [];
      this.startedAt = Date.now();
      const rivals = shuffle(EW.RIVALS.slice()).slice(0, cfg.players - 1);
      this.players = [{ name: cfg.playerName, isAI: false, avatar: 'assets/avatar-player.png', hand: [], stats: { q: 0, ok: 0, wrong: [] } }]
        .concat(rivals.map((r) => ({ name: r.name, isAI: true, avatar: r.avatar, hand: [], stats: { q: 0, ok: 0, wrong: [] } })));
    }
    get cur() { return this.players[this.current]; }
    get top() { return this.discard[this.discard.length - 1]; }
    next(i = this.current, steps = 1) { const n = this.players.length; return (((i + this.dir * steps) % n) + n) % n; }
    draw(p, n) {
      const out = [];
      for (let i = 0; i < n; i++) {
        if (!this.deck.length) {
          const top = this.discard.pop();
          this.deck = shuffle(this.discard.splice(0));
          this.discard = [top];
          CUI.log('Xáo lại bãi bài thành bộ bài mới.', 'sys');
          if (!this.deck.length) break;
        }
        const c = this.deck.pop();
        p.hand.push(c);
        out.push(c);
      }
      if (out.length) EW.sfx('draw');
      return out;
    }
    canPlay(c) {
      const t = this.top;
      if (c.kind === 'wild' || c.kind === 'wild4') return true;
      if (c.color === this.color) return true;
      if (c.kind === 'word' && t.kind === 'word' && c.level === t.level) return true;
      if (c.kind !== 'word' && c.kind === t.kind) return true;
      return false;
    }
    async start() {
      this.players.forEach((p) => this.draw(p, this.cfg.handSize));
      let first = this.deck.pop();
      while (first.kind !== 'word') { this.deck.unshift(first); first = this.deck.pop(); }
      this.discard.push(first);
      this.color = first.color;
      this.current = Math.floor(Math.random() * this.players.length);
      CUI.render();
      CUI.log(`Lá đầu tiên: <b>${first.word}</b> (${COLORS[first.color].name}, Level ${first.level}).`, 'sys');
      await CUI.banner(`${this.cur.isAI ? this.cur.name : 'Bạn'} đi trước!`, 'Đánh lá cùng màu hoặc cùng Level');
      this.beginTurn();
    }
    async beginTurn() {
      if (this.over) return;
      this.turn++;
      this.drewThisTurn = null;
      CUI.render();
      if (this.cur.isAI) this.aiTurn();
    }
    endTurn(skipNext = false) {
      if (this.over) return;
      this.current = this.next(this.current, skipNext ? 2 : 1);
      CUI.render();
      setTimeout(() => this.beginTurn(), this.cfg.aiSpeed === 'fast' ? 250 : 450);
    }

    /** Đánh 1 lá: kiểm tra câu hỏi (lá từ vựng), áp hiệu ứng, chuyển lượt */
    async play(p, card, chosenColor) {
      if (this.over || !this.canPlay(card)) return false;
      if (card.kind === 'word' && this.cfg.quiz !== 'off') {
        const quiz = makeQuiz(card, this.cfg.quiz);
        let ok;
        if (p.isAI) {
          ok = Math.random() < LEVELS[this.cfg.difficulty].acc;
          await CUI.aiQuizFx(p, card, quiz, ok);
        } else {
          ok = await CUI.quiz(card, quiz);
        }
        p.stats.q++;
        if (ok) p.stats.ok++; else p.stats.wrong.push(card.word);
        this.records.push({ turn: this.turn, player: p.name, text: `${card.word} · ${quiz.q}`, ok, votes: '', accepted: ok, errors: ok ? [] : ['VOCAB'], detail: ok ? '' : `Đáp án: ${quiz.answer}`, points: 0 });
        if (!ok) {
          this.draw(p, 1);
          CUI.log(`${p.isAI ? p.name : 'Bạn'} trả lời sai về <b>${card.word}</b> → giữ lá và rút phạt 1 lá.`, 'sys');
          EW.sfx('fail');
          this.endTurn();
          return true;
        }
      }
      p.hand.splice(p.hand.indexOf(card), 1);
      this.discard.push(card);
      EW.sfx('place');
      if (card.kind === 'word') EW.Speech.say(card.word);
      let color = card.color;
      if (card.kind === 'wild' || card.kind === 'wild4') {
        color = chosenColor || (p.isAI ? this.aiColor(p) : await CUI.pickColor());
      }
      this.color = color;
      const label = card.kind === 'word' ? `<b>${card.word}</b>` : `<b>${ACT_NAME[card.kind]}</b>`;
      CUI.log(`${p.isAI ? p.name : 'Bạn'} đánh ${label}${card.kind.startsWith('wild') ? ' → chọn màu ' + COLORS[color].name : ''}.`, p.isAI ? 'opp' : 'me');
      CUI.render();
      if (!p.hand.length) return this.finish(p);
      const nxt = this.players[this.next()];
      switch (card.kind) {
        case 'skip':
          CUI.log(`⛔ ${nxt.isAI ? nxt.name : 'Bạn'} mất lượt.`, 'sys');
          return this.endTurn(true);
        case 'reverse':
          this.dir *= -1;
          CUI.log('🔁 Đảo chiều lượt chơi.', 'sys');
          return this.endTurn(this.players.length === 2);
        case 'draw2':
          this.draw(nxt, 2);
          CUI.log(`➕2 ${nxt.isAI ? nxt.name : 'Bạn'} rút 2 lá và mất lượt.`, 'sys');
          return this.endTurn(true);
        case 'wild4':
          this.draw(nxt, 4);
          CUI.log(`➕4 ${nxt.isAI ? nxt.name : 'Bạn'} rút 4 lá và mất lượt.`, 'sys');
          return this.endTurn(true);
        default:
          return this.endTurn();
      }
    }
    async drawOne(p) {
      if (this.drewThisTurn) return;
      const [c] = this.draw(p, 1);
      this.drewThisTurn = c || true;
      CUI.log(`${p.isAI ? p.name : 'Bạn'} rút 1 lá.`, p.isAI ? 'opp' : 'me');
      CUI.render();
      return c;
    }
    pass(p) {
      CUI.log(`${p.isAI ? p.name : 'Bạn'} bỏ lượt.`, p.isAI ? 'opp' : 'me');
      this.endTurn();
    }
    aiColor(p) {
      const count = {};
      p.hand.forEach((c) => { if (c.color) count[c.color] = (count[c.color] || 0) + 1; });
      return Object.keys(count).sort((a, b) => count[b] - count[a])[0] || pick(Object.keys(COLORS));
    }
    async aiTurn() {
      const p = this.cur;
      const pause = (ms) => wait(this.cfg.aiSpeed === 'fast' ? ms * 0.45 : ms);
      await pause(900);
      if (this.over) return;
      const playable = p.hand.filter((c) => this.canPlay(c));
      const nextHand = this.players[this.next()].hand.length;
      const choose = (list) => {
        // ưu tiên tấn công khi người kế sắp hết bài, giữ Wild cho sau
        const pref = (c) => (c.kind === 'word' ? 2 : c.kind === 'wild' ? 0 : c.kind === 'wild4' ? (nextHand <= 2 ? 5 : 0.5) : nextHand <= 3 ? 4 : 1.5) + Math.random();
        return list.sort((a, b) => pref(b) - pref(a))[0];
      };
      if (playable.length) return this.play(p, choose(playable));
      const c = await this.drawOne(p);
      await pause(600);
      if (c && this.canPlay(c)) return this.play(p, c);
      this.pass(p);
    }
    finish(winner) {
      this.over = true;
      this.winner = winner;
      CUI.render();
      EW.sfx(winner.isAI ? 'fail' : 'win');
      setTimeout(() => CUI.showResult(this), 900);
    }
  }

  // ---------- Giao diện ----------
  const CUI = {
    game: null,
    busy: 0,
    log(msg, cls = '') {
      const el = document.createElement('div');
      el.className = 'log-item ' + cls;
      el.innerHTML = msg;
      const log = $('#c-log');
      log.prepend(el);
      while (log.children.length > 80) log.lastChild.remove();
    },
    cardEl(c, o = {}) {
      const el = document.createElement('div');
      el.className = 'card img ccard' + (o.small ? ' small' : '') + (o.cls ? ' ' + o.cls : '');
      el.innerHTML = `<img src="${c.img}" alt="${esc(c.word || ACT_NAME[c.kind])}" draggable="false" loading="lazy" />`;
      return el;
    },
    myTurn() { const g = this.game; return g && !g.over && g.current === 0 && this.busy === 0; },
    render() {
      const g = this.game;
      if (!g) return;
      // ghế đối thủ
      const seats = $('#c-seats');
      seats.innerHTML = '';
      g.players.forEach((p, i) => {
        if (i === 0) return;
        const s = document.createElement('div');
        s.className = 'seat' + (g.current === i ? ' active' : '');
        s.innerHTML = `
          <div class="seat-top"><div class="portrait sm"><img src="${p.avatar}" alt="" /></div>
            <div class="seat-name"><b>${esc(p.name)}</b><small>${p.hand.length === 1 ? '⚠️ còn 1 lá!' : 'Rival Scholar'}</small></div>
            <div class="c-count ${p.hand.length <= 2 ? 'low' : ''}">${p.hand.length}</div></div>
          <div class="seat-hand">${Array.from({ length: Math.min(p.hand.length, 9) }, () => `<div class="card img tiny"><img src="assets/cards/color/117.webp" alt="" /></div>`).join('')}</div>
          <div class="seat-status">${g.current === i ? '🎨 đang chọn lá…' : ''}</div>`;
        seats.appendChild(s);
      });
      // trung tâm
      $('#c-deck-n').textContent = g.deck.length;
      const top = $('#c-top');
      top.innerHTML = '';
      if (g.top) {
        const e = this.cardEl(g.top);
        if (this._lastTop !== g.top.uid) { e.classList.add('land'); this._lastTop = g.top.uid; }
        top.appendChild(e);
      }
      const col = COLORS[g.color];
      $('#c-color').innerHTML = col ? `<span class="dot" style="background:${col.hex}"></span>Màu: <b>${col.name}</b>${g.top && g.top.kind === 'word' ? ` · Level <b>${g.top.level}</b>` : ''}` : '';
      $('#c-color').style.setProperty('--cc', col ? col.hex : '#888');
      document.querySelector('.c-field').style.setProperty('--cc', col ? col.hex : '#888');
      $('#c-dir').textContent = g.dir === 1 ? '↻' : '↺';
      $('#c-dir').title = g.dir === 1 ? 'Chiều kim đồng hồ' : 'Ngược chiều kim đồng hồ';
      const me = g.players[0];
      const mine = g.current === 0 && !g.over;
      $('#c-status').innerHTML = g.over ? '' : mine
        ? (g.drewThisTurn ? 'Đánh lá vừa rút (nếu hợp lệ) hoặc bỏ lượt.' : 'Lượt của bạn: đánh 1 lá hợp lệ hoặc rút bài.')
        : `Lượt của <b>${esc(g.cur.name)}</b>…`;
      $('#c-pass').disabled = !(mine && g.drewThisTurn);
      $('#c-deck').disabled = !(mine && !g.drewThisTurn) || this.busy > 0;
      $('#c-deck').classList.toggle('ready', mine && !g.drewThisTurn && !me.hand.some((c) => g.canPlay(c)));
      // thông tin & tay của tôi
      $('#c-me').className = 'pinfo is-me' + (mine ? ' active' : '');
      $('#c-me').innerHTML = `<div class="portrait"><img src="${me.avatar}" alt="" /></div>
        <div class="pbody"><div class="nameplate"><b>${esc(me.name)}</b><small>Learner</small></div>
        <div class="pstats"><div class="c-count big">${me.hand.length}</div><div class="crystals"><span class="crys-num">🃏 lá trên tay</span><span class="crys-num">🧠 trả lời đúng ${me.stats.ok}/${me.stats.q}</span></div></div></div>`;
      const hand = $('#c-hand');
      hand.innerHTML = '';
      const order = { red: 0, blue: 1, green: 2, yellow: 3 };
      const sorted = me.hand.slice().sort((a, b) => (order[a.color] ?? 4) - (order[b.color] ?? 4) || (a.level ?? 10) - (b.level ?? 10));
      const n = sorted.length;
      sorted.forEach((c, i) => {
        const ok = mine && g.canPlay(c) && (!g.drewThisTurn || g.drewThisTurn === c);
        const e = this.cardEl(c, { cls: ok ? 'playable' : mine ? 'dim' : '' });
        const mid = (n - 1) / 2;
        e.style.setProperty('--rot', ((i - mid) * (n > 9 ? 1.5 : 2.5)).toFixed(1) + 'deg');
        e.style.setProperty('--lift', (Math.abs(i - mid) * 2.5).toFixed(0) + 'px');
        e.onclick = () => this.onCard(c);
        e.onmouseenter = () => { if (c.kind === 'word') e.title = `${c.word} — ${c.vi}`; };
        hand.appendChild(e);
      });
      hand.classList.toggle('crowded', n > 9);
      // thứ tự lượt
      $('#c-order').innerHTML = g.players.map((p, i) => `<div class="ord ${g.current === i ? 'cur' : ''}"><span class="ord-n">${i + 1}</span><img src="${p.avatar}" alt="" /><span class="ord-name">${esc(p.isAI ? p.name : p.name + ' (bạn)')}</span><b>${p.hand.length}</b></div>`).join('');
    },
    async onCard(c) {
      const g = this.game;
      if (!this.myTurn()) return;
      if (g.drewThisTurn && g.drewThisTurn !== c) return EW.UI.toast('Sau khi rút, bạn chỉ được đánh lá vừa rút hoặc bỏ lượt.');
      if (!g.canPlay(c)) return EW.UI.toast(`Lá này không hợp lệ: cần màu ${COLORS[g.color].name}${g.top.kind === 'word' ? ' hoặc Level ' + g.top.level : ''}.`);
      this.busy++;
      try { await g.play(g.players[0], c); } finally { this.busy--; this.render(); }
    },
    quiz(card, quiz) {
      const box = document.createElement('div');
      box.className = 'quiz';
      box.innerHTML = `<div class="quiz-card"></div><div class="quiz-body"><div class="quiz-q">${esc(quiz.q)} ${quiz.say ? `<button class="say big" data-say="${esc(quiz.say)}">🔊</button>` : ''}</div><div class="quiz-opts"></div><div class="quiz-timer"></div></div>`;
      const ce = this.cardEl(quiz.type === 'listen' ? { ...card, img: 'assets/cards/color/117.webp' } : card);
      box.querySelector('.quiz-card').appendChild(ce);
      if (quiz.say) setTimeout(() => EW.Speech.say(quiz.say), 250);
      return new Promise((resolve) => {
        EW.UI.modal({
          title: '🧠 Trả lời để đánh lá này', body: box, wide: true, buttons: [],
          onOpen: (b, close) => {
            let left = 20;
            const t = setInterval(() => { left--; const el = b.querySelector('.quiz-timer'); if (el) el.textContent = `⏳ ${left}s`; if (left <= 0) finish(null); }, 1000);
            let done = false;
            const finish = async (ans) => {
              if (done) return;
              done = true;
              clearInterval(t);
              const ok = ans === quiz.answer;
              b.querySelectorAll('.quiz-opt').forEach((x) => { x.disabled = true; if (x.dataset.v === quiz.answer) x.classList.add('right'); else if (x.dataset.v === ans) x.classList.add('wrong'); });
              b.querySelector('.quiz-timer').innerHTML = ok ? '<span class="ok">✔ Chính xác!</span>' : `<span class="bad">✘ Đáp án: <b>${esc(quiz.answer)}</b>${quiz.hint ? ' · ' + esc(quiz.hint) : ''}</span>`;
              EW.sfx(ok ? 'score' : 'fail');
              EW.Speech.say(card.word);
              await wait(ok ? 900 : 1900);
              close(ok);
              resolve(ok);
            };
            b.querySelector('.quiz-timer').textContent = `⏳ ${left}s`;
            quiz.options.forEach((o) => {
              const btn = document.createElement('button');
              btn.className = 'quiz-opt';
              btn.dataset.v = o;
              btn.textContent = o;
              btn.onclick = () => finish(o);
              b.querySelector('.quiz-opts').appendChild(btn);
            });
          },
        });
      });
    },
    async aiQuizFx(p, card, quiz, ok) {
      this.log(`${p.name} trả lời “${esc(quiz.q)}” → ${ok ? '✔ đúng' : '✘ sai'}${ok ? '' : ` (đáp án: ${esc(quiz.answer)})`}.`, ok ? 'opp' : 'sys');
      await wait(this.game.cfg.aiSpeed === 'fast' ? 200 : 450);
    },
    pickColor() {
      const box = document.createElement('div');
      box.className = 'color-pick';
      return EW.UI.modal({
        title: '🎨 Chọn màu tiếp theo', body: box, buttons: [],
        onOpen: (b, close) => Object.entries(COLORS).forEach(([k, c]) => {
          const btn = document.createElement('button');
          btn.className = 'cpick';
          btn.style.setProperty('--cc', c.hex);
          btn.innerHTML = `<b>${c.name}</b><small>${c.vi}</small>`;
          btn.onclick = () => close(k);
          box.appendChild(btn);
        }),
      });
    },
    async banner(text, sub) {
      const b = $('#banner') || document.body;
      const host = document.createElement('div');
      host.className = 'banner show';
      host.innerHTML = `<div class="b-inner"><div class="b-text">${esc(text)}</div><div class="b-sub">${esc(sub || '')}</div></div>`;
      document.body.appendChild(host);
      EW.sfx('banner');
      await wait(1200);
      host.remove();
      void b;
    },
    showResult(g) {
      const me = g.players[0];
      const rank = g.players.slice().sort((a, b) => a.hand.length - b.hand.length);
      const win = g.winner === me;
      const place = rank.indexOf(me) + 1;
      const wrong = [...new Set(me.stats.wrong)];
      const entry = {
        date: new Date().toISOString(), mode: 'Đấu màu', name: me.name, topic: 'Bộ bài 4 màu', rule: 'Quiz: ' + g.cfg.quiz, players: g.players.length, difficulty: g.cfg.difficulty,
        result: win ? 'Thắng' : `Hạng ${place}`, score: rank.map((p) => `${p.name} còn ${p.hand.length} lá`).join(' · '), minutes: Math.round((Date.now() - g.startedAt) / 60000),
        stats: me.stats, records: g.records,
      };
      const h = EW.App.store.get();
      h.unshift(entry);
      EW.App.store.set(h.slice(0, 100));
      const wordInfo = (w) => { const c = allWords().find((x) => x[0] === w); return c ? `<li><b>${esc(c[0])}</b>${c[1] && c[1] !== c[0] ? ' (số nhiều: ' + esc(c[1]) + ')' : c[1] ? ' (số nhiều giống số ít)' : ' (không đếm được)'} — ${esc(c[2])} <button class="say" data-say="${esc(c[0])}">🔊</button></li>` : ''; };
      $('#result-body').innerHTML = `
        <div class="result-head ${win ? 'win' : 'lose'}">
          <div class="r-title">${win ? 'CHIẾN THẮNG' : 'HẠNG ' + place}</div>
          <div class="muted">Đấu màu · ${entry.minutes} phút · ${g.turn} lượt · ${esc(g.winner.isAI ? g.winner.name : 'Bạn')} hết bài trước</div>
        </div>
        <div class="podium">${rank.map((p, i) => `<div class="pod ${p === me ? 'me' : ''} ${p === g.winner ? 'top' : ''}"><span class="pod-n">${i + 1}</span><img src="${p.avatar}" alt="" /><b>${esc(p.isAI ? p.name : p.name + ' (bạn)')}</b><span class="pod-s">${p.hand.length} lá</span><small>trả lời đúng ${p.stats.ok}/${p.stats.q}</small></div>`).join('')}</div>
        <div class="r-stats">
          <div class="stat"><b>${me.stats.ok}/${me.stats.q}</b><span>Câu hỏi trả lời đúng</span></div>
          <div class="stat"><b>${me.stats.q ? Math.round((me.stats.ok / me.stats.q) * 100) : 0}%</b><span>Độ chính xác</span></div>
          <div class="stat"><b>${wrong.length}</b><span>Từ cần ôn</span></div>
        </div>
        <h3>Từ cần ôn lại</h3>
        ${wrong.length ? `<ul class="review">${wrong.map(wordInfo).join('')}</ul>` : '<p class="muted">Bạn trả lời đúng tất cả. Tuyệt vời! 🎉</p>'}
        <div class="actions-row">
          <button class="btn" id="r-csv">⬇️ Tải phiếu theo dõi (CSV)</button>
          <button class="btn primary" id="r-again">🎨 Chơi lại</button>
          <button class="btn ghost" data-go="title">Về màn hình chính</button>
        </div>`;
      $('#r-csv').onclick = () => EW.App.downloadCSV([entry], 'edwords-dau-mau-' + entry.date.slice(0, 16).replace(/[:T]/g, '-') + '.csv');
      $('#r-again').onclick = () => startColor(g.cfg);
      EW.App.go('result');
    },
  };

  function startColor(cfg) {
    const g = new ColorGame(cfg);
    CUI.game = g;
    CUI.busy = 0;
    $('#c-log').innerHTML = '';
    $('#c-mode').textContent = `${cfg.players} người · ${{ mix: 'Hỏi nghĩa & số nhiều', meaning: 'Hỏi nghĩa', plural: 'Hỏi số nhiều', listen: 'Nghe & chọn từ', off: 'Không hỏi' }[cfg.quiz]}`;
    EW.App.go('color');
    g.start();
  }

  $('#color-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    startColor({
      playerName: (f.get('playerName') || 'Bạn').trim() || 'Bạn', players: +f.get('players'), quiz: f.get('quiz'),
      handSize: +f.get('handSize'), difficulty: f.get('difficulty'), aiSpeed: f.get('aiSpeed'),
    });
  });
  $('#c-deck').onclick = async () => {
    const g = CUI.game;
    if (!CUI.myTurn() || g.drewThisTurn) return;
    const c = await g.drawOne(g.players[0]);
    if (!c || !g.canPlay(c)) { EW.UI.toast(c ? `Bạn rút được “${c.word || ACT_NAME[c.kind]}” nhưng không đánh được → bỏ lượt.` : 'Hết bài để rút.'); await wait(900); g.pass(g.players[0]); }
  };
  $('#c-pass').onclick = () => { const g = CUI.game; if (CUI.myTurn() && g.drewThisTurn) g.pass(g.players[0]); };
  $('#c-help').onclick = () => EW.UI.modal({ title: '🎨 Luật Đấu màu', body: `<ul class="c-rules">${RULES_HTML}</ul>`, wide: true, closable: true });
  $('#c-quit').onclick = async () => {
    if (await EW.UI.confirm('Rời trận?', 'Kết quả trận này sẽ không được lưu.', 'Rời trận', 'Ở lại')) { CUI.game.over = true; EW.App.go('title'); }
  };

  const RULES_HTML = [
    'Bộ bài 115 lá, 4 màu chủ đề. Mỗi màu có 19 lá từ vựng mang số <b>Level 0–9</b>, 2 lá Draw 2, 2 lá Skip, 2 lá Reverse; thêm lá <b>Wild</b> và <b>Wild draw 4</b>.',
    'Mỗi người nhận 7 lá (hoặc 5 lá). Đến lượt, đánh 1 lá <b>cùng màu</b>, <b>cùng Level</b> hoặc <b>cùng loại lá chức năng</b> với lá trên cùng. Wild đánh lúc nào cũng được.',
    'Khi đánh lá từ vựng, bạn phải <b>trả lời đúng câu hỏi</b> về từ đó (nghĩa tiếng Việt, dạng số nhiều hoặc nghe phát âm). Trả lời sai thì giữ lá, rút phạt 1 lá và mất lượt.',
    '<b>Skip</b>: người kế tiếp mất lượt · <b>Reverse</b>: đảo chiều · <b>Draw 2</b>: người kế tiếp rút 2 lá và mất lượt · <b>Wild</b>: chọn màu · <b>Wild draw 4</b>: người kế tiếp rút 4 lá, mất lượt, bạn chọn màu.',
    'Không có lá hợp lệ thì rút 1 lá. Lá vừa rút hợp lệ thì có thể đánh luôn, nếu không thì bỏ lượt.',
    'Người <b>hết bài trước</b> thắng. Cuối trận có danh sách “từ cần ôn” để học lại.',
  ].map((x) => `<li>${x}</li>`).join('');
  const rulesBox = $('#color-rules');
  if (rulesBox) rulesBox.innerHTML = RULES_HTML;

  EW.Color = { startColor, ColorGame, makeQuiz, buildDeck, COLORS };
})();
