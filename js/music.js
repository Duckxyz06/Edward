/* EdWords – Sentence Duel · Nhạc nền tự sinh bằng WebAudio
 * Không dùng tệp nhạc nên không lo bản quyền và chơi được offline.
 *  - "menu":   nhẹ nhàng, huyền ảo (pad + đàn hạc), ~70 BPM
 *  - "battle": dồn dập hơn (bass, trống nhẹ, giai điệu chuông), ~100 BPM
 * Trình duyệt chỉ cho phát âm thanh sau thao tác đầu tiên của người dùng.
 */
(function () {
  const EW = (window.EW = window.EW || {});
  const KEY = 'edwords_music_v1';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } };
  const save = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* bỏ qua */ } };
  const pref = Object.assign({ on: true, volume: 0.5 }, load());

  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

  // Hợp âm (MIDI) và thang âm cho giai điệu
  const SONGS = {
    menu: {
      bpm: 70,
      chords: [[50, 57, 62, 66, 69], [47, 54, 59, 62, 66], [43, 50, 55, 59, 62], [45, 52, 57, 61, 64]], // Dmaj7 · Bm7 · Gmaj7 · A
      scale: [62, 64, 66, 69, 71, 74, 76, 78, 81],
      arp: [0, 2, 3, 4, 3, 2, 1, 2],
      drums: false, bass: false, melodyEvery: 4, padLevel: 0.11,
    },
    battle: {
      bpm: 100,
      chords: [[45, 52, 57, 60, 64], [41, 48, 53, 57, 60], [48, 55, 60, 64, 67], [43, 50, 55, 59, 62], [45, 52, 57, 60, 64], [41, 48, 53, 57, 60], [43, 50, 55, 59, 62], [40, 47, 52, 56, 59]], // Am F C G · Am F G E
      scale: [69, 71, 72, 74, 76, 77, 79, 81, 84],
      arp: [0, 2, 4, 2, 3, 2, 4, 3],
      drums: true, bass: true, melodyEvery: 2, padLevel: 0.07,
    },
  };

  let ctx = null, master = null, musicBus = null, reverb = null, delay = null;
  let timer = null, mood = 'menu', step = 0, nextTime = 0, melodyNote = 4;
  let ducked = false, started = false;

  function setupGraph() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    musicBus = ctx.createGain();
    musicBus.connect(master);
    // Vang giả lập bằng xung nhiễu tắt dần
    reverb = ctx.createConvolver();
    const len = ctx.sampleRate * 2.8;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    reverb.buffer = buf;
    const wet = ctx.createGain();
    wet.gain.value = 0.42;
    reverb.connect(wet).connect(master);
    // Tiếng vọng cho chuông / đàn hạc
    delay = ctx.createDelay(1);
    delay.delayTime.value = 0.36;
    const fb = ctx.createGain();
    fb.gain.value = 0.32;
    const dl = ctx.createGain();
    dl.gain.value = 0.25;
    delay.connect(fb).connect(delay);
    delay.connect(dl).connect(musicBus);
  }

  function out(node, rev = 0.5, echo = 0) {
    node.connect(musicBus);
    if (rev) { const g = ctx.createGain(); g.gain.value = rev; node.connect(g).connect(reverb); }
    if (echo) { const g = ctx.createGain(); g.gain.value = echo; node.connect(g).connect(delay); }
  }

  function pad(notes, t, dur, level) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(700, t);
    f.frequency.linearRampToValueAtTime(1400, t + dur / 2);
    f.frequency.linearRampToValueAtTime(700, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(level, t + dur * 0.3);
    g.gain.linearRampToValueAtTime(level * 0.8, t + dur * 0.8);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.6);
    f.connect(g);
    out(g, 0.9);
    notes.slice(1).forEach((n) => {
      [-6, 6].forEach((det) => {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = midi(n);
        o.detune.value = det;
        const og = ctx.createGain();
        og.gain.value = 0.12;
        o.connect(og).connect(f);
        o.start(t);
        o.stop(t + dur + 0.7);
      });
    });
  }

  function pluck(n, t, level, type = 'triangle', decay = 1.2) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = midi(n);
    const o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.value = midi(n) * 2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(level, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    const g2 = ctx.createGain();
    g2.gain.value = 0.25;
    o.connect(g);
    o2.connect(g2).connect(g);
    out(g, 0.55, 0.6);
    o.start(t); o2.start(t);
    o.stop(t + decay + 0.05); o2.stop(t + decay + 0.05);
  }

  function bass(n, t, dur) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = midi(n - 12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    out(g, 0.1);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  let noiseBuf = null;
  function noise(t, dur, level, freq) {
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(level, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g);
    out(g, 0.2);
    s.start(t);
    s.stop(t + dur + 0.02);
  }

  function kick(t) {
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.32, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    o.connect(g);
    out(g, 0.05);
    o.start(t);
    o.stop(t + 0.3);
  }

  // Mỗi "step" = 1 nốt móc đơn (1/8). Mỗi hợp âm kéo dài 8 step (1 ô nhịp 4/4).
  function scheduleStep(t) {
    const song = SONGS[mood];
    const spb = 60 / song.bpm / 2;
    const bar = Math.floor(step / 8);
    const s8 = step % 8;
    const chord = song.chords[bar % song.chords.length];
    if (s8 === 0) {
      pad(chord, t, spb * 8, song.padLevel);
      if (song.bass) bass(chord[0], t, spb * 3);
    }
    if (song.bass && (s8 === 3 || s8 === 6)) bass(chord[0] + (s8 === 6 ? 7 : 0), t, spb * 1.5);
    // Đàn hạc rải hợp âm
    const an = chord[song.arp[s8] % chord.length] + 12;
    pluck(an, t, mood === 'menu' ? 0.05 : 0.035, 'triangle', mood === 'menu' ? 1.6 : 0.6);
    // Giai điệu chuông: đi bước nhỏ trên thang âm, ưu tiên nốt thuộc hợp âm
    if (s8 % song.melodyEvery === 0 && Math.random() < (mood === 'menu' ? 0.55 : 0.7)) {
      melodyNote = Math.max(0, Math.min(song.scale.length - 1, melodyNote + [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)]));
      let n = song.scale[melodyNote];
      const pcs = chord.map((c) => c % 12);
      if (s8 === 0 && !pcs.includes(n % 12)) n += 1;
      if (s8 === 0 && !pcs.includes(n % 12)) n -= 2;
      pluck(n, t, mood === 'menu' ? 0.06 : 0.05, 'sine', mood === 'menu' ? 2.2 : 1.1);
    }
    if (song.drums) {
      if (s8 === 0 || s8 === 4) kick(t);
      if (s8 % 2 === 1) noise(t, 0.05, 0.05, 7000);
      if (s8 === 4) noise(t, 0.16, 0.09, 1800);
    }
    step++;
    return spb;
  }

  function tick() {
    while (nextTime < ctx.currentTime + 0.35) nextTime += scheduleStep(nextTime);
  }

  function applyVolume(fade = 0.8) {
    if (!ctx) return;
    const target = pref.on ? pref.volume * (ducked ? 0.35 : 1) * 0.9 : 0;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(Math.max(0.0001, target), now + fade);
  }

  function start() {
    if (started) return;
    started = true;
    if (!ctx) setupGraph();
    if (ctx.state === 'suspended') ctx.resume();
    nextTime = ctx.currentTime + 0.1;
    timer = setInterval(tick, 100);
    applyVolume(2);
  }

  const Music = {
    get on() { return pref.on; },
    get volume() { return pref.volume; },
    /** Gọi sau thao tác đầu tiên của người dùng */
    unlock() { if (pref.on) start(); else if (ctx && ctx.state === 'suspended') ctx.resume(); },
    setMood(m) {
      if (!SONGS[m] || m === mood) return;
      mood = m;
      if (!ctx) return;
      // chuyển bài mượt: hạ âm lượng rồi bắt đầu từ ô nhịp mới
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
      setTimeout(() => { step = 0; melodyNote = 4; nextTime = ctx.currentTime + 0.05; applyVolume(1.2); }, 450);
    },
    toggle() {
      pref.on = !pref.on;
      save(pref);
      if (pref.on) start();
      applyVolume(0.6);
      Music.syncButtons();
      return pref.on;
    },
    setVolume(v) { pref.volume = Math.max(0, Math.min(1, v)); save(pref); applyVolume(0.2); },
    duck(on) { ducked = on; applyVolume(0.3); },
    syncButtons() {
      document.querySelectorAll('[data-music-toggle]').forEach((b) => {
        b.textContent = pref.on ? '🎵' : '🔇';
        b.title = pref.on ? 'Tắt nhạc nền' : 'Bật nhạc nền';
        b.classList.toggle('off', !pref.on);
      });
      document.querySelectorAll('[data-music-volume]').forEach((r) => { r.value = Math.round(pref.volume * 100); });
    },
  };

  // Mở khóa âm thanh ở thao tác đầu tiên
  const first = () => { Music.unlock(); window.removeEventListener('pointerdown', first); window.removeEventListener('keydown', first); };
  window.addEventListener('pointerdown', first);
  window.addEventListener('keydown', first);
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else if (pref.on) ctx.resume();
  });

  EW.Music = Music;
})();
