/* EdWords – Sentence Battle · Bộ máy kiểm tra câu ("quản trò" tự động)
 * Kiểm tra một dãy thẻ theo các cấu trúc ngữ pháp được dạy trong học phần
 * tiếng Anh 1–3: hiện tại đơn, quá khứ đơn, tương lai, tiếp diễn, hiện tại
 * hoàn thành, động từ khuyết thiếu, câu hỏi Yes/No, bị động đơn giản và câu
 * ghép bằng liên từ. Lỗi được phân loại để thống kê (mục 13.4: "ghi nhận lỗi
 * ngôn ngữ").
 */
(function () {
  const EW = (window.EW = window.EW || {});

  const ERROR_CATS = {
    STRUCTURE: 'Cấu trúc câu',
    AGREEMENT: 'Hòa hợp chủ ngữ – động từ',
    VERB_FORM: 'Dạng động từ',
    TENSE: 'Thì & trạng từ thời gian',
    WORD_ORDER: 'Trật tự từ',
    OBJECT: 'Tân ngữ / bổ ngữ',
    ADJ_ADV: 'Tính từ / trạng từ',
    MEANING: 'Nghĩa / kết hợp từ',
    RULE: 'Luật của quản trò',
  };

  const TENSE_VI = {
    present: 'hiện tại đơn', past: 'quá khứ đơn', future: 'tương lai đơn', modal: 'động từ khuyết thiếu',
    presProg: 'hiện tại tiếp diễn', pastProg: 'quá khứ tiếp diễn', perfect: 'hiện tại hoàn thành',
    bePres: 'hiện tại (to be)', bePast: 'quá khứ (to be)', passivePres: 'bị động hiện tại', passivePast: 'bị động quá khứ',
  };
  const TTAG_VI = { past: 'quá khứ', habit: 'thói quen', freq: 'tần suất', now: 'đang diễn ra', future: 'tương lai', perfect: 'hoàn thành', any: 'chung' };
  const COMPAT = {
    past: ['past', 'pastProg', 'bePast', 'passivePast'],
    habit: ['present', 'bePres', 'past', 'bePast', 'modal', 'future', 'passivePres', 'passivePast'],
    now: ['presProg', 'bePres', 'modal', 'passivePres'],
    future: ['future', 'modal'],
    perfect: ['perfect'],
    any: ['present', 'past', 'future', 'modal', 'presProg', 'pastProg', 'bePres', 'bePast', 'passivePres', 'passivePast'],
  };
  const FORM_LABEL = { base: 'V nguyên mẫu', s: 'V-s/es', past: 'V2 (quá khứ)', ing: 'V-ing', pp: 'V3 (phân từ II)' };
  const FORM_KEYS = ['base', 's', 'past', 'ing', 'pp'];
  const PERSON_VI = { '1s': '“I”', '2': '“you”', '3s': 'ngôi thứ 3 số ít', '1p': '“we”', '3p': 'số nhiều' };

  const q = (s) => '‘' + s + '’';
  const intersects = (a, b) => !a || !b || a.some((x) => b.includes(x));

  function verbText(tok) {
    return tok.card.forms[tok.form || 'base'];
  }
  function tokWord(tok) {
    return tok.type === 'V' ? verbText(tok) : tok.card.word;
  }
  // Các dạng có cùng chữ viết với dạng người chơi chọn (vd: played = V2 = V3)
  function formKeys(tok) {
    const txt = verbText(tok);
    return FORM_KEYS.filter((k) => tok.card.forms[k] === txt);
  }

  function parseNP(toks, i) {
    let j = i;
    const adjs = [];
    while (toks[j] && toks[j].type === 'A' && toks[j].card.kind === 'adj') adjs.push(toks[j++]);
    const h = toks[j];
    if (h && (h.type === 'N' || h.type === 'S')) return { start: i, end: j + 1, adjs, head: h };
    return { start: i, end: j, adjs, head: null };
  }
  const npPerson = (np) => (np.head.type === 'S' ? np.head.card.person : np.head.card.number);
  const npTags = (np) => np.head.card.tags || [];
  const npText = (np) => np.adjs.map((a) => a.card.word).concat(np.head.card.word).join(' ');

  function parseClause(toks, isQuestion) {
    const errors = [];
    const E = (code, at, vi) => errors.push({ code, at: [].concat(at).filter((x) => x != null).map((t) => (typeof t === 'number' ? t : t.gi)), vi });
    let i = 0;
    const allT = [];
    let frontT = null;
    let aux = null;

    if (!isQuestion && toks[i] && toks[i].type === 'T') {
      frontT = toks[i++];
      allT.push(frontT);
      if (frontT.card.pos === 'mid') E('WORD_ORDER', frontT, `Trạng từ tần suất ${q(frontT.card.word)} không đứng đầu câu; đặt nó trước động từ thường hoặc sau to be / trợ động từ.`);
    }
    if (isQuestion) aux = toks[i++];

    // Chủ ngữ
    const subj = parseNP(toks, i);
    if (!subj.head) {
      const at = toks[i] || toks[toks.length - 1];
      E('STRUCTURE', at, 'Mệnh đề thiếu chủ ngữ (thẻ S hoặc danh từ N) ở đầu câu' + (isQuestion ? ', ngay sau trợ động từ.' : '.'));
      return { errors };
    }
    if (subj.adjs.length && subj.head.type === 'S') E('ADJ_ADV', subj.adjs, `Tính từ không đứng trước ${q(subj.head.card.word)} (đại từ / tên riêng / cụm có sẵn từ hạn định).`);
    i = subj.end;
    const person = npPerson(subj);
    const sTags = npTags(subj);
    subj.adjs.forEach((a) => {
      if (!intersects(a.card.tags, sTags)) E('MEANING', a, `${q(a.card.word)} không dùng để miêu tả ${q(subj.head.card.word)}.`);
    });

    // Trạng từ trước trợ động từ / động từ
    const preT = [];
    while (toks[i] && toks[i].type === 'T') preT.push(toks[i++]);
    if (!isQuestion && toks[i] && toks[i].type === 'AUX') aux = toks[i++];
    const postT = [];
    while (toks[i] && toks[i].type === 'T') postT.push(toks[i++]);
    allT.push(...preT, ...postT);
    preT.concat(postT).forEach((t) => {
      if (t.card.pos === 'end') E('WORD_ORDER', t, `${q(t.card.word)} là cụm thời gian, đặt ở đầu hoặc cuối câu.`);
    });
    if (!isQuestion && aux) preT.forEach((t) => {
      if (t.card.pos === 'mid') E('WORD_ORDER', t, `${q(t.card.word)} phải đứng SAU ${q(aux.card.word)} (trạng từ tần suất đứng sau to be / trợ động từ).`);
    });

    // Động từ chính
    let verb = null;
    if (toks[i] && toks[i].type === 'V') verb = toks[i++];

    // Bổ ngữ phía sau
    let obj = null;
    const adjComp = [], advs = [], places = [];
    let seenPost = false;
    while (i < toks.length) {
      const t = toks[i];
      if (t.type === 'N' || t.type === 'S' || (t.type === 'A' && t.card.kind === 'adj')) {
        const np = parseNP(toks, i);
        if (np.head) {
          if (np.adjs.length && np.head.type === 'S') E('ADJ_ADV', np.adjs, `Tính từ không đứng trước ${q(np.head.card.word)}.`);
          if (np.head.type === 'S' && np.head.card.pronoun) E('OBJECT', np.head, `${q(np.head.card.word)} là đại từ chủ ngữ, không làm tân ngữ (dùng me / him / her / us / them).`);
          if (obj) E('STRUCTURE', np.head, `Chỉ dùng một danh từ sau động từ; dùng thẻ L (and…) để nối thêm mệnh đề.`);
          else {
            obj = np;
            if (seenPost) E('WORD_ORDER', np.head, `Tân ngữ ${q(np.head.card.word)} phải đứng ngay sau động từ, trước trạng từ và cụm thời gian.`);
          }
          np.adjs.forEach((a) => {
            if (!intersects(a.card.tags, npTags(np))) E('MEANING', a, `${q(a.card.word)} không dùng để miêu tả ${q(np.head.card.word)}.`);
          });
          i = np.end;
        } else {
          adjComp.push(...np.adjs);
          i = np.end;
        }
        continue;
      }
      if (t.type === 'A' && t.card.kind === 'adv') { advs.push(t); seenPost = true; }
      else if (t.type === 'A' && t.card.kind === 'place') { places.push(t); seenPost = true; }
      else if (t.type === 'T') {
        allT.push(t);
        if (t.card.pos === 'mid') E('WORD_ORDER', t, `${q(t.card.word)} đứng TRƯỚC động từ thường (vd: I ${t.card.word} play…) hoặc sau to be / trợ động từ.`);
        seenPost = true;
      } else if (t.type === 'AUX' || t.type === 'V') {
        E('STRUCTURE', t, `Thừa ${q(tokWord(t))}: mỗi mệnh đề chỉ có một cụm động từ. Dùng thẻ L để nối hai mệnh đề.` + (t.type === 'AUX' && !isQuestion && t === toks[toks.length - 1] ? '' : ''));
      }
      i++;
    }

    // ---- Phân tích thì & hòa hợp ----
    let tense = null;
    let passive = false;
    const allowsAdj = verb && verb.card.obj === 'adj';
    if (aux) {
      const a = aux.card;
      if (!a.persons.includes(person)) {
        E('AGREEMENT', [aux, subj.head], `${q(a.word)} không đi với chủ ngữ ${q(subj.head.card.word)} (${PERSON_VI[person]}). ${agreeHint(a, person)}`);
      }
      if (a.kind === 'be') {
        if (verb) {
          const ks = formKeys(verb);
          if (ks.includes('ing')) tense = a.tense === 'past' ? 'pastProg' : 'presProg';
          else if (ks.includes('pp') && !verb.card.noPassive && verb.card.obj !== 'none') {
            passive = true;
            tense = a.tense === 'past' ? 'passivePast' : 'passivePres';
            if (obj) E('OBJECT', obj.head, `Câu bị động (${a.word} + V3) không có tân ngữ phía sau.`);
            if (verb.card.objTags && !intersects(verb.card.objTags, sTags)) E('MEANING', [subj.head, verb], `${q(subj.head.card.word)} không thể “được ${verb.card.vi}”.`);
          } else {
            E('VERB_FORM', verb, `Sau ${q(a.word)} dùng V-ing (${verb.card.forms.ing}) cho thì tiếp diễn${verb.card.noPassive || verb.card.obj === 'none' ? '' : ', hoặc V3 (' + verb.card.forms.pp + ') cho câu bị động'}.`);
            tense = a.tense === 'past' ? 'pastProg' : 'presProg';
          }
        } else {
          tense = a.tense === 'past' ? 'bePast' : 'bePres';
          if (!adjComp.length && !obj && !places.length) E('STRUCTURE', aux, `Sau ${q(a.word)} cần tính từ, danh từ hoặc nơi chốn (vd: She is happy / at home).`);
          if (advs.length) E('ADJ_ADV', advs, `Sau to be dùng TÍNH TỪ, không dùng trạng từ ${q(advs[0].card.word)}.`);
          adjComp.forEach((ad) => {
            if (!intersects(ad.card.tags, sTags)) E('MEANING', [ad, subj.head], `${q(ad.card.word)} không dùng để miêu tả ${q(subj.head.card.word)}.`);
          });
          if (obj && (!npTags(obj).includes('person') || !intersects(npTags(obj), sTags))) E('MEANING', [obj.head, subj.head], `${q(subj.head.card.word)} không thể “là” ${q(npText(obj))}. Sau to be nên dùng tính từ.`);
          else if (obj) {
            const objPl = npPerson(obj) === '3p';
            const subjPl = ['1p', '3p'].includes(person);
            if (objPl !== subjPl && person !== '2') E('AGREEMENT', [subj.head, obj.head], `${q(subj.head.card.word)} là ${subjPl ? 'số nhiều' : 'số ít'} nhưng ${q(npText(obj))} là ${objPl ? 'số nhiều' : 'số ít'}.`);
          }
        }
      } else {
        tense = a.tense;
        const need = a.kind === 'have' ? 'pp' : 'base';
        if (!verb) E('STRUCTURE', aux, `Sau ${q(a.word)} cần một động từ (thẻ V).`);
        else if (!formKeys(verb).includes(need)) {
          E('VERB_FORM', verb, `Sau ${q(a.word)} dùng ${FORM_LABEL[need]}: ${q(verb.card.forms[need])}.`);
        }
      }
    } else {
      if (!verb) {
        if (adjComp.length || obj) E('STRUCTURE', subj.head, `Thiếu động từ. Với tính từ/danh từ cần to be: ${beFor(person)}.`);
        else E('STRUCTURE', subj.head, 'Mệnh đề thiếu động từ (thẻ V).');
      } else {
        const ks = formKeys(verb);
        if (person === '3s') {
          if (ks.includes('s')) tense = 'present';
          else if (ks.includes('past')) tense = 'past';
          else if (ks.includes('base')) { tense = 'present'; E('AGREEMENT', [subj.head, verb], `Chủ ngữ ${q(subj.head.card.word)} là ngôi thứ 3 số ít → động từ thêm -s/-es: ${q(verb.card.forms.s)}.`); }
        } else {
          if (ks.includes('base')) tense = 'present';
          else if (ks.includes('past')) tense = 'past';
          else if (ks.includes('s')) { tense = 'present'; E('AGREEMENT', [subj.head, verb], `Chỉ thêm -s khi chủ ngữ là ngôi thứ 3 số ít; với ${q(subj.head.card.word)} dùng ${q(verb.card.forms.base)}.`); }
        }
        if (!tense) {
          if (ks.includes('ing')) E('VERB_FORM', verb, `V-ing cần đi với am / is / are / was / were (vd: ${beFor(person)} ${verb.card.forms.ing}).`);
          else E('VERB_FORM', verb, `V3 ${q(verb.card.forms.pp)} cần đi với have / has (hoàn thành) hoặc to be (bị động). Quá khứ đơn dùng ${q(verb.card.forms.past)}.`);
          tense = 'present';
        }
      }
    }

    // ---- Tân ngữ, tính từ, nghĩa ----
    if (verb && !passive) {
      const v = verb.card;
      if (v.obj === 'req' && !obj) E('OBJECT', verb, `${q(v.forms.base)} cần một danh từ (thẻ N) phía sau.`);
      if (v.obj === 'none' && obj) E('OBJECT', obj.head, `${q(v.forms.base)} không cần tân ngữ; bỏ ${q(npText(obj))} hoặc dùng nơi chốn.`);
      if (v.obj === 'adj') {
        if (obj) E('OBJECT', obj.head, `Sau ${q(v.forms.base)} dùng tính từ (vd: ${v.forms.base} happy), không dùng danh từ.`);
        if (!adjComp.length) E('ADJ_ADV', advs.length ? advs : verb, `Sau ${q(v.forms.base)} cần một TÍNH TỪ (happy, tired…)` + (advs.length ? `, không dùng trạng từ ${q(advs[0].card.word)}.` : '.'));
        adjComp.forEach((ad) => {
          if (!intersects(ad.card.tags, sTags)) E('MEANING', [ad, subj.head], `${q(ad.card.word)} không dùng để miêu tả ${q(subj.head.card.word)}.`);
        });
      } else if (adjComp.length) {
        E('ADJ_ADV', adjComp, `Tính từ ${q(adjComp[0].card.word)} không đứng sau động từ thường; dùng trạng từ (quickly, carefully…) hoặc đặt tính từ trước danh từ.`);
      }
      if (obj && v.objTags && v.obj !== 'adj' && v.obj !== 'none' && !intersects(v.objTags, npTags(obj))) {
        E('MEANING', [verb, obj.head], `${q(v.forms.base)} (${v.vi}) không đi với ${q(npText(obj))}.`);
      }
      if (v.agent !== false && !sTags.includes('person')) {
        E('MEANING', [subj.head, verb], `${q(subj.head.card.word)} không thể tự “${v.vi}”. Thử câu bị động (is/was + V3).`);
      }
    } else if (verb && passive && adjComp.length) {
      E('ADJ_ADV', adjComp, 'Câu bị động không cần tính từ phía sau; dùng trạng từ.');
    }

    // ---- Thì & trạng từ thời gian ----
    if (tense) {
      allT.forEach((t) => {
        const ok = COMPAT[t.card.tag];
        if (ok && !ok.includes(tense)) {
          E('TENSE', aux ? [t, aux] : verb ? [t, verb] : t, `${q(t.card.word)} (${TTAG_VI[t.card.tag]}) không hợp với thì ${TENSE_VI[tense]}. ${tenseHint(t.card.tag)}`);
        }
      });
    }
    if (aux && aux.card.neg) allT.forEach((t) => {
      if (t.card.word === 'never') E('STRUCTURE', [t, aux], `Không dùng ${q('never')} cùng ${q(aux.card.word)} (hai lần phủ định).`);
    });

    return { errors, tense, person };
  }

  function agreeHint(a, person) {
    const map = {
      do: person === '3s' ? 'Dùng “does”.' : '', be: person === '1s' ? (a.tense === 'past' ? 'Dùng “was”.' : 'Dùng “am”.') : person === '3s' ? (a.tense === 'past' ? 'Dùng “was”.' : 'Dùng “is”.') : (a.tense === 'past' ? 'Dùng “were”.' : 'Dùng “are”.'),
      have: person === '3s' ? 'Dùng “has”.' : 'Dùng “have”.',
    };
    if (a.kind === 'do' && person !== '3s') return 'Dùng “do”.';
    return map[a.kind] || '';
  }
  function beFor(person) {
    return person === '1s' ? 'am' : person === '3s' ? 'is' : 'are';
  }
  function tenseHint(tag) {
    return {
      past: 'Dùng V2 / did / was / were.',
      habit: 'Dùng thì đơn (hiện tại / quá khứ / will).',
      now: 'Dùng am / is / are + V-ing.',
      future: 'Dùng will / can + V nguyên mẫu.',
      perfect: 'Dùng have / has + V3.',
    }[tag] || '';
  }

  // ---- Dạng từ của thẻ N (mạo từ / số nhiều) và thẻ A (tính từ / trạng từ) ----
  function nForms(card) {
    const h = card.head, p = card.plural;
    switch (card.count) {
      case 'c': return [
        { key: 'a', det: 'a', head: h, number: '3s', label: 'a/an + N' },
        { key: 'the', det: 'the', head: h, number: '3s', label: 'the + N' },
        { key: 'pl', det: '', head: p, number: '3p', label: 'N số nhiều' },
        { key: 'thepl', det: 'the', head: p, number: '3p', label: 'the + N số nhiều' },
      ];
      case 'sp': return [
        { key: 'a', det: 'a', head: h, number: '3s', label: 'a/an + N (số ít)' },
        { key: 'pl', det: '', head: p, number: '3p', label: 'N (số nhiều)' },
        { key: 'thepl', det: 'the', head: p, number: '3p', label: 'the + N (số nhiều)' },
      ];
      case 'pl': return [
        { key: 'bare', det: '', head: h, number: '3p', label: 'N (luôn số nhiều)' },
        { key: 'the', det: 'the', head: h, number: '3p', label: 'the + N' },
      ];
      case 'u': return [
        { key: 'bare', det: '', head: h, number: '3s', label: 'N (không đếm được)' },
        { key: 'the', det: 'the', head: h, number: '3s', label: 'the + N' },
      ];
      default: return null;
    }
  }
  /** Các lựa chọn dạng từ cho một thẻ: [{key, text, label}] (null nếu thẻ không có dạng) */
  function formOptions(card) {
    if (card.type === 'V') {
      const seen = new Set();
      return FORM_KEYS.filter((k) => (seen.has(card.forms[k]) ? false : seen.add(card.forms[k])))
        .map((k) => ({ key: k, text: card.forms[k], label: FORM_LABEL[k] }));
    }
    if (card.type === 'N' && card.count) return nForms(card).map((f) => ({ key: f.key, text: npWord(f.det, f.head), label: f.label }));
    if (card.type === 'A' && card.aforms) return [
      { key: 'adj', text: card.aforms.adj, label: 'Tính từ' },
      { key: 'adv', text: card.aforms.adv, label: 'Trạng từ' },
    ];
    return null;
  }
  function defaultForm(card) { const o = formOptions(card); return o ? o[0].key : 'base'; }
  function npWord(det, head) { if (det === 'a' || det === 'an') det = article(head); return (det ? det + ' ' : '') + head; }
  /** Thẻ "hiệu lực" sau khi áp dạng từ người chơi chọn */
  function resolve(card, form) {
    if (card.type === 'N' && card.count) {
      const fs = nForms(card);
      const f = fs.find((x) => x.key === form) || fs[0];
      return { ...card, det: f.det, head: f.head, number: f.number, word: npWord(f.det, f.head) };
    }
    if (card.type === 'A' && card.aforms) {
      const k = form === 'adv' ? 'adv' : 'adj';
      return { ...card, kind: k, word: card.aforms[k] };
    }
    return card;
  }
  /** Chữ hiển thị của thẻ theo dạng đã chọn */
  function displayWord(card, form) {
    if (card.type === 'V') return card.forms[form && card.forms[form] ? form : 'base'];
    return resolve(card, form).word;
  }

  /** items: [{card, form}] → {ok, errors[], text, question, tenses[]} */
  function validate(items, opts = {}) {
    const toks = items.map((it, gi) => ({ type: it.card.type, card: resolve(it.card, it.form), form: it.form, gi }));
    const errors = [];
    const tenses = [];
    if (toks.length < 3) errors.push({ code: 'STRUCTURE', at: [], vi: 'Câu cần ít nhất 3 thẻ.' });
    const question = toks.length > 0 && toks[0].type === 'AUX';
    const segs = [[]];
    const links = [];
    toks.forEach((t) => {
      if (t.type === 'L') { links.push(t); segs.push([]); }
      else segs[segs.length - 1].push(t);
    });
    links.forEach((l) => {
      if (l.gi === 0 || l.gi === toks.length - 1) errors.push({ code: 'STRUCTURE', at: [l.gi], vi: `Liên từ ${q(l.card.word)} phải nằm GIỮA hai mệnh đề hoàn chỉnh.` });
    });
    if (toks.length >= 3) {
      segs.forEach((seg, si) => {
        if (!seg.length) {
          if (si > 0 && si < segs.length - 1) errors.push({ code: 'STRUCTURE', at: [links[si - 1].gi], vi: 'Hai liên từ đứng liền nhau.' });
          return;
        }
        const r = parseClause(seg, si === 0 && question);
        errors.push(...r.errors);
        if (r.tense) tenses.push(r.tense);
      });
    }
    // Luật đặt câu của quản trò (vd: "Đặt câu với thì hiện tại đơn")
    const ruleKey = opts.rule !== undefined ? opts.rule : Grammar.rule;
    const rule = ruleKey && EW.DATA && EW.DATA.RULES[ruleKey];
    if (rule && rule.tenses && tenses.length && !errors.some((e) => e.code === 'TENSE' || e.code === 'VERB_FORM' || e.code === 'AGREEMENT')) {
      const bad = tenses.filter((t) => !rule.tenses.includes(t));
      if (bad.length) errors.push({ code: 'RULE', at: [], vi: `Câu đang dùng ${TENSE_VI[bad[0]]}, chưa đúng luật quản trò: “${rule.name}”.` });
    }
    return { ok: errors.length === 0, errors, text: render(items), question, tenses, hasLinker: links.length > 0 };
  }

  function article(next) {
    return /^(hour|honest)/i.test(next) ? 'an' : /^[aeiou]/i.test(next) && !/^(uni|use|eu|one)/i.test(next) ? 'an' : 'a';
  }

  function render(items) {
    if (!items.length) return '';
    const toks = items.map((it) => ({ type: it.card.type, card: resolve(it.card, it.form), form: it.form }));
    const words = [];
    let buf = [];
    const flush = () => { words.push(...buf.map((t) => t.card.word)); buf = []; };
    const question = toks[0].type === 'AUX';
    toks.forEach((t, i) => {
      if (t.type === 'A' && t.card.kind === 'adj') { buf.push(t); return; }
      if (t.type === 'N') {
        const adjWords = buf.map((b) => b.card.word);
        buf = [];
        let det = t.card.det;
        const rest = adjWords.concat(t.card.head);
        if (det === 'a' || det === 'an') det = article(rest[0]);
        words.push(...(det ? [det] : []), ...rest);
        return;
      }
      flush();
      let w = tokWord(t);
      const nx = toks[i + 1];
      if (t.type === 'V' && t.card.prep && nx && (nx.type === 'N' || (nx.type === 'A' && nx.card.kind === 'adj'))) w += ' ' + t.card.prep;
      if (t.type === 'L' && (w === 'but' || w === 'so') && words.length) words[words.length - 1] += ',';
      words.push(w);
      const prev = toks[i - 1];
      const clauseStart = i === 0 || (prev && prev.type === 'L');
      if (t.type === 'T' && clauseStart && t.card.pos === 'end' && i < toks.length - 1) words[words.length - 1] += ',';
    });
    flush();
    let s = words.join(' ');
    s = s.charAt(0).toUpperCase() + s.slice(1);
    return s + (question ? '?' : '.');
  }

  /** Thử đổi dạng từ (V, N, A) để câu đúng → trả về câu gợi ý hoặc null */
  function suggestFix(items, opts = {}) {
    const idx = items.map((it, i) => (formOptions(it.card) ? i : -1)).filter((i) => i >= 0);
    if (!idx.length || idx.length > 5) return null;
    const opt = idx.map((i) => formOptions(items[i].card).map((o) => o.key));
    const total = opt.reduce((a, o) => a * o.length, 1);
    if (total > 3000) return null;
    for (let n = 0; n < total; n++) {
      let m = n;
      const trial = items.map((it) => ({ card: it.card, form: it.form }));
      idx.forEach((ti, k) => { trial[ti].form = opt[k][m % opt[k].length]; m = Math.floor(m / opt[k].length); });
      const r = validate(trial, opts);
      if (r.ok) return r.text;
    }
    return null;
  }

  const Grammar = { validate, render, suggestFix, resolve, formOptions, defaultForm, displayWord, rule: null, ERROR_CATS, FORM_LABEL, FORM_KEYS, TENSE_VI, TTAG_VI };
  EW.Grammar = Grammar;
})();
