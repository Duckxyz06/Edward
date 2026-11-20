/* EdWords – Sentence Battle · Luật chơi & trạng thái trận đấu
 * Luật theo thuyết minh (mục 10.2):
 *  - Mỗi người chơi có 5 lá trên tay + 6 thẻ cố định trên bàn (2 S, 1 T, 2 AUX, 1 L)
 *    do quản trò công bố trước khi chơi.
 *  - Mỗi lượt: rút bài → dùng thẻ hành động / Addword → ghép câu từ bài trên tay
 *    và thẻ cố định.
 *  - Câu đúng được 1 điểm; ai đạt điểm mục tiêu (mặc định 5) trước sẽ thắng, hoặc
 *    hết thời gian thì người nhiều điểm hơn thắng.
 *  - Sửa lỗi đồng đẳng: người chơi được "thách đấu" câu của đối thủ.
 */
(function () {
  const EW = (window.EW = window.EW || {});
  const D = () => EW.DATA;
  let uidSeq = 0;
  const inst = (card) => ({ ...card, uid: 'c' + ++uidSeq });
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  const Deck = {
    topicList(cfg) {
      return cfg.topic === 'mixed' ? Object.values(D().topics) : [D().topics[cfg.topic]];
    },
    inFocus(cfg, card) { return card.focus.some((f) => cfg.focus.includes(f)); },
    wordBank(cfg) {
      const ts = Deck.topicList(cfg);
      return [
        ...D().subjects,
        ...ts.flatMap((t) => [...t.verbs, ...t.nouns, ...t.adjs]),
        ...D().times.filter((t) => Deck.inFocus(cfg, t)),
        ...D().auxes.filter((a) => Deck.inFocus(cfg, a)),
      ];
    },
    /** Quản trò chọn 6 thẻ cố định (giống nhau cho mọi người chơi để công bằng) */
    fixedSet(cfg) {
      const subs = shuffle(D().subjects.filter((s) => s.pronoun).slice());
      const s1 = subs.find((s) => ['3s'].includes(s.person));
      const s2 = subs.find((s) => s !== s1 && s.person !== '3s');
      const auxPool = shuffle(D().auxes.filter((a) => Deck.inFocus(cfg, a) && !a.neg));
      const a1 = auxPool[0];
      const a2 = auxPool.find((a) => a.kind !== a1.kind || a.tense !== a1.tense) || auxPool[1] || a1;
      const t = pick(D().times.filter((x) => Deck.inFocus(cfg, x)));
      const l = pick(D().linkers);
      return [s1, s2, t, a1, a2, l];
    },
    build(cfg, fixed) {
      const ts = Deck.topicList(cfg);
      const fixedIds = new Set(fixed.map((f) => f.id));
      const sample = (arr, n) => shuffle(arr.slice()).slice(0, n);
      const verbs = ts.flatMap((t) => t.verbs);
      const nouns = ts.flatMap((t) => t.nouns);
      const adjs = ts.flatMap((t) => t.adjs);
      const cards = [
        ...sample(D().subjects.filter((s) => !fixedIds.has(s.id)), 3),
        ...sample(verbs, 12),
        ...sample(nouns, 10),
        ...sample(adjs, 7),
        ...sample(D().times.filter((t) => Deck.inFocus(cfg, t) && !fixedIds.has(t.id)), 3),
        ...sample(D().auxes.filter((a) => Deck.inFocus(cfg, a)), 4),
        ...sample(D().linkers, 2),
      ];
      const A = D().actions;
      ['draw2', 'erase', 'swap', 'lock', 'refresh', 'combo', 'shield', 'shield'].forEach((k) =>
        cards.push({ id: 'ACT-' + k, type: 'ACTION', action: k, word: A[k].name, vi: A[k].desc }));
      cards.push({ id: 'ADD-1', type: 'ADDWORD', word: 'Addword', vi: 'Thêm 1 từ bất kỳ từ ngân hàng từ vào câu của bạn.' });
      cards.push({ id: 'ADD-2', type: 'ADDWORD', word: 'Addword', vi: 'Thêm 1 từ bất kỳ từ ngân hàng từ vào câu của bạn.' });
      return shuffle(cards.map(inst));
    },
  };

  class Duel {
    constructor(cfg, ui) {
      this.cfg = cfg;
      this.ui = ui;
      this.turn = 0;
      this.phase = 'setup';
      this.current = 0;
      this.sentence = [];
      this.over = false;
      this.records = [];
      this.startedAt = Date.now();
      const fixed = Deck.fixedSet(cfg);
      this.fixedDefs = fixed;
      this.players = [
        this.mkPlayer(cfg.playerName || 'Bạn', false, fixed),
        this.mkPlayer('Máy · ' + EW.AI.LEVELS[cfg.difficulty].name, true, fixed),
      ];
    }
    mkPlayer(name, isAI, fixed) {
      return {
        name, isAI, deck: Deck.build(this.cfg, fixed), hand: [], discard: [], set: [],
        fixed: fixed.map(inst), score: 0, locked: null, pendingLock: null,
        stats: { ok: 0, bad: 0, errors: {}, challenges: 0, challengeWins: 0, missed: 0 },
      };
    }
    opp(p) { return this.players[this.players.indexOf(p) ^ 1]; }
    get cur() { return this.players[this.current]; }
    log(msg, cls) { this.ui.log(msg, cls); }

    draw(p, n = 1) {
      const drawn = [];
      for (let i = 0; i < n; i++) {
        if (!p.deck.length) {
          if (!p.discard.length) break;
          p.deck = shuffle(p.discard.splice(0));
          this.log(`${p.name} xáo lại bãi bài thành bộ bài mới.`, 'sys');
        }
        const c = p.deck.pop();
        p.hand.push(c);
        drawn.push(c);
      }
      this.ui.sfx('draw');
      return drawn;
    }

    async start() {
      this.players.forEach((p) => this.draw(p, 5));
      const first = Math.random() < 0.5 ? 0 : 1;
      await this.ui.coinToss(first === 0);
      this.firstPlayer = first;
      this.startTurn(first);
    }

    async startTurn(idx) {
      if (this.over) return;
      this.current = idx;
      this.turn++;
      const p = this.cur;
      this.sentence = [];
      this.flags = { combo: false, submitted: false };
      p.locked = p.pendingLock;
      p.pendingLock = null;
      this.phase = 'draw';
      this.ui.render();
      await this.ui.banner(p.isAI ? 'LƯỢT ĐỐI THỦ' : 'LƯỢT CỦA BẠN', `Lượt ${this.turn}`);
      if (this.over) return;
      if (!(this.turn === 1)) {
        const n = p.hand.length === 0 ? 3 : 1;
        const d = this.draw(p, n);
        if (!p.isAI) this.log(`Bạn rút ${d.map((c) => '<b>' + c.word + '</b>').join(', ')}.`, 'me');
        else this.log(`${p.name} rút ${d.length} lá.`, 'opp');
      }
      // Bổ trợ: không có động từ trên tay → rút đến khi có thẻ V (tối đa 3 lá)
      for (let k = 0; k < 3 && !p.hand.some((c) => c.type === 'V'); k++) {
        const d = this.draw(p, 1);
        if (!d.length) break;
        this.log(`${p.isAI ? p.name : 'Bạn'} không có thẻ động từ → rút bổ trợ ${p.isAI ? '1 lá' : '<b>' + d[0].word + '</b>'}.`, 'sys');
      }
      if (p.locked) {
        const lc = p.fixed.find((f) => f.uid === p.locked);
        if (lc) this.log(`Thẻ cố định <b>${lc.word}</b> của ${p.isAI ? p.name : 'bạn'} bị khóa trong lượt này.`, 'sys');
      }
      this.phase = 'main';
      this.ui.render();
      this.ui.startTurnTimer();
      if (p.isAI) EW.AI.takeTurn(this);
    }

    // ---------- Ghép câu ----------
    usedFixed(uid) { return this.sentence.some((it) => it.src === 'fixed' && it.uid === uid); }
    inSentence(handUid) { return this.sentence.some((it) => it.handUid === handUid); }
    addHand(p, uid) {
      const c = p.hand.find((x) => x.uid === uid);
      if (!c || this.inSentence(uid)) return;
      this.sentence.push({ uid: c.uid, handUid: c.uid, src: 'hand', card: c, form: 'base' });
      this.ui.sfx('place');
      this.ui.render();
    }
    addFixed(p, uid) {
      const c = p.fixed.find((x) => x.uid === uid);
      if (!c) return;
      if (p.locked === uid) return this.ui.toast('Thẻ này đang bị khóa!');
      if (this.usedFixed(uid)) return this.ui.toast('Thẻ cố định chỉ dùng 1 lần trong một câu.');
      this.sentence.push({ uid: c.uid, src: 'fixed', card: c, form: 'base' });
      this.ui.sfx('place');
      this.ui.render();
    }
    addWord(p, awUid, wordDef) {
      const card = { ...wordDef, uid: 'aw' + ++uidSeq, fromAddword: true };
      this.sentence.push({ uid: card.uid, handUid: awUid, src: 'addword', card, form: 'base' });
      this.ui.sfx('place');
      this.ui.render();
    }
    aiPlace(p, part) {
      this.sentence.push({ uid: part.card.uid, handUid: part.handUid, src: part.src, card: part.card, form: part.form || 'base' });
      this.ui.sfx('place');
      this.ui.render();
    }
    removeAt(i) { this.sentence.splice(i, 1); this.ui.render(); }
    move(from, to) {
      if (to < 0 || to >= this.sentence.length) return;
      const [it] = this.sentence.splice(from, 1);
      this.sentence.splice(to, 0, it);
      this.ui.render();
    }
    setForm(i, f) { this.sentence[i].form = f; this.ui.render(); }
    clearSentence() { this.sentence = []; this.ui.render(); }

    // ---------- Thẻ hành động ----------
    async setShield(p, uid) {
      if (p.set.length >= 2) return this.ui.toast('Chỉ úp tối đa 2 Lá chắn.');
      const i = p.hand.findIndex((c) => c.uid === uid);
      if (i < 0) return;
      p.set.push(p.hand.splice(i, 1)[0]);
      this.log(`${p.isAI ? p.name : 'Bạn'} úp 1 lá xuống sân.`, p.isAI ? 'opp' : 'me');
      this.ui.sfx('set');
      this.ui.render();
    }

    async activate(p, uid, opts = {}) {
      const i = p.hand.findIndex((c) => c.uid === uid);
      if (i < 0 || this.over) return false;
      const card = p.hand[i];
      const def = D().actions[card.action];
      const o = this.opp(p);
      // Chọn mục tiêu trước khi kích hoạt (người chơi)
      if (!p.isAI) {
        if (card.action === 'lock') {
          opts.target = await this.ui.chooseCard('Chọn 1 thẻ cố định của đối thủ để khóa', o.fixed);
          if (!opts.target) return false;
        }
        if (card.action === 'swap' && !o.hand.length) return this.ui.toast('Đối thủ không còn bài trên tay.'), false;
      }
      p.hand.splice(i, 1);
      p.discard.push(card);
      this.ui.sfx('activate');
      this.log(`${p.isAI ? p.name : 'Bạn'} kích hoạt <b>${def.glyph} ${def.name}</b>.`, p.isAI ? 'opp' : 'me');
      await this.ui.activationFx(card, p.isAI);
      this.ui.render();

      // Phản đòn bằng Lá chắn (chain)
      if (def.targetOpp && o.set.length) {
        let negate = false;
        if (o.isAI) negate = Math.random() < 0.8;
        else negate = await this.ui.confirm('⛓ Phản đòn', `Đối thủ kích hoạt <b>${def.glyph} ${def.name}</b>: ${def.desc}<br><br>Lật <b>🛡️ Lá chắn</b> để vô hiệu hóa?`, 'Lật Lá chắn', 'Bỏ qua');
        if (negate) {
          const sh = o.set.shift();
          o.discard.push(sh);
          this.ui.sfx('shield');
          this.log(`⛓ ${o.isAI ? o.name : 'Bạn'} lật <b>🛡️ Lá chắn</b>: ${def.name} bị vô hiệu!`, 'sys');
          await this.ui.chainFx();
          this.ui.render();
          return true;
        }
      }

      switch (card.action) {
        case 'draw2': {
          const d = this.draw(p, 2);
          if (!p.isAI) this.log(`Bạn rút ${d.map((c) => '<b>' + c.word + '</b>').join(', ')}.`, 'me');
          break;
        }
        case 'erase': {
          const pool = o.hand;
          if (pool.length) {
            const c = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
            o.discard.push(c);
            this.log(`${o.isAI ? o.name : 'Bạn'} mất lá <b>${c.word}</b>.`, 'sys');
          }
          break;
        }
        case 'swap': {
          if (!o.hand.length) break;
          const taken = o.hand.splice(Math.floor(Math.random() * o.hand.length), 1)[0];
          let giveUid = opts.give;
          if (!giveUid && p.hand.length) {
            if (p.isAI) giveUid = this.worstCard(p).uid;
            else giveUid = await this.ui.chooseCard('Chọn 1 lá đưa cho đối thủ', p.hand.filter((c) => !this.inSentence(c.uid)), true);
          }
          p.hand.push(taken);
          const gi = p.hand.findIndex((c) => c.uid === giveUid);
          if (gi >= 0) o.hand.push(p.hand.splice(gi, 1)[0]);
          this.log(`${p.isAI ? p.name : 'Bạn'} lấy được <b>${p.isAI ? '1 lá' : taken.word}</b> và đưa lại 1 lá.`, 'sys');
          break;
        }
        case 'lock': {
          const t = o.fixed.find((f) => f.uid === opts.target) || o.fixed[0];
          o.pendingLock = t.uid;
          this.log(`🔒 Thẻ cố định <b>${t.word}</b> của ${o.isAI ? o.name : 'bạn'} bị khóa ở lượt kế tiếp.`, 'sys');
          break;
        }
        case 'refresh': {
          let ids = opts.discard;
          if (!p.isAI) ids = await this.ui.chooseMany('Chọn các lá muốn bỏ (sẽ rút lại đúng bấy nhiêu lá)', p.hand.filter((c) => !this.inSentence(c.uid)));
          ids = ids || [];
          ids.forEach((id) => {
            const k = p.hand.findIndex((c) => c.uid === id);
            if (k >= 0) p.discard.push(p.hand.splice(k, 1)[0]);
          });
          this.draw(p, ids.length);
          this.log(`${p.isAI ? p.name : 'Bạn'} làm mới ${ids.length} lá.`, 'sys');
          break;
        }
        case 'combo':
          this.flags.combo = true;
          this.log('Câu ghép có thẻ L ở lượt này được <b>2 điểm</b>!', 'sys');
          break;
      }
      this.ui.render();
      return true;
    }

    worstCard(p) {
      const order = { L: 0, T: 1, AUX: 2, S: 3, A: 4, N: 5, V: 6, ACTION: 7, ADDWORD: 8 };
      return p.hand.slice().sort((a, b) => order[a.type] - order[b.type])[0];
    }

    // ---------- Nộp câu ----------
    async submit(p, meta = {}) {
      if (this.flags.submitted || this.over) return;
      const items = this.sentence.slice();
      if (!items.some((it) => it.src !== 'fixed')) {
        return this.ui.toast('Câu phải dùng ít nhất 1 thẻ trên tay.');
      }
      this.flags.submitted = true;
      this.phase = 'check';
      this.ui.stopTurnTimer();
      this.ui.render();
      const res = EW.Grammar.validate(items);
      const rec = {
        turn: this.turn, player: p.isAI ? 'AI' : 'Người chơi', text: res.text, ok: res.ok,
        errors: res.errors.map((e) => e.code), detail: res.errors.map((e) => e.vi).join(' | '),
        cards: items.length, linker: res.hasLinker, challenged: '', result: '', time: new Date().toISOString(),
      };
      this.records.push(rec);
      let points = 0;

      if (!p.isAI) {
        if (this.cfg.speaking && EW.Speech.canListen()) {
          await this.ui.speakCheck(res.text);
        } else EW.Speech.say(res.text);
        points = res.ok ? (this.flags.combo && res.hasLinker ? 2 : 1) : 0;
        await this.ui.showJudgement(res, points, items);
        rec.result = res.ok ? 'Đúng' : 'Sai';
      } else {
        EW.Speech.say(res.text);
        const verdict = await this.ui.challengePrompt(res, items);
        const me = this.players[0];
        if (verdict.challenge) {
          me.stats.challenges++;
          rec.challenged = 'Có';
          if (!res.ok) {
            me.stats.challengeWins++;
            const exact = res.errors.some((e) => e.at.includes(verdict.index));
            const n = exact ? 2 : 1;
            this.draw(me, n);
            rec.result = exact ? 'Bắt lỗi đúng vị trí' : 'Bắt lỗi (sai vị trí)';
            this.log(`✅ Bạn bắt lỗi thành công${exact ? ' và chỉ đúng chỗ sai' : ''}! Rút ${n} lá.`, 'me');
          } else {
            const pool = me.hand;
            if (pool.length) me.discard.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
            points = this.flags.combo && res.hasLinker ? 2 : 1;
            rec.result = 'Thách đấu sai – câu đúng';
            this.log('❌ Câu của đối thủ đúng ngữ pháp. Bạn mất 1 lá ngẫu nhiên.', 'sys');
          }
          await this.ui.showChallengeResult(res, verdict, items);
        } else {
          rec.challenged = 'Không';
          points = this.flags.combo && res.hasLinker ? 2 : 1;
          if (!res.ok) {
            me.stats.missed++;
            rec.result = 'Lỗi bị bỏ sót';
            await this.ui.showMissed(res, items);
          } else rec.result = 'Đúng';
        }
      }

      // Thống kê
      if (res.ok) p.stats.ok++;
      else { p.stats.bad++; res.errors.forEach((e) => (p.stats.errors[e.code] = (p.stats.errors[e.code] || 0) + 1)); }

      if (points > 0) {
        p.score += points;
        // bỏ thẻ đã dùng
        const used = new Set(items.filter((it) => it.handUid).map((it) => it.handUid));
        p.hand = p.hand.filter((c) => { if (used.has(c.uid)) { p.discard.push(c); return false; } return true; });
        this.log(`${p.isAI ? p.name : 'Bạn'} ghi <b>+${points}</b> điểm với “${res.text}”`, 'score');
        this.ui.sfx('score');
      } else {
        this.log(`${p.isAI ? p.name : 'Bạn'} không ghi điểm. Thẻ được trả lại tay.`, 'sys');
        this.ui.sfx('fail');
      }
      rec.points = points;
      this.sentence = [];
      this.ui.render();
      if (p.score >= this.cfg.target) return this.finish(p);
      await wait(400);
      this.endTurn();
    }

    endTurn() {
      if (this.over) return;
      this.ui.stopTurnTimer();
      const p = this.cur;
      this.phase = 'end';
      p.locked = null;
      this.sentence = [];
      // giới hạn 8 lá trên tay
      while (p.hand.length > 8) p.discard.push(p.isAI ? p.hand.splice(p.hand.indexOf(this.worstCard(p)), 1)[0] : p.hand.shift());
      this.ui.render();
      if (this.timeUp) return this.finishByTime();
      setTimeout(() => this.startTurn(this.current ^ 1), 350);
    }

    finishByTime() {
      const [a, b] = this.players;
      this.finish(a.score === b.score ? null : a.score > b.score ? a : b, true);
    }

    finish(winner, byTime = false) {
      if (this.over) return;
      this.over = true;
      this.phase = 'end';
      this.ui.stopTurnTimer();
      this.ui.stopMatchTimer();
      this.winner = winner;
      this.byTime = byTime;
      this.ui.render();
      this.ui.showResult(this);
    }
  }

  EW.Deck = Deck;
  EW.Duel = Duel;
})();
