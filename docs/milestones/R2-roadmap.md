# R2 — Bếp chung, phối hợp và chín ca làm

17/10/2026. Theo yêu cầu tiếp tục mục 1–9, giữ M0/M1 đã có và triển khai phần còn thiếu.

## Đã triển khai

- M2: handoff E, Q thả, F ném nguyên liệu, bắt tự động khi tay trống; quỹ đạo, rơi sàn, đáp quầy, nhặt, chặn bởi vật cản; kiểm tra giữ duy nhất một chủ sở hữu.
- M3: cửa sổ chuyển đồ hai vùng của cùng bếp; đồ/dụng cụ/điểm cùng chia sẻ. Đường đi chứng minh bắt buộc chuyển đồ. Solo dùng Tab/nút Đổi. PvP có lối vòng để không khóa nguyên liệu của một bên.
- M4: băng chuyền 3 ô quay đồng thời mỗi 6s, cửa chắn cảnh báo 2s trước đóng, không đóng xuyên người; quầy di chuyển giữ đồ và dừng trước người; nền ướt. Pause/reset đóng băng mọi cơ chế.
- M5: giữ 6 công thức/3 quy trình đã có; thêm báo sắp cháy, lửa lan theo khoảng cách sau 8s, quầy cháy không dùng được nhưng luôn dập được, điểm giao có breakdown base/tip/combo/rush.
- M6: chế độ Cùng phụ bếp chung điểm; helper cố định phía nấu ở màn relay, nhận đồ thật, nấu/giao/rửa; nhường quầy người đang thao tác và chọn công việc khác. Bot so tài vẫn dùng luật thật; tìm đường lại trên bếp động.
- M7: 9 bố cục, menu, bài học, sao riêng; kiểm tra không chồng quầy, đủ đường đến mọi dụng cụ, bot so tài hoàn tất và đạt mốc mở khóa trên cả 9. Một sao mở màn kế, có luyện tập không lưu tiến trình.
- M8: 4 chef local; bộ phím không trùng, input tay cầm chuẩn, deadzone/edge/normalize, pause khi tay cầm mất.
- M9: phòng mã 6 ký tự, co-op 4 / PvP 2; host authoritative, chỉ nhận input, snapshot 20Hz; input sequence chống lặp; giữ ghế/vật khi reconnect, thả đồ khi rời ghế, không tiếp tục mô phỏng khách khi mất host.
- Hình ảnh/âm thanh/hiệu năng: ba bộ cảnh, vật liệu cảng riêng, dấu hướng ném, FX thao tác/cảnh báo/giao món, giảm geometry churn, A* heap, bỏ SSAO/bloom/MSAA hậu kỳ, shadow 1024, DPR mặc định 1; ba mức chất lượng và hạ khi FPS thấp.

## Bằng chứng đã chạy

110 ca tự động: 106 ca toàn bộ simulation/render/input/snapshot và 4 ca protocol phòng (ghế, đầy phòng, reconnect, input lặp, rời ghế, callback phòng cũ). Build production thành công.

- Unit/integration: engine, all recipe families, shared inventory/points, movement collisions/dash, item ownership/catch swept, layout reachability/non-overlap, fire recovery, conveyor atomic rotation, safe gates, moving counter, unlock, 4 independent inputs, online snapshot round-trip / invalid and repeated inputs.
- Bot helper: chơi trọn thời lượng các màn không phân vùng; relay nhận nguyên liệu do test chuyển qua hatch và tự phục vụ trên phía của mình. Bot đối thủ: chơi trọn 9 ca, có đơn phục vụ thật và điểm >= mốc một sao ở từng ca.
- Browser: E lấy cà chua → Q thả → E nhặt → F ném. Solo relay Tab chuyển P1→P2 rồi WASD chỉ di chuyển P2. Menu local 4 người, P3 di chuyển riêng. Luyện tập mở được màn 5/9; helper đã phục vụ salad trên màn băng chuyền trong trình duyệt.
- Online: host + 3 khách cùng máy qua PeerJS thật. P2 input xuất hiện đúng ở host; P2 lấy thịt, ném cho P1 tự bắt, hai bên thấy một vật. P2 vào lại đúng ghế/giữ nguyên thịt, host pause. P3/P4 di chuyển độc lập, host roster [0,1,2,3]. Ảnh `/Users/trungducng/Desktop/Overcook/kitchen-rush-online-four.png`.
- Trước chỉnh vị trí quầy cuối: 60fps ở 609×804 và 1280×800 trên máy QA, preset Mượt. Đây là một máy, không cam kết cho mọi thiết bị. Bỏ hậu kỳ có thể giảm độ mềm của bóng/ánh sáng.

## Còn phải nghiệm thu

Không gọi toàn bộ game giống Overcooked 90%. Chưa có đánh giá cảm giác/độ vui với bốn người thật, cân bằng đủ ba sao theo lượt chơi người, tay cầm thật và các mạng/thiết bị độc lập. Online chưa có TURN riêng, host migration hay lưu phòng khi đóng host. Chín ca đã làm và kiểm tra được; các cổng yêu cầu người/máy thật vẫn mở, không tự đổi checklist để ghi đạt 90%.
