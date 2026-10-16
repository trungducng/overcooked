# Kitchen Rush

Game nấu ăn 3D dùng Three.js/Vite, bếp chung trong mọi chế độ. Đồ họa và tài nguyên tự dựng bằng mã, không lấy asset của Overcooked.

```sh
npm install
npm run dev
npm test
npm run build
```

## Chơi

- Solo; Cùng phụ bếp (bot chung điểm); Đồng đội 2–4 người local; PvP 2 người; đấu bot.
- Online: Chọn trận đấu → Chơi online → Tạo phòng / nhập mã 6 ký tự. Đồng đội tối đa 4 người, PvP 2 người. Khách luôn dùng bộ phím P1 trên máy mình. Chủ phòng mô phỏng toàn bộ trận, khách chỉ gửi input.
- Đạt ít nhất 1 sao để mở ca tiếp. Tiến trình lưu trên trình duyệt. Luyện tập tự do mở mọi màn, không ghi sao/điểm tốt nhất.
- Hành trình gồm 9 bố cục riêng: Bữa súp đầu tiên; Cửa sổ đồng đội; Đại tiệc ba món; Bến cảng trơn trượt; Dây chuyền phục vụ; Cầu cảng đóng mở; Chợ rau ban đêm; Đảo bếp chuyển động; Ca làm bão lửa.

## Điều khiển local

| Chef | Đi | Lấy/đặt/đưa/nhặt | Giữ thao tác | Lướt | Thả | Ném |
|---|---|---|---|---|---|---|
| P1 | WASD | E | Space | Shift trái | Q | F |
| P2 | Mũi tên | Enter | / | Shift phải | Delete | . |
| P3 | IJKL | O | U | P | N | M |
| P4 | Num 8456 | + | Num 0 | Num decimal | Num − | Num × |

Tay cầm chuẩn: cần trái; A lấy/đặt; X thao tác; B ném; Y thả; RB lướt; Start pause. Tay cầm thứ n gán Pn, bàn phím vẫn dùng được. Ngắt tay cầm tạm dừng. Chưa nghiệm thu tay cầm vật lý trong môi trường QA này.

Solo màn phân vai dùng Tab hoặc nút Đổi để điều khiển chef còn lại. E hướng vào người tay trống ở gần để đưa đồ. Chỉ ném nguyên liệu sống/đã thái; người tay trống tự bắt. Vật không bắt được đáp quầy trống hoặc rơi sàn, E nhặt lại. Đĩa/món hoàn thiện chỉ thả/đưa, không ném.

## Bếp và món

Súp: thái 2 phần đúng công thức → nấu → cầm đĩa múc → giao. Salad: đĩa trên bàn ráp + xà lách/cà chua đã thái. Burger: thịt thái → nướng 7 giây + bánh mì sống + cà chua thái, ráp trên đĩa. Có sổ công thức và trợ giúp trong game.

Nồi/chảo chín để lâu sẽ cháy, cảnh báo trước 5 giây. Lửa lan sang quầy gần sau 8 giây; tay không giữ thao tác dập từng điểm cháy, rửa đĩa và phục hồi. Giao đơn đầu tăng combo tối đa ×2, tip theo thời gian còn lại, cao điểm thêm 25%, mất đơn trừ 20đ.

Quầy giữa dùng chuyển đồ, băng chuyền xoay 3 ô mỗi 6 giây, cửa chắn có cảnh báo và không đóng đè chef, quầy động mang đồ theo và dừng khi có người chắn. Màn phân vai co-op/solo không đi xuyên giữa hai vùng; PvP có lối vòng để cả hai tiếp cận mọi công cụ.

## Hình ảnh, hiệu năng, mạng

Ba bộ cảnh: đại sảnh đá, cảng công nghiệp, chợ đêm. Mesh tĩnh được gộp, render trực tiếp thay hậu kỳ SSAO/bloom nhiều lớp; đồ đang nướng không tạo lại geometry mỗi tick. Nút ☼ chọn Nhẹ/Mượt/Nét; tự hạ Nhẹ nếu FPS thấp liên tục. Nhãn nguyên liệu đầy đủ chỉ hiện theo ngữ cảnh hoặc bật H. Âm thanh thao tác, chuyển/bắt, cảnh báo và giai điệu giao món; nút nhạc tắt/bật và ghi nhớ.

Online dùng PeerJS 1.5.5/WebRTC với signaling công cộng. Host giữ vật, score, deadline, môi trường; snapshot 20Hz; chống input lặp/out-of-order. Mất khách: host pause và giữ chỗ, khách Vào lại bằng token của tab giữ nguyên đồ. Rời chỗ / chủ phòng bỏ chỗ sẽ thả vật để không mất tài nguyên. Host thoát thì ca dừng, không chuyển chủ phòng tự động. Mạng chặn WebRTC hoặc NAT yêu cầu TURN có thể không kết nối; hiện chưa có TURN riêng. Không có lưu phòng sau khi host đóng tab.

QA đã nối 4 phiên trình duyệt cùng máy qua signaling thật, di chuyển P2/P3/P4, ném/bắt qua mạng, reconnect P2 giữ nguyên vật. Chưa kiểm chứng nhiều thiết bị/mạng, packet-loss hoặc gamepad thật; không tuyên bố các phần đó đạt cổng 90%.

Xem [trạng thái lộ trình](docs/implementation-plan.md) và [bằng chứng bản hoàn thiện](docs/milestones/R2-roadmap.md).

## Mobile và iPad

Tự nhận diện cảm ứng qua `any-pointer: coarse` hoặc `maxTouchPoints` (bao gồm iPad trình duyệt desktop). Cần kéo trái, Lấy/Đặt phải, giữ nút dao để thái/rửa/dập lửa; Ném, Thả, Lướt riêng. Hai pointer độc lập; thả/cancel/chuyển tab/pause/xoay máy trả input về 0. Camera và HUD dành khoảng trống cho hai ngón, `viewport-fit=cover` + safe area cho tai thỏ/thanh home. Chơi dọc được, ngang nhìn bếp rộng hơn.

Một màn cảm ứng điều khiển một người; local nhiều chef cần thêm bàn phím hoặc tay cầm. Mỗi người dùng điện thoại/iPad riêng thì vào cùng mã phòng online. Có nút Cảm ứng để bật thử trên máy dùng chuột. Đã QA viewport 390×844, 844×390, 1024×768; kéo joystick và bấm lướt trong browser, kiểm tra lifecycle đa pointer tự động. Chưa chạy trên Safari/iPad phần cứng thật.
