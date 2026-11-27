/* EdWords – Sentence Battle · Luật chơi chế độ "Ghép câu" (theo luật của nhóm)
 * A. Bộ bài: thẻ cố định S, AUX, T (quản trò ghi từ) + bộ bài chủ đề gồm N, V, A,
 *    thẻ chức năng (+2, +4, STEAL, Exchange Card, Refresh) và Addword.
 * B. 4–6 người chơi · quản trò đưa luật đặt câu (vd: thì hiện tại đơn) và từ cho S, T, (L), AUX
 *    · mỗi người 5 lá trên tay + 3 lá cố định · đến lượt thì rút bài, dùng thẻ chức năng,
 *    ghép câu đơn từ bài trên tay + thẻ cố định · các thành viên còn lại đánh giá
 *    ngữ pháp & nghĩa · đúng thì +1 điểm · hết thời gian, ai nhiều điểm nhất thắng.
 */
(function () {
  const EW = (window.EW = window.EW || {});
  const D = () => EW.DATA;
  let uidSeq = 0;
  const inst = (card) => ({ ...card, uid: 'c' + ++uidSeq });
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  const RIVALS = [
    { name: 'Minh', avatar: 'assets/avatar-rival-a.png' },
    { name: 'Thảo', avatar: 'assets/avatar-rival-b.png' },
    { name: 'Khoa', avatar: 'assets/avatar-rival-c.png' },
    { name: 'Vy', avatar: 'assets/avatar-rival-d.png' },
    { name: 'Long', avatar: 'assets/avatar-rival-e.png' },
  ];

  const Deck = {
    topic(cfg) { return D().topics[cfg.topic]; },
    /** Bộ bài chủ đề dùng chung cho cả bàn */
    build(cfg) {
      const t = Deck.topic(cfg);
      const cards = [];
      [...t.nouns, ...t.verbs, ...t.adjs].forEach((c) => { for (let i = 0; i < (c.copies || 1); i++) cards.push(inst(c)); });
      Object.entries(D().actions).forEach(([k, a]) => {
        for (let i = 0; i < a.copies; i++) cards.push(inst({ id: 'ACT-' + k, type: 'ACTION', action: k, word: a.name, vi: a.desc, img: t.actions[k] || null }));
      });
      for (let i = 0; i < D().ADDWORD.copies; i++) cards.push(inst({ id: 'ADD', type: 'ADDWORD', word: 'Addword', vi: D().ADDWORD.desc, img: t.actions.addword }));
      return shuffle(cards);
    },
    /** Ngân hàng từ cho thẻ Addword */
    wordBank(cfg) {
      const t = Deck.topic(cfg);
      return [...D().subjects, ...t.verbs, ...t.nouns, ...t.adjs, ...D().times, ...D().auxes, ...(cfg.allowL ? D().linkers : [])];
    },
    /** Thẻ cố định do quản trò ghi từ (giống nhau cho mọi người chơi) */
    fixedDefs(cfg) {
      const find = (list, id) => list.find((c) => c.id === id) || list[0];
      const core = D().core;
      const out = [
        { ...find(D().subjects, cfg.gm.S), img: core.S, fixedFace: true },
        { ...find(D().auxes, cfg.gm.AUX), img: core.AUX, fixedFace: true },
        { ...find(D().times, cfg.gm.T), img: core.T, fixedFace: true },
      ];
      if (cfg.allowL) out.push({ ...find(D().linkers, cfg.gm.L) });
      return out;
    },
    /** Gợi ý từ cho quản trò theo luật đặt câu */
    suggestGM(rule) {
      const R = D().RULES[rule];
      const pick = (a) => a[Math.floor(Math.random() * a.length)];
      const auxes = D().auxes.filter((a) => R.aux(a) && !a.neg);
      const times = D().times.filter((t) => !R.time || R.time.includes(t.tag));
      const aux = pick(auxes);
      const subs = D().subjects.filter((s) => aux.persons.includes(s.person));
      return { S: pick(subs).id, AUX: aux.id, T: pick(times).id, L: pick(D().linkers).id };
    },
  };

  class Game {
    constructor(cfg, ui) {
      this.cfg = cfg;
      this.ui = ui;
      this.turn = 0;
      this.round = 1;
      this.phase = 'setup';
      this.current = 0;
      this.sentence = [];
      this.flags = { submitted: false };
      this.over = false;
      this.records = [];
      this.startedAt = Date.now();
      EW.Grammar.rule = cfg.rule;
      this.fixedDefs = Deck.fixedDefs(cfg);
      this.deck = Deck.build(cfg);
      this.discard = [];
      const n = Math.max(4, Math.min(6, cfg.players));
      this.players = [this.mkPlayer(cfg.playerName || 'Bạn', false, 'assets/avatar-player.png')];
      shuffle(RIVALS.slice()).slice(0, n - 1).forEach((r) => this.players.push(this.mkPlayer(r.name, true, r.avatar)));
    }
    mkPlayer(name, isAI, avatar) {
      return {
        name, isAI, avatar, hand: [], fixed: this.fixedDefs.map(inst), score: 0,
        stats: { ok: 0, bad: 0, errors: {}, judged: 0, judgedRight: 0, exact: 0, accepted: 0 },
      };
    }
    get cur() { return this.players[this.current]; }
    others(p) { return this.players.filter((x) => x !== p); }
    log(msg, cls) { this.ui.log(msg, cls); }
    who(p) { return p.isAI ? p.name : 'Bạn'; }

    draw(p, n = 1) {
      const drawn = [];
      for (let i = 0; i < n; i++) {
        if (!this.deck.length) {
          if (!this.discard.length) break;
          this.deck = shuffle(this.discard.splice(0));
          this.log('Xáo lại bãi bài thành bộ bài mới.', 'sys');
        }
        const c = this.deck.pop();
        p.hand.push(c);
        drawn.push(c);
      }
      if (drawn.length) this.ui.sfx('draw');
      return drawn;
    }

    async start() {
      this.players.forEach((p) => this.draw(p, 5));
      const first = Math.floor(Math.random() * this.players.length);
      this.firstPlayer = first;
      await this.ui.announceFirst(this.players[first]);
      this.startTurn(first);
    }

    async startTurn(idx) {
      if (this.over) return;
      this.current = idx;
      this.turn++;
      if (idx === this.firstPlayer && this.turn > 1) this.round++;
      const p = this.cur;
      this.sentence = [];
      this.flags = { submitted: false };
      this.phase = 'draw';
      this.ui.render();
      await this.ui.banner(p.isAI ? `LƯỢT CỦA ${p.name.toUpperCase()}` : 'LƯỢT CỦA BẠN', `Vòng ${this.round} · Lượt ${this.turn}`);
      if (this.over) return;
      const d = this.draw(p, 1);
      if (!p.isAI) this.log(`Bạn rút <b>${d.map((c) => c.word).join(', ') || '—'}</b>.`, 'me');
      else this.log(`${p.name} rút 1 lá.`, 'opp');
      if (this.cfg.assistDraw) {
        for (let k = 0; k < 3 && !p.hand.some((c) => c.type === 'V'); k++) {
          const x = this.draw(p, 1);
          if (!x.length) break;
          this.log(`${this.who(p)} chưa có thẻ động từ → rút bổ trợ 1 lá.`, 'sys');
        }
      }
      this.phase = 'main';
      this.ui.render();
      this.ui.startTurnTimer();
      if (p.isAI) EW.AI.takeTurn(this);
    }

    // ---------- Ghép câu ----------
    usedFixed(uid) { return this.sentence.some((it) => it.src === 'fixed' && it.uid === uid); }
    inSentence(handUid) { return this.sentence.some((it) => it.handUid === handUid); }
    push(item) { this.sentence.push(item); this.ui.sfx('place'); this.ui.render(); }
    addHand(p, uid) {
      const c = p.hand.find((x) => x.uid === uid);
      if (!c || this.inSentence(uid)) return;
      this.push({ uid: c.uid, handUid: c.uid, src: 'hand', card: c, form: EW.Grammar.defaultForm(c) });
    }
    addFixed(p, uid) {
      const c = p.fixed.find((x) => x.uid === uid);
      if (!c) return;
      if (this.usedFixed(uid)) return this.ui.toast('Mỗi thẻ cố định chỉ dùng 1 lần trong một câu.');
      this.push({ uid: c.uid, src: 'fixed', card: c, form: EW.Grammar.defaultForm(c) });
    }
    addWord(p, awUid, wordDef) {
      const card = { ...wordDef, uid: 'aw' + ++uidSeq, fromAddword: true };
      this.push({ uid: card.uid, handUid: awUid, src: 'addword', card, form: EW.Grammar.defaultForm(card) });
    }
    aiPlace(p, part) {
      this.push({ uid: part.card.uid, handUid: part.handUid, src: part.src, card: part.card, form: part.form || EW.Grammar.defaultForm(part.card) });
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

    // ---------- Thẻ chức năng ----------
    async activate(p, uid, opts = {}) {
      const i = p.hand.findIndex((c) => c.uid === uid);
      if (i < 0 || this.over) return false;
      const card = p.hand[i];
      const def = D().actions[card.action];
      // chọn người chơi mục tiêu
      let target = opts.target;
      if (def.target && !target) {
        const pool = this.others(p).filter((x) => x.hand.length);
        if (!pool.length) { if (!p.isAI) this.ui.toast('Không ai còn bài trên tay.'); return false; }
        if (!p.isAI) {
          target = await this.ui.choosePlayer(def.action === 'steal' ? 'STEAL: chọn người bị cướp 1 lá' : 'Exchange: chọn người để đổi bài', pool);
          if (!target) return false;
        } else target = pool[0];
      }
      let give = opts.give;
      if (card.action === 'exchange' && !give) {
        const mine = p.hand.filter((c) => c.uid !== uid && !this.inSentence(c.uid));
        if (!mine.length) { if (!p.isAI) this.ui.toast('Bạn cần ít nhất 1 lá khác để đổi.'); return false; }
        if (!p.isAI) { give = await this.ui.chooseCard('Chọn 1 lá của bạn để đưa đi', mine); if (!give) return false; }
        else give = mine[0].uid;
      }

      p.hand.splice(p.hand.indexOf(card), 1);
      this.discard.push(card);
      this.ui.sfx('activate');
      this.log(`${this.who(p)} dùng <b>${def.name}</b>${target ? ' với ' + this.who(target) : ''}.`, p.isAI ? 'opp' : 'me');
      await this.ui.activationFx(card, p.isAI);

      switch (card.action) {
        case 'draw2':
        case 'draw4': {
          const d = this.draw(p, card.action === 'draw2' ? 2 : 4);
          if (!p.isAI) this.log(`Bạn rút ${d.map((c) => '<b>' + c.word + '</b>').join(', ')}.`, 'me');
          break;
        }
        case 'steal': {
          const c = target.hand.splice(Math.floor(Math.random() * target.hand.length), 1)[0];
          p.hand.push(c);
          this.log(`💰 ${this.who(p)} cướp ${p.isAI && target.isAI ? '1 lá' : '<b>' + c.word + '</b>'} của ${this.who(target)}.`, 'sys');
          break;
        }
        case 'exchange': {
          const taken = target.hand.splice(Math.floor(Math.random() * target.hand.length), 1)[0];
          const gi = p.hand.findIndex((c) => c.uid === give);
          const given = p.hand.splice(gi, 1)[0];
          target.hand.push(given);
          p.hand.push(taken);
          const show = !p.isAI || !target.isAI;
          this.log(`🔄 ${this.who(p)} đổi ${show ? '<b>' + given.word + '</b>' : '1 lá'} lấy ${show ? '<b>' + taken.word + '</b>' : '1 lá'} của ${this.who(target)}.`, 'sys');
          break;
        }
        case 'refresh': {
          const keep = p.hand.filter((c) => this.inSentence(c.uid));
          const out = p.hand.filter((c) => !this.inSentence(c.uid));
          this.discard.push(...out);
          p.hand = keep;
          this.draw(p, out.length);
          this.log(`♻️ ${this.who(p)} bỏ ${out.length} lá và rút lại ${out.length} lá.`, 'sys');
          break;
        }
      }
      this.ui.render();
      return true;
    }

    // ---------- Nộp câu & các thành viên đánh giá ----------
    async submit(p, meta = {}) {
      if (this.flags.submitted || this.over) return;
      const items = this.sentence.slice();
      if (!items.some((it) => it.src !== 'fixed')) return this.ui.toast('Câu phải dùng ít nhất 1 lá trên tay.');
      this.flags.submitted = true;
      this.phase = 'check';
      this.ui.stopTurnTimer();
      this.ui.render();
      const res = EW.Grammar.validate(items, { rule: this.cfg.rule });

      if (!p.isAI && this.cfg.speaking && EW.Speech.canListen()) await this.ui.speakCheck(res.text);
      else EW.Speech.say(res.text);

      // Các thành viên còn lại đánh giá: Đúng / Sai (ngữ pháp & nghĩa)
      const votes = [];
      const human = this.players[0];
      if (p !== human) {
        const v = await this.ui.votePrompt(res, items, p);
        votes.push({ player: human, ok: v.ok, index: v.index });
      }
      const acc = EW.AI.LEVELS[this.cfg.difficulty].judgeAcc;
      this.others(p).filter((x) => x.isAI).forEach((x) => votes.push({ player: x, ok: Math.random() < acc ? res.ok : !res.ok }));
      const yes = votes.filter((v) => v.ok).length;
      const no = votes.length - yes;
      const accepted = yes > no ? true : yes < no ? false : res.ok; // hòa phiếu: quản trò quyết định
      const tie = yes === no;
      const points = accepted ? 1 : 0;

      // thống kê người chơi khi làm giám khảo
      votes.forEach((v) => {
        v.player.stats.judged++;
        if (v.ok === res.ok) v.player.stats.judgedRight++;
        if (!res.ok && !v.ok && v.index != null && res.errors.some((e) => e.at.includes(v.index))) v.player.stats.exact++;
      });

      await this.ui.showVerdict({ res, items, votes, yes, no, accepted, tie, submitter: p, points });

      const rec = {
        turn: this.turn, round: this.round, player: p.name, text: res.text, ok: res.ok, accepted,
        votes: `${yes}✔/${no}✘`, errors: res.errors.map((e) => e.code), detail: res.errors.map((e) => e.vi).join(' | '),
        points, time: new Date().toISOString(),
      };
      this.records.push(rec);
      if (res.ok) p.stats.ok++;
      else { p.stats.bad++; res.errors.forEach((e) => (p.stats.errors[e.code] = (p.stats.errors[e.code] || 0) + 1)); }

      if (points) {
        p.score += points;
        p.stats.accepted++;
        const used = new Set(items.filter((it) => it.handUid).map((it) => it.handUid));
        p.hand = p.hand.filter((c) => { if (used.has(c.uid)) { this.discard.push(c); return false; } return true; });
        this.log(`${this.who(p)} ghi <b>+1</b> điểm: “${res.text}”`, 'score');
        this.ui.sfx('score');
      } else {
        this.log(`Câu của ${this.who(p)} không được chấp nhận. Thẻ trả lại tay.`, 'sys');
        this.ui.sfx('fail');
      }
      this.sentence = [];
      this.ui.render();
      if (this.cfg.target && p.score >= this.cfg.target) return this.finish();
      await wait(300);
      this.endTurn();
    }

    endTurn() {
      if (this.over) return;
      this.ui.stopTurnTimer();
      const p = this.cur;
      this.phase = 'end';
      this.sentence = [];
      while (p.hand.length > 10) this.discard.push(p.hand.shift());
      this.ui.render();
      if (this.timeUp) return this.finish();
      setTimeout(() => this.startTurn((this.current + 1) % this.players.length), 300);
    }

    ranking() {
      return this.players.slice().sort((a, b) => b.score - a.score || b.stats.ok - a.stats.ok);
    }

    finish() {
      if (this.over) return;
      this.over = true;
      this.phase = 'end';
      this.ui.stopTurnTimer();
      this.ui.stopMatchTimer();
      const r = this.ranking();
      this.winners = r.filter((p) => p.score === r[0].score);
      this.ui.render();
      this.ui.showResult(this);
    }
  }

  EW.Deck = Deck;
  EW.Game = Game;
  EW.RIVALS = RIVALS;
})();
