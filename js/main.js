/* EdWords – Sentence Battle · Điều hướng màn hình, thiết lập, thư viện, lịch sử, kết quả */
(function () {
  const EW = window.EW;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = EW.UI.esc;
  const HKEY = 'edwords_history_v1';

  const store = {
    get() { try { return JSON.parse(localStorage.getItem(HKEY) || '[]'); } catch (e) { return []; } },
    set(v) { try { localStorage.setItem(HKEY, JSON.stringify(v)); } catch (e) { /* bộ nhớ bị chặn */ } },
  };

  function go(name) {
    EW.Music.setMood(name === 'duel' ? 'battle' : 'menu');
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === 'screen-' + name));
    if (name === 'library') renderLibrary();
    if (name === 'history') renderHistory();
    window.scrollTo(0, 0);
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (b) go(b.dataset.go);
  });

  // ---------- Nhạc nền ----------
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-music-toggle]')) { EW.Music.toggle(); EW.UI.toast(EW.Music.on ? '🎵 Đã bật nhạc nền' : '🔇 Đã tắt nhạc nền'); }
  });
  document.addEventListener('input', (e) => {
    if (e.target.matches('[data-music-volume]')) {
      EW.Music.setVolume(e.target.value / 100);
      if (!EW.Music.on && e.target.value > 0) EW.Music.toggle();
      EW.Music.syncButtons();
    }
  });
  EW.Music.syncButtons();

  // ---------- Thiết lập ----------
  const topicSel = $('#topic-select');
  Object.entries(EW.DATA.topics).forEach(([k, t]) => topicSel.insertAdjacentHTML('beforeend', `<option value="${k}">${t.icon} ${t.name} (${t.en})</option>`));
  topicSel.insertAdjacentHTML('beforeend', '<option value="mixed">🌐 Tổng hợp tất cả chủ đề</option>');
  const focusList = $('#focus-list');
  Object.entries(EW.DATA.FOCUS).forEach(([k, v]) => {
    const on = ['present', 'past', 'future'].includes(k);
    focusList.insertAdjacentHTML('beforeend', `<label class="chip ${on ? 'on' : ''}"><input type="checkbox" name="focus" value="${k}" ${on ? 'checked' : ''}/> ${v}</label>`);
  });
  focusList.addEventListener('change', (e) => e.target.closest('.chip').classList.toggle('on', e.target.checked));
  $('#mic-note').textContent = EW.Speech.canListen() ? '' : '(trình duyệt này chưa hỗ trợ micro; hãy dùng Chrome/Edge)';

  $('#setup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const focus = f.getAll('focus');
    if (!focus.length) return EW.UI.toast('Chọn ít nhất một cấu trúc ngữ pháp.');
    const cfg = {
      playerName: (f.get('playerName') || 'Bạn').trim() || 'Bạn',
      topic: f.get('topic'), focus, difficulty: f.get('difficulty'),
      target: +f.get('target'), turnTime: +f.get('turnTime'), matchTime: +f.get('matchTime'),
      assist: !!f.get('assist'), speaking: !!f.get('speaking'),
    };
    startDuel(cfg);
  });

  let lastCfg = null;
  async function startDuel(cfg) {
    lastCfg = cfg;
    const duel = new EW.Duel(cfg, EW.UI);
    EW.current = duel;
    EW.UI.bind(duel);
    go('duel');
    EW.UI.render();
    // Quản trò công bố thẻ cố định & từ vựng
    const box = document.createElement('div');
    box.innerHTML = `<p>Quản trò công bố <b>6 thẻ cố định</b> cho mỗi người chơi. Hãy đọc to và nhớ nghĩa trước khi vào trận.</p><div class="choose-grid"></div>
      <p class="muted">Chủ đề: <b>${cfg.topic === 'mixed' ? 'Tổng hợp' : EW.DATA.topics[cfg.topic].name}</b> · Ngữ pháp: ${cfg.focus.map((k) => EW.DATA.FOCUS[k]).join(', ')}</p>`;
    duel.fixedDefs.forEach((c) => {
      const e = EW.UI.cardEl(c, { small: true });
      e.onclick = () => EW.Speech.say(c.word);
      box.querySelector('.choose-grid').appendChild(e);
    });
    await EW.UI.modal({ title: '🎙️ Quản trò công bố', body: box, wide: true, buttons: [{ label: '⚔️ Vào trận!', value: true, cls: 'primary' }] });
    EW.UI.log(`Trận đấu bắt đầu · Mục tiêu ${cfg.target} điểm.`, 'sys');
    duel.start();
  }

  // ---------- Nút trên sân ----------
  $('#btn-submit').onclick = () => { const d = EW.current; if (EW.UI.canAct()) d.submit(d.players[0]); };
  $('#btn-clear').onclick = () => { const d = EW.current; if (EW.UI.canAct()) d.clearSentence(); };
  $('#btn-say').onclick = () => { const d = EW.current; if (d) EW.Speech.say(EW.Grammar.render(d.sentence)); };
  $('#btn-end').onclick = async () => {
    const d = EW.current;
    if (!EW.UI.canAct()) return;
    const ok = await EW.UI.confirm('Kết thúc lượt?', 'Bạn chưa xác nhận câu nào. Kết thúc lượt mà không ghi điểm?', 'Kết thúc lượt', 'Ở lại');
    if (ok) { d.log('Bạn kết thúc lượt.', 'me'); d.endTurn(); }
  };
  $('#btn-mute').onclick = (e) => { EW.Speech.muted = !EW.Speech.muted; e.target.textContent = EW.Speech.muted ? '🔇' : '🔈'; };
  $('#btn-help').onclick = () => EW.UI.modal({ title: '📜 Luật chơi', body: $('#screen-rules .rules').cloneNode(true), wide: true, closable: true });
  $('#btn-quit').onclick = async () => {
    const ok = await EW.UI.confirm('Rời trận?', 'Kết quả trận này sẽ không được lưu.', 'Rời trận', 'Ở lại');
    if (ok) { const d = EW.current; d.over = true; EW.UI.stopTurnTimer(); EW.UI.stopMatchTimer(); go('title'); }
  };

  // ---------- Luật: chú giải ----------
  const legend = $('#type-legend');
  const TYPE_DESC = {
    S: 'Chủ từ: I, you, she, Nam…', V: 'Động từ / cụm động từ. Chọn dạng V, V-s, V2, V-ing, V3', N: 'Danh từ / cụm danh từ',
    A: 'Tính từ, trạng từ, nơi chốn', T: 'Thời gian, tần suất: yesterday, always…', AUX: 'Trợ động từ & to be: do, will, is, have…',
    L: 'Liên kết từ: and, but, so, because, when', ACTION: 'Thẻ hành động tạo lợi thế', ADDWORD: 'Thêm 1 từ bất kỳ từ ngân hàng từ',
  };
  Object.entries(EW.DATA.TYPE_INFO).forEach(([k, v]) => legend.insertAdjacentHTML('beforeend', `<li><span class="tbadge t-${k}">${k === 'ACTION' ? '★' : k === 'ADDWORD' ? '✚' : k}</span> <b>${v.name}</b> · ${TYPE_DESC[k]}</li>`));
  const al = $('#action-legend');
  Object.values(EW.DATA.actions).forEach((a) => al.insertAdjacentHTML('beforeend', `<li>${a.glyph} <b>${a.name}</b> (${a.en}): ${a.desc}</li>`));

  // ---------- Thư viện ----------
  const libTopic = $('#lib-topic');
  libTopic.innerHTML = '<option value="all">Tất cả chủ đề</option>' + Object.entries(EW.DATA.topics).map(([k, t]) => `<option value="${k}">${t.icon} ${t.name}</option>`).join('');
  let libType = 'all';
  const libTypes = $('#lib-types');
  ['all', 'S', 'V', 'N', 'A', 'T', 'AUX', 'L', 'ACTION'].forEach((t) => {
    const b = document.createElement('button');
    b.className = 'chip' + (t === libType ? ' on' : '');
    b.textContent = t === 'all' ? 'Tất cả' : EW.DATA.TYPE_INFO[t].glyph + ' ' + EW.DATA.TYPE_INFO[t].name;
    b.onclick = () => { libType = t; libTypes.querySelectorAll('.chip').forEach((x) => x.classList.remove('on')); b.classList.add('on'); renderLibrary(); };
    libTypes.appendChild(b);
  });
  libTopic.onchange = renderLibrary;
  $('#lib-search').oninput = renderLibrary;
  function renderLibrary() {
    const D = EW.DATA;
    const tps = libTopic.value === 'all' ? Object.values(D.topics) : [D.topics[libTopic.value]];
    const actions = Object.keys(D.actions).map((k) => ({ id: 'ACT-' + k, type: 'ACTION', action: k, word: D.actions[k].name, vi: D.actions[k].desc }));
    const all = [...D.subjects, ...tps.flatMap((t) => [...t.verbs, ...t.nouns, ...t.adjs]), ...D.times, ...D.auxes, ...D.linkers, ...actions];
    const qv = $('#lib-search').value.trim().toLowerCase();
    const list = all.filter((c) => (libType === 'all' || c.type === libType) && (!qv || c.word.toLowerCase().includes(qv) || (c.vi || '').toLowerCase().includes(qv)));
    const grid = $('#lib-grid');
    grid.innerHTML = `<div class="lib-count">${list.length} thẻ</div>`;
    list.forEach((c) => {
      const e = EW.UI.cardEl(c);
      e.onclick = () => {
        if (c.type !== 'ACTION') EW.Speech.say(c.word);
        EW.UI.modal({ title: 'Chi tiết thẻ', body: `<div class="lib-detail"><div class="lib-card"></div><div class="detail">${EW.UI.detailHTML(c)}</div></div>`, closable: true, wide: true, onOpen: (b) => b.querySelector('.lib-card').appendChild(EW.UI.cardEl(c)) });
      };
      grid.appendChild(e);
    });
  }

  // ---------- Kết quả ----------
  function showResult(duel) {
    const me = duel.players[0];
    const ai = duel.players[1];
    const win = duel.winner === me;
    const draw = !duel.winner;
    EW.sfx(win ? 'win' : 'fail');
    const cats = EW.Grammar.ERROR_CATS;
    const myRecs = duel.records.filter((r) => r.player !== 'AI');
    const total = me.stats.ok + me.stats.bad;
    const acc = total ? Math.round((me.stats.ok / total) * 100) : 0;
    const maxErr = Math.max(1, ...Object.values(me.stats.errors));
    const entry = {
      date: new Date().toISOString(), name: me.name, topic: duel.cfg.topic, focus: duel.cfg.focus, difficulty: duel.cfg.difficulty,
      result: draw ? 'Hòa' : win ? 'Thắng' : 'Thua', score: `${me.score}-${ai.score}`, minutes: Math.round((Date.now() - duel.startedAt) / 60000),
      stats: me.stats, records: duel.records,
    };
    const h = store.get();
    h.unshift(entry);
    store.set(h.slice(0, 100));

    $('#result-body').innerHTML = `
      <div class="result-head ${draw ? 'draw' : win ? 'win' : 'lose'}">
        <div class="r-title">${draw ? 'HÒA' : win ? 'CHIẾN THẮNG' : 'THẤT BẠI'}</div>
        <div class="r-score">${me.score} <span>–</span> ${ai.score}</div>
        <div class="muted">${duel.byTime ? 'Kết thúc do hết giờ · ' : ''}${entry.minutes} phút · ${duel.turn} lượt</div>
      </div>
      <div class="r-stats">
        <div class="stat"><b>${me.stats.ok}</b><span>Câu đúng</span></div>
        <div class="stat"><b>${me.stats.bad}</b><span>Câu sai</span></div>
        <div class="stat"><b>${acc}%</b><span>Độ chính xác</span></div>
        <div class="stat"><b>${me.stats.challengeWins}/${me.stats.challenges}</b><span>Thách đấu thành công</span></div>
        <div class="stat"><b>${me.stats.missed}</b><span>Lỗi bỏ sót</span></div>
      </div>
      <h3>Lỗi ngữ pháp của bạn</h3>
      <div class="err-bars">${Object.keys(cats).filter((k) => me.stats.errors[k]).map((k) => `<div class="bar-row"><span>${cats[k]}</span><div class="bar"><i style="width:${(me.stats.errors[k] / maxErr) * 100}%"></i></div><b>${me.stats.errors[k]}</b></div>`).join('') || '<p class="muted">Không có lỗi nào. Xuất sắc! 🎉</p>'}</div>
      <h3>Các câu trong trận</h3>
      <table class="rec-table"><thead><tr><th>Lượt</th><th>Người</th><th>Câu</th><th>Kết quả</th><th>Điểm</th></tr></thead><tbody>
      ${duel.records.map((r) => `<tr class="${r.ok ? 'ok' : 'bad'}"><td>${r.turn}</td><td>${esc(r.player)}</td><td>${esc(r.text)} <button class="say" data-say="${esc(r.text)}">🔊</button>${r.ok ? '' : `<div class="rec-err">${esc(r.detail)}</div>`}</td><td>${esc(r.result)}</td><td>${r.points || 0}</td></tr>`).join('')}
      </tbody></table>
      <div class="actions-row">
        <button class="btn" id="r-csv">⬇️ Tải phiếu theo dõi (CSV)</button>
        <button class="btn primary" id="r-again">⚔️ Đấu lại</button>
        <button class="btn ghost" data-go="title">Về màn hình chính</button>
      </div>`;
    $('#r-csv').onclick = () => downloadCSV([entry], 'edwords-tran-' + entry.date.slice(0, 16).replace(/[:T]/g, '-') + '.csv');
    $('#r-again').onclick = () => startDuel(lastCfg);
    setTimeout(() => go('result'), 900);
    void myRecs;
  }

  // ---------- Lịch sử & CSV ----------
  function csvCell(v) {
    const s = String(v == null ? '' : v);
    return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function downloadCSV(entries, filename) {
    const head = ['ngay', 'nguoi_choi', 'chu_de', 'ngu_phap', 'do_kho', 'ket_qua_tran', 'ty_so', 'luot', 'nguoi_dat_cau', 'cau', 'dung', 'ma_loi', 'chi_tiet_loi', 'thach_dau', 'ket_qua', 'diem'];
    const rows = [head];
    entries.forEach((e) => e.records.forEach((r) => rows.push([
      e.date, e.name, e.topic, (e.focus || []).join('+'), e.difficulty, e.result, e.score,
      r.turn, r.player, r.text, r.ok ? 1 : 0, r.errors.join('+'), r.detail, r.challenged, r.result, r.points || 0,
    ])));
    const csv = '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function renderHistory() {
    const h = store.get();
    const el = $('#hist-list');
    if (!h.length) { el.innerHTML = '<p class="muted">Chưa có trận nào.</p>'; return; }
    el.innerHTML = `<table class="rec-table"><thead><tr><th>Ngày</th><th>Người chơi</th><th>Chủ đề</th><th>Độ khó</th><th>Kết quả</th><th>Tỷ số</th><th>Câu đúng/sai</th></tr></thead><tbody>${h.map((e) => `<tr><td>${new Date(e.date).toLocaleString('vi-VN')}</td><td>${esc(e.name)}</td><td>${esc(e.topic)}</td><td>${esc(e.difficulty)}</td><td>${esc(e.result)}</td><td>${esc(e.score)}</td><td>${e.stats.ok}/${e.stats.bad}</td></tr>`).join('')}</tbody></table>`;
  }
  $('#hist-export').onclick = () => { const h = store.get(); if (!h.length) return EW.UI.toast('Chưa có dữ liệu.'); downloadCSV(h, 'edwords-phieu-theo-doi.csv'); };
  $('#hist-clear').onclick = async () => { if (await EW.UI.confirm('Xóa lịch sử?', 'Toàn bộ dữ liệu trận đấu trên trình duyệt này sẽ bị xóa.', 'Xóa', 'Hủy')) { store.set([]); renderHistory(); } };

  EW.App = { go, showResult, startDuel };
})();
