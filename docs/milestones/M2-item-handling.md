# M2 — Chuyển đồ, thả, ném, bắt

17/10/2026. Vật nằm duy nhất trong tay / trên quầy / trong danh sách vật rơi. Handoff dùng E khi hướng mặt vào người tay trống ở gần. Q thả mọi vật, E nhặt sàn trước khi thao tác quầy. F chỉ ném nguyên liệu sống/đã thái. P2 Delete / dấu chấm. Có nút cảm ứng.

10 ca tự động trong `tests/handling.test.js`: chuyển đúng vật; từ chối tay bận/xa/phía sau; thả/nhặt mọi loại; thả cạnh tường; loại vật được ném; bắt ở bước thời gian lớn; không bắt khi bận/tự bắt; đáp quầy trống; quầy bận/biên không mất vật; vật cản chặn đường bay. 10/10 đạt. Hồi quy toàn bộ 68/68.

Browser localhost: lấy cà chua bằng di chuyển thật + E, Q thả, E nhặt, F ném. Quan sát canvas state: raw tomato chuyển tay → vật rơi → tay → vật bay, không tạo bản sao. Direct render sau bỏ SSAO/bloom ghi 60fps ở viewport 609×774 trên máy QA. Chưa suy rộng hiệu năng máy khác. Bắt/handoff hai người kiểm chứng ở simulation; trải nghiệm hai người thật dài hạn chưa chấm.
