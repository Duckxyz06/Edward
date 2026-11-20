/* EdWords – Sentence Battle · Giao diện sân đấu */
(function () {
  const EW = (window.EW = window.EW || {});
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const TI = () => EW.DATA.TYPE_INFO;
  const A_KIND = { adj: 'Tính từ', adv: 'Trạng từ', place: 'Nơi chốn' };
  const TIPS = `<div class="tips"><div class="tips-title">💡 Mẹo nhanh</div>
    <p><b>Câu cơ bản:</b> S + V (+ N) (+ A) (+ T)</p>
    <p><b>Có trợ động từ:</b> S + AUX + V</p>
    <ul>
      <li>will / can / do / did → V nguyên mẫu</li>
      <li>am / is / are → V-ing</li>
      <li>have / has → V3</li>
      <li>he / she / Nam + V-s (hiện tại đơn)</li>
      <li>always, often… đứng trước V thường, sau to be</li>
      <li>yesterday → V2; tomorrow → will + V</li>
    </ul>
    <p class="muted">Rê chuột / chạm vào thẻ để xem nghĩa, dạng từ và cách dùng.</p></div>`;

  function cardTitle(card) {
    if (card.type === 'ACTION') return EW.DATA.actions[card.action].en;
    if (card.type === 'A') return A_KIND[card.kind];
    if (card.type === 'T') return card.pos === 'mid' ? 'Tần suất' : 'Thời gian';
    return TI()[card.type].name;
  }

  function cardEl(card, o = {}) {
    const el = document.createElement('div');
    if (o.faceDown) {
      el.className = 'card back' + (o.small ? ' small' : '') + (o.tiny ? ' tiny' : '');
      el.innerHTML = '<div class="back-logo">Ed<span>Words</span></div>';
      return el;
    }
    const t = card.type;
    let glyph = TI()[t].glyph, word = card.word, sub = card.vi;
    if (t === 'ACTION') { const a = EW.DATA.actions[card.action]; glyph = a.glyph; word = a.name; sub = a.desc; }
    if (t === 'V' && o.form) word = card.forms[o.form];
    el.className = `card t-${t}` + (o.small ? ' small' : '') + (o.tiny ? ' tiny' : '') + (card.fromAddword ? ' from-aw' : '') + (o.cls ? ' ' + o.cls : '');
    el.dataset.uid = card.uid || '';
    const badge = t === 'ACTION' ? '★' : t === 'ADDWORD' ? '✚' : t;
    el.innerHTML = `
      <div class="c-head"><span class="c-type">${badge}</span><span class="c-title">${esc(cardTitle(card))}</span></div>
      <div class="c-art"><span>${glyph}</span></div>
      <div class="c-word">${esc(word)}</div>
      <div class="c-vi">${esc(sub)}</div>`;
    if (o.locked) el.insertAdjacentHTML('beforeend', '<div class="lock-ov">🔒</div>');
    if (o.used) el.classList.add('used');
    el.addEventListener('mouseenter', () => UI.showDetail(card, o.form));
    return el;
  }

  function detailHTML(card, form) {
    const t = card.type;
    const ti = TI()[t];
    let body = '';
    if (t === 'V') {
      const f = card.forms;
      body += `<table class="forms">${EW.Grammar.FORM_KEYS.map((k) => `<tr class="${k === form ? 'cur' : ''}"><th>${EW.Grammar.FORM_LABEL[k]}</th><td>${esc(f[k])}</td><td><button class="say" data-say="${esc(f[k])}">🔊</button></td></tr>`).join('')}</table>`;
      const objTxt = { none: 'Không cần tân ngữ (vd: I sleep.)', opt: 'Có thể có tân ngữ phía sau.', req: 'Bắt buộc có danh từ (N) phía sau.', adj: 'Theo sau là TÍNH TỪ (vd: feel happy).' }[card.obj];
      body += `<p class="hint">📌 ${objTxt}</p>`;
    }
    if (t === 'AUX') {
      const need = card.kind === 'have' ? 'V3' : card.kind === 'be' ? 'V-ing / tính từ / danh từ / V3 (bị động)' : 'V nguyên mẫu';
      body += `<p class="hint">📌 Đi với: <b>${card.persons.map((p) => ({ '1s': 'I', '2': 'you', '3s': 'he/she/it', '1p': 'we', '3p': 'they' }[p])).join(', ')}</b><br>📌 Theo sau: <b>${need}</b></p>`;
    }
    if (t === 'T') body += `<p class="hint">📌 Nhóm: <b>${EW.Grammar.TTAG_VI[card.tag]}</b><br>📌 Vị trí: ${card.pos === 'mid' ? 'trước động từ thường, sau to be / trợ động từ' : 'đầu hoặc cuối câu'}</p>`;
    if (t === 'A') body += `<p class="hint">📌 ${{ adj: 'Tính từ: đứng trước danh từ hoặc sau to be / feel / look.', adv: 'Trạng từ cách thức: đứng sau động từ (và tân ngữ).', place: 'Trạng ngữ nơi chốn: đứng cuối câu hoặc sau to be.' }[card.kind]}</p>`;
    if (t === 'N') body += `<p class="hint">📌 ${card.number === '3p' ? 'Số nhiều → dùng như “they”.' : 'Số ít / không đếm được → dùng như “he/she/it”.'}</p>`;
    if (t === 'S') body += `<p class="hint">📌 Ngôi: <b>${{ '1s': 'thứ nhất số ít', '2': 'thứ hai', '3s': 'thứ ba số ít', '1p': 'thứ nhất số nhiều', '3p': 'thứ ba số nhiều' }[card.person]}</b></p>`;
    const word = t === 'ACTION' ? EW.DATA.actions[card.action].name : t === 'V' && form ? card.forms[form] : card.word;
    const canSay = !['ACTION', 'ADDWORD'].includes(t);
    return `
      <div class="d-type t-${t}">${ti.glyph} ${esc(ti.name)} <small>${esc(ti.en)}</small></div>
      <div class="d-word">${esc(word)} ${canSay ? `<button class="say" data-say="${esc(word)}">🔊</button>` : ''}</div>
      <div class="d-vi">${esc(card.vi)}</div>
      ${body}`;
  }

  // ---------- Modal ----------
  function modal({ title, body, buttons = [{ label: 'OK', value: true, cls: 'primary' }], wide, cls, onOpen, closable }) {
    return new Promise((resolve) => {
      const root = $('#modal-root');
      const ov = document.createElement('div');
      ov.className = 'modal-ov';
      const box = document.createElement('div');
      box.className = 'modal' + (wide ? ' wide' : '') + (cls ? ' ' + cls : '');
      box.innerHTML = `${title ? `<div class="m-title">${title}</div>` : ''}<div class="m-body"></div><div class="m-btns"></div>`;
      const mb = box.querySelector('.m-body');
      if (typeof body === 'string') mb.innerHTML = body; else if (body) mb.appendChild(body);
      const close = (v) => { ov.classList.add('out'); setTimeout(() => ov.remove(), 180); UI.busy--; UI.renderControls(); resolve(v); };
      buttons.forEach((b) => {
        const btn = document.createElement('button');
        btn.className = 'btn ' + (b.cls || '');
        btn.innerHTML = b.label;
        btn.onclick = () => close(typeof b.value === 'function' ? b.value() : b.value);
        box.querySelector('.m-btns').appendChild(btn);
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
    duel: null,
    busy: 0,
    selectMode: null,
    cardEl,
    detailHTML,
    modal,
    esc,

    bind(duel) {
      this.duel = duel;
      this.busy = 0;
      this.selectMode = null;
      $('#log').innerHTML = '';
      $('#prompt-panel').innerHTML = '';
      $('#prompt-panel').classList.remove('show');
      $('#detail').innerHTML = TIPS;
      this._seenS = new Set();
      this.startMatchTimer();
    },

    sfx(n) { EW.sfx(n); },
    myTurn() { const d = this.duel; return d && !d.over && d.current === 0 && d.phase === 'main' && !d.flags.submitted; },
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

    // ---------- Vẽ sân ----------
    render() {
      const d = this.duel;
      if (!d) return;
      const [me, op] = d.players;
      // tay đối thủ
      const oh = $('#opp-hand');
      oh.innerHTML = '';
      op.hand.forEach((c) => { if (!(d.current === 1 && d.inSentence(c.uid))) oh.appendChild(cardEl(c, { faceDown: true, tiny: true })); });
      // thẻ cố định
      this.renderFixed(op, $('#opp-fixed'), false);
      this.renderFixed(me, $('#my-fixed'), true);
      this.renderSet(op, $('#opp-set'), false);
      this.renderSet(me, $('#my-set'), true);
      this.renderInfo(op, $('#opp-info'), d.current === 1);
      this.renderInfo(me, $('#my-info'), d.current === 0);
      this.renderPiles(op, $('#opp-piles'));
      this.renderPiles(me, $('#my-piles'));
      this.renderHand(me);
      this.renderPhase();
      this.renderSentence();
      this.renderControls();
    },

    renderFixed(p, el, mine) {
      const d = this.duel;
      el.innerHTML = '';
      const active = d.players[d.current] === p;
      p.fixed.forEach((c) => {
        const locked = (active && p.locked === c.uid) || p.pendingLock === c.uid;
        const used = active && d.usedFixed(c.uid);
        const e = cardEl(c, { small: true, locked, used });
        if (mine) e.addEventListener('click', () => { if (this.canAct()) d.addFixed(p, c.uid); else this.showDetail(c); });
        else e.addEventListener('click', () => this.showDetail(c));
        el.appendChild(e);
      });
    },

    renderSet(p, el, mine) {
      el.innerHTML = '';
      for (let i = 0; i < 2; i++) {
        const c = p.set[i];
        if (c) {
          const e = cardEl(c, { faceDown: !mine, small: true, cls: mine ? 'set-mine' : '' });
          el.appendChild(e);
        } else el.insertAdjacentHTML('beforeend', '<div class="slot small"></div>');
      }
    },

    renderInfo(p, el, active) {
      const d = this.duel;
      const pips = Array.from({ length: d.cfg.target }, (_, i) => `<span class="pip ${i < p.score ? 'on' : ''}"></span>`).join('');
      el.className = 'pinfo' + (active ? ' active' : '');
      el.innerHTML = `
        <div class="avatar">${p.isAI ? '🤖' : '🎓'}</div>
        <div class="pname">${esc(p.name)}</div>
        <div class="score"><span class="score-num">${p.score}</span><span class="score-max">/ ${d.cfg.target}</span></div>
        <div class="pips">${pips}</div>
        <div class="turn-timer" id="${p.isAI ? 'opp' : 'my'}-timer"></div>`;
    },

    renderPiles(p, el) {
      el.innerHTML = `
        <div class="pile deck" title="Bộ bài"><div class="card back small"><div class="back-logo">Ed<span>Words</span></div></div><b>${p.deck.length}</b></div>
        <div class="pile disc" title="Bãi bài"><div class="slot small">${p.discard.length ? '🗑️' : ''}</div><b>${p.discard.length}</b></div>`;
    },

    renderHand(me) {
      const d = this.duel;
      const el = $('#my-hand');
      el.innerHTML = '';
      const visible = me.hand.filter((c) => !(d.current === 0 && d.inSentence(c.uid)));
      const n = visible.length;
      visible.forEach((c, i) => {
        const e = cardEl(c, {});
        const mid = (n - 1) / 2;
        e.style.setProperty('--rot', ((i - mid) * 3).toFixed(1) + 'deg');
        e.style.setProperty('--lift', (Math.abs(i - mid) * 4).toFixed(0) + 'px');
        if (!this._seen) this._seen = new Set();
        if (!this._seen.has(c.uid)) { e.classList.add('enter'); this._seen.add(c.uid); }
        e.addEventListener('click', () => this.onHandClick(c));
        el.appendChild(e);
      });
    },

    renderPhase() {
      const d = this.duel;
      const phases = [['draw', 'DRAW', 'Rút bài'], ['main', 'MAIN', 'Ghép câu'], ['check', 'CHECK', 'Chấm câu'], ['end', 'END', 'Kết thúc']];
      $('#phase-bar').innerHTML = `<span class="whose ${d.current === 0 ? 'me' : 'opp'}">${d.current === 0 ? 'Lượt của bạn' : 'Lượt đối thủ'} · ${d.turn}</span>` +
        phases.map(([k, n, vi]) => `<span class="ph ${d.phase === k ? 'on' : ''}"><b>${n}</b><small>${vi}</small></span>`).join('<i>›</i>') +
        (d.flags && d.flags.combo ? '<span class="combo-tag">✖️2 Combo</span>' : '');
    },

    renderSentence() {
      const d = this.duel;
      const zone = $('#sentence-zone');
      zone.innerHTML = '';
      const editable = this.canAct();
      zone.classList.toggle('selecting', !!this.selectMode);
      if (!d.sentence.length) {
        zone.innerHTML = `<div class="empty-hint">${d.current === 0 ? 'Chạm vào thẻ trên tay hoặc thẻ cố định để ghép câu' : 'Đối thủ đang suy nghĩ…'}</div>`;
      }
      d.sentence.forEach((it, i) => {
        const wrap = document.createElement('div');
        wrap.className = 's-item' + (it.src === 'fixed' ? ' fixed-src' : '');
        if (!this._seenS) this._seenS = new Set();
        if (!this._seenS.has(it.uid)) { wrap.classList.add('new'); this._seenS.add(it.uid); }
        if (this._mark && this._mark.includes(i)) wrap.classList.add('err');
        const e = cardEl(it.card, { small: true, form: it.form });
        wrap.appendChild(e);
        if (editable) {
          wrap.draggable = true;
          wrap.addEventListener('dragstart', (ev) => { ev.dataTransfer.setData('text/plain', String(i)); wrap.classList.add('drag'); });
          wrap.addEventListener('dragend', () => wrap.classList.remove('drag'));
          wrap.addEventListener('dragover', (ev) => { ev.preventDefault(); wrap.classList.add('over'); });
          wrap.addEventListener('dragleave', () => wrap.classList.remove('over'));
          wrap.addEventListener('drop', (ev) => { ev.preventDefault(); const from = +ev.dataTransfer.getData('text/plain'); d.move(from, i); });
          const ctr = document.createElement('div');
          ctr.className = 's-ctrl';
          ctr.innerHTML = `<button data-a="l" title="Sang trái">◀</button><button data-a="x" title="Bỏ thẻ">✕</button><button data-a="r" title="Sang phải">▶</button>`;
          ctr.onclick = (ev) => {
            const a = ev.target.dataset.a;
            if (a === 'l') d.move(i, i - 1);
            if (a === 'r') d.move(i, i + 1);
            if (a === 'x') d.removeAt(i);
          };
          wrap.appendChild(ctr);
          if (it.card.type === 'V') {
            const sel = document.createElement('select');
            sel.className = 'form-sel';
            sel.title = 'Chọn dạng động từ';
            const seen = new Set();
            EW.Grammar.FORM_KEYS.forEach((k) => {
              const txt = it.card.forms[k];
              if (seen.has(txt) && k !== it.form) return;
              seen.add(txt);
              sel.insertAdjacentHTML('beforeend', `<option value="${k}" ${k === it.form ? 'selected' : ''}>${esc(txt)} · ${EW.Grammar.FORM_LABEL[k].split(' ')[0]}</option>`);
            });
            sel.onchange = () => d.setForm(i, sel.value);
            wrap.appendChild(sel);
          }
        } else if (this.selectMode) {
          wrap.classList.add('pickable');
          wrap.onclick = () => this.selectMode(i);
        }
        zone.appendChild(wrap);
      });
      const text = EW.Grammar.render(d.sentence);
      $('#sentence-preview').innerHTML = text ? `<span class="quote">“${esc(text)}”</span>` : '';
      const as = $('#assist');
      as.innerHTML = '';
      if (d.cfg.assist && d.current === 0 && d.sentence.length >= 2) {
        const r = EW.Grammar.validate(d.sentence);
        as.innerHTML = r.ok ? '<span class="ok">✓ Câu hợp lệ – sẵn sàng xác nhận!</span>' : `<span class="warn">💡 ${esc(r.errors[0].vi)}</span>`;
      }
    },

    renderControls() {
      const d = this.duel;
      if (!d) return;
      const can = this.canAct();
      $('#btn-submit').disabled = !can || !d.sentence.length;
      $('#btn-clear').disabled = !can || !d.sentence.length;
      $('#btn-end').disabled = !can;
      $('#btn-say').disabled = !d.sentence.length;
      document.body.classList.toggle('my-turn', can);
    },

    // ---------- Tương tác ----------
    async onHandClick(c) {
      const d = this.duel;
      this.showDetail(c);
      if (!this.canAct()) return;
      const me = d.players[0];
      if (c.type === 'ACTION') {
        const a = EW.DATA.actions[c.action];
        const box = document.createElement('div');
        box.className = 'act-preview';
        box.appendChild(cardEl(c));
        box.insertAdjacentHTML('beforeend', `<p>${esc(a.desc)}</p>`);
        const ok = await modal({ title: `${a.glyph} ${a.name} <small>${a.en}</small>`, body: box, buttons: [{ label: 'Hủy', value: false, cls: 'ghost' }, { label: a.set ? 'Úp xuống sân' : 'Kích hoạt', value: true, cls: 'primary' }], closable: true });
        if (!ok) return;
        if (a.set) return d.setShield(me, c.uid);
        return d.activate(me, c.uid);
      }
      if (c.type === 'ADDWORD') {
        const w = await this.pickWord();
        if (w) d.addWord(me, c.uid, w);
        return;
      }
      d.addHand(me, c.uid);
    },

    pickWord() {
      const bank = EW.Deck.wordBank(this.duel.cfg);
      const seen = new Set();
      const words = bank.filter((w) => (seen.has(w.type + w.word) ? false : seen.add(w.type + w.word)));
      const box = document.createElement('div');
      box.innerHTML = `<input class="aw-search" placeholder="Tìm từ…" /><div class="chips aw-types"></div><div class="aw-grid"></div>`;
      let type = 'V';
      return modal({
        title: '✚ Addword – chọn 1 từ từ ngân hàng',
        body: box, wide: true, closable: true,
        buttons: [{ label: 'Hủy', value: null, cls: 'ghost' }],
        onOpen: (b, close) => {
          const grid = b.querySelector('.aw-grid');
          const input = b.querySelector('.aw-search');
          const types = b.querySelector('.aw-types');
          ['S', 'V', 'N', 'A', 'T', 'AUX'].forEach((t) => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'chip' + (t === type ? ' on' : '');
            chip.textContent = TI()[t].glyph + ' ' + t;
            chip.onclick = () => { type = t; types.querySelectorAll('.chip').forEach((x) => x.classList.remove('on')); chip.classList.add('on'); draw(); };
            types.appendChild(chip);
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

    chooseMany(title, cards) {
      const box = document.createElement('div');
      box.className = 'choose-grid';
      const sel = new Set();
      return modal({
        title, body: box, wide: true,
        buttons: [{ label: 'Xác nhận', value: () => [...sel], cls: 'primary' }],
        onOpen: () => cards.forEach((c) => {
          const e = cardEl(c, { small: true });
          e.onclick = () => { if (sel.has(c.uid)) sel.delete(c.uid); else sel.add(c.uid); e.classList.toggle('picked'); };
          box.appendChild(e);
        }),
      });
    },

    confirm(title, html, yes = 'Đồng ý', no = 'Hủy') {
      return modal({ title, body: html, buttons: [{ label: no, value: false, cls: 'ghost' }, { label: yes, value: true, cls: 'primary' }] });
    },

    // ---------- Hiệu ứng ----------
    async banner(text, sub) {
      const b = $('#banner');
      b.innerHTML = `<div class="b-inner"><div class="b-text">${text}</div><div class="b-sub">${sub || ''}</div></div>`;
      b.classList.remove('show');
      void b.offsetWidth;
      b.classList.add('show');
      this.sfx('banner');
      await wait(1150);
      b.classList.remove('show');
    },

    async coinToss(meFirst) {
      const fx = $('#fx');
      fx.innerHTML = `<div class="coin-wrap"><div class="coin spin">🪙</div><div class="coin-txt"></div></div>`;
      fx.classList.add('show');
      await wait(1300);
      fx.querySelector('.coin').classList.remove('spin');
      fx.querySelector('.coin-txt').textContent = meFirst ? 'Bạn đi trước!' : 'Đối thủ đi trước!';
      this.sfx('banner');
      await wait(1100);
      fx.classList.remove('show');
      fx.innerHTML = '';
    },

    async activationFx(card, isAI) {
      const fx = $('#fx');
      fx.innerHTML = '';
      const e = cardEl(card);
      e.classList.add('activate-fx');
      fx.appendChild(e);
      fx.classList.add('show', isAI ? 'from-top' : 'from-bottom');
      await wait(900);
      fx.classList.remove('show', 'from-top', 'from-bottom');
      fx.innerHTML = '';
    },

    async chainFx() {
      const fx = $('#fx');
      fx.innerHTML = '<div class="chain-fx">⛓️<span>CHAIN · LÁ CHẮN</span></div>';
      fx.classList.add('show');
      await wait(900);
      fx.classList.remove('show');
      fx.innerHTML = '';
    },

    // ---------- Hẹn giờ ----------
    startTurnTimer() {
      this.stopTurnTimer();
      const d = this.duel;
      const total = +d.cfg.turnTime;
      if (!total || d.current !== 0) return;
      let left = total;
      const tick = () => {
        const el = $('#my-timer');
        if (el) el.innerHTML = `<span class="${left <= 15 ? 'low' : ''}">⏳ ${left}s</span>`;
        if (left <= 0) {
          this.stopTurnTimer();
          if (this.myTurn()) {
            this.toast('Hết giờ lượt!');
            d.log('⏳ Hết thời gian lượt.', 'sys');
            if (this.busy === 0) d.endTurn();
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
      const d = this.duel;
      const el = $('#match-timer');
      if (!+d.cfg.matchTime) { el.innerHTML = '∞ Không giới hạn thời gian'; return; }
      const end = Date.now() + d.cfg.matchTime * 1000;
      const tick = () => {
        const left = Math.max(0, Math.round((end - Date.now()) / 1000));
        el.innerHTML = `⌛ ${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
        el.classList.toggle('low', left < 60);
        if (left <= 0 && !d.timeUp) {
          d.timeUp = true;
          this.stopMatchTimer();
          el.innerHTML = '⌛ Hết giờ – trận kết thúc sau lượt này';
          d.log('⌛ Hết thời gian trận. Trận đấu kết thúc sau lượt hiện tại.', 'sys');
        }
      };
      tick();
      this._matchT = setInterval(tick, 1000);
    },
    stopMatchTimer() { clearInterval(this._matchT); },

    // ---------- Chấm câu ----------
    errorList(res, items) {
      const cats = EW.Grammar.ERROR_CATS;
      const fix = res.ok ? null : EW.Grammar.suggestFix(items);
      return `<ul class="err-list">${res.errors.map((e) => `<li><span class="cat c-${e.code}">${cats[e.code]}</span> ${esc(e.vi)}</li>`).join('')}</ul>` +
        (fix ? `<div class="fix">💡 Gợi ý sửa: <b>${esc(fix)}</b> <button class="say" data-say="${esc(fix)}">🔊</button></div>` : '');
    },

    async showJudgement(res, points, items) {
      this._mark = res.errors.flatMap((e) => e.at);
      this.renderSentence();
      const html = res.ok
        ? `<div class="verdict ok">✔ CHÍNH XÁC! <b>+${points}</b> điểm</div><div class="big-sentence">${esc(res.text)} <button class="say" data-say="${esc(res.text)}">🔊</button></div>`
        : `<div class="verdict bad">✘ CHƯA ĐÚNG</div><div class="big-sentence bad">${esc(res.text)}</div>${this.errorList(res, items)}<p class="muted">Thẻ được trả lại tay. Lượt sau thử lại nhé!</p>`;
      await modal({ title: 'Quản trò chấm câu', body: html, buttons: [{ label: 'Tiếp tục', value: true, cls: 'primary' }], cls: res.ok ? 'm-ok' : 'm-bad' });
      this._mark = null;
    },

    async speakCheck(text) {
      const body = `<p>Đọc to câu của bạn:</p><div class="big-sentence">${esc(text)} <button class="say" data-say="${esc(text)}">🔊</button></div><div class="mic-res"></div>`;
      let score = null;
      await modal({
        title: '🎤 Luyện nói', body,
        buttons: [{ label: 'Bỏ qua', value: null, cls: 'ghost' }, { label: '🎤 Bắt đầu nói', value: 'listen', cls: 'primary' }],
      }).then(async (v) => {
        if (v !== 'listen') return;
        this.toast('Đang nghe… hãy đọc câu');
        const heard = await EW.Speech.listen();
        score = EW.Speech.similarity(text, heard || '');
        const pct = Math.round(score * 100);
        await modal({
          title: '🎤 Kết quả luyện nói',
          body: `<p>Máy nghe được: <i>${esc((heard || '(không nghe rõ)').split('||')[0])}</i></p><div class="verdict ${pct >= 70 ? 'ok' : 'bad'}">Độ khớp: ${pct}%</div><p class="muted">${pct >= 70 ? 'Phát âm tốt!' : 'Nghe mẫu và thử lại ở lượt sau nhé.'}</p>`,
        });
      });
      return score;
    },

    challengePrompt(res, items) {
      return new Promise((resolve) => {
        const panel = $('#prompt-panel');
        let left = 30;
        let timer = null;
        const done = (v) => { clearInterval(timer); this.selectMode = null; panel.classList.remove('show'); panel.innerHTML = ''; this.renderSentence(); resolve(v); };
        const main = () => {
          panel.innerHTML = `
            <div class="pp-title">⚖️ Phán xét câu của đối thủ</div>
            <div class="pp-sentence">“${esc(res.text)}” <button class="say" data-say="${esc(res.text)}">🔊</button></div>
            <p>Câu này đúng ngữ pháp không? Nếu thấy lỗi, hãy <b>thách đấu</b> và chỉ vào thẻ sai.</p>
            <div class="pp-btns"><button class="btn" data-v="accept">✔ Chấp nhận</button><button class="btn danger" data-v="challenge">⚠️ Thách đấu</button></div>
            <div class="pp-timer"></div>`;
          panel.querySelector('[data-v=accept]').onclick = () => done({ challenge: false });
          panel.querySelector('[data-v=challenge]').onclick = pickMode;
        };
        const pickMode = () => {
          panel.innerHTML = `<div class="pp-title">🎯 Chạm vào thẻ bạn cho là SAI</div><p>Chọn thẻ trong câu ở giữa sân.</p><div class="pp-btns"><button class="btn ghost" data-v="back">← Quay lại</button></div><div class="pp-timer"></div>`;
          panel.querySelector('[data-v=back]').onclick = () => { this.selectMode = null; this.renderSentence(); main(); };
          this.selectMode = (i) => done({ challenge: true, index: i });
          this.renderSentence();
        };
        main();
        panel.classList.add('show');
        const tick = () => {
          const t = panel.querySelector('.pp-timer');
          if (t) t.textContent = `Tự động chấp nhận sau ${left}s`;
          if (left-- <= 0) done({ challenge: false });
        };
        tick();
        timer = setInterval(tick, 1000);
      });
    },

    async showChallengeResult(res, verdict, items) {
      this._mark = res.errors.flatMap((e) => e.at);
      this.renderSentence();
      const exact = !res.ok && this._mark.includes(verdict.index);
      const html = !res.ok
        ? `<div class="verdict ok">✅ BẮT LỖI THÀNH CÔNG${exact ? ' – ĐÚNG VỊ TRÍ!' : ''}</div><div class="big-sentence bad">${esc(res.text)}</div>${this.errorList(res, items)}<p class="muted">Bạn rút ${exact ? 2 : 1} lá. Đối thủ không được điểm.</p>`
        : `<div class="verdict bad">❌ THÁCH ĐẤU THẤT BẠI</div><div class="big-sentence">${esc(res.text)}</div><p>Câu này đúng ngữ pháp. Bạn mất 1 lá ngẫu nhiên, đối thủ được điểm.</p>`;
      await modal({ title: 'Kết quả thách đấu', body: html, cls: !res.ok ? 'm-ok' : 'm-bad' });
      this._mark = null;
    },

    async showMissed(res, items) {
      this._mark = res.errors.flatMap((e) => e.at);
      this.renderSentence();
      await modal({
        title: '👀 Lỗi bị bỏ sót',
        body: `<div class="verdict bad">Câu của đối thủ có lỗi nhưng không bị thách đấu</div><div class="big-sentence bad">${esc(res.text)}</div>${this.errorList(res, items)}<p class="muted">Đối thủ vẫn được điểm. Lần sau hãy để ý kỹ hơn nhé!</p>`,
        cls: 'm-bad',
      });
      this._mark = null;
    },

    showResult(duel) {
      EW.App.showResult(duel);
    },
  };

  // Nút 🔊 ở mọi nơi
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-say]');
    if (b) { e.stopPropagation(); EW.Speech.say(b.dataset.say); }
  });

  EW.UI = UI;
})();
