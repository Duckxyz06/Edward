# EdWords – Sentence Battle (bản web)

Trò chơi thẻ bài đối kháng giúp sinh viên không chuyên tiếng Anh **vận dụng từ vựng và ngữ pháp** bằng cách ghép câu. Đây là bản số hóa của mô hình board game *EdWords Sentence Battle* do nhóm sinh viên nghiên cứu, Khoa Ngoại ngữ, Trường Đại học Đồng Tháp đề xuất. Bản web trình bày theo phong cách sân đấu thẻ bài: có phase trong lượt, thẻ úp và phản đòn.

## Chạy game

Không cần cài đặt hay build. Chỉ cần mở `index.html` bằng Chrome hoặc Edge (bấm đúp vào file là được).

Có thể đăng lên GitHub Pages để sinh viên chơi qua đường link: vào Settings → Pages → chọn nhánh, thư mục `/`.

## Tính năng

| Theo thuyết minh | Trong bản web |
|---|---|
| Thẻ S, L, AUX, T, V, N, A, thẻ hành động, Addword | Đủ 9 loại thẻ, mỗi loại một màu khung riêng |
| 5 lá trên tay + 6 thẻ cố định do quản trò công bố | Màn hình "Quản trò công bố" trước trận: 2 S, 1 T, 2 AUX, 1 L, giống nhau cho cả hai bên |
| Rút bài, dùng thẻ hành động, ghép câu | Các phase DRAW → MAIN → CHECK → END |
| Đặt câu đúng được 1 điểm, ai đạt 5 điểm trước thì thắng, hoặc thắng theo thời gian | Điểm mục tiêu 3/5/7, giới hạn thời gian trận và thời gian mỗi lượt |
| Sửa lỗi đồng đẳng (peer-correction) | Thách đấu câu của máy bằng cách chỉ vào thẻ sai |
| Rèn phát âm, kỹ năng nói | Máy đọc câu (TTS) và chế độ luyện nói qua micro |
| Ghi nhận lỗi ngôn ngữ, phiếu theo dõi | Thống kê lỗi theo 8 nhóm, xuất file CSV |
| Điều chỉnh chủ đề và độ khó | 3 chủ đề + tổng hợp, chọn cấu trúc ngữ pháp, 3 mức độ khó của máy |

## Giao diện

Giao diện được dựng theo **EDWORDS UI Kit & Design System v1.1**, phong cách *Fantasy Academy × Tactical Card Duel × Premium Sci-fi HUD*:

- Bảng màu: nền midnight navy, panel kính indigo, viền kim loại vàng, ánh sáng cyan/violet.
- Màu từng nhóm thẻ: S cyan, V violet, N amber, A green, T magenta, AUX azure, L teal, Action electric blue.
- Font: Cinzel / Marcellus cho tiêu đề, Be Vietnam Pro cho nội dung.
- Thành phần: thanh HUD trên cùng, widget người chơi (chân dung, khiên điểm, tinh thể tiến độ), bảng đá *Sentence Zone* có các lane gợi ý, nút **End Turn** khung vàng, hiệu ứng vệt sáng cyan–gold khi câu đúng.

Ảnh trong `assets/` (logo, chân dung, khung End Turn, cảnh nền) được cắt từ gói UI Kit. Mọi chữ, số và nút đều được dựng lại bằng HTML/CSS như tài liệu hướng dẫn khuyến nghị.

## Cấu trúc mã nguồn

```
index.html          Các màn hình
assets/             Ảnh lấy từ EDWORDS UI Kit
css/style.css       Giao diện
js/data.js          Ngân hàng thẻ: từ vựng, trợ động từ, thời gian, thẻ hành động (giảng viên có thể sửa)
js/grammar.js       Bộ kiểm tra ngữ pháp ("quản trò" tự động)
js/ai.js            Đối thủ máy
js/game.js          Luật chơi, trạng thái trận
js/ui.js            Vẽ sân đấu và các tương tác
js/speech.js        Đọc câu, nhận dạng giọng nói, âm thanh
js/main.js          Thiết lập trận, thư viện thẻ, lịch sử, kết quả
tests/grammar.test.js
```

Chạy test ngữ pháp:

```bash
node tests/grammar.test.js
```

Xem thiết kế chi tiết trong [docs/THIET_KE.md](docs/THIET_KE.md).
