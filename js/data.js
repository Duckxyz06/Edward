/* EdWords – Sentence Battle · Ngân hàng thẻ (word bank)
 * Giảng viên / người điều phối có thể chỉnh sửa trực tiếp file này để thay
 * chủ đề từ vựng, cấu trúc ngữ pháp và độ khó (mục 16.6 của thuyết minh).
 *
 * Loại thẻ (theo thuyết minh mục 10.2):
 *   S   – Chủ từ (subject)            V   – Động từ / cụm động từ
 *   N   – Danh từ / cụm danh từ        A   – Tính từ / trạng từ
 *   T   – Thời gian, tần suất          AUX – Trợ động từ (gồm cả to be)
 *   L   – Liên kết từ                  ACTION – Thẻ hành động
 *   ADDWORD – Thẻ thêm từ tự do
 */
(function () {
  const EW = (window.EW = window.EW || {});

  const ALL = ['1s', '2', '3s', '1p', '3p'];
  const NON3 = ['1s', '2', '1p', '3p'];
  const P3S = ['3s'];

  let seq = 0;
  const id = (p) => p + '-' + ++seq;

  // ---------- S: chủ từ ----------
  const S = (word, person, vi, pronoun = true) => ({ id: id('S'), type: 'S', word, person, vi, pronoun, tags: ['person'] });
  const subjects = [
    S('I', '1s', 'tôi'),
    S('you', '2', 'bạn'),
    S('he', '3s', 'anh ấy'),
    S('she', '3s', 'cô ấy'),
    S('we', '1p', 'chúng tôi'),
    S('they', '3p', 'họ'),
    S('Nam', '3s', 'Nam (tên riêng)', false),
    S('Lan', '3s', 'Lan (tên riêng)', false),
    S('my mother', '3s', 'mẹ tôi', false),
    S('my classmates', '3p', 'các bạn cùng lớp', false),
  ];

  // ---------- AUX: trợ động từ ----------
  // kind: do | modal | be | have ; tense: present | past | future | modal | perfect
  const X = (word, kind, tense, persons, vi, focus, neg = false) => ({ id: id('AUX'), type: 'AUX', word, kind, tense, persons, vi, focus, neg });
  const auxes = [
    X('do', 'do', 'present', NON3, 'trợ động từ hiện tại (I/you/we/they)', ['present']),
    X("don't", 'do', 'present', NON3, 'không (hiện tại, I/you/we/they)', ['present'], true),
    X('does', 'do', 'present', P3S, 'trợ động từ hiện tại (he/she/it)', ['present']),
    X("doesn't", 'do', 'present', P3S, 'không (hiện tại, he/she/it)', ['present'], true),
    X('did', 'do', 'past', ALL, 'trợ động từ quá khứ', ['past']),
    X("didn't", 'do', 'past', ALL, 'đã không (quá khứ)', ['past'], true),
    X('will', 'modal', 'future', ALL, 'sẽ', ['future']),
    X("won't", 'modal', 'future', ALL, 'sẽ không', ['future'], true),
    X('can', 'modal', 'modal', ALL, 'có thể', ['present', 'future']),
    X("can't", 'modal', 'modal', ALL, 'không thể', ['present', 'future'], true),
    X('should', 'modal', 'modal', ALL, 'nên', ['present', 'future']),
    X('am', 'be', 'present', ['1s'], 'là / đang (I)', ['present', 'progressive']),
    X('is', 'be', 'present', P3S, 'là / đang (he/she/it)', ['present', 'progressive']),
    X('are', 'be', 'present', ['2', '1p', '3p'], 'là / đang (you/we/they)', ['present', 'progressive']),
    X("isn't", 'be', 'present', P3S, 'không phải / không đang (he/she/it)', ['present', 'progressive'], true),
    X("aren't", 'be', 'present', ['2', '1p', '3p'], 'không phải / không đang (you/we/they)', ['present', 'progressive'], true),
    X('was', 'be', 'past', ['1s', '3s'], 'đã là / đã đang (I/he/she/it)', ['past', 'progressive']),
    X('were', 'be', 'past', ['2', '1p', '3p'], 'đã là / đã đang (you/we/they)', ['past', 'progressive']),
    X("wasn't", 'be', 'past', ['1s', '3s'], 'đã không (I/he/she/it)', ['past', 'progressive'], true),
    X('have', 'have', 'perfect', NON3, 'đã (hoàn thành, I/you/we/they)', ['perfect']),
    X('has', 'have', 'perfect', P3S, 'đã (hoàn thành, he/she/it)', ['perfect']),
    X("haven't", 'have', 'perfect', NON3, 'chưa (hoàn thành)', ['perfect'], true),
    X("hasn't", 'have', 'perfect', P3S, 'chưa (hoàn thành, he/she/it)', ['perfect'], true),
  ];

  // ---------- T: thời gian, tần suất ----------
  // tag: past | habit | freq | now | future | perfect | any ; pos: end (đầu/cuối câu) | mid (trước động từ thường, sau to be/trợ động từ)
  const T = (word, tag, pos, vi, focus) => ({ id: id('T'), type: 'T', word, tag, pos, vi, focus });
  const times = [
    T('yesterday', 'past', 'end', 'hôm qua', ['past']),
    T('last week', 'past', 'end', 'tuần trước', ['past']),
    T('last night', 'past', 'end', 'tối qua', ['past']),
    T('two days ago', 'past', 'end', 'hai ngày trước', ['past']),
    T('every day', 'habit', 'end', 'mỗi ngày', ['present']),
    T('every weekend', 'habit', 'end', 'mỗi cuối tuần', ['present']),
    T('on Mondays', 'habit', 'end', 'vào các thứ Hai', ['present']),
    T('always', 'freq', 'mid', 'luôn luôn', ['present', 'past']),
    T('usually', 'freq', 'mid', 'thường xuyên', ['present', 'past']),
    T('often', 'freq', 'mid', 'thường', ['present', 'past']),
    T('sometimes', 'freq', 'mid', 'thỉnh thoảng', ['present', 'past']),
    T('never', 'freq', 'mid', 'không bao giờ', ['present', 'past']),
    T('now', 'now', 'end', 'bây giờ', ['progressive']),
    T('right now', 'now', 'end', 'ngay bây giờ', ['progressive']),
    T('at the moment', 'now', 'end', 'lúc này', ['progressive']),
    T('tomorrow', 'future', 'end', 'ngày mai', ['future']),
    T('next week', 'future', 'end', 'tuần sau', ['future']),
    T('next summer', 'future', 'end', 'mùa hè tới', ['future']),
    T('already', 'perfect', 'mid', 'đã … rồi', ['perfect']),
    T('just', 'perfect', 'mid', 'vừa mới', ['perfect']),
    T('recently', 'perfect', 'end', 'gần đây', ['perfect']),
    T('for two years', 'perfect', 'end', 'được hai năm', ['perfect']),
    T('since 2024', 'perfect', 'end', 'từ năm 2024', ['perfect']),
    T('in the morning', 'any', 'end', 'vào buổi sáng', ['present', 'past', 'future', 'progressive']),
    T('after class', 'any', 'end', 'sau giờ học', ['present', 'past', 'future', 'progressive']),
  ];

  // ---------- L: liên kết từ ----------
  const L = (word, vi) => ({ id: id('L'), type: 'L', word, vi });
  const linkers = [L('and', 'và'), L('but', 'nhưng'), L('so', 'vì vậy'), L('because', 'bởi vì'), L('when', 'khi')];

  // ---------- V / N / A theo chủ đề (bộ thẻ in của nhóm: Duckxyz06/Board-game) ----------
  // V: obj none | opt | req | adj ; objTags: loại danh từ làm tân ngữ ; prep: giới từ tự thêm trước tân ngữ
  //    agent: false nếu chủ ngữ không cần là người (vd: The storm destroyed the road).
  const V = (base, s, past, ing, pp, vi, obj, objTags, extra = {}) => ({
    id: id('V'), type: 'V', word: base, forms: { base, s, past, ing, pp }, vi, obj, objTags, ...extra,
  });
  // N: count c (đếm được) | u (không đếm được) | pl (luôn số nhiều) | sp (số ít = số nhiều, vd species)
  //    Người chơi chọn dạng: a/an + N · the + N · N-s · the + N-s (tùy loại).
  const N = (head, plural, count, tags, vi, extra = {}) => ({
    id: id('N'), type: 'N', head, plural, count, tags, vi, word: head, ...extra,
  });
  // A: thẻ tính từ có dạng trạng từ đi kèm (in trên thẻ) → người chơi chọn tính từ hoặc trạng từ
  const A = (adj, adv, vi, tags, extra = {}) => ({
    id: id('A'), type: 'A', word: adj, aforms: { adj, adv }, vi, tags, kind: 'adj', ...extra,
  });

  const C = (topic) => (n) => `assets/cards/${topic}/${n}.webp`;
  const cs = C('shopping'), cd = C('disasters'), ce = C('environment');

  const topics = {
    shopping: {
      name: 'Mua sắm', en: 'Unit 8 · Shopping', icon: '🛍️', back: cs(57),
      nouns: [
        N('supermarket', 'supermarkets', 'c', ['shop'], 'siêu thị', { img: cs(1), copies: 2, def: 'A large shop that sells food and other things.' }),
        N('open-air market', 'open-air markets', 'c', ['shop'], 'chợ ngoài trời', { img: cs(3), copies: 2, def: 'A market outside, not inside a building.' }),
        N('online shop', 'online shops', 'c', ['shop'], 'cửa hàng trực tuyến', { img: cs(5), copies: 2, def: 'A shop that sells things on the Internet.' }),
        N('clothes', 'clothes', 'pl', ['goods'], 'quần áo', { img: cs(7), copies: 2, def: 'Things people wear on their bodies.' }),
        N('shoes', 'shoes', 'pl', ['goods'], 'giày', { img: cs(9), copies: 2, def: 'Things people wear on their feet.' }),
        N('sale', 'sales', 'c', ['event'], 'đợt giảm giá', { img: cs(11), copies: 2, def: 'A time when things cost less money.' }),
        N('website', 'websites', 'c', ['shop', 'web'], 'trang web', { img: cs(13), copies: 2, def: 'A place on the Internet with information.' }),
        N('money', 'money', 'u', ['money'], 'tiền', { img: cs(15), copies: 2, def: 'What people use to buy things.' }),
      ],
      verbs: [
        V('buy', 'buys', 'bought', 'buying', 'bought', 'mua', 'req', ['goods'], { img: cs(17), copies: 2, def: 'To get something by paying money.' }),
        V('sell', 'sells', 'sold', 'selling', 'sold', 'bán', 'req', ['goods'], { img: cs(19), copies: 2, def: 'To give something to someone for money.' }),
        V('pay', 'pays', 'paid', 'paying', 'paid', 'trả tiền', 'opt', ['money'], { img: cs(21), copies: 2, def: 'To give money for something.' }),
        V('go', 'goes', 'went', 'going', 'gone', 'đi', 'opt', ['shop'], { img: cs(23), copies: 2, prep: 'to', noPassive: true, def: 'To travel or move to another place.' }),
        V('spend', 'spends', 'spent', 'spending', 'spent', 'tiêu (tiền)', 'req', ['money'], { img: cs(25), copies: 2, def: 'To use money to buy things.' }),
        V('visit', 'visits', 'visited', 'visiting', 'visited', 'ghé thăm', 'req', ['shop'], { img: cs(27), copies: 2, def: 'To go to a place.' }),
        V('choose', 'chooses', 'chose', 'choosing', 'chosen', 'chọn', 'req', ['goods', 'shop'], { img: cs(29), copies: 2, def: 'To pick the thing you want.' }),
        V('offer', 'offers', 'offered', 'offering', 'offered', 'đưa ra, mời', 'req', ['goods', 'event', 'money'], { img: cs(31), copies: 1, def: 'To say that someone can have something.' }),
        V('save', 'saves', 'saved', 'saving', 'saved', 'tiết kiệm', 'opt', ['money'], { img: cs(32), copies: 1, def: 'To keep money for later.' }),
        V('bargain', 'bargains', 'bargained', 'bargaining', 'bargained', 'mặc cả', 'none', null, { img: cs(33), copies: 1, noPassive: true, def: 'To try to agree on a lower price.' }),
      ],
      adjs: [
        A('cheap', 'cheaply', 'rẻ', ['goods', 'shop', 'event'], { img: cs(34), copies: 2, def: 'Not costing much money.' }),
        A('expensive', 'expensively', 'đắt', ['goods', 'shop'], { img: cs(36), copies: 2, def: 'Costing a lot of money.' }),
        A('convenient', 'conveniently', 'tiện lợi', ['shop', 'goods', 'web'], { img: cs(38), copies: 2, def: 'Easy and useful to use.' }),
        A('popular', 'popularly', 'phổ biến, được ưa chuộng', ['shop', 'goods', 'web', 'event', 'person'], { img: cs(40), copies: 2, def: 'Liked by many people.' }),
        A('good', 'well', 'tốt', ['shop', 'goods', 'web', 'event', 'person'], { img: cs(42), copies: 2, def: 'Of a high quality.' }),
        A('nice', 'nicely', 'đẹp, dễ chịu', ['shop', 'goods', 'web', 'event', 'person'], { img: cs(44), copies: 2, def: 'Pleasant or enjoyable.' }),
      ],
      actions: { draw2: cs(46), draw4: cs(48), exchange: cs(50), steal: cs(52), addword: cs(54) },
    },
    disasters: {
      name: 'Thiên tai', en: 'Unit 9 · Natural Disasters', icon: '🌪️', back: cd(59),
      nouns: [
        N('earthquake', 'earthquakes', 'c', ['disaster'], 'động đất', { img: cd(1), copies: 2, def: 'A sudden shaking of the ground.', an: true }),
        N('flood', 'floods', 'c', ['disaster'], 'lũ lụt', { img: cd(3), copies: 2, def: 'A large amount of water covering land.' }),
        N('storm', 'storms', 'c', ['disaster'], 'cơn bão', { img: cd(5), copies: 2, def: 'Bad weather with strong wind and rain.' }),
        N('tornado', 'tornadoes', 'c', ['disaster'], 'lốc xoáy', { img: cd(7), copies: 2, def: 'A very strong wind that moves in a circle.' }),
        N('building', 'buildings', 'c', ['place'], 'tòa nhà', { img: cd(9), copies: 3, def: 'A place with walls and a roof.' }),
        N('road', 'roads', 'c', ['place'], 'con đường', { img: cd(12), copies: 3, def: 'A way for people and cars to travel.' }),
        N('people', 'people', 'pl', ['person'], 'mọi người', { img: cd(15), copies: 2, def: 'Human beings.' }),
        N('emergency kit', 'emergency kits', 'c', ['thing'], 'bộ đồ dùng khẩn cấp', { img: cd(17), copies: 2, def: 'A bag or box with things needed in an emergency.' }),
        N('victim', 'victims', 'c', ['person'], 'nạn nhân', { img: cd(19), copies: 2, def: 'A person who suffers because of a disaster.' }),
      ],
      verbs: [
        V('destroy', 'destroys', 'destroyed', 'destroying', 'destroyed', 'phá hủy', 'req', ['place', 'thing'], { img: cd(21), copies: 2, agent: false, def: 'To damage something completely.' }),
        V('warn', 'warns', 'warned', 'warning', 'warned', 'cảnh báo', 'req', ['person'], { img: cd(23), copies: 2, def: 'To tell someone about danger.' }),
        V('predict', 'predicts', 'predicted', 'predicting', 'predicted', 'dự báo', 'req', ['disaster'], { img: cd(25), copies: 2, def: 'To say what may happen in the future.' }),
        V('damage', 'damages', 'damaged', 'damaging', 'damaged', 'làm hư hại', 'req', ['place', 'thing'], { img: cd(27), copies: 2, agent: false, def: 'To harm or break something.' }),
        V('rescue', 'rescues', 'rescued', 'rescuing', 'rescued', 'giải cứu', 'req', ['person'], { img: cd(29), copies: 2, def: 'To save someone from danger.' }),
        V('evacuate', 'evacuates', 'evacuated', 'evacuating', 'evacuated', 'sơ tán', 'opt', ['person', 'place'], { img: cd(31), copies: 2, def: 'To move people away from a dangerous place.' }),
        V('prepare', 'prepares', 'prepared', 'preparing', 'prepared', 'chuẩn bị', 'opt', ['thing'], { img: cd(32), copies: 1, def: 'To get ready for something.' }),
        V('cause', 'causes', 'caused', 'causing', 'caused', 'gây ra', 'req', ['disaster'], { img: cd(34), copies: 2, agent: false, def: 'To make something happen.' }),
      ],
      adjs: [
        A('dangerous', 'dangerously', 'nguy hiểm', ['disaster', 'place', 'thing'], { img: cd(36), copies: 2, def: 'Able or likely to cause harm.' }),
        A('heavy', 'heavily', 'nặng, lớn (mưa, bão)', ['disaster', 'thing'], { img: cd(38), copies: 2, def: 'Large in amount or force.' }),
        A('violent', 'violently', 'dữ dội', ['disaster', 'person'], { img: cd(40), copies: 2, def: 'Very strong and dangerous.' }),
        A('safe', 'safely', 'an toàn', ['person', 'place', 'thing'], { img: cd(42), copies: 2, def: 'Not in danger.' }),
        A('serious', 'seriously', 'nghiêm trọng', ['disaster', 'person'], { img: cd(44), copies: 2, def: 'Bad or important enough to cause concern.' }),
        A('strong', 'strongly', 'mạnh', ['disaster', 'person', 'place', 'thing'], { img: cd(46), copies: 2, def: 'Having great power or force.' }),
      ],
      actions: { draw2: cd(48), draw4: cd(50), exchange: cd(52), steal: cd(54), addword: cd(56) },
    },
    environment: {
      name: 'Bảo vệ môi trường', en: 'Environmental Protection', icon: '🌱', back: cs(57),
      nouns: [
        N('pollution', 'pollution', 'u', ['problem'], 'sự ô nhiễm', { img: ce(1), copies: 2, def: 'Dirty or harmful substances in the environment.' }),
        N('habitat', 'habitats', 'c', ['place'], 'môi trường sống', { img: ce(3), copies: 2, def: 'The natural home of an animal or plant.' }),
        N('carbon dioxide', 'carbon dioxide', 'u', ['gas', 'problem'], 'khí CO₂', { img: ce(5), copies: 2, def: 'A gas that people and animals breathe out and plants use to grow.' }),
        N('endangered species', 'endangered species', 'sp', ['animal'], 'loài có nguy cơ tuyệt chủng', { img: ce(7), copies: 2, def: 'Types of animals or plants that may disappear forever.' }),
        N('single-use product', 'single-use products', 'c', ['waste', 'thing'], 'sản phẩm dùng một lần', { img: ce(9), copies: 2, def: 'Products that are used once and then thrown away.' }),
        N('rubbish', 'rubbish', 'u', ['waste'], 'rác', { img: ce(11), copies: 3, def: 'Things that people do not want and throw away.' }),
        N('tree', 'trees', 'c', ['plant'], 'cây', { img: ce(14), copies: 2, def: 'A tall plant with a hard trunk and branches.' }),
        N('environment', 'environments', 'c', ['place'], 'môi trường', { img: ce(16), copies: 2, def: 'The natural world around us, including air, water, and land.' }),
        N('water pollution', 'water pollution', 'u', ['problem'], 'ô nhiễm nguồn nước', { img: ce(18), copies: 2, def: 'Dirty or harmful substances in water.' }),
        N('plastic waste', 'plastic waste', 'u', ['waste'], 'rác thải nhựa', { img: ce(20), copies: 1, def: 'Plastic things that people throw away.' }),
        N('forest', 'forests', 'c', ['place', 'plant'], 'rừng', { img: ce(21), copies: 2, def: 'A large area of land covered with many trees.' }),
      ],
      verbs: [
        V('protect', 'protects', 'protected', 'protecting', 'protected', 'bảo vệ', 'req', ['place', 'animal', 'plant'], { img: ce(23), copies: 2, def: 'To keep someone or something safe from harm.' }),
        V('reduce', 'reduces', 'reduced', 'reducing', 'reduced', 'giảm', 'req', ['problem', 'waste', 'gas'], { img: ce(25), copies: 3, def: 'To make something smaller or less.' }),
        V('plant', 'plants', 'planted', 'planting', 'planted', 'trồng', 'req', ['plant'], { img: ce(28), copies: 2, def: 'To put a seed or plant into the ground so it can grow.' }),
        V('recycle', 'recycles', 'recycled', 'recycling', 'recycled', 'tái chế', 'opt', ['waste', 'thing'], { img: ce(30), copies: 2, def: 'To use old materials again to make new things.' }),
        V('avoid', 'avoids', 'avoided', 'avoiding', 'avoided', 'tránh', 'req', ['waste', 'thing', 'problem'], { img: ce(32), copies: 2, def: 'To stay away from someone or something.' }),
        V('save', 'saves', 'saved', 'saving', 'saved', 'cứu, giữ gìn', 'req', ['animal', 'plant', 'place'], { img: ce(34), copies: 2, def: 'To keep something safe or stop it from being wasted.' }),
        V('stop', 'stops', 'stopped', 'stopping', 'stopped', 'ngăn chặn', 'req', ['problem', 'waste'], { img: ce(36), copies: 2, def: 'To finish an activity or make something finish.' }),
        V('pick up', 'picks up', 'picked up', 'picking up', 'picked up', 'nhặt', 'req', ['waste', 'thing'], { img: ce(38), copies: 2, def: 'To lift something from the ground or a surface.' }),
        V('clean up', 'cleans up', 'cleaned up', 'cleaning up', 'cleaned up', 'dọn sạch', 'req', ['place', 'waste'], { img: ce(40), copies: 2, def: 'To make a place clean and tidy.' }),
      ],
      adjs: [
        A('harmful', 'harmfully', 'có hại', ['problem', 'gas', 'waste', 'thing'], { img: ce(42), copies: 2, def: 'Causing damage or injury to someone or something.' }),
        A('natural', 'naturally', 'tự nhiên', ['place', 'plant', 'gas'], { img: ce(44), copies: 2, def: 'Existing in nature and not made by people.' }),
        A('dangerous', 'dangerously', 'nguy hiểm', ['problem', 'gas', 'waste', 'thing', 'place', 'animal'], { img: ce(46), copies: 2, def: 'Able or likely to cause harm or injury.' }),
      ],
      actions: { draw2: ce(48), draw4: ce(50), exchange: ce(52), steal: ce(54), addword: ce(56) },
    },
  };

  // Thẻ cố định (bộ Core): người quản trò ghi từ lên thẻ trước khi chơi
  const core = { S: 'assets/cards/core/1.webp', AUX: 'assets/cards/core/7.webp', T: 'assets/cards/core/13.webp', back: 'assets/cards/core/20.webp' };

  // ---------- Thẻ chức năng (luật mục A.2) ----------
  const actions = {
    draw2: { name: '+2', en: 'Draw 2', glyph: '➕2', desc: 'Rút 2 lá bài.', copies: 2 },
    draw4: { name: '+4', en: 'Draw 4', glyph: '➕4', desc: 'Rút 4 lá bài.', copies: 2 },
    steal: { name: 'STEAL', en: 'Steal', glyph: '💰', desc: 'Cướp ngẫu nhiên 1 lá bài từ tay một người chơi khác.', copies: 2, target: true },
    exchange: { name: 'Exchange Card', en: 'Exchange', glyph: '🔄', desc: 'Đổi 1 lá bài của bạn lấy 1 lá ngẫu nhiên của một người chơi khác.', copies: 2, target: true },
    refresh: { name: 'Refresh', en: 'Refresh', glyph: '♻️', desc: 'Bỏ hết lá bài trên tay và rút lại đúng số lá tương ứng.', copies: 2 },
  };
  const ADDWORD = { copies: 3, desc: 'Thay thế bất cứ lá bài nào mà bạn muốn sử dụng (chọn 1 từ bất kỳ).' };

  // Luật đặt câu của quản trò (luật mục B)
  const RULES = {
    present: { name: 'Thì hiện tại đơn', tenses: ['present', 'bePres', 'passivePres'], aux: (a) => (a.kind === 'do' || a.kind === 'be') && a.tense === 'present', time: ['habit', 'freq', 'any'] },
    past: { name: 'Thì quá khứ đơn', tenses: ['past', 'bePast', 'passivePast'], aux: (a) => (a.kind === 'do' || a.kind === 'be') && a.tense === 'past', time: ['past', 'freq', 'any'] },
    future: { name: 'Thì tương lai đơn (will)', tenses: ['future'], aux: (a) => a.tense === 'future', time: ['future', 'any'] },
    progressive: { name: 'Thì hiện tại tiếp diễn', tenses: ['presProg'], aux: (a) => a.kind === 'be' && a.tense === 'present', time: ['now', 'any'] },
    perfect: { name: 'Thì hiện tại hoàn thành', tenses: ['perfect'], aux: (a) => a.kind === 'have', time: ['perfect', 'any'] },
    modal: { name: 'Động từ khuyết thiếu (can / should)', tenses: ['modal'], aux: (a) => a.tense === 'modal', time: ['habit', 'now', 'future', 'any'] },
    free: { name: 'Tự do (mọi thì)', tenses: null, aux: () => true, time: null },
  };

  const TYPE_INFO = {
    S: { name: 'Chủ từ', en: 'Subject', glyph: '👤' },
    V: { name: 'Động từ', en: 'Verb', glyph: '⚡' },
    N: { name: 'Danh từ', en: 'Noun', glyph: '📦' },
    A: { name: 'Tính / trạng từ', en: 'Adj / Adv', glyph: '✨' },
    T: { name: 'Thời gian', en: 'Time', glyph: '⏰' },
    AUX: { name: 'Trợ động từ', en: 'Auxiliary', glyph: '⚙️' },
    L: { name: 'Liên kết', en: 'Linker', glyph: '🔗' },
    ACTION: { name: 'Chức năng', en: 'Function', glyph: '★' },
    ADDWORD: { name: 'Addword', en: 'Addword', glyph: '✚' },
  };

  EW.DATA = { subjects, auxes, times, linkers, topics, core, actions, ADDWORD, RULES, TYPE_INFO };
})();
