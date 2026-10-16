# Kitchen Rush · phiên bản 2

Game nấu ăn 3D độc lập, dùng Three.js để tạo hình căn bếp, nguyên liệu và đầu bếp. Không dùng tài nguyên của Overcooked.

## Chạy và kiểm tra

```sh
npm install
npm run dev
npm test
npm run build
```

Vite in URL bản chơi; `dist/` là bản build tĩnh. Các kiểm tra bao gồm vòng nấu–giao–rửa, cháy nồi, quyền sử dụng quầy theo đội, tìm đường trên mọi map, cả chín level, bot ở ba trình độ, tạm dừng và kết quả trận.

## Bốn chế độ

- **Một mình:** săn ba sao trên từng màn.
- **Đồng đội:** hai người dùng chung thớt, nồi, đơn hàng, đĩa và điểm.
- **Đấu tay đôi (PvP):** hai người cùng máy, cùng bàn phím. Người 1 dùng thớt/nồi cam, người 2 dùng thớt/nồi xanh.
- **Đấu với bot:** bot dùng quầy xanh và tự tìm đường, lấy nguyên liệu, thái, nấu, lấy đĩa, giao món, rửa đĩa và dập lửa. Có Tập sự, Đầu bếp và Bếp trưởng; khác tốc độ đi và thời gian phản ứng, cùng luật nấu/điểm với người.

PvP và đấu bot dùng cùng thời gian trận và cùng chuỗi công thức. Mỗi bên có điểm, combo, đơn đang chờ, nồi, thớt và số đĩa riêng. Bỏ lỡ đơn bị trừ 20đ; điểm không xuống dưới 0. Điểm cao hơn khi hết giờ thắng; bằng điểm là hòa. Nguyên liệu và các bàn trống là không gian dùng chung. Hai nút ở danh sách đơn cho phép xem đơn từng bên. Chưa có chơi mạng giữa các máy.

## Ba bản đồ, chín màn

1. **Căn bếp ban mai:** đảo bếp dài, đi vòng hai bên.
2. **Bến cảng gió lộng:** hai đảo tách rời, lối giữa có vũng nước làm chậm bước chân (cả người lẫn bot).
3. **Chợ đêm đèn lồng:** vị trí nguyên liệu và bếp đổi phía, các đảo lệch tạo lối đi zích zắc.

Mỗi bản đồ có ba level, đều có thể chọn trực tiếp:

| Level | Thời gian trận | Hạn mỗi đơn | Nấu | Thời gian từ chín tới cháy | Mốc sao |
| --- | --- | --- | --- | --- | --- |
| Làm nóng bếp | 4:00 | 110 giây | 10 giây | 25 giây | 150 / 350 / 600đ |
| Giờ cao điểm | 3:30 | 88 giây | 9 giây | 20 giây | 180 / 400 / 650đ |
| Bếp trưởng | 3:00 | 72 giây | 8 giây | 16 giây | 200 / 420 / 680đ |

Kết thúc có thể tái đấu, sang màn kế hoặc đổi chế độ/map. Điểm tốt nhất và sao từng chế độ/map/level lưu trong trình duyệt (27 sao mỗi chế độ).

## Điều khiển

| | Di chuyển | Lấy / đặt | Thái / rửa / dập lửa | Lướt |
| --- | --- | --- | --- | --- |
| Người 1 | WASD | E | giữ Space | Shift trái |
| Người 2 | Mũi tên | Enter | giữ / hoặc Numpad 0 | Shift phải |

ESC tạm dừng cả hai đội, các nồi và bot. Mất tiêu điểm cửa sổ cũng tạm dừng. Điện thoại có nút cảm ứng cho người 1; PvP cùng bàn phím phù hợp máy tính.

Cách nấu: lấy nguyên liệu → đặt lên thớt → giữ phím thao tác → lấy nguyên liệu đã thái → cho hai phần đúng công thức vào nồi → chờ chín → lấy đĩa → múc súp → giao món. Tay không để rửa đĩa hoặc dập lửa. Có thể đặt đồ lên bàn trống và bỏ vào thùng rác khi cần.

Bốn công thức: 2 cà chua, 2 hành tây, 2 nấm, hoặc 1 cà chua + 1 nấm. Công thức hiển thị trên đơn.

## Mã nguồn

- `src/engine.js`: trạng thái nấu, đơn, đĩa và điểm của một đội.
- `src/levels.js`: chế độ, map, vị trí quầy và cấu hình level.
- `src/match.js`: điều phối trận, đồng hồ hai bên và kết quả thắng/hòa/thua.
- `src/navigation.js`: va chạm, ảnh hưởng địa hình và đường đi A*.
- `src/bot.js`: bot thực hiện thao tác thật qua engine, không tạo điểm giả.
- `src/main.js`: hình ảnh 3D, giao diện, bàn phím và menu.
