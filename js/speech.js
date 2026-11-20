/* EdWords – Sentence Battle · Phát âm (TTS), luyện nói (nhận dạng giọng nói) và hiệu ứng âm thanh */
(function () {
  const EW = (window.EW = window.EW || {});
  let muted = false;
  let voice = null;

  function pickVoice() {
    if (!('speechSynthesis' in window)) return;
    const vs = speechSynthesis.getVoices();
    voice = vs.find((v) => /en-US/i.test(v.lang) && /Google|Samantha|Aria|Jenny/i.test(v.name)) || vs.find((v) => /^en/i.test(v.lang)) || null;
  }
  if ('speechSynthesis' in window) {
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
  }

  const Speech = {
    say(text, rate = 0.95) {
      if (muted || !('speechSynthesis' in window) || !text) return;
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US';
        if (voice) u.voice = voice;
        u.rate = rate;
        speechSynthesis.speak(u);
      } catch (e) { /* bỏ qua */ }
    },
    canListen() { return !!(window.SpeechRecognition || window.webkitSpeechRecognition); },
    /** Nghe người chơi đọc câu → Promise<string> */
    listen(timeoutMs = 8000) {
      return new Promise((resolve) => {
        const R = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!R) return resolve('');
        const r = new R();
        r.lang = 'en-US';
        r.interimResults = false;
        r.maxAlternatives = 3;
        let done = false;
        const finish = (t) => { if (!done) { done = true; try { r.stop(); } catch (e) {} resolve(t); } };
        r.onresult = (e) => {
          const alts = Array.from(e.results[0]).map((a) => a.transcript);
          finish(alts.join(' || '));
        };
        r.onerror = () => finish('');
        r.onend = () => finish('');
        setTimeout(() => finish(''), timeoutMs);
        try { r.start(); } catch (e) { finish(''); }
      });
    },
    /** Tỉ lệ từ khớp giữa câu mục tiêu và câu nói được (0–1) */
    similarity(target, heard) {
      const norm = (s) => s.toLowerCase().replace(/[^a-z0-9' ]/g, ' ').split(/\s+/).filter(Boolean);
      const t = norm(target);
      let best = 0;
      heard.split('||').forEach((h) => {
        const w = norm(h);
        const pool = w.slice();
        let hit = 0;
        t.forEach((x) => { const k = pool.indexOf(x); if (k >= 0) { hit++; pool.splice(k, 1); } });
        best = Math.max(best, t.length ? hit / t.length : 0);
      });
      return best;
    },
    get muted() { return muted; },
    set muted(v) { muted = v; if (v && 'speechSynthesis' in window) speechSynthesis.cancel(); },
  };

  // Hiệu ứng âm thanh tổng hợp bằng WebAudio (không cần tệp âm thanh)
  let ctx = null;
  const tones = {
    draw: [[520, 0.05], [780, 0.06]],
    place: [[660, 0.05]],
    set: [[300, 0.08], [200, 0.1]],
    activate: [[440, 0.07], [660, 0.07], [880, 0.1]],
    shield: [[880, 0.06], [440, 0.06], [880, 0.12]],
    score: [[523, 0.09], [659, 0.09], [784, 0.09], [1046, 0.18]],
    fail: [[300, 0.12], [220, 0.2]],
    banner: [[392, 0.08], [523, 0.12]],
    win: [[523, 0.12], [659, 0.12], [784, 0.12], [1046, 0.3]],
  };
  function sfx(name) {
    if (muted || !tones[name]) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      let t = ctx.currentTime;
      tones[name].forEach(([f, d]) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(g).connect(ctx.destination);
        o.start(t);
        o.stop(t + d + 0.02);
        t += d * 0.9;
      });
    } catch (e) { /* bỏ qua */ }
  }

  EW.Speech = Speech;
  EW.sfx = sfx;
})();
