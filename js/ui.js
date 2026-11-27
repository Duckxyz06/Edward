/* EdWords – Sentence Battle · Giao diện chế độ "Ghép câu" (4–6 người) */
(function () {
  const EW = (window.EW = window.EW || {});
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const TI = () => EW.DATA.TYPE_INFO;
  const G = () => EW.Grammar;
  const BACK = '<div class="back-emblem"><span class="back-book">📖</span><span class="back-name">EDWORDS</span></div>';
  const A_KIND = { adj: 'Tính từ', adv: 'Trạng từ', place: 'Nơi chốn' };
  const TIPS = `<div class="tips"><div class="tips-title">💡 Mẹo nhanh</div>
    <p><b>Câu cơ bản:</b> S + V (+ N) (+ A) (+ T)</p>
    <p><b>Có trợ động từ:</b> S + AUX + V</p>
    <ul>
      <li>will / can / do / did + V nguyên mẫu</li>
      <li>am / is / are + V-ing hoặc + tính từ</li>
      <li>have / has + V3</li>
      <li>he / she / Nam + V-s (hiện tại đơn)</li>
      <li>Danh từ đếm được số ít cần <b>a/an</b> hoặc <b>the</b></li>
      <li>Tính từ đứng trước danh từ / sau to be; trạng từ đứng sau động từ</li>
    </ul>
    <p class="muted">Rê chuột / chạm vào thẻ để xem nghĩa, dạng từ và cách dùng.</p></div>`;

  function cardTitle(card) {
    if (card.type === 'ACTION') return EW.DATA.actions[card.action].en;
    if (card.type === 'A') return card.aforms ? 'Tính / trạng từ' : A_KIND[card.kind];
    if (card.type === 'T') return card.pos === 'mid' ? 'Tần suất' : 'Thời gian';
    return TI()[card.type].name;
  }

  /** Lá bài: dùng ảnh thẻ in thật nếu có, nếu không thì dựng bằng CSS */
  function cardEl(card, o = {}) {
    const el = document.createElement('div');
    if (o.faceDown) {
      el.className = 'card back' + (o.small ? ' small' : '') + (o.tiny ? ' tiny' : '');
      el.innerHTML = BACK;
      return el;
    }
    const t = card.type;
    const sizes = (o.small ? ' small' : '') + (o.tiny ? ' tiny' : '') + (card.fromAddword ? ' from-aw' : '') + (o.cls ? ' ' + o.cls : '');
    el.dataset.uid = card.uid || '';
    const opts = G().formOptions(card);
    const showForm = o.form && opts && (o.forceForm || o.form !== opts[0].key || t === 'N');
    if (card.img) {
      el.className = `card img t-${t}` + sizes;
      el.innerHTML = `<img src="${card.img}" alt="${esc(card.word)}" loading="lazy" draggable="false" />`;
      if (card.fixedFace) el.insertAdjacentHTML('beforeend', `<div class="fx-word">${esc(card.word)}</div>`);
      if (showForm) el.insertAdjacentHTML('beforeend', `<div class="form-tag">${esc(G().displayWord(card, o.form))}</div>`);
    } else {
      let glyph = TI()[t].glyph, word = card.word, sub = card.vi;
      if (t === 'ACTION') { const a = EW.DATA.actions[card.action]; glyph = a.glyph; word = a.name; sub = a.desc; }
      if (o.form) word = G().displayWord(card, o.form);
      el.className = `card t-${t}` + sizes;
      const badge = t === 'ACTION' ? '★' : t === 'ADDWORD' ? '✚' : t;
      el.innerHTML = `
        <div class="c-head"><span class="c-type">${badge}</span><span class="c-title">${esc(cardTitle(card))}</span></div>
        <div class="c-art"><span>${glyph}</span></div>
        <div class="c-word">${esc(word)}</div>
        <div class="c-vi">${esc(sub)}</div>`;
    }
    if (o.used) el.classList.add('used');
    el.addEventListener('mouseenter', () => UI.showDetail(card, o.form));
    return el;
  }

  function detailHTML(card, form) {
    const t = card.type;
    const ti = TI()[t];
    let body = '';
    const opts = G().formOptions(card);
    if (opts) {
      body += `<table class="forms">${opts.map((f) => `<tr class="${f.key === form ? 'cur' : ''}"><th>${esc(f.label)}</th><td>${esc(f.text)}</td><td><button class="say" data-say="${esc(f.text)}">🔊</button></td></tr>`).join('')}</table>`;
    }
    if (t === 'V') {
      const objTxt = { none: 'Không cần tân ngữ (vd: She bargains well.)', opt: 'Có thể có danh từ phía sau.', req: 'Bắt buộc có danh từ (N) phía sau.', adj: 'Theo sau là TÍNH TỪ.' }[card.obj];
      body += `<p class="hint">📌 ${objTxt}${card.prep ? `<br>📌 Có danh từ phía sau thì tự thêm “${card.prep}” (vd: go to the supermarket).` : ''}${card.agent === false ? '<br>📌 Chủ ngữ có thể là sự vật (vd: The storm destroyed the road).' : ''}</p>`;
    }
    if (t === 'AUX') {
      const need = card.kind === 'have' ? 'V3' : card.kind === 'be' ? 'V-ing / tính từ / V3 (bị động)' : 'V nguyên mẫu';
      body += `<p class="hint">📌 Đi với: <b>${card.persons.map((p) => ({ '1s': 'I', '2': 'you', '3s': 'he/she/it', '1p': 'we', '3p': 'they' }[p])).join(', ')}</b><br>📌 Theo sau: <b>${need}</b></p>`;
    }
    if (t === 'T') body += `<p class="hint">📌 Nhóm: <b>${G().TTAG_VI[card.tag]}</b><br>📌 Vị trí: ${card.pos === 'mid' ? 'trước động từ thường, sau to be / trợ động từ' : 'đầu hoặc cuối câu'}</p>`;
    if (t === 'A') body += `<p class="hint">📌 Tính từ: đứng trước danh từ hoặc sau to be.<br>📌 Trạng từ: đứng sau động từ (và tân ngữ).</p>`;
    if (t === 'N') body += `<p class="hint">📌 ${{ c: 'Danh từ đếm được: số ít cần a/an hoặc the.', u: 'Danh từ không đếm được: không dùng a/an, không thêm -s.', pl: 'Danh từ luôn ở dạng số nhiều → động từ chia như “they”.', sp: 'Số ít và số nhiều cùng một dạng.' }[card.count] || ''}</p>`;
    if (t === 'S') body += `<p class="hint">📌 Ngôi: <b>${{ '1s': 'thứ nhất số ít', '2': 'thứ hai', '3s': 'thứ ba số ít', '1p': 'thứ nhất số nhiều', '3p': 'thứ ba số nhiều' }[card.person]}</b></p>`;
    const word = t === 'ACTION' ? EW.DATA.actions[card.action].name : form ? G().displayWord(card, form) : card.word;
    const canSay = !['ACTION', 'ADDWORD'].includes(t);
    return `
      ${card.img ? `<div class="d-img"><img src="${card.img}" alt="" />${card.fixedFace ? `<div class="fx-word">${esc(card.word)}</div>` : ''}</div>` : ''}
      <div class="d-type t-${t}">${ti.glyph} ${esc(ti.name)} <small>${esc(ti.en)}</small></div>
      <div class="d-word">${esc(word)} ${canSay ? `<button class="say" data-say="${esc(word)}">🔊</button>` : ''}</div>
      <div class="d-vi">${esc(card.vi)}</div>
      ${card.def ? `<div class="d-def">“${esc(card.def)}”</div>` : ''}
      ${body}`;
  }

  // ---------- Modal ----------
  function modal({ title, body, buttons = [{ label: 'OK', value: true, cls: 'primary' }], wide, cls, onOpen, closable, autoClose }) {
    return new Promise((resolve) => {
      const root = $('#modal-root');
      const ov = document.createElement('div');
      ov.className = 'modal-ov';
      const box = document.createElement('div');
      box.className = 'modal' + (wide ? ' wide' : '') + (cls ? ' ' + cls : '');
      box.innerHTML = `${title ? `<div class="m-title">${title}</div>` : ''}<div class="m-body"></div><div class="m-btns"></div>`;
      const mb = box.querySelector('.m-body');
      if (typeof body === 'string') mb.innerHTML = body; else if (body) mb.appendChild(body);
      let done = false, timer = null;
      const close = (v) => { if (done) return; done = true; clearInterval(timer); ov.classList.add('out'); setTimeout(() => ov.remove(), 180); UI.busy--; UI.renderControls(); resolve(v); };
      buttons.forEach((b, bi) => {
        const btn = document.createElement('button');
        btn.className = 'btn ' + (b.cls || '');
        btn.innerHTML = b.label;
        btn.onclick = () => close(typeof b.value === 'function' ? b.value() : b.value);
        box.querySelector('.m-btns').appendChild(btn);
        if (autoClose && bi === buttons.length - 1) {
          let left = autoClose;
          const base = b.label;
          btn.innerHTML = `${base} (${left})`;
          timer = setInterval(() => { left--; btn.innerHTML = `${base} (${left})`; if (left <= 0) close(typeof b.value === 'function' ? b.value() : b.value); }, 1000);
        }
      });
      if (closable) ov.addEventListener('click', (e) => { if (e.target === ov) close(null); });
      ov.appendChild(box);
      root.appendChild(ov);
      UI.busy++;
      UI.renderControls();
      if (onOpen) onOpen(box, close);
    });
  }

  const UI = {
    game: null,
    busy: 0,
    selectMode: null,
    cardEl,
    detailHTML,
    modal,
    esc,
    BACK,

    bind(game) {
      this.game = game;
      this.busy = 0;
      this.selectMode = null;
      this._seen = new Set();
      this._seenS = new Set();
      $('#log').innerHTML = '';
      $('#prompt-panel').innerHTML = '';
      $('#prompt-panel').classList.remove('show');
      $('#detail').innerHTML = TIPS;
      this.startMatchTimer();
      const c = game.cfg;
      const rule = EW.DATA.RULES[c.rule];
      $('#hud-mode').textContent = `Ghép câu · ${EW.DATA.topics[c.topic].name} · ${game.players.length} người`;
      $('#rule-sub').innerHTML = `🎙️ Luật của quản trò: <b>${esc(rule.name)}</b>`;
    },

    sfx(n) { EW.sfx(n); },
    myTurn() { const g = this.game; return g && !g.over && g.current === 0 && g.phase === 'main' && !g.flags.submitted; },
    canAct() { return this.myTurn() && this.busy === 0; },

    showDetail(card, form) {
      const el = $('#detail');
      el.innerHTML = detailHTML(card, form);
      el.classList.add('pulse');
      setTimeout(() => el.classList.remove('pulse'), 200);
    },

    log(msg, cls = '') {
      const el = document.createElement('div');
      el.className = 'log-item ' + cls;
      el.innerHTML = msg;
      const log = $('#log');
      log.prepend(el);
      while (log.children.length > 80) log.lastChild.remove();
    },

    toast(msg) {
      const t = $('#toast');
      t.textContent = msg;
      t.classList.add('show');
      clearTimeout(this._tt);
      this._tt = setTimeout(() => t.classList.remove('show'), 2200);
    },

    // ---------- Vẽ bàn chơi ----------
    render() {
      const g = this.game;
      if (!g) return;
      const me = g.players[0];
      this.renderSeats();
      this.renderInfo(me, $('#my-info'), g.current === 0);
      this.renderFixed(me);
      this.renderPiles();
      this.renderHand(me);
      this.renderPhase();
      this.renderSentence();
      this.renderTurnStats();
      this.renderOrder();
      this.renderControls();
    },

    renderSeats() {
      const g = this.game;
      const el = $('#seats');
      el.innerHTML = '';
      el.dataset.n = g.players.length - 1;
      g.players.slice(1).forEach((p) => {
        const idx = g.players.indexOf(p);
        const seat = document.createElement('div');
        seat.className = 'seat' + (g.current === idx ? ' active' : '');
        seat.dataset.idx = idx;
        const backs = Math.min(p.hand.length, 7);
        seat.innerHTML = `
          <div class="seat-top">
            <div class="portrait sm"><img src="${p.avatar}" alt="" /></div>
            <div class="seat-name"><b>${esc(p.name)}</b><small>Rival Scholar</small></div>
            <div class="shield sm" title="Điểm"><span>${p.score}</span></div>
          </div>
          <div class="seat-hand">${Array.from({ length: backs }, () => `<div class="card back tiny">${BACK}</div>`).join('')}<span class="seat-count">${p.hand.length}</span></div>
          <div class="seat-status">${g.current === idx ? (g.phase === 'check' ? '⚖️ đang được đánh giá' : '✍️ đang ghép câu…') : ''}</div>
          <div class="seat-vote"></div>`;
        el.appendChild(seat);
      });
    },

    renderInfo(p, el, active) {
      const g = this.game;
      const tgt = g.cfg.target;
      const gems = tgt ? Array.from({ length: tgt }, (_, i) => `<span class="gem ${i < p.score ? 'on' : ''}"></span>`).join('') : '';
      el.className = 'pinfo' + (active ? ' active' : '') + ' is-me';
      el.innerHTML = `
        <div class="portrait"><img src="${p.avatar}" alt="" /></div>
        <div class="pbody">
          <div class="nameplate"><b>${esc(p.name)}</b><small>Learner</small></div>
          <div class="pstats">
            <div class="shield" title="Điểm câu"><span>${p.score}</span></div>
            <div class="crystals"><span class="crys-num">💠 ${p.score}${tgt ? '/' + tgt : ' điểm'}</span><div class="gems">${gems}</div></div>
          </div>
          <div class="turn-timer" id="my-timer"></div>
        </div>`;
    },

    renderFixed(p) {
      const g = this.game;
      const el = $('#my-fixed');
      el.innerHTML = '';
      p.fixed.forEach((c) => {
        const used = g.current === 0 && g.usedFixed(c.uid);
        const e = cardEl(c, { small: true, used });
        e.addEventListener('click', () => { if (this.canAct()) g.addFixed(p, c.uid); else this.showDetail(c); });
        el.appendChild(e);
      });
    },

    renderPiles() {
      const g = this.game;
      const back = EW.DATA.topics[g.cfg.topic].back;
      $('#piles').innerHTML = `
        <div class="pile deck" title="Bộ bài chung: ${g.deck.length} lá"><div class="card img small"><img src="${back}" alt="" /></div><b class="count">${g.deck.length}</b></div>
        <div class="pile disc" title="Bãi bài: ${g.discard.length} lá"><div class="slot small">♻</div><b class="count">${g.discard.length}</b></div>`;
    },

    renderTurnStats() {
      const g = this.game;
      const me = g.players[0];
      $('#turn-stats').innerHTML = `
        <div class="ts-head">Vòng ${g.round}</div>
        <div class="ts-row" title="Câu được chấp nhận"><span>✔</span><b>${me.stats.accepted}</b></div>
        <div class="ts-row" title="Đánh giá đúng / số lần đánh giá"><span>⚖</span><b>${me.stats.judgedRight}/${me.stats.judged}</b></div>
        <div class="ts-row" title="Số lá trên tay"><span>🂠</span><b>${me.hand.length}</b></div>`;
    },

    renderOrder() {
      const g = this.game;
      $('#turn-order').innerHTML = g.players.map((p, i) => `
        <div class="ord ${g.current === i ? 'cur' : ''}">
          <span class="ord-n">${i + 1}</span><img src="${p.avatar}" alt="" /><span class="ord-name">${esc(p.isAI ? p.name : p.name + ' (bạn)')}</span><b>${p.score}</b>
        </div>`).join('');
    },

    renderHand(me) {
      const g = this.game;
      const el = $('#my-hand');
      el.innerHTML = '';
      const visible = me.hand.filter((c) => !(g.current === 0 && g.inSentence(c.uid)));
      const n = visible.length;
      visible.forEach((c, i) => {
        const e = cardEl(c, {});
        const mid = (n - 1) / 2;
        e.style.setProperty('--rot', ((i - mid) * (n > 7 ? 2 : 3)).toFixed(1) + 'deg');
        e.style.setProperty('--lift', (Math.abs(i - mid) * 3).toFixed(0) + 'px');
        if (!this._seen.has(c.uid)) { e.classList.add('enter'); this._seen.add(c.uid); }
        e.addEventListener('click', () => this.onHandClick(c));
        el.appendChild(e);
      });
      el.classList.toggle('crowded', n > 7);
    },

    renderPhase() {
      const g = this.game;
      const p = g.cur;
      const phases = [['draw', 'DRAW', 'Rút bài'], ['main', 'MAIN', 'Ghép câu'], ['check', 'CHECK', 'Đánh giá'], ['end', 'END', 'Kết thúc']];
      $('#phase-bar').innerHTML = `<span class="whose ${g.current === 0 ? 'me' : 'opp'}">${g.current === 0 ? 'Lượt của bạn' : 'Lượt của ' + esc(p.name)} · ${g.turn}</span>` +
        phases.map(([k, n, vi]) => `<span class="ph ${g.phase === k ? 'on' : ''}"><b>${n}</b><small>${vi}</small></span>`).join('<i>›</i>');
    },

    renderSentence() {
      const g = this.game;
      const zone = $('#sentence-zone');
      zone.innerHTML = '';
      const editable = this.canAct();
      zone.classList.toggle('selecting', !!this.selectMode);
      if (!g.sentence.length) {
        const lanes = [['S', 'Subject'], ['AUX', 'Auxiliary'], ['V', 'Verb'], ['N', 'Noun'], ['A', 'Adj / Adv'], ['T', 'Time']];
        zone.innerHTML = `<div class="lanes">${lanes.map(([k, n]) => `<div class="lane t-${k}"><b>${k}</b><small>${n}</small></div>`).join('')}</div>
          <div class="empty-hint">${g.current === 0 ? 'Chạm vào lá trên tay hoặc lá cố định để ghép câu — thứ tự lane chỉ là gợi ý' : esc(g.cur.name) + ' đang suy nghĩ…'}</div>`;
      }
      g.sentence.forEach((it, i) => {
        const wrap = document.createElement('div');
        wrap.className = 's-item' + (it.src === 'fixed' ? ' fixed-src' : '');
        if (!this._seenS.has(it.uid)) { wrap.classList.add('new'); this._seenS.add(it.uid); }
        if (this._mark && this._mark.includes(i)) wrap.classList.add('err');
        wrap.appendChild(cardEl(it.card, { small: true, form: it.form, forceForm: true }));
        if (editable) {
          wrap.draggable = true;
          wrap.addEventListener('dragstart', (ev) => { ev.dataTransfer.setData('text/plain', String(i)); wrap.classList.add('drag'); });
          wrap.addEventListener('dragend', () => wrap.classList.remove('drag'));
          wrap.addEventListener('dragover', (ev) => { ev.preventDefault(); wrap.classList.add('over'); });
          wrap.addEventListener('dragleave', () => wrap.classList.remove('over'));
          wrap.addEventListener('drop', (ev) => { ev.preventDefault(); g.move(+ev.dataTransfer.getData('text/plain'), i); });
          const ctr = document.createElement('div');
          ctr.className = 's-ctrl';
          ctr.innerHTML = `<button data-a="l" title="Sang trái">◀</button><button data-a="x" title="Bỏ thẻ">✕</button><button data-a="r" title="Sang phải">▶</button>`;
          ctr.onclick = (ev) => {
            const a = ev.target.dataset.a;
            if (a === 'l') g.move(i, i - 1);
            if (a === 'r') g.move(i, i + 1);
            if (a === 'x') g.removeAt(i);
          };
          wrap.appendChild(ctr);
          const opts = G().formOptions(it.card);
          if (opts && opts.length > 1) {
            const sel = document.createElement('select');
            sel.className = 'form-sel t-' + it.card.type;
            sel.title = 'Chọn dạng từ';
            opts.forEach((o) => sel.insertAdjacentHTML('beforeend', `<option value="${o.key}" ${o.key === it.form ? 'selected' : ''}>${esc(o.text)}</option>`));
            sel.onchange = () => g.setForm(i, sel.value);
            wrap.appendChild(sel);
          }
        } else if (this.selectMode) {
          wrap.classList.add('pickable');
          wrap.onclick = () => this.selectMode(i);
        }
        zone.appendChild(wrap);
      });
      const text = G().render(g.sentence);
      $('#sentence-preview').innerHTML = text ? `<span class="quote">“${esc(text)}”</span>` : '';
      const as = $('#assist');
      as.innerHTML = '';
      if (g.cfg.assist && g.current === 0 && g.sentence.length >= 2) {
        const r = G().validate(g.sentence, { rule: g.cfg.rule });
        as.innerHTML = r.ok ? '<span class="ok">✓ Câu hợp lệ – sẵn sàng xác nhận!</span>' : `<span class="warn">💡 ${esc(r.errors[0].vi)}</span>`;
      }
    },

    renderControls() {
      const g = this.game;
      if (!g || !$('#btn-submit')) return;
      const can = this.canAct();
      $('#btn-submit').disabled = !can || !g.sentence.length;
      $('#btn-clear').disabled = !can || !g.sentence.length;
      $('#btn-end').disabled = !can;
      $('#btn-say').disabled = !g.sentence.length;
      document.body.classList.toggle('my-turn', can);
      $('#btn-end').classList.toggle('ready', can);
    },

    // ---------- Tương tác ----------
    async onHandClick(c) {
      const g = this.game;
      this.showDetail(c);
      if (!this.canAct()) return;
      const me = g.players[0];
      if (c.type === 'ACTION') {
        const a = EW.DATA.actions[c.action];
        const box = document.createElement('div');
        box.className = 'act-preview';
        box.appendChild(cardEl(c));
        box.insertAdjacentHTML('beforeend', `<p>${esc(a.desc)}</p>`);
        const ok = await modal({ title: `${a.glyph} ${a.name}`, body: box, buttons: [{ label: 'Hủy', value: false, cls: 'ghost' }, { label: 'Dùng lá này', value: true, cls: 'primary' }], closable: true });
        if (ok) await g.activate(me, c.uid);
        return;
      }
      if (c.type === 'ADDWORD') {
        const w = await this.pickWord();
        if (w) g.addWord(me, c.uid, w);
        return;
      }
      g.addHand(me, c.uid);
    },

    pickWord() {
      const bank = EW.Deck.wordBank(this.game.cfg);
      const seen = new Set();
      const words = bank.filter((w) => (seen.has(w.type + w.word) ? false : seen.add(w.type + w.word)));
      const box = document.createElement('div');
      box.innerHTML = `<p class="muted">Addword thay thế bất cứ lá bài nào bạn muốn dùng: chọn 1 từ.</p><input class="aw-search" placeholder="Tìm từ…" /><div class="chips aw-types"></div><div class="aw-grid"></div>`;
      let type = 'V';
      const types = ['S', 'V', 'N', 'A', 'T', 'AUX'].concat(this.game.cfg.allowL ? ['L'] : []);
      return modal({
        title: '✚ Addword', body: box, wide: true, closable: true,
        buttons: [{ label: 'Hủy', value: null, cls: 'ghost' }],
        onOpen: (b, close) => {
          const grid = b.querySelector('.aw-grid');
          const input = b.querySelector('.aw-search');
          const chips = b.querySelector('.aw-types');
          types.forEach((t) => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'chip' + (t === type ? ' on' : '');
            chip.textContent = TI()[t].glyph + ' ' + TI()[t].name;
            chip.onclick = () => { type = t; chips.querySelectorAll('.chip').forEach((x) => x.classList.remove('on')); chip.classList.add('on'); draw(); };
            chips.appendChild(chip);
          });
          const draw = () => {
            const qv = input.value.trim().toLowerCase();
            grid.innerHTML = '';
            words.filter((w) => w.type === type && (!qv || w.word.toLowerCase().includes(qv) || (w.vi || '').toLowerCase().includes(qv))).forEach((w) => {
              const e = cardEl(w, { small: true });
              e.onclick = () => close(w);
              grid.appendChild(e);
            });
          };
          input.oninput = draw;
          draw();
        },
      });
    },

    chooseCard(title, cards) {
      const box = document.createElement('div');
      box.className = 'choose-grid';
      return modal({
        title, body: box, wide: true, buttons: [{ label: 'Hủy', value: null, cls: 'ghost' }],
        onOpen: (b, close) => cards.forEach((c) => { const e = cardEl(c, { small: true }); e.onclick = () => close(c.uid); box.appendChild(e); }),
      });
    },

    choosePlayer(title, players) {
      const box = document.createElement('div');
      box.className = 'choose-players';
      return modal({
        title, body: box, buttons: [{ label: 'Hủy', value: null, cls: 'ghost' }],
        onOpen: (b, close) => players.forEach((p) => {
          const btn = document.createElement('button');
          btn.className = 'player-pick';
          btn.innerHTML = `<img src="${p.avatar}" alt="" /><b>${esc(p.name)}</b><small>${p.hand.length} lá · ${p.score} điểm</small>`;
          btn.onclick = () => close(p);
          box.appendChild(btn);
        }),
      });
    },

    confirm(title, html, yes = 'Đồng ý', no = 'Hủy') {
      return modal({ title, body: html, buttons: [{ label: no, value: false, cls: 'ghost' }, { label: yes, value: true, cls: 'primary' }] });
    },

    // ---------- Hiệu ứng ----------
    async banner(text, sub) {
      const b = $('#banner');
      b.innerHTML = `<div class="b-inner"><div class="b-text">${esc(text)}</div><div class="b-sub">${sub || ''}</div></div>`;
      b.classList.remove('show');
      void b.offsetWidth;
      b.classList.add('show');
      this.sfx('banner');
      await wait(this.game && this.game.cfg.aiSpeed === 'fast' && this.game.current !== 0 ? 700 : 1150);
      b.classList.remove('show');
    },

    async announceFirst(p) {
      const fx = $('#fx');
      fx.innerHTML = `<div class="coin-wrap"><div class="first-pick">${this.game.players.map((x) => `<img src="${x.avatar}" alt="" data-n="${esc(x.name)}" />`).join('')}</div><div class="coin-txt"></div></div>`;
      fx.classList.add('show');
      const imgs = [...fx.querySelectorAll('.first-pick img')];
      for (let k = 0; k < 14; k++) { imgs.forEach((im, j) => im.classList.toggle('on', j === k % imgs.length)); await wait(90); }
      imgs.forEach((im) => im.classList.toggle('on', im.dataset.n === p.name));
      fx.querySelector('.coin-txt').textContent = `${p.isAI ? p.name : 'Bạn'} rút bài trước!`;
      this.sfx('banner');
      await wait(1300);
      fx.classList.remove('show');
      fx.innerHTML = '';
    },

    async activationFx(card) {
      const fx = $('#fx');
      fx.innerHTML = '';
      const e = cardEl(card);
      e.classList.add('activate-fx');
      fx.appendChild(e);
      fx.classList.add('show');
      await wait(this.game.cfg.aiSpeed === 'fast' && this.game.current !== 0 ? 500 : 900);
      fx.classList.remove('show');
      fx.innerHTML = '';
    },

    // ---------- Hẹn giờ ----------
    startTurnTimer() {
      this.stopTurnTimer();
      const g = this.game;
      const total = +g.cfg.turnTime;
      if (!total || g.current !== 0) return;
      let left = total;
      const tick = () => {
        const el = $('#my-timer');
        if (el) el.innerHTML = `<span class="${left <= 15 ? 'low' : ''}">⏳ ${left}s</span>`;
        if (left <= 0) {
          this.stopTurnTimer();
          if (this.myTurn()) {
            this.toast('Hết giờ lượt!');
            g.log('⏳ Hết thời gian lượt của bạn.', 'sys');
            if (this.busy === 0) g.endTurn();
          }
          return;
        }
        left--;
      };
      tick();
      this._turnT = setInterval(tick, 1000);
    },
    stopTurnTimer() { clearInterval(this._turnT); const el = $('#my-timer'); if (el) el.innerHTML = ''; },
    startMatchTimer() {
      this.stopMatchTimer();
      const g = this.game;
      const el = $('#match-timer');
      if (!+g.cfg.matchTime) { el.innerHTML = '∞ Không giới hạn thời gian'; return; }
      const end = Date.now() + g.cfg.matchTime * 1000;
      const tick = () => {
        const left = Math.max(0, Math.round((end - Date.now()) / 1000));
        el.innerHTML = `⌛ ${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
        el.classList.toggle('low', left < 60);
        if (left <= 0 && !g.timeUp) {
          g.timeUp = true;
          this.stopMatchTimer();
          el.innerHTML = '⌛ Hết giờ – trận kết thúc sau lượt này';
          g.log('⌛ Hết thời gian cố định. Trận đấu kết thúc sau lượt hiện tại.', 'sys');
        }
      };
      tick();
      this._matchT = setInterval(tick, 1000);
    },
    stopMatchTimer() { clearInterval(this._matchT); },

    // ---------- Đánh giá câu ----------
    errorList(res, items) {
      const cats = G().ERROR_CATS;
      const fix = res.ok ? null : G().suggestFix(items, { rule: this.game.cfg.rule });
      return `<ul class="err-list">${res.errors.map((e) => `<li><span class="cat c-${e.code}">${cats[e.code]}</span> ${esc(e.vi)}</li>`).join('')}</ul>` +
        (fix ? `<div class="fix">💡 Gợi ý sửa: <b>${esc(fix)}</b> <button class="say" data-say="${esc(fix)}">🔊</button></div>` : '');
    },

    /** Người chơi đánh giá câu của người khác: Đúng / Sai (+ chỉ thẻ sai) */
    votePrompt(res, items, submitter) {
      return new Promise((resolve) => {
        const panel = $('#prompt-panel');
        let left = 40;
        let timer = null;
        const done = (v) => { clearInterval(timer); this.selectMode = null; panel.classList.remove('show'); panel.innerHTML = ''; this.renderSentence(); resolve(v); };
        const main = () => {
          panel.innerHTML = `
            <div class="pp-title">⚖️ Đánh giá câu của ${esc(submitter.name)}</div>
            <div class="pp-sentence">“${esc(res.text)}” <button class="say" data-say="${esc(res.text)}">🔊</button></div>
            <p>Câu này <b>đúng ngữ pháp</b> và <b>đúng nghĩa</b> chưa? Luật: <b>${esc(EW.DATA.RULES[this.game.cfg.rule].name)}</b>.</p>
            <div class="pp-btns"><button class="btn confirm" data-v="ok">✔ Đúng</button><button class="btn danger" data-v="bad">✘ Sai</button></div>
            <div class="pp-timer"></div>`;
          panel.querySelector('[data-v=ok]').onclick = () => done({ ok: true });
          panel.querySelector('[data-v=bad]').onclick = pickMode;
        };
        const pickMode = () => {
          panel.innerHTML = `<div class="pp-title">🎯 Thẻ nào sai?</div><p>Chạm vào thẻ bạn cho là sai trong Sentence Zone, hoặc bỏ qua bước này.</p>
            <div class="pp-btns"><button class="btn ghost" data-v="back">← Quay lại</button><button class="btn" data-v="skip">Bỏ qua, chỉ chọn Sai</button></div><div class="pp-timer"></div>`;
          panel.querySelector('[data-v=back]').onclick = () => { this.selectMode = null; this.renderSentence(); main(); };
          panel.querySelector('[data-v=skip]').onclick = () => done({ ok: false });
          this.selectMode = (i) => done({ ok: false, index: i });
          this.renderSentence();
        };
        main();
        panel.classList.add('show');
        const tick = () => {
          const t = panel.querySelector('.pp-timer');
          if (t) t.textContent = `Tự động chọn “Đúng” sau ${left}s`;
          if (left-- <= 0) done({ ok: true });
        };
        tick();
        timer = setInterval(tick, 1000);
      });
    },

    async showVerdict({ res, items, votes, yes, no, accepted, tie, submitter, points }) {
      this._mark = res.errors.flatMap((e) => e.at);
      this.renderSentence();
      // phiếu hiện trên từng ghế
      votes.forEach((v) => {
        const idx = this.game.players.indexOf(v.player);
        const seat = document.querySelector(`.seat[data-idx="${idx}"] .seat-vote`);
        if (seat) seat.innerHTML = `<span class="vote ${v.ok ? 'yes' : 'no'}">${v.ok ? '✔ Đúng' : '✘ Sai'}</span>`;
      });
      if (accepted) {
        const z = $('#sentence-zone');
        z.classList.add('success');
        await wait(650);
        z.classList.remove('success');
      }
      const me = this.game.players[0];
      const isMe = submitter === me;
      const myVote = votes.find((v) => v.player === me);
      const voteList = votes.map((v) => `<div class="vchip ${v.ok ? 'yes' : 'no'}"><img src="${v.player.avatar}" alt="" />${esc(v.player.isAI ? v.player.name : 'Bạn')}<b>${v.ok ? '✔' : '✘'}</b></div>`).join('');
      let note = '';
      if (accepted && !res.ok) note = '<p class="note bad">👀 Câu có lỗi nhưng đa số đã chấp nhận. Cả nhóm cùng xem lại lỗi bên dưới nhé!</p>';
      if (!accepted && res.ok) note = '<p class="note">🤔 Câu này thực ra đúng nhưng đa số đánh giá sai.</p>';
      if (tie) note += '<p class="note">⚖️ Hòa phiếu: quản trò quyết định.</p>';
      let mine = '';
      if (myVote) mine = myVote.ok === res.ok ? '<p class="note good">🎯 Bạn đánh giá chính xác!</p>' : '<p class="note bad">Bạn đánh giá chưa chính xác.</p>';
      const gm = res.ok
        ? `<div class="gm-say ok">🎙️ Quản trò: câu <b>đúng</b> ngữ pháp và luật đặt câu.</div>`
        : `<div class="gm-say bad">🎙️ Quản trò nhận xét:</div>${this.errorList(res, items)}`;
      const html = `
        <div class="big-sentence ${res.ok ? '' : 'bad'}">${esc(res.text)} <button class="say" data-say="${esc(res.text)}">🔊</button></div>
        <div class="votes"><span class="tally">${yes} ✔ / ${no} ✘</span>${voteList}</div>
        <div class="verdict ${accepted ? 'ok' : 'bad'}">${accepted ? `✔ ĐƯỢC CHẤP NHẬN · ${isMe ? 'Bạn' : esc(submitter.name)} +${points}` : '✘ KHÔNG ĐƯỢC CHẤP NHẬN'}</div>
        ${note}${mine}${gm}`;
      await modal({ title: `Kết quả đánh giá · ${isMe ? 'câu của bạn' : 'câu của ' + esc(submitter.name)}`, body: html, wide: true, cls: accepted ? 'm-ok' : 'm-bad', buttons: [{ label: 'Tiếp tục', value: true, cls: 'primary' }], autoClose: isMe || myVote ? 15 : 8 });
      this._mark = null;
      document.querySelectorAll('.seat-vote').forEach((x) => (x.innerHTML = ''));
    },

    async speakCheck(text) {
      const body = `<p>Đọc to câu của bạn:</p><div class="big-sentence">${esc(text)} <button class="say" data-say="${esc(text)}">🔊</button></div>`;
      const v = await modal({ title: '🎤 Luyện nói', body, buttons: [{ label: 'Bỏ qua', value: null, cls: 'ghost' }, { label: '🎤 Bắt đầu nói', value: 'listen', cls: 'primary' }] });
      if (v !== 'listen') return null;
      this.toast('Đang nghe… hãy đọc câu');
      const heard = await EW.Speech.listen();
      const score = EW.Speech.similarity(text, heard || '');
      const pct = Math.round(score * 100);
      await modal({
        title: '🎤 Kết quả luyện nói',
        body: `<p>Máy nghe được: <i>${esc((heard || '(không nghe rõ)').split('||')[0])}</i></p><div class="verdict ${pct >= 70 ? 'ok' : 'bad'}">Độ khớp: ${pct}%</div><p class="muted">${pct >= 70 ? 'Phát âm tốt!' : 'Nghe mẫu và thử lại ở lượt sau nhé.'}</p>`,
      });
      return score;
    },

    showResult(game) { EW.App.showResult(game); },
  };

  // Nút 🔊 ở mọi nơi
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-say]');
    if (b) { e.stopPropagation(); EW.Speech.say(b.dataset.say); }
  });

  EW.UI = UI;
})();
