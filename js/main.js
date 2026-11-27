/* EdWords – Sentence Battle · Điều hướng màn hình, thiết lập, thư viện, lịch sử, kết quả */
(function () {
  const EW = window.EW;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = EW.UI.esc;
  const D = EW.DATA;
  const HKEY = 'edwords_history_v2';

  const store = {
    get() { try { return JSON.parse(localStorage.getItem(HKEY) || '[]'); } catch (e) { return []; } },
    set(v) { try { localStorage.setItem(HKEY, JSON.stringify(v)); } catch (e) { /* bộ nhớ bị chặn */ } },
  };

  function go(name) {
    EW.Music.setMood(name === 'duel' || name === 'color' ? 'battle' : 'menu');
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

  // ---------- Thiết lập chế độ Ghép câu ----------
  const topicList = $('#topic-list');
  Object.entries(D.topics).forEach(([k, t], i) => {
    topicList.insertAdjacentHTML('beforeend', `
      <label class="topic-opt">
        <input type="radio" name="topic" value="${k}" ${i === 0 ? 'checked' : ''} />
        <img src="${t.nouns[0].img}" alt="" /><span><b>${t.icon} ${t.name}</b><small>${t.en}</small></span>
      </label>`);
  });
  const ruleSel = $('#rule-select');
  Object.entries(D.RULES).forEach(([k, r]) => ruleSel.insertAdjacentHTML('beforeend', `<option value="${k}">${r.name}</option>`));
  const opt = (c) => `<option value="${c.id}">${esc(c.word)} — ${esc(c.vi)}</option>`;
  function fillGM(keep) {
    const R = D.RULES[ruleSel.value];
    const auxes = D.auxes.filter((a) => R.aux(a));
    const times = D.times.filter((t) => !R.time || R.time.includes(t.tag));
    const prev = keep ? { S: $('#gm-S').value, AUX: $('#gm-AUX').value, T: $('#gm-T').value, L: $('#gm-L').value } : null;
    $('#gm-S').innerHTML = D.subjects.map(opt).join('');
    $('#gm-AUX').innerHTML = auxes.map(opt).join('');
    $('#gm-T').innerHTML = times.map(opt).join('');
    $('#gm-L').innerHTML = D.linkers.map(opt).join('');
    const sug = EW.Deck.suggestGM(ruleSel.value);
    ['S', 'AUX', 'T', 'L'].forEach((k) => {
      const sel = $('#gm-' + k);
      const want = prev && [...sel.options].some((o) => o.value === prev[k]) ? prev[k] : sug[k];
      sel.value = want;
    });
  }
  ruleSel.onchange = () => fillGM(true);
  $('#gm-random').onclick = () => fillGM(false);
  $('#allow-l').onchange = (e) => document.querySelector('.gm-l').classList.toggle('show', e.target.checked);
  fillGM(false);
  $('#mic-note').textContent = EW.Speech.canListen() ? '' : '(trình duyệt này chưa hỗ trợ micro; hãy dùng Chrome/Edge)';

  $('#setup-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const cfg = {
      mode: 'sentence',
      playerName: (f.get('playerName') || 'Bạn').trim() || 'Bạn',
      players: +f.get('players'), topic: f.get('topic'), rule: f.get('rule'),
      gm: { S: f.get('gmS'), AUX: f.get('gmAUX'), T: f.get('gmT'), L: f.get('gmL') },
      allowL: !!f.get('allowL'), difficulty: f.get('difficulty'),
      target: +f.get('target'), turnTime: +f.get('turnTime'), matchTime: +f.get('matchTime'),
      aiSpeed: f.get('aiSpeed'), assist: !!f.get('assist'), assistDraw: !!f.get('assistDraw'), speaking: !!f.get('speaking'),
    };
    startGame(cfg);
  });

  let lastCfg = null;
  async function startGame(cfg) {
    lastCfg = cfg;
    const game = new EW.Game(cfg, EW.UI);
    EW.current = game;
    EW.UI.bind(game);
    go('duel');
    EW.UI.render();
    // Quản trò công bố luật đặt câu và từ cho thẻ cố định
    const box = document.createElement('div');
    box.innerHTML = `<div class="gm-rule">🎙️ Luật đặt câu: <b>${esc(D.RULES[cfg.rule].name)}</b></div>
      <p>Mỗi người chơi có <b>${game.fixedDefs.length} lá cố định</b> với các từ sau. Chạm vào thẻ để nghe phát âm.</p>
      <div class="choose-grid big"></div>
      <p class="muted">Bộ bài: <b>${D.topics[cfg.topic].name}</b> · ${game.players.length} người chơi · ${cfg.matchTime ? Math.round(cfg.matchTime / 60) + ' phút' : 'không giới hạn thời gian'}${cfg.target ? ' · kết thúc sớm khi đạt ' + cfg.target + ' điểm' : ''}</p>`;
    game.fixedDefs.forEach((c) => {
      const e = EW.UI.cardEl(c);
      e.onclick = () => EW.Speech.say(c.word);
      box.querySelector('.choose-grid').appendChild(e);
    });
    await EW.UI.modal({ title: '🎙️ Quản trò công bố', body: box, wide: true, buttons: [{ label: '⚔️ Vào trận!', value: true, cls: 'primary' }] });
    EW.UI.log(`Trận đấu bắt đầu · ${game.players.map((p) => p.name).join(', ')}.`, 'sys');
    game.start();
  }

  // ---------- Nút trên bàn chơi ----------
  $('#btn-submit').onclick = () => { const g = EW.current; if (EW.UI.canAct()) g.submit(g.players[0]); };
  $('#btn-clear').onclick = () => { const g = EW.current; if (EW.UI.canAct()) g.clearSentence(); };
  $('#btn-say').onclick = () => { const g = EW.current; if (g) EW.Speech.say(EW.Grammar.render(g.sentence)); };
  $('#btn-end').onclick = async () => {
    const g = EW.current;
    if (!EW.UI.canAct()) return;
    const ok = await EW.UI.confirm('Kết thúc lượt?', 'Bạn chưa xác nhận câu nào. Kết thúc lượt mà không ghi điểm?', 'Kết thúc lượt', 'Ở lại');
    if (ok) { g.log('Bạn kết thúc lượt.', 'me'); g.endTurn(); }
  };
  $('#btn-mute').onclick = (e) => { EW.Speech.muted = !EW.Speech.muted; e.target.textContent = EW.Speech.muted ? '🔇' : '🔈'; };
  $('#btn-help').onclick = () => EW.UI.modal({ title: '📜 Luật chơi', body: $('#screen-rules .rules').cloneNode(true), wide: true, closable: true });
  $('#btn-quit').onclick = async () => {
    const ok = await EW.UI.confirm('Rời trận?', 'Kết quả trận này sẽ không được lưu.', 'Rời trận', 'Ở lại');
    if (ok) { const g = EW.current; g.over = true; EW.UI.stopTurnTimer(); EW.UI.stopMatchTimer(); go('title'); }
  };

  // ---------- Luật: chú giải ----------
  const TYPE_DESC = {
    S: 'Chủ từ (thẻ cố định): I, you, she, Nam…', V: 'Động từ / cụm động từ: chọn V, V-s/es, V2, V-ing, V3', N: 'Danh từ / cụm danh từ: chọn a/an, the hoặc số nhiều',
    A: 'Tính từ / trạng từ: chọn dạng in trên thẻ', T: 'Thời gian / điều kiện (thẻ cố định)', AUX: 'Trợ động từ (thẻ cố định): do, will, is, have…',
    L: 'Liên kết từ (tùy chọn): and, but, so…', ACTION: 'Lá chức năng tạo lợi thế', ADDWORD: 'Thay thế bất cứ lá bài nào bạn muốn',
  };
  Object.entries(D.TYPE_INFO).forEach(([k, v]) => $('#type-legend').insertAdjacentHTML('beforeend', `<li><span class="tbadge t-${k}">${k === 'ACTION' ? '★' : k === 'ADDWORD' ? '✚' : k}</span> <b>${v.name}</b> · ${TYPE_DESC[k]}</li>`));
  Object.values(D.actions).forEach((a) => $('#action-legend').insertAdjacentHTML('beforeend', `<li>${a.glyph} <b>${a.name}</b>: ${a.desc}</li>`));
  $('#action-legend').insertAdjacentHTML('beforeend', `<li>✚ <b>Addword</b>: ${D.ADDWORD.desc}</li>`);

  // ---------- Thư viện ----------
  const libTopic = $('#lib-topic');
  libTopic.innerHTML = Object.entries(D.topics).map(([k, t]) => `<option value="${k}">${t.icon} ${t.name}</option>`).join('') + '<option value="core">🎙️ Bộ Core (thẻ cố định)</option>';
  let libType = 'all';
  const libTypes = $('#lib-types');
  ['all', 'N', 'V', 'A', 'ACTION'].forEach((t) => {
    const b = document.createElement('button');
    b.className = 'chip' + (t === libType ? ' on' : '');
    b.textContent = t === 'all' ? 'Tất cả' : D.TYPE_INFO[t].glyph + ' ' + D.TYPE_INFO[t].name;
    b.onclick = () => { libType = t; libTypes.querySelectorAll('.chip').forEach((x) => x.classList.remove('on')); b.classList.add('on'); renderLibrary(); };
    libTypes.appendChild(b);
  });
  libTopic.onchange = renderLibrary;
  $('#lib-search').oninput = renderLibrary;
  function renderLibrary() {
    let all;
    if (libTopic.value === 'core') {
      const c = D.core;
      all = [
        ...D.subjects.map((x) => ({ ...x, img: c.S, fixedFace: true })),
        ...D.auxes.map((x) => ({ ...x, img: c.AUX, fixedFace: true })),
        ...D.times.map((x) => ({ ...x, img: c.T, fixedFace: true })),
        ...D.linkers,
      ];
    } else {
      const t = D.topics[libTopic.value];
      const acts = Object.keys(D.actions).map((k) => ({ id: 'ACT-' + k, type: 'ACTION', action: k, word: D.actions[k].name, vi: D.actions[k].desc, img: t.actions[k] || null }));
      all = [...t.nouns, ...t.verbs, ...t.adjs, ...acts, { id: 'ADD', type: 'ADDWORD', word: 'Addword', vi: D.ADDWORD.desc, img: t.actions.addword }];
    }
    const qv = $('#lib-search').value.trim().toLowerCase();
    const list = all.filter((c) => (libType === 'all' || c.type === libType || libTopic.value === 'core') && (!qv || c.word.toLowerCase().includes(qv) || (c.vi || '').toLowerCase().includes(qv)));
    const grid = $('#lib-grid');
    grid.innerHTML = `<div class="lib-count">${list.length} thẻ${libTopic.value !== 'core' ? ' · bộ in gồm ' + [...D.topics[libTopic.value].nouns, ...D.topics[libTopic.value].verbs, ...D.topics[libTopic.value].adjs].reduce((a, c) => a + c.copies, 0) + ' lá nội dung' : ''}</div>`;
    list.forEach((c) => {
      const e = EW.UI.cardEl(c);
      e.onclick = () => {
        if (!['ACTION', 'ADDWORD'].includes(c.type)) EW.Speech.say(c.word);
        EW.UI.modal({ title: 'Chi tiết thẻ', body: `<div class="lib-detail"><div class="detail">${EW.UI.detailHTML(c)}</div></div>`, closable: true, wide: true });
      };
      grid.appendChild(e);
    });
  }

  // ---------- Kết quả ----------
  function showResult(game) {
    const me = game.players[0];
    const rank = game.ranking();
    const win = game.winners.includes(me);
    const shared = game.winners.length > 1;
    EW.sfx(win ? 'win' : 'fail');
    const cats = EW.Grammar.ERROR_CATS;
    const total = me.stats.ok + me.stats.bad;
    const acc = total ? Math.round((me.stats.ok / total) * 100) : 0;
    const maxErr = Math.max(1, ...Object.values(me.stats.errors));
    const place = rank.indexOf(me) + 1;
    const entry = {
      date: new Date().toISOString(), mode: 'Ghép câu', name: me.name, topic: D.topics[game.cfg.topic].name, rule: D.RULES[game.cfg.rule].name,
      players: game.players.length, difficulty: game.cfg.difficulty,
      result: win ? (shared ? 'Đồng hạng nhất' : 'Thắng') : `Hạng ${place}`, score: rank.map((p) => `${p.name} ${p.score}`).join(' · '),
      minutes: Math.round((Date.now() - game.startedAt) / 60000), stats: me.stats, records: game.records,
    };
    const h = store.get();
    h.unshift(entry);
    store.set(h.slice(0, 100));

    $('#result-body').innerHTML = `
      <div class="result-head ${win ? 'win' : 'lose'}">
        <div class="r-title">${win ? (shared ? 'ĐỒNG HẠNG NHẤT' : 'CHIẾN THẮNG') : 'HẠNG ' + place}</div>
        <div class="muted">${game.timeUp ? 'Hết thời gian cố định · ' : ''}${entry.minutes} phút · ${game.round} vòng · ${game.turn} lượt</div>
      </div>
      <div class="podium">${rank.map((p, i) => `<div class="pod ${p === me ? 'me' : ''} ${game.winners.includes(p) ? 'top' : ''}"><span class="pod-n">${i + 1}</span><img src="${p.avatar}" alt="" /><b>${esc(p.isAI ? p.name : p.name + ' (bạn)')}</b><span class="pod-s">${p.score} điểm</span><small>${p.stats.accepted} câu được chấp nhận · đánh giá đúng ${p.stats.judgedRight}/${p.stats.judged}</small></div>`).join('')}</div>
      <div class="r-stats">
        <div class="stat"><b>${me.stats.ok}</b><span>Câu đúng (quản trò)</span></div>
        <div class="stat"><b>${me.stats.bad}</b><span>Câu sai</span></div>
        <div class="stat"><b>${acc}%</b><span>Độ chính xác</span></div>
        <div class="stat"><b>${me.stats.judgedRight}/${me.stats.judged}</b><span>Đánh giá đúng</span></div>
        <div class="stat"><b>${me.stats.exact}</b><span>Chỉ đúng thẻ sai</span></div>
      </div>
      <h3>Lỗi ngữ pháp của bạn</h3>
      <div class="err-bars">${Object.keys(cats).filter((k) => me.stats.errors[k]).map((k) => `<div class="bar-row"><span>${cats[k]}</span><div class="bar"><i style="width:${(me.stats.errors[k] / maxErr) * 100}%"></i></div><b>${me.stats.errors[k]}</b></div>`).join('') || '<p class="muted">Không có lỗi nào. Xuất sắc! 🎉</p>'}</div>
      <h3>Các câu trong trận</h3>
      <div class="table-wrap"><table class="rec-table"><thead><tr><th>Lượt</th><th>Người</th><th>Câu</th><th>Phiếu</th><th>Quản trò</th><th>Điểm</th></tr></thead><tbody>
      ${game.records.map((r) => `<tr class="${r.ok ? 'ok' : 'bad'}"><td>${r.turn}</td><td>${esc(r.player)}</td><td>${esc(r.text)} <button class="say" data-say="${esc(r.text)}">🔊</button>${r.ok ? '' : `<div class="rec-err">${esc(r.detail)}</div>`}</td><td>${esc(r.votes)}</td><td class="gm">${r.ok ? 'Đúng' : 'Sai'}</td><td>${r.points}</td></tr>`).join('')}
      </tbody></table></div>
      <div class="actions-row">
        <button class="btn" id="r-csv">⬇️ Tải phiếu theo dõi (CSV)</button>
        <button class="btn primary" id="r-again">⚔️ Chơi lại</button>
        <button class="btn ghost" data-go="title">Về màn hình chính</button>
      </div>`;
    $('#r-csv').onclick = () => downloadCSV([entry], 'edwords-tran-' + entry.date.slice(0, 16).replace(/[:T]/g, '-') + '.csv');
    $('#r-again').onclick = () => startGame(lastCfg);
    setTimeout(() => go('result'), 900);
  }

  // ---------- Lịch sử & CSV ----------
  function csvCell(v) {
    const s = String(v == null ? '' : v);
    return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function downloadCSV(entries, filename) {
    const head = ['ngay', 'che_do', 'nguoi_choi', 'bo_bai', 'luat_dat_cau', 'so_nguoi', 'do_kho', 'ket_qua_tran', 'bang_diem', 'luot', 'nguoi_dat_cau', 'cau', 'quan_tro_cham_dung', 'phieu_danh_gia', 'duoc_chap_nhan', 'ma_loi', 'chi_tiet_loi', 'diem'];
    const rows = [head];
    entries.forEach((e) => (e.records || []).forEach((r) => rows.push([
      e.date, e.mode, e.name, e.topic, e.rule, e.players, e.difficulty, e.result, e.score,
      r.turn, r.player, r.text, r.ok ? 1 : 0, r.votes, r.accepted ? 1 : 0, (r.errors || []).join('+'), r.detail, r.points || 0,
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
    el.innerHTML = `<div class="table-wrap"><table class="rec-table"><thead><tr><th>Ngày</th><th>Chế độ</th><th>Người chơi</th><th>Bộ bài / luật</th><th>Kết quả</th><th>Bảng điểm</th></tr></thead><tbody>${h.map((e) => `<tr><td>${new Date(e.date).toLocaleString('vi-VN')}</td><td>${esc(e.mode)}</td><td>${esc(e.name)}</td><td>${esc(e.topic)}${e.rule ? ' · ' + esc(e.rule) : ''}</td><td>${esc(e.result)}</td><td>${esc(e.score)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  $('#hist-export').onclick = () => { const h = store.get(); if (!h.length) return EW.UI.toast('Chưa có dữ liệu.'); downloadCSV(h, 'edwords-phieu-theo-doi.csv'); };
  $('#hist-clear').onclick = async () => { if (await EW.UI.confirm('Xóa lịch sử?', 'Toàn bộ dữ liệu trận đấu trên trình duyệt này sẽ bị xóa.', 'Xóa', 'Hủy')) { store.set([]); renderHistory(); } };

  EW.App = { go, showResult, startGame, store, downloadCSV };
})();
