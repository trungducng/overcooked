# Kitchen Rush: nghiên cứu và hướng nâng cấp

## Điều học được

- **Phối hợp là mục tiêu thiết kế.** Phil Duncan mô tả điều khiển đơn giản, lối đi hẹp và việc chuyển nguyên liệu giữa người chơi. Bố trí bếp thay đổi khiến nhóm phải đổi vai trong trận. [Bài viết trực tiếp của nhà thiết kế](https://www.gamedeveloper.com/design/game-design-deep-dive-building-truly-cooperative-play-in-i-overcooked-i-).
- **Có lý do để chơi lại.** Team17 nêu combo giao đúng thứ tự, mục tiêu ba sao, bếp biến đổi và ném nguyên liệu. Những cơ chế này tạo cơ hội tối ưu cách phối hợp. [The A–Z of Overcooked! 2](https://www.team17.com/news/the-a-z-of-overcooked-2).

## Suy luận thiết kế cho Kitchen Rush

Điểm yếu của bản cũ: các món chỉ thay nguyên liệu nhưng cùng một đường xử lý. Đổi màu map hoặc tăng quãng chạy không tạo đủ quyết định mới. Cần những công việc có thể làm song song, thiết bị phải canh, và lựa chọn giữa giao nhanh với giữ chuỗi thưởng.

## Đã triển khai trong bản 3

| Thay đổi | Quyết định người chơi phải đưa ra |
| --- | --- |
| Súp: thái → nồi → múc đĩa | Canh nồi và chuẩn bị món tiếp khi súp nấu |
| Salad: thái → ráp đĩa, không nấu | Giao món lạnh nhanh hay ưu tiên đơn đầu? |
| Burger: thái thịt → nướng → ráp với bánh và cà chua | Chia việc chuẩn bị bánh, cà chua trong lúc thịt nướng |
| Nồi và chảo đều cháy được | Bỏ công đoạn đang làm để cứu thiết bị? |
| Combo giao đúng thứ tự | Chấp nhận mất chuỗi để cứu đơn gần hết hạn? |
| Cao điểm 12 giây, mỗi 45 giây, +25% điểm | Chuẩn bị món để tận dụng đợt thưởng |
| Sàn rộng 25% ngang, 40% sâu | Có chỗ chia vai và di chuyển giữa các khu |
| Hai bếp độc lập trong thi đấu | Đấu hiệu suất công bằng; đủ kho và dụng cụ mỗi bên |

Công thức và đường chế biến hiển thị trên đơn; sổ tay món giải thích cách ráp. Bot đi lại và nấu qua cùng engine, dùng nguyên liệu/đĩa thật, tự rửa và dập lửa.

## Phạm vi còn lại

Chưa có địa hình biến đổi cấu trúc giữa trận, ném nguyên liệu, chơi mạng, hoặc số liệu để kết luận khả năng giữ chân người chơi. Các luận điểm về sức hấp dẫn ở trên là phân tích thiết kế, chưa phải kết quả kiểm chứng với người chơi Kitchen Rush. Bước đánh giá hữu ích tiếp theo là quan sát người mới học công thức, đo số trận họ chủ động chơi lại và các chỗ gây nhầm lẫn.
