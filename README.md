# EdWords – Sentence Battle (bản web)

Trò chơi thẻ bài giúp sinh viên không chuyên tiếng Anh **vận dụng từ vựng và ngữ pháp**. Đây là bản số hóa của mô hình board game *EdWords Sentence Battle* do nhóm sinh viên nghiên cứu, Khoa Ngoại ngữ, Trường Đại học Đồng Tháp xây dựng. Ảnh thẻ lấy từ bộ thẻ in của nhóm (kho [Duckxyz06/Board-game](https://github.com/Duckxyz06/Board-game)).

## Chạy game

Không cần cài đặt hay build. Chỉ cần mở `index.html` bằng Chrome hoặc Edge (bấm đúp vào file là được). Game chơi được cả khi không có mạng, vì font, ảnh và nhạc đều nằm sẵn trong thư mục.

Có thể đăng lên GitHub Pages để sinh viên chơi qua đường link: vào Settings → Pages → chọn nhánh, thư mục `/`.

## Hai chế độ chơi

### ✍️ Ghép câu (4–6 người) – luật của nhóm

| Luật | Trong game |
|---|---|
| Lá cố định S, AUX, T do quản trò ghi từ | Màn hình thiết lập có mục **Quản trò**: chọn luật đặt câu và từ cho thẻ S, AUX, T (thêm thẻ L nếu cho phép câu ghép) |
| Bộ bài chủ đề gồm N, V, A, lá chức năng, Addword | 3 bộ bài in thật: **Shopping (Unit 8)**, **Natural Disasters (Unit 9)**, **Environmental Protection**, đúng số lá như bản in |
| +2, +4, STEAL, Exchange Card, Refresh | Đủ 5 lá chức năng; STEAL và Exchange chọn được người chơi mục tiêu |
| Addword thay thế bất cứ lá nào | Chọn 1 từ bất kỳ (S, V, N, A, T, AUX) |
| 4–6 người, 5 lá trên tay + 3 lá cố định | Bạn và 3–5 người chơi máy, dùng chung 1 bộ bài |
| Người chơi đầu tiên rút bài | Bốc thăm người đi trước, mỗi lượt rút 1 lá |
| Kết hợp bài trên tay và lá cố định thành câu đơn | Bảng Sentence Zone; chọn dạng từ cho V (V, V-s/es, V2, V-ing, V3), N (a/an, the, số nhiều), A (tính từ hoặc trạng từ như in trên thẻ) |
| Các thành viên còn lại đánh giá ngữ pháp và nghĩa | Mọi người bỏ phiếu **Đúng/Sai**, có thể chỉ ra thẻ sai. Đa số chấp nhận thì +1 điểm, hòa phiếu thì quản trò quyết định. Sau đó quản trò (máy) nhận xét lỗi và gợi ý câu đúng |
| Nhiều điểm nhất trong thời gian cố định thì thắng | Thời gian trận 10–45 phút, tùy chọn kết thúc sớm khi đạt 5/7/10 điểm |
| Luật có thể thay đổi tùy mục đích | Có các luật tùy chọn: thêm thẻ L, rút bổ trợ khi không có động từ, gợi ý ngữ pháp, luyện nói qua micro |

### 🎨 Đấu màu (2–6 người) – bộ bài 4 màu

- Bộ bài 115 lá từ thư mục *Bộ bài board game*, gồm 4 màu chủ đề: gia đình và quần áo, đồ dùng học tập và nhà cửa, động vật và đồ chơi, đồ ăn và phương tiện.
- Đánh lá **cùng màu**, **cùng Level (0–9)** hoặc cùng loại lá chức năng. Có các lá Skip, Reverse, Draw 2, Wild, Wild draw 4. Ai hết bài trước thắng.
- Mỗi lần đánh lá từ vựng phải **trả lời đúng câu hỏi**: chọn nghĩa tiếng Việt, chọn dạng số nhiều, hoặc nghe phát âm rồi chọn từ. Trả lời sai thì giữ lá và rút phạt 1 lá.
- Cuối trận có danh sách **từ cần ôn**.
- Ghi chú về bộ bài:
  - Lá *Game* dùng hình nhân vật có bản quyền nên không đưa vào bản số.
  - Lá con mèo bị in nhầm chữ *Baby* nên trong game dùng tên *Cat*.

## Giao diện và âm thanh

- Giao diện theo **EDWORDS UI Kit & Design System**: nền xanh đêm, panel kính chàm, viền vàng; màu nhóm thẻ S cyan, V tím, N hổ phách, A xanh lá, T hồng, AUX xanh dương.
- Font đủ dấu tiếng Việt, lưu sẵn trong máy: **Playfair Display** cho tiêu đề và **Be Vietnam Pro** cho nội dung (giấy phép SIL OFL).
- Nhạc nền do trình duyệt tự tạo (WebAudio), không dùng file nhạc nên không lo bản quyền. Có nút bật/tắt và thanh chỉnh âm lượng.
- Máy đọc mẫu câu và từ vựng (TTS).

## Dữ liệu cho nghiên cứu

Mỗi câu hoặc câu hỏi trong trận được lưu lại, gồm: lượt, người chơi, câu, phiếu đánh giá, kết luận của quản trò, mã lỗi và điểm. Dữ liệu xuất được ra file CSV từ màn hình kết quả hoặc màn hình *Lịch sử & phiếu theo dõi*.

## Cấu trúc mã nguồn

```
index.html            Các màn hình
assets/cards/         Ảnh thẻ in (shopping, disasters, environment, core, color)
assets/               Logo, chân dung, khung End Turn, nền (từ UI Kit)
css/style.css         Giao diện · css/fonts.css: font tiếng Việt
js/data.js            Ngân hàng thẻ 3 chủ đề, thẻ cố định, lá chức năng, luật đặt câu (giảng viên có thể sửa)
js/grammar.js         Bộ kiểm tra ngữ pháp ("quản trò" tự động)
js/game.js            Luật chế độ Ghép câu
js/ai.js              Người chơi máy
js/ui.js              Giao diện chế độ Ghép câu
js/color.js           Chế độ Đấu màu (dữ liệu, luật, máy, giao diện)
js/speech.js          Đọc câu, nhận dạng giọng nói, hiệu ứng âm thanh
js/music.js           Nhạc nền tự sinh
js/main.js            Thiết lập trận, thư viện thẻ, lịch sử, kết quả
tests/grammar.test.js Kiểm thử bộ chấm ngữ pháp
```

Chạy test ngữ pháp:

```bash
node tests/grammar.test.js
```

Xem thiết kế chi tiết trong [docs/THIET_KE.md](docs/THIET_KE.md).
