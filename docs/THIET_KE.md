# Thiết kế game web EdWords – Sentence Battle

## 1. Mục tiêu

Chuyển mô hình board game trong thuyết minh (mục 10.2, 11, 14.2) thành một trò chơi web. Sinh viên có thể tự luyện ngoài giờ học, còn giảng viên vẫn dùng bộ thẻ in cho các buổi chơi nhóm 4–6 người. Bản web giữ nguyên luật chơi gốc và chỉ thêm những gì chỉ máy tính làm được:

- chấm câu tức thì,
- giải thích lỗi,
- đọc mẫu câu,
- ghi lại dữ liệu cho nghiên cứu.

Phong cách trình bày lấy cảm hứng từ các game đấu thẻ bài trực tuyến: có sân đấu, phase, thẻ úp và phản đòn (chain). Tên, thẻ, hình ảnh và giao diện đều là thiết kế riêng của EdWords.

## 2. Sân đấu

```
┌──────────┬──────────────────────────────────────┬───────────┐
│ Chi tiết │  Tay đối thủ (úp)                    │ Đồng hồ   │
│ thẻ      │  [Info] [6 thẻ cố định] [Úp] [Bộ bài]│ Phán xét  │
│ (nghĩa,  │  ── DRAW › MAIN › CHECK › END ──     │ (thách    │
│ dạng từ, │  ╔══════ BẢNG GHÉP CÂU ═══════╗      │  đấu)     │
│ cách     │  ║ S  AUX  V  N  A  T         ║      │ Nhật ký   │
│ dùng)    │  ╚════════════════════════════╝      │ trận      │
│          │  "She is cooking breakfast now."     │           │
│          │  [Info] [6 thẻ cố định] [Úp] [Bộ bài]│           │
│          │  Bài trên tay (xòe quạt)             │           │
└──────────┴──────────────────────────────────────┴───────────┘
```

## 3. Luật chơi

- **Chuẩn bị:** Bộ bài khoảng 48 lá. Máy tung đồng xu để chọn người đi trước, mỗi người bốc 5 lá.
- **Thẻ cố định:** Quản trò công bố 6 thẻ cố định (2 S, 1 T, 2 AUX, 1 L) theo cấu trúc ngữ pháp giảng viên chọn.
  - Thuyết minh ghi "6 thẻ (2 S, 1 T, AUX và L)", nên bản web dùng 2 AUX cho đủ 6 thẻ. Có thể sửa trong `Deck.fixedSet`.
- **DRAW:** Rút 1 lá. Nếu trên tay không có thẻ V, rút bổ trợ đến khi có (tối đa 3 lá) để tránh bị kẹt lượt.
- **MAIN:**
  - Dùng thẻ hành động, úp Lá chắn, dùng Addword.
  - Ghép câu từ bài trên tay và thẻ cố định. Câu phải dùng ít nhất 1 lá trên tay.
  - Với thẻ V, người chơi tự chọn dạng V, V-s/es, V2, V-ing hoặc V3. Đây là phần luyện ngữ pháp chính.
- **CHECK:** Máy chấm câu và đọc to câu.
  - Câu đúng: +1 điểm, hoặc +2 nếu đã kích hoạt *Câu ghép ×2* và câu có thẻ L.
  - Câu sai: hiện lỗi kèm gợi ý sửa, thẻ được trả lại tay.
- **END:** Trên tay giữ tối đa 8 lá.
- **Thắng:** Đạt điểm mục tiêu trước, hoặc nhiều điểm hơn khi hết giờ trận.

### Thách đấu (sửa lỗi đồng đẳng)

AI cố tình mắc lỗi theo độ khó: Dễ 35%, Vừa 22%, Khó 10%. Người chơi chọn **Chấp nhận** hoặc **Thách đấu**, rồi chỉ vào thẻ mình cho là sai.

| Trường hợp | Kết quả |
|---|---|
| Câu sai, chỉ đúng vị trí | Người chơi rút 2 lá, máy không được điểm |
| Câu sai, chỉ sai vị trí | Người chơi rút 1 lá, máy không được điểm |
| Câu đúng | Người chơi mất 1 lá, máy được điểm |
| Câu sai nhưng không ai thách đấu | Máy **vẫn được điểm**, quản trò hiện giải thích ("lỗi bị bỏ sót") |

### Thẻ hành động

| Thẻ | Hiệu ứng |
|---|---|
| 🃏 Rút thêm | Rút 2 lá |
| 🧽 Xóa từ | Đối thủ bỏ ngẫu nhiên 1 lá |
| 🔄 Đổi bài | Lấy 1 lá của đối thủ, đưa lại 1 lá |
| 🔒 Khóa thẻ | Khóa 1 thẻ cố định của đối thủ trong lượt kế tiếp của họ |
| ♻️ Làm mới | Bỏ lá tùy ý, rút lại bấy nhiêu lá |
| ✖️2 Câu ghép | Câu có thẻ L được 2 điểm |
| 🛡️ Lá chắn | Úp xuống sân; vô hiệu một thẻ hành động nhắm vào mình (chain) |
| ✚ Addword | Thêm 1 từ bất kỳ từ ngân hàng từ |

## 4. Bộ kiểm tra ngữ pháp (`js/grammar.js`)

Câu được tách thành các mệnh đề tại thẻ L. Mỗi mệnh đề được phân tích theo khung:

`[T đầu câu] S [tần suất] [AUX] [tần suất] [V] [N] [A] [T cuối câu]`

Câu hỏi Yes/No có dạng `AUX S …`.

| Nhóm lỗi | Ví dụ được phát hiện |
|---|---|
| Cấu trúc câu | thiếu chủ ngữ hoặc động từ; thừa động từ; *I happy* |
| Hòa hợp chủ ngữ – động từ | *she read* (nghĩa hiện tại), *they does*, *I is*, *she was students* |
| Dạng động từ | *will plays*, *is cook*, *have visited* (dùng V2 thay V3), *I eating* |
| Thì & trạng từ thời gian | *have visited … yesterday*, *are watching … yesterday* |
| Trật tự từ | *I play always*, *eats quickly rice*, *I always will* |
| Tân ngữ / bổ ngữ | *go to* thiếu danh từ; *sleep rice*; *help she* |
| Tính từ / trạng từ | *is happily*, *speaks English good* |
| Nghĩa / kết hợp từ | *drink the library*, *tired rice* (dựa trên nhãn nghĩa của thẻ) |

Ngoài ra bộ kiểm tra còn hỗ trợ:

- câu bị động đơn giản (*The report was written last week.*),
- câu ghép với and/but/so/because/when,
- tự thêm dấu phẩy, viết hoa và chọn mạo từ a/an (*an interesting email*).

## 5. Dữ liệu phục vụ nghiên cứu

Mỗi lần đặt câu, game ghi lại: lượt, người đặt câu, câu, đúng/sai, mã lỗi, chi tiết lỗi, có thách đấu không, kết quả và điểm.

Dữ liệu được lưu trên trình duyệt (localStorage) và có thể xuất file CSV từ màn hình kết quả hoặc màn hình "Lịch sử". File này dùng cho phiếu theo dõi các buổi thử nghiệm (mục 13.4) và phân tích lỗi ngôn ngữ.

## 6. Mở rộng tiếp theo

- Chế độ 2–6 người trên một máy hoặc qua mạng, giống buổi chơi nhóm thật.
- Thêm chủ đề từ vựng bám theo học phần Tiếng Anh 1–3.
- Thẻ có hình minh họa.
