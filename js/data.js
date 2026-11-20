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

  // ---------- V / N / A theo chủ đề ----------
  // obj: none | opt | req | adj ; objTags: loại danh từ phù hợp làm tân ngữ
  const V = (base, s, past, ing, pp, vi, obj, objTags, extra = {}) => ({
    id: id('V'), type: 'V', word: base, forms: { base, s, past, ing, pp }, vi, obj, objTags, ...extra,
  });
  // det: '' | 'a' | 'the' | 'my' ... ; number: 3s | 3p
  const N = (det, head, number, tags, vi) => ({
    id: id('N'), type: 'N', det, head, number, tags, vi, word: (det ? det + ' ' : '') + head,
  });
  // kind: adj | adv | place ; tags: (tính từ) loại danh từ/chủ ngữ phù hợp
  const A = (word, kind, vi, tags) => ({ id: id('A'), type: 'A', word, kind, vi, tags });

  const topics = {
    daily: {
      name: 'Đời sống hằng ngày',
      en: 'Daily Life',
      icon: '🏠',
      verbs: [
        V('eat', 'eats', 'ate', 'eating', 'eaten', 'ăn', 'opt', ['food']),
        V('drink', 'drinks', 'drank', 'drinking', 'drunk', 'uống', 'opt', ['drink']),
        V('cook', 'cooks', 'cooked', 'cooking', 'cooked', 'nấu', 'opt', ['food']),
        V('buy', 'buys', 'bought', 'buying', 'bought', 'mua', 'req', ['food', 'drink', 'thing']),
        V('clean', 'cleans', 'cleaned', 'cleaning', 'cleaned', 'dọn dẹp', 'opt', ['home', 'thing']),
        V('watch', 'watches', 'watched', 'watching', 'watched', 'xem', 'opt', ['media', 'sport']),
        V('listen to', 'listens to', 'listened to', 'listening to', 'listened to', 'nghe', 'req', ['music', 'media', 'person'], { noPassive: true }),
        V('go to', 'goes to', 'went to', 'going to', 'gone to', 'đi đến', 'req', ['place', 'home'], { noPassive: true }),
        V('help', 'helps', 'helped', 'helping', 'helped', 'giúp đỡ', 'opt', ['person']),
        V('wake up', 'wakes up', 'woke up', 'waking up', 'woken up', 'thức dậy', 'none', null, { noPassive: true }),
        V('sleep', 'sleeps', 'slept', 'sleeping', 'slept', 'ngủ', 'none', null),
        V('feel', 'feels', 'felt', 'feeling', 'felt', 'cảm thấy', 'adj', null, { noPassive: true }),
      ],
      nouns: [
        N('', 'rice', '3s', ['food'], 'cơm'),
        N('', 'bread', '3s', ['food'], 'bánh mì'),
        N('', 'breakfast', '3s', ['food'], 'bữa sáng'),
        N('', 'coffee', '3s', ['drink'], 'cà phê'),
        N('', 'milk tea', '3s', ['drink'], 'trà sữa'),
        N('', 'music', '3s', ['music'], 'âm nhạc'),
        N('the', 'news', '3s', ['media'], 'bản tin'),
        N('a', 'movie', '3s', ['media'], 'một bộ phim'),
        N('my', 'room', '3s', ['home', 'place'], 'phòng của tôi'),
        N('the', 'kitchen', '3s', ['home', 'place'], 'nhà bếp'),
        N('the', 'market', '3s', ['place'], 'chợ'),
        N('a', 'phone', '3s', ['thing'], 'một chiếc điện thoại'),
        N('my', 'parents', '3p', ['person'], 'bố mẹ tôi'),
        N('my', 'brother', '3s', ['person'], 'anh/em trai tôi'),
      ],
      adjs: [
        A('happy', 'adj', 'vui vẻ', ['person']),
        A('tired', 'adj', 'mệt', ['person']),
        A('busy', 'adj', 'bận rộn', ['person', 'place']),
        A('hungry', 'adj', 'đói', ['person']),
        A('delicious', 'adj', 'ngon', ['food', 'drink']),
        A('new', 'adj', 'mới', ['thing', 'home', 'media', 'place']),
        A('quickly', 'adv', 'một cách nhanh chóng'),
        A('carefully', 'adv', 'một cách cẩn thận'),
        A('slowly', 'adv', 'một cách chậm rãi'),
        A('at home', 'place', 'ở nhà'),
        A('in the kitchen', 'place', 'trong bếp'),
      ],
    },
    school: {
      name: 'Học tập ở trường',
      en: 'School & Study',
      icon: '🎓',
      verbs: [
        V('study', 'studies', 'studied', 'studying', 'studied', 'học', 'opt', ['subject', 'language']),
        V('learn', 'learns', 'learned', 'learning', 'learned', 'học, tiếp thu', 'opt', ['subject', 'language', 'word']),
        V('read', 'reads', 'read', 'reading', 'read', 'đọc', 'opt', ['text']),
        V('write', 'writes', 'wrote', 'writing', 'written', 'viết', 'opt', ['text']),
        V('speak', 'speaks', 'spoke', 'speaking', 'spoken', 'nói', 'opt', ['language']),
        V('do', 'does', 'did', 'doing', 'done', 'làm', 'req', ['task']),
        V('finish', 'finishes', 'finished', 'finishing', 'finished', 'hoàn thành', 'req', ['task', 'text']),
        V('pass', 'passes', 'passed', 'passing', 'passed', 'vượt qua (kỳ thi)', 'req', ['exam']),
        V('ask', 'asks', 'asked', 'asking', 'asked', 'hỏi', 'opt', ['person', 'question']),
        V('answer', 'answers', 'answered', 'answering', 'answered', 'trả lời', 'opt', ['question']),
        V('teach', 'teaches', 'taught', 'teaching', 'taught', 'dạy', 'opt', ['subject', 'language', 'person']),
        V('go to', 'goes to', 'went to', 'going to', 'gone to', 'đi đến', 'req', ['place'], { noPassive: true }),
      ],
      nouns: [
        N('', 'English', '3s', ['language', 'subject'], 'tiếng Anh'),
        N('', 'math', '3s', ['subject'], 'môn toán'),
        N('', 'history', '3s', ['subject'], 'môn lịch sử'),
        N('', 'new words', '3p', ['word'], 'từ mới'),
        N('a', 'book', '3s', ['text'], 'một quyển sách'),
        N('an', 'email', '3s', ['text'], 'một bức thư điện tử'),
        N('the', 'report', '3s', ['text', 'task'], 'bản báo cáo'),
        N('my', 'homework', '3s', ['task'], 'bài tập về nhà'),
        N('the', 'final exam', '3s', ['exam'], 'kỳ thi cuối kỳ'),
        N('a', 'question', '3s', ['question'], 'một câu hỏi'),
        N('the', 'library', '3s', ['place'], 'thư viện'),
        N('', 'school', '3s', ['place'], 'trường học'),
        N('our', 'teacher', '3s', ['person'], 'giáo viên của chúng tôi'),
        N('', 'students', '3p', ['person'], 'các sinh viên'),
      ],
      adjs: [
        A('difficult', 'adj', 'khó', ['subject', 'language', 'exam', 'task', 'question', 'text']),
        A('easy', 'adj', 'dễ', ['subject', 'language', 'exam', 'task', 'question', 'text']),
        A('interesting', 'adj', 'thú vị', ['subject', 'language', 'text', 'person']),
        A('good', 'adj', 'giỏi, tốt', ['person', 'text', 'subject']),
        A('ready', 'adj', 'sẵn sàng', ['person']),
        A('nervous', 'adj', 'lo lắng', ['person']),
        A('carefully', 'adv', 'một cách cẩn thận'),
        A('well', 'adv', 'tốt, giỏi'),
        A('quietly', 'adv', 'một cách yên lặng'),
        A('in class', 'place', 'trong lớp'),
        A('at the library', 'place', 'ở thư viện'),
      ],
    },
    travel: {
      name: 'Du lịch & giải trí',
      en: 'Travel & Free Time',
      icon: '🧳',
      verbs: [
        V('visit', 'visits', 'visited', 'visiting', 'visited', 'thăm', 'req', ['place', 'person']),
        V('travel to', 'travels to', 'traveled to', 'traveling to', 'traveled to', 'du lịch đến', 'req', ['place'], { noPassive: true }),
        V('take', 'takes', 'took', 'taking', 'taken', 'chụp / đi (xe)', 'req', ['photo', 'transport']),
        V('ride', 'rides', 'rode', 'riding', 'ridden', 'đạp, cưỡi (xe)', 'req', ['transport']),
        V('play', 'plays', 'played', 'playing', 'played', 'chơi', 'opt', ['sport', 'instrument']),
        V('enjoy', 'enjoys', 'enjoyed', 'enjoying', 'enjoyed', 'thích thú, tận hưởng', 'req', ['activity', 'place', 'food', 'media']),
        V('meet', 'meets', 'met', 'meeting', 'met', 'gặp', 'req', ['person']),
        V('book', 'books', 'booked', 'booking', 'booked', 'đặt (phòng, vé)', 'req', ['room', 'ticket']),
        V('swim', 'swims', 'swam', 'swimming', 'swum', 'bơi', 'none', null),
        V('walk', 'walks', 'walked', 'walking', 'walked', 'đi bộ', 'none', null),
        V('dance', 'dances', 'danced', 'dancing', 'danced', 'nhảy, múa', 'none', null),
        V('look', 'looks', 'looked', 'looking', 'looked', 'trông có vẻ', 'adj', null, { noPassive: true }),
      ],
      nouns: [
        N('', 'Da Lat', '3s', ['place'], 'Đà Lạt'),
        N('', 'Sa Dec', '3s', ['place'], 'Sa Đéc'),
        N('the', 'beach', '3s', ['place'], 'bãi biển'),
        N('a', 'museum', '3s', ['place'], 'một bảo tàng'),
        N('', 'photos', '3p', ['photo'], 'những bức ảnh'),
        N('a', 'bus', '3s', ['transport'], 'một chiếc xe buýt'),
        N('a', 'bike', '3s', ['transport'], 'một chiếc xe đạp'),
        N('', 'football', '3s', ['sport'], 'bóng đá'),
        N('', 'badminton', '3s', ['sport'], 'cầu lông'),
        N('the', 'guitar', '3s', ['instrument'], 'đàn ghi-ta'),
        N('a', 'hotel room', '3s', ['room'], 'một phòng khách sạn'),
        N('', 'tickets', '3p', ['ticket'], 'những tấm vé'),
        N('the', 'trip', '3s', ['activity'], 'chuyến đi'),
        N('my', 'friends', '3p', ['person'], 'những người bạn của tôi'),
      ],
      adjs: [
        A('beautiful', 'adj', 'đẹp', ['place', 'photo', 'person']),
        A('famous', 'adj', 'nổi tiếng', ['place', 'person']),
        A('cheap', 'adj', 'rẻ', ['ticket', 'room', 'transport', 'food']),
        A('excited', 'adj', 'hào hứng', ['person']),
        A('relaxed', 'adj', 'thư giãn', ['person']),
        A('fun', 'adj', 'vui', ['activity', 'sport', 'place']),
        A('happily', 'adv', 'một cách vui vẻ'),
        A('together', 'adv', 'cùng nhau'),
        A('fast', 'adv', 'nhanh'),
        A('in the park', 'place', 'trong công viên'),
        A('by the river', 'place', 'bên bờ sông'),
      ],
    },
  };

  // ---------- Thẻ hỗ trợ ----------
  const actions = {
    draw2: { name: 'Rút thêm', en: 'Word Rush', glyph: '🃏', desc: 'Rút 2 lá từ bộ bài.' },
    erase: { name: 'Xóa từ', en: 'Eraser', glyph: '🧽', desc: 'Đối thủ phải bỏ ngẫu nhiên 1 lá trên tay.', targetOpp: true },
    swap: { name: 'Đổi bài', en: 'Word Swap', glyph: '🔄', desc: 'Lấy ngẫu nhiên 1 lá trên tay đối thủ, rồi đưa lại cho họ 1 lá do bạn chọn.', targetOpp: true },
    lock: { name: 'Khóa thẻ', en: 'Lock', glyph: '🔒', desc: 'Chọn 1 thẻ cố định của đối thủ: thẻ đó bị khóa trong lượt kế tiếp của họ.', targetOpp: true },
    refresh: { name: 'Làm mới', en: 'Refresh', glyph: '♻️', desc: 'Bỏ bao nhiêu lá trên tay tùy ý, rồi rút lại đúng bấy nhiêu lá.' },
    combo: { name: 'Câu ghép ×2', en: 'Combo Bonus', glyph: '✖️2', desc: 'Trong lượt này, câu đúng có dùng thẻ liên kết (L) được tính 2 điểm.' },
    shield: { name: 'Lá chắn', en: 'Shield', glyph: '🛡️', desc: 'Úp lên sân (tối đa 2). Khi đối thủ dùng thẻ hành động nhắm vào bạn, lật lên để vô hiệu hóa thẻ đó.', set: true },
  };

  const FOCUS = {
    present: 'Hiện tại đơn (+ can/should)',
    past: 'Quá khứ đơn',
    future: 'Tương lai đơn (will)',
    progressive: 'Thì tiếp diễn',
    perfect: 'Hiện tại hoàn thành',
  };

  const TYPE_INFO = {
    S: { name: 'Chủ từ', en: 'Subject', glyph: '👤' },
    V: { name: 'Động từ', en: 'Verb', glyph: '⚡' },
    N: { name: 'Danh từ', en: 'Noun', glyph: '📦' },
    A: { name: 'Tính / trạng từ', en: 'Adj / Adv', glyph: '✨' },
    T: { name: 'Thời gian', en: 'Time', glyph: '⏰' },
    AUX: { name: 'Trợ động từ', en: 'Auxiliary', glyph: '⚙️' },
    L: { name: 'Liên kết', en: 'Linker', glyph: '🔗' },
    ACTION: { name: 'Hành động', en: 'Action', glyph: '★' },
    ADDWORD: { name: 'Thêm từ', en: 'Addword', glyph: '✚' },
  };

  EW.DATA = { subjects, auxes, times, linkers, topics, actions, FOCUS, TYPE_INFO };
})();
