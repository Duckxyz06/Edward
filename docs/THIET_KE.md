# Thiết kế game web EdWords – Sentence Battle

## 1. Mục tiêu

Bản web số hóa mô hình board game trong thuyết minh (mục 10.2, 11, 14.2). Game theo đúng luật chơi mới nhất của nhóm, dùng ảnh thẻ in thật và chỉ thêm những gì máy tính làm được:

- chấm câu tức thì,
- giải thích lỗi,
- đọc mẫu câu,
- ghi dữ liệu cho nghiên cứu.

## 2. Chế độ "Ghép câu" (luật của nhóm)

### A. Cấu trúc bộ bài

| Nhóm | Lá | Nguồn ảnh |
|---|---|---|
| Lá cố định | S (chủ từ), AUX (trợ động từ), T (thời gian / điều kiện). Quản trò ghi từ lên thẻ; game hiển thị từ đè lên mặt thẻ trắng | `Core Deck_Edwords_Sentence Battle` |
| Bộ bài chủ đề | N, V, A (đúng số lá như bản in), +2 ×2, +4 ×2, Exchange ×2, STEAL ×2, Addword ×3, Refresh ×2 | `Shopping`, `Natural Disaster`, `Environmental Protection` |

Lá Refresh không có ảnh trong kho nên game dựng mặt thẻ bằng CSS.

### B. Luật chơi

1. Có 4–6 người chơi: người dùng và 3–5 người chơi máy.
2. Quản trò chọn **luật đặt câu** (hiện tại đơn, quá khứ đơn, tương lai đơn, hiện tại tiếp diễn, hiện tại hoàn thành, can/should, hoặc tự do) và **từ cho thẻ S, AUX, T** (thêm L nếu bật câu ghép). Nút 🎲 gợi ý bộ từ phù hợp với luật đã chọn.
3. Chia 5 lá cho mỗi người từ bộ bài chung. Mỗi người có 3 lá cố định giống nhau.
4. Mỗi lượt diễn ra theo thứ tự: **rút 1 lá** → dùng lá chức năng → ghép câu đơn (ít nhất 1 lá trên tay) → xác nhận.
5. **Các thành viên còn lại bỏ phiếu** Đúng/Sai về ngữ pháp và nghĩa. Người dùng có thể chỉ ra thẻ sai.
6. Đa số chấp nhận thì **+1 điểm** và các lá đã dùng vào bãi bài. Hòa phiếu thì quản trò (máy) quyết định. Câu không được chấp nhận thì thẻ trả lại tay.
7. Sau mỗi lần bỏ phiếu, quản trò hiện kết luận đúng/sai, các lỗi và câu gợi ý sửa, để cả nhóm học, kể cả khi đa số đã đánh giá nhầm.
8. Hết thời gian cố định (10–45 phút), ai nhiều điểm nhất thắng. Có tùy chọn kết thúc sớm ở 5/7/10 điểm.

### Lá chức năng

| Lá | Hiệu ứng |
|---|---|
| +2 / +4 | Rút 2 / 4 lá |
| STEAL | Cướp ngẫu nhiên 1 lá từ tay người chơi được chọn |
| Exchange Card | Đưa 1 lá của mình, lấy 1 lá ngẫu nhiên của người chơi được chọn |
| Refresh | Bỏ hết lá trên tay, rút lại đúng số lá đó |
| Addword | Thay thế bất cứ lá nào: chọn 1 từ bất kỳ trong ngân hàng từ |

### Người chơi máy

- Đặt câu bằng cách thử các tổ hợp thẻ và dùng chính bộ chấm ngữ pháp.
- Cố tình mắc lỗi theo độ khó (Dễ 35%, Vừa 22%, Khó 10%) để người dùng luyện kỹ năng đánh giá.
- Khi chấm câu của người khác, độ chính xác của máy là 70% / 85% / 95% theo độ khó.

## 3. Chế độ "Đấu màu"

- Bộ bài 117 lá gồm 4 màu. Mỗi màu có 19 lá từ vựng Level 0–9, 2 lá Draw 2, 2 lá Skip, 2 lá Reverse, 2 lá Wild, 2 lá Wild draw 4.
- Bản số bỏ lá *Game* (hình nhân vật có bản quyền) và lá mặt sau, còn 115 lá.
- Đánh lá cùng màu, cùng Level hoặc cùng loại lá chức năng. Wild đánh lúc nào cũng được. Người hết bài trước thắng.
- Mỗi lần đánh lá từ vựng phải trả lời đúng một câu hỏi về từ đó: nghĩa tiếng Việt, dạng số nhiều, hoặc nghe rồi chọn từ. Trả lời sai thì giữ lá, rút phạt 1 lá và mất lượt.
- Cuối trận có danh sách từ trả lời sai để ôn lại.

## 4. Bộ kiểm tra ngữ pháp (`js/grammar.js`)

Câu được tách mệnh đề tại thẻ L, rồi phân tích theo khung sau:

`[T đầu câu] S [tần suất] [AUX] [tần suất] [V] [N] [A] [T cuối câu]`

Câu hỏi Yes/No có dạng `AUX S …`.

| Nhóm lỗi | Ví dụ |
|---|---|
| Cấu trúc câu | thiếu chủ ngữ hoặc động từ; *I cheap* |
| Hòa hợp chủ ngữ – động từ | *she buy*, *they does*, *supermarkets is* |
| Dạng động từ | *will buys*, *is sell*, *have visited … yesterday* |
| Thì & trạng từ thời gian | *have visited … yesterday* |
| Trật tự từ | *I buy always clothes*, *buys cheaply shoes* |
| Tân ngữ / bổ ngữ | *visit* thiếu danh từ; *bargain money* |
| Tính từ / trạng từ | *is popularly*, *bargains good* |
| Nghĩa / kết hợp từ | *spend the supermarket*, *buy an online shop* (dựa trên nhãn nghĩa của thẻ) |
| Luật của quản trò | câu thì quá khứ khi luật là "Thì hiện tại đơn" |

Ngoài ra bộ kiểm tra còn:

- tự thêm giới từ cho động từ cần nó (*go → go to the supermarket*),
- tự chọn mạo từ a/an (*an open-air market*), thêm dấu phẩy và viết hoa,
- hỗ trợ câu bị động đơn giản (*The shoes are sold cheaply.*).

## 5. Dữ liệu phục vụ nghiên cứu

File CSV gồm các cột: chế độ, người chơi, bộ bài, luật đặt câu, số người chơi, độ khó, kết quả trận, bảng điểm, lượt, người đặt câu, câu, quản trò chấm đúng/sai, phiếu đánh giá, có được chấp nhận không, mã lỗi, chi tiết lỗi và điểm.

## 6. Mở rộng tiếp theo

- Chế độ nhiều người chơi thật qua mạng hoặc chuyền máy trong lớp.
- Thêm các bộ bài chủ đề mới bằng cách bổ sung ảnh vào `assets/cards/<chủ đề>/` và khai báo trong `js/data.js`.
