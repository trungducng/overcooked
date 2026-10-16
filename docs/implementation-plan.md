# Lộ trình Kitchen Rush → trải nghiệm tham chiếu Overcooked! 2

Cập nhật: 17/10/2026. Tham chiếu chính là Overcooked! 2 vì có cơ chế ném nguyên liệu. Mục tiêu là độ sâu thao tác, phối hợp và áp lực căn bếp; hình ảnh và tài nguyên tiếp tục là thiết kế riêng.

## Bản triển khai mới nhất

M0/M1 được giữ lại. R2 đã có các cơ chế mục 3–9 theo yêu cầu mới: xử lý đồ, relay, bếp động, cháy lan, helper, chín ca, 4 local và phòng online. Chi tiết triển khai/bằng chứng/giới hạn tại [R2](milestones/R2-roadmap.md). Không còn dùng ba mức khó làm đại diện cho chín màn. M8 input đã kiểm tra tự động và keyboard trong browser; tay cầm vật lý chưa nghiệm thu. M9 đã nối 4 phiên cùng máy, chưa nghiệm thu mạng/thiết bị độc lập. Các cổng chơi thật chưa được tự chấm đạt.

## Quy tắc chuyển mốc

Làm tuần tự M0 → M10. Chỉ mở mốc tiếp theo khi mốc hiện tại đạt ít nhất 90% điểm nghiệm thu, mọi tiêu chí bắt buộc đều đạt và không còn lỗi chặn vòng chơi. Một mốc 90% không đồng nghĩa toàn game giống bản gốc 90%.

Mỗi mốc có 10 ca nghiệm thu, mỗi ca 10 điểm; đạt tối thiểu 9/10, không được bỏ ca lõi. Ghi bằng chứng tự động và chơi thật vào `docs/milestones/`. Nếu sửa gây hồi quy ở mốc đã đóng, mở lại và sửa trước. Không đổi checklist chỉ để nâng điểm. Cảm giác điều khiển và độ vui cần chơi thử, không suy ra từ số test unit.

Toàn bộ game chỉ được nhận mức 90% trong phạm vi đã thống nhất khi tổng điểm theo trọng số bên dưới ≥90%, mọi mốc lõi M0–M7 đạt cổng, và đã chơi trọn các màn đại diện ở solo, co-op, PvP và bot. Hiện **chưa đánh giá tổng mức tương đồng**; còn nhiều cơ chế chưa làm.

## Điều chỉnh ưu tiên hình ảnh

Theo phản hồi ngày 16/10/2026, thực hiện V1 — Đại sảnh Ánh Lửa trước M2: khung chơi toàn viewport, camera, dựng cảnh, vật liệu, ánh sáng, nhân vật và HUD. Xem `docs/milestones/V1-lantern-hall.md`. Không chờ tới M10 mới làm nền tảng hình ảnh; M10 giữ phần hoàn thiện âm thanh/animation và hiệu năng. Không lấy điểm nghiệm thu kỹ thuật để chấm độ giống hình ảnh.

## Thứ tự triển khai

| Mốc | Trọng số | Phần việc và kết quả cần có | Cổng nghiệm thu lõi | Trạng thái |
| --- | ---: | --- | --- | --- |
| M0 | 10% | Một bếp chung cho mọi chế độ; thớt/nồi/chảo/đĩa/bàn trống là vật thể chung; PvP giữ điểm theo người giao | Chuyển việc người A → B không nhân đôi/mất đồ; bot không kẹt vì đồ dở; đồng hồ bếp chạy một lần | Đạt 9/10 ca kỹ thuật; xem M0 |
| M1 | 10% | Di chuyển, va chạm đầu bếp, lướt, trượt dọc góc quầy; camera giữ đủ không gian thao tác | Hai người cản nhau có thể thoát; không xuyên quầy/kẹt góc; lướt dễ dự đoán bằng bàn phím và cảm ứng | Đạt 9/10 ca kỹ thuật; xem M1 |
| M2 | 10% | Lấy/đặt/handoff rõ ràng, thả xuống sàn, ném/bắt nguyên liệu hợp lệ; báo vật đang nhắm | Bắt khi tay trống, rơi khi không bắt, không ném vật cấm, không nhân đồ; người nhận tiếp tục chế biến | Đã triển khai; kiểm tra ownership và browser, xem M2/R2 |
| M3 | 15% | Màn buộc phân vai: khu sơ chế và nấu cách nhau, cửa chuyển đồ, tài nguyên bố trí lệch; solo đổi đầu bếp | Co-op cần chuyển đồ thật; solo vẫn hoàn thành; PvP hai phía có cơ hội công bằng trong một không gian | Đã triển khai relay/Tab; xem R2 |
| M4 | 15% | Bàn/cầu di chuyển, lối mở theo chu kỳ, băng chuyền, nền trơn và nguy cơ rơi; cảnh báo trước thay đổi | Vật/đầu bếp đi cùng nền đúng; không mắc kẹt vĩnh viễn; bot tìm đường lại; hồi sinh không mất quyền điều khiển | Đã triển khai belt/gate/quầy động; xem R2 |
| M5 | 10% | Tinh chỉnh chuỗi chế biến, nhiều dụng cụ/cỡ công thức, đơn/tip/combo, thiếu đĩa và cháy lan có cứu chữa | Áp lực đến từ nhiều công việc song song; phục hồi được sau sai sót; điểm có thể giải thích; bỏ bonus tự chế nếu làm lệch nhịp tham chiếu | Đã triển khai cháy lan/cứu quầy; xem R2 |
| M6 | 8% | Bot biết chia việc, giữ chỗ dụng cụ hợp lý, nhận đồ, tránh người và đổi kế hoạch trên map động | Chơi trọn các menu/map mà không cộng điểm giả; không giành đồ vô hạn; độ khó tăng quyết định chứ không gian lận luật | Đã triển khai helper và bot kiểm tra 9 ca; xem R2 |
| M7 | 10% | Chín màn thiết kế riêng, tiến trình dạy cơ chế từng bước, sao và mở khóa; nhịp căng–nghỉ rõ | Mỗi màn có bài toán phối hợp khác; kiểm chứng đường đi/khả năng hoàn thành; mục tiêu sao dựa trên lượt chơi thật | Đã triển khai 9 bố cục và unlock; xem R2 |
| M8 | 5% | 3–4 người local, gán điều khiển/tay cầm, tham gia lại, HUD phân biệt từng người | Bốn đầu bếp cùng thao tác không trùng input; pause/reconnect và co-op đều ổn | Đã triển khai 4 local; chờ tay cầm thật |
| M9 | 5% | Phòng online, chủ phòng, đồng bộ vật/đơn/timer, vào lại và xử lý mất mạng | Không nhân đồ/điểm; chịu độ trễ/mất kết nối trong lượt chơi; kiểm tra nhiều máy thật | Đã triển khai; 4 phiên cùng máy đạt, chưa nghiệm thu khác mạng |
| M10 | 2% | Màu sắc/ánh sáng, animation thao tác, âm thanh cảnh báo, rung và nhãn ngữ cảnh | Nhìn biết nguyên liệu và trạng thái từ xa; ít chữ nổi; âm thanh báo đúng hành động; kiểm tra máy yếu | Đã làm nền hình/FX/hiệu năng; chưa nghiệm thu máy yếu và nghe/chơi thật |

## Checklist cho từng mốc sau M0

Trước khi bắt đầu mỗi mốc, cụ thể hóa 10 ca từ các nhóm sau: (1–4) vòng chơi chính và biến thể quan trọng; (5) thao tác hai người; (6) solo; (7) bot; (8) sai sót/khôi phục; (9) pause/reset/đổi màn và hồi quy; (10) chơi thật đánh giá cảm giác, khả năng đọc hình và nhịp. Các ca 1–4, 8–9 bắt buộc. M3–M4 bắt buộc thêm ca co-op; M6 bắt buộc ca bot; M8–M9 có ca nhiều người/máy thật riêng. Chưa chạy được thì ghi chưa đạt, không tự tính điểm.

Mỗi lần giao bản: ghi phần hoàn thành, ca chưa đạt, bằng chứng, giới hạn và mốc tiếp theo. Không triển khai dàn trải nhiều mốc cùng lúc. Các cải tiến nhãn và màu đã có là nền ban đầu, chưa tính M10 hoàn thành.

## Nguồn thiết kế

- [Team17 — A–Z of Overcooked! 2](https://www.team17.com/news/the-a-z-of-overcooked-2): ném nguyên liệu, bếp biến đổi và chơi phối hợp.
- [Ghost Town Games — Building truly cooperative play](https://www.gamedeveloper.com/design/game-design-deep-dive-building-truly-cooperative-play-in-i-overcooked-i-): bố trí bếp tạo phụ thuộc, giao tiếp và phối hợp.
- [Team17 — Overcooked! 2 FAQ](https://www.team17.com/news/overcooked-2-faq): phạm vi chơi local/online.

Bản R2 thay ba cấu hình khó bằng chín ca thiết kế riêng. Ném/bắt, bếp động, helper, 4 local và phòng online đã có. Các yêu cầu nâng cao trước đây như nền mang chef/nguy cơ rơi, nhiều dụng cụ cùng loại, host migration và kiểm chứng mạng thật chưa được ghi đạt; xem giới hạn R2.
