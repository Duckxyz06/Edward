/* EdWords – Sentence Battle · Đối thủ máy (AI)
 * Tìm câu bằng cách thử các tổ hợp thẻ và dùng chính bộ kiểm tra ngữ pháp.
 * Ở mỗi độ khó, AI cố tình mắc lỗi với một tỉ lệ nhất định để người chơi
 * luyện kỹ năng phát hiện & sửa lỗi (peer-correction).
 */
(function () {
  const EW = (window.EW = window.EW || {});
  const G = () => EW.Grammar;

  const LEVELS = {
    easy: { name: 'Dễ', errorRate: 0.35, pickTop: 0.5, actionRate: 0.4, useLinker: 0.2, judgeAcc: 0.7 },
    normal: { name: 'Vừa', errorRate: 0.22, pickTop: 0.2, actionRate: 0.65, useLinker: 0.6, judgeAcc: 0.85 },
    hard: { name: 'Khó', errorRate: 0.1, pickTop: 0, actionRate: 0.9, useLinker: 0.9, judgeAcc: 0.95 },
  };

  // pool: [{key, card, src, handUid?}] — key duy nhất cho mỗi thẻ có thể dùng
  function findClauses(pool, limit = 400, opts = {}) {
    const by = (f) => pool.filter(f);
    const subjects = by((p) => p.card.type === 'S' || (p.card.type === 'N' && (p.card.tags || []).includes('person')) || p.card.type === 'N');
    const auxes = [null, ...by((p) => p.card.type === 'AUX')];
    const verbs = [null, ...by((p) => p.card.type === 'V')];
    const nouns = by((p) => p.card.type === 'N' || (p.card.type === 'S' && !p.card.pronoun));
    const adjs = by((p) => p.card.type === 'A');
    const times = [null, ...by((p) => p.card.type === 'T')];
    const out = [];
    const seen = new Set();

    const tryItems = (arr) => {
      const keys = arr.map((x) => x.key);
      if (new Set(keys).size !== keys.length) return;
      const items = arr.map((x) => ({ card: x.card, form: x.form || G().defaultForm(x.card) }));
      const r = G().validate(items);
      if (!r.ok || seen.has(r.text)) return;
      seen.add(r.text);
      out.push({ parts: arr, text: r.text });
    };

    for (const s of subjects) {
      for (const a of auxes) {
        // AI không dùng "do/does/did" khẳng định (nhấn mạnh) trong câu trần thuật
        const emph = a && a.card.kind === 'do' && !a.card.neg;
        for (const v of verbs) {
          if (!v && !a) continue;
          const forms = v ? uniqForms(v.card) : [null];
          for (const f of forms) {
            const vv = v ? { ...v, form: f } : null;
            const comps = [[]];
            nouns.forEach((n) => comps.push([n]));
            adjs.forEach((ad) => {
              comps.push([ad]);
              nouns.forEach((n) => { if (ad.card.kind === 'adj') comps.push([ad, n]); else comps.push([n, ad]); });
            });
            for (const c of comps) {
              for (const t of times) {
                if (!emph) {
                  const core = [s];
                  if (t && t.card.pos === 'mid') {
                    if (a) core.push(a, t); else core.push(t);
                  } else if (a) core.push(a);
                  if (vv) core.push(vv);
                  core.push(...c);
                  if (t && t.card.pos === 'end') core.push(t);
                  tryItems(core);
                }
                // Câu hỏi Yes/No: AUX + S (+ tần suất) + V …
                if (a && opts.questions && !a.card.neg) {
                  const qs = [a, s];
                  if (t && t.card.pos === 'mid') qs.push(t);
                  if (vv) qs.push(vv);
                  qs.push(...c);
                  if (t && t.card.pos === 'end') qs.push(t);
                  tryItems(qs);
                }
                if (out.length >= limit) return out;
              }
            }
          }
        }
      }
    }
    return out;
  }

  function uniqForms(v) {
    const seen = new Set();
    return EW.Grammar.FORM_KEYS.filter((k) => (seen.has(v.forms[k]) ? false : seen.add(v.forms[k])));
  }
  // Thẻ N / A có nhiều dạng (a/the/số nhiều; tính từ/trạng từ) → mỗi dạng là một lựa chọn (cùng key)
  function expand(entry) {
    const c = entry.card;
    if ((c.type === 'N' && c.count) || (c.type === 'A' && c.aforms)) return G().formOptions(c).map((o) => ({ ...entry, form: o.key }));
    return [entry];
  }

  function score(c) {
    const hand = c.parts.filter((p) => p.src === 'hand').length;
    const question = c.parts[0].card.type === 'AUX';
    return c.parts.length + hand * 2.5 + (c.linker ? 3 : 0) - (question ? 2.5 : 0) + Math.random() * 2;
  }

  /** Tìm câu tốt nhất cho người chơi `pl` của trận `duel` */
  function bestSentence(duel, pl, opts = {}) {
    const pool = [];
    const add = (e) => pool.push(...expand(e));
    pl.hand.forEach((c) => { if (!['ACTION', 'ADDWORD'].includes(c.type)) add({ key: c.uid, card: c, src: 'hand', handUid: c.uid }); });
    pl.fixed.forEach((c) => add({ key: c.uid, card: c, src: 'fixed' }));
    if (opts.extra) add(opts.extra);
    let clauses = findClauses(pool.filter((p) => p.card.type !== 'L'), 400, { questions: true });
    clauses = clauses.filter((c) => c.parts.some((p) => p.src === 'hand' || p.src === 'addword'));
    // câu ghép
    const linkers = pool.filter((p) => p.card.type === 'L');
    const level = LEVELS[duel.cfg.difficulty];
    if (linkers.length && Math.random() < (opts.forceLinker ? 1 : level.useLinker)) {
      const all = findClauses(pool.filter((p) => p.card.type !== 'L'), 300);
      const top = all.sort((a, b) => b.parts.length - a.parts.length).slice(0, 28);
      for (const x of top) for (const y of top) {
        if (x === y) continue;
        const ks = new Set(x.parts.map((p) => p.key));
        if (y.parts.some((p) => ks.has(p.key))) continue;
        for (const l of linkers) {
          const parts = [...x.parts, l, ...y.parts];
          if (!parts.some((p) => p.src === 'hand' || p.src === 'addword')) continue;
          const r = G().validate(parts.map((p) => ({ card: p.card, form: p.form || G().defaultForm(p.card) })));
          if (r.ok) clauses.push({ parts, text: r.text, linker: true });
        }
      }
    }
    if (!clauses.length) return null;
    clauses.forEach((c) => (c.score = score(c)));
    clauses.sort((a, b) => b.score - a.score);
    const k = Math.max(1, Math.floor(clauses.length * level.pickTop));
    return clauses[Math.floor(Math.random() * Math.min(k, clauses.length))];
  }

  /** Cố tình tạo lỗi: đổi dạng động từ / trợ động từ / vị trí trạng từ */
  function injectError(parts) {
    const muts = [];
    parts.forEach((p, i) => {
      const fo = G().formOptions(p.card);
      if (fo) fo.forEach((o) => { if (o.key !== p.form) muts.push(() => { const c = parts.slice(); c[i] = { ...p, form: o.key }; return c; }); });
    });
    const tIdx = parts.findIndex((p) => p.card.type === 'T');
    if (tIdx > 0) {
      muts.push(() => { const c = parts.slice(); const [t] = c.splice(tIdx, 1); c.splice(1, 0, t); return c; });
      muts.push(() => { const c = parts.slice(); const [t] = c.splice(tIdx, 1); c.push(t); return c; });
    }
    const aIdx = parts.findIndex((p) => p.card.type === 'A' && p.card.kind !== 'adj');
    if (aIdx > 0) muts.push(() => { const c = parts.slice(); const [a] = c.splice(aIdx, 1); c.splice(2, 0, a); return c; });
    for (let tries = 0; tries < 12 && muts.length; tries++) {
      const m = muts.splice(Math.floor(Math.random() * muts.length), 1)[0];
      const c = m();
      const r = G().validate(c.map((p) => ({ card: p.card, form: p.form || G().defaultForm(p.card) })));
      if (!r.ok) return c;
    }
    return null;
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  async function takeTurn(game) {
    const me = game.cur;
    const level = LEVELS[game.cfg.difficulty];
    const fast = game.cfg.aiSpeed === 'fast';
    const pause = (ms) => wait(fast ? ms * 0.45 : ms);
    await pause(800);
    if (game.over) return;
    const findAct = (key) => me.hand.find((c) => c.type === 'ACTION' && c.action === key);
    const rivals = () => game.others(me).filter((x) => x.hand.length);
    // người đang dẫn đầu (ưu tiên người có nhiều bài nếu bằng điểm)
    const leader = () => rivals().sort((a, b) => b.score - a.score || b.hand.length - a.hand.length)[0];

    // +2 / +4 khi bài ít
    for (const k of ['draw4', 'draw2']) {
      const c = findAct(k);
      if (c && me.hand.length <= 6) { await game.activate(me, c.uid); await pause(600); }
    }
    // STEAL / Exchange nhắm vào người dẫn đầu
    let c = findAct('steal');
    if (c && rivals().length && Math.random() < level.actionRate) { await game.activate(me, c.uid, { target: leader() }); await pause(600); }
    if (game.over) return;

    let best = bestSentence(game, me);
    c = findAct('exchange');
    if (c && rivals().length && Math.random() < level.actionRate * 0.7) {
      const mine = me.hand.filter((x) => x.uid !== c.uid && !(best && best.parts.some((p) => p.handUid === x.uid)));
      if (mine.length) {
        const worst = mine.sort((a, b) => rank(a) - rank(b))[0];
        await game.activate(me, c.uid, { target: leader(), give: worst.uid });
        await pause(600);
        best = bestSentence(game, me);
      }
    }
    // Addword: thử thêm một từ từ ngân hàng
    const aw = me.hand.find((x) => x.type === 'ADDWORD');
    if (aw && (!best || best.parts.length < 5)) {
      const cands = EW.Deck.wordBank(game.cfg).filter((w) => ['V', 'N', 'A'].includes(w.type));
      let bestAw = null;
      for (let n = 0; n < 8; n++) {
        const w = cands[Math.floor(Math.random() * cands.length)];
        const extra = { key: 'aw-' + w.id, card: { ...w, uid: 'aw-' + w.id }, src: 'addword', handUid: aw.uid };
        const s2 = bestSentence(game, me, { extra });
        if (s2 && (!bestAw || s2.score > bestAw.score)) bestAw = s2;
      }
      if (bestAw && (!best || bestAw.score > best.score + 1)) best = bestAw;
    }
    // Refresh khi không ghép được câu
    if (!best) {
      c = findAct('refresh');
      if (c) { await game.activate(me, c.uid); await pause(600); best = bestSentence(game, me); }
    }
    if (game.over) return;
    if (!best) {
      game.log(`${me.name} chưa ghép được câu và bỏ lượt.`, 'opp');
      await pause(500);
      return game.endTurn();
    }
    let parts = best.parts;
    if (Math.random() < level.errorRate) {
      const bad = injectError(parts);
      if (bad) parts = bad;
    }
    for (const p of parts) {
      if (game.over) return;
      game.aiPlace(me, p);
      await pause(330);
    }
    await pause(450);
    await game.submit(me);
  }

  function rank(c) {
    return { ACTION: 6, ADDWORD: 9, V: 8, N: 5, A: 3, S: 2, T: 1, AUX: 2, L: 0 }[c.type] || 0;
  }

  EW.AI = { takeTurn, bestSentence, LEVELS };
})();
