# M1 — Di chuyển, va chạm và lướt

Trạng thái: đạt 9/10 ca kỹ thuật (90 điểm), ngày 16/10/2026. Cổng 90 điểm, mọi ca bắt buộc đạt. Checklist chốt trước triển khai; mỗi ca 10 điểm.

| Ca | Bắt buộc | Điều kiện đạt | Kết quả |
| --- | --- | --- | --- |
| 1 | Có | Đi bộ và lướt không xuyên quầy/biên ở 20–144 FPS, kể cả frame dài | Đạt |
| 2 | Có | Hai đầu bếp gặp trực diện/dash không xuyên hoặc chồng người, không đẩy xuyên quầy | Đạt |
| 3 | Có | Trượt dọc tường/góc; đi chéo và đổi hướng thoát được sau khi bị chặn | Đạt |
| 4 | Có | Lướt theo hướng đã chọn, có hồi chiêu và phản hồi rõ; không spam, không rơi vật đang cầm | Đạt |
| 5 | Không | Co-op/PvP hai bàn phím dùng cùng luật; P2 lướt độc lập, đồ và điểm không bị đổi bởi va chạm | Đạt |
| 6 | Không | Solo không va chạm nhân vật ẩn; cảm ứng có di chuyển/lướt cùng hàm xử lý | Đạt |
| 7 | Không | Bot tránh người và tìm đường lại sau khi bị chắn; giữ vòng nấu/rửa trên ba map | Đạt |
| 8 | Có | Phục hồi vị trí chồng nhau khi khởi tạo/đổi trạng thái; không kẹt vĩnh viễn ở góc | Đạt |
| 9 | Có | Pause/blur/reset/đổi map không làm lướt tiếp ngoài ý muốn; toàn bộ regression đạt | Đạt |
| 10 | Không | Chơi thật kiểm tra góc camera, thao tác va chạm–thoát–lướt, bố cục desktop/mobile dễ đọc | Một phần; chưa chấm điểm |

Không bao gồm ném/bắt, đẩy đồ, phạt rơi đồ hay map động: các phần đó theo mốc sau. Độ vui với nhóm người thật vẫn cần phản hồi thực tế.

## Bằng chứng

- `npm test`: 54/54 đạt; `npm run build`: thành công.
- `tests/movement.test.js`: kiểm tra 20/30/60/144 FPS, frame 250ms, lướt vào người/quầy/biên, trượt góc, phục hồi chồng người, giữ vật đang cầm và reset. Chạy 2.500 bước đi/lướt thay đổi hướng trên từng map, luôn giữ khoảng cách và không xuyên quầy.
- Mỗi map có ca bot nấu trọn trận khi người đứng chắn gần thớt rồi rời đi; bot không chồng người và vẫn giao được món. Các test cũ về món ăn, rửa đĩa, điểm và pause tiếp tục đạt.
- Browser PvP: đưa hai đầu bếp lại gần bằng bàn phím; khoảng cách tiếp xúc xấp xỉ 0,70 đơn vị, đầu bếp có thể lách ra. Kiểm tra nút mũi tên cảm ứng và LƯỚT trên bố cục nhỏ: nhân vật di chuyển, nút/thanh báo hồi chiêu hoạt động, phím được nhả sau thao tác.
- Browser bot/cảng: kho đĩa đã tách khỏi bàn ráp; bot hoàn thành salad và burger, được 507 điểm sau hai món trong lần quan sát. Console không có error trong ca này.
- Browser PvP với mã phím ShiftRight: chỉ P2 di chuyển/lên hồi chiêu (0,9s), P1 vẫn sẵn sàng.
- Browser pause giữa cú lướt: dash về 0, phím giữ được xóa, cooldown giữ nguyên khi đang pause. Reset/đổi map trả vận tốc và cooldown về 0.
- Camera đã kiểm tra trên bố cục nhỏ và desktop 1440×1000: các quầy tương tác vẫn nằm trong khung bếp.

## Hành vi đã chốt

Lướt 0,17 giây, tốc độ 10,5 đơn vị/giây và hồi chiêu 1,1 giây. Nếu đang đứng yên thì lướt theo hướng đang nhìn; nếu đang đi thì dùng hướng đi tại lúc kích hoạt. Không đổi hướng giữa cú lướt. Va chạm chính diện dừng cú lướt; tiếp xúc xiên có thể trượt qua. Vùng sàn ướt ảnh hưởng cùng luật với đi bộ. Va chạm không đổi chủ sở hữu vật, không cộng/trừ điểm và không đẩy đầu bếp khác.

Đã sửa lỗi bố trí cũ: kho đĩa map cảng trùng tọa độ bàn ráp. Thêm kiểm tra vị trí quầy duy nhất trên mọi map.

Ca 10 còn chờ chơi dài bằng người thật và điện thoại thật để chốt cảm giác điều khiển. Kiểm tra trình duyệt và test tự động không thay thế được đánh giá độ vui của nhóm người chơi. M1 đạt cổng kỹ thuật; không kết luận toàn game đã đạt 90% độ giống Overcooked! 2. M2 là phần kế tiếp, chưa triển khai trong bản này.
