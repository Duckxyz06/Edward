/* EdWords – Sentence Battle · Đối thủ máy (AI)
 * Tìm câu bằng cách thử các tổ hợp thẻ và dùng chính bộ kiểm tra ngữ pháp.
 * Ở mỗi độ khó, AI cố tình mắc lỗi với một tỉ lệ nhất định để người chơi
 * luyện kỹ năng phát hiện & sửa lỗi (peer-correction).
 */
(function () {
  const EW = (window.EW = window.EW || {});
  const G = () => EW.Grammar;

  const LEVELS = {
    easy: { name: 'Dễ', errorRate: 0.35, pickTop: 0.5, actionRate: 0.35, useLinker: 0.2 },
    normal: { name: 'Vừa', errorRate: 0.22, pickTop: 0.2, actionRate: 0.6, useLinker: 0.6 },
    hard: { name: 'Khó', errorRate: 0.1, pickTop: 0, actionRate: 0.85, useLinker: 0.9 },
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
      const items = arr.map((x) => ({ card: x.card, form: x.form || 'base' }));
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

  function score(c) {
    const hand = c.parts.filter((p) => p.src === 'hand').length;
    return c.parts.length + hand * 2.5 + (c.linker ? 3 : 0) + Math.random();
  }

  /** Tìm câu tốt nhất cho người chơi `pl` của trận `duel` */
  function bestSentence(duel, pl, opts = {}) {
    const pool = [];
    pl.hand.forEach((c) => { if (!['ACTION', 'ADDWORD'].includes(c.type)) pool.push({ key: c.uid, card: c, src: 'hand', handUid: c.uid }); });
    pl.fixed.forEach((c) => { if (!pl.locked || pl.locked !== c.uid) pool.push({ key: c.uid, card: c, src: 'fixed' }); });
    if (opts.extra) pool.push(opts.extra);
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
          const r = G().validate(parts.map((p) => ({ card: p.card, form: p.form || 'base' })));
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
      if (p.card.type === 'V') uniqForms(p.card).forEach((f) => { if (f !== p.form) muts.push(() => { const c = parts.slice(); c[i] = { ...p, form: f }; return c; }); });
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
      const r = G().validate(c.map((p) => ({ card: p.card, form: p.form || 'base' })));
      if (!r.ok) return c;
    }
    return null;
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  async function takeTurn(duel) {
    const me = duel.players[1];
    const opp = duel.players[0];
    const level = LEVELS[duel.cfg.difficulty];
    await wait(900);
    if (duel.over) return;

    const findAct = (key) => me.hand.find((c) => c.type === 'ACTION' && c.action === key);
    // Úp lá chắn
    for (const sh of me.hand.filter((c) => c.type === 'ACTION' && c.action === 'shield')) {
      if (me.set.length < 2) { await duel.setShield(me, sh.uid); await wait(500); }
    }
    // Rút thêm khi bài ít
    let c = findAct('draw2');
    if (c && me.hand.length <= 6) { await duel.activate(me, c.uid); await wait(700); }

    // Hành động tấn công
    if (Math.random() < level.actionRate) {
      c = findAct('erase');
      if (c && opp.hand.length >= 4) { await duel.activate(me, c.uid); await wait(700); }
    }
    if (Math.random() < level.actionRate * 0.8) {
      c = findAct('lock');
      if (c) {
        const target = opp.fixed.find((f) => f.type === 'AUX') || opp.fixed[0];
        await duel.activate(me, c.uid, { target: target.uid });
        await wait(700);
      }
    }
    if (Math.random() < level.actionRate * 0.5) {
      c = findAct('swap');
      if (c && opp.hand.length) { await duel.activate(me, c.uid); await wait(700); }
    }
    if (duel.over) return;

    let best = bestSentence(duel, me);
    // Thẻ Addword: thử thêm một từ từ ngân hàng
    const aw = me.hand.find((x) => x.type === 'ADDWORD');
    if (aw && (!best || best.parts.length < 5)) {
      const cands = EW.Deck.wordBank(duel.cfg).filter((w) => ['V', 'N', 'A'].includes(w.type));
      let bestAw = null;
      for (let n = 0; n < 8; n++) {
        const w = cands[Math.floor(Math.random() * cands.length)];
        const extra = { key: 'aw-' + w.id, card: { ...w, uid: 'aw-' + w.id }, src: 'addword', handUid: aw.uid };
        const s = bestSentence(duel, me, { extra });
        if (s && (!bestAw || s.score > bestAw.score)) bestAw = s;
      }
      if (bestAw && (!best || bestAw.score > best.score + 1)) best = bestAw;
    }
    if (!best) {
      c = findAct('refresh');
      if (c) {
        await duel.activate(me, c.uid, { discard: me.hand.filter((x) => x.type !== 'ACTION' && x.type !== 'ADDWORD').map((x) => x.uid).slice(0, 3) });
        await wait(700);
        best = bestSentence(duel, me);
      }
    }
    if (duel.over) return;
    if (!best) {
      duel.log(`${me.name} không ghép được câu và bỏ lượt.`, 'opp');
      await wait(600);
      return duel.endTurn();
    }
    c = findAct('combo');
    if (c && best.linker) { await duel.activate(me, c.uid); await wait(600); }

    let parts = best.parts;
    let intended = true;
    if (Math.random() < level.errorRate) {
      const bad = injectError(parts);
      if (bad) { parts = bad; intended = false; }
    }
    for (const p of parts) {
      if (duel.over) return;
      duel.aiPlace(me, p);
      await wait(380);
    }
    await wait(500);
    await duel.submit(me, { intendedCorrect: intended });
  }

  EW.AI = { takeTurn, bestSentence, LEVELS };
})();
