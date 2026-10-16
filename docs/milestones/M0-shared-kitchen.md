# M0 — Một bếp chung

16/10/2026 — đạt 9/10 ca kỹ thuật (90 điểm). Không phải kết luận độ tương đồng toàn game. M1 là mốc kế tiếp, chưa triển khai trong bản này.

| Ca | Bắt buộc | Kết quả | Bằng chứng |
| --- | --- | --- | --- |
| 1. Một scene/camera, hai đầu bếp cùng không gian | Có | Đạt | Browser bot và PvP: một căn bếp, hai nhân vật; renderRooms chỉ render scene chung |
| 2. Một bộ quầy công khai, không có bộ quầy rival | Có | Đạt | Test station set duy nhất, mỗi loại thiết bị một quầy; 15 quầy trên browser |
| 3. A đặt thớt, B thái/lấy; không nhân đồ | Có | Đạt | Test cross-chef board |
| 4. Nồi/chảo dùng chung, thời gian chỉ chạy một lần | Có | Đạt | Test shared pot time sau match.tick(5) = 5; engine recipe/grill/fire regression |
| 5. Đĩa sạch/bẩn, rửa và bàn trống dùng chung | Có | Đạt | Test counter handoff + wash; browser PvP hai người mỗi người lấy một đĩa → kho cả hai cùng còn 2 |
| 6. Người giao nhận điểm; đơn/combo riêng cho PvP | Có | Đạt | Test PvP cả hai nấu/giao cùng pot, served mỗi bên 1; dirty chung = 2 |
| 7. Pause, kết thúc và đổi trận đồng bộ/reset | Có | Đạt | Test pause, results/tie; browser PvP pause và chuyển co-op harbor: tay trống, kho về 4 |
| 8. Bot nấu được cả ba quy trình, dùng đồ thật và rửa | Có | Đạt | Test mọi recipe, 3 map × 3 cấu hình, 3 trình độ; browser bot giao súp đạt 118đ |
| 9. Bot tiếp tục món dở và đổi kế hoạch khi người lấy đồ | Có | Đạt | Test partial soup/salad/grill/counter, human takes board; 37/37 test toàn suite đạt |
| 10. Chơi trọn vòng nhiều trận với hai người và can thiệp ngẫu nhiên | Không | Chờ | Đã smoke solo/co-op/PvP/bot; chưa có phiên hai người thực và stress can thiệp liên tục |

Build Vite thành công. Browser console không ghi nhận error trong ca đã kiểm tra. Nhãn H bật/tắt hoạt động; nhãn mặc định chỉ hiện ở quầy gần người và trạng thái đang chế biến.

Giới hạn: bot mới được kiểm chứng với các tình huống can thiệp xác định, chưa phải phân vai thông minh; va chạm giữa đầu bếp chưa có (M1). Ném/bắt, map động, chín màn thiết kế riêng, 4 người và online nằm ở mốc sau. Cảm giác vui/giữ chân chưa được đo bằng người chơi thực.
