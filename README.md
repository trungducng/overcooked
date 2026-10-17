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
- Hành trình gồm 9 bố cục riêng: Bữa súp đầu tiên; Cửa sổ đồng đội; Vườn bếp chữ U; Bến cảng chữ S; Dây chuyền phục vụ; Hai cửa luân phiên; Chợ đêm zigzag; Đảo bếp chuyển động; Ca làm bão lửa.

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

## Đa dạng màn và phản hồi hình ảnh (17/10)

Menu có đủ 9 thẻ màn với sơ đồ lấy từ vị trí quầy thật, món và cơ chế riêng. Bếp chữ U gom sơ chế vào giữa; bến cảng chữ S buộc đi vòng; hai cửa đóng luân phiên; chợ có vách zigzag; băng chuyền đổi hướng mỗi 18 giây; ca cuối có ô hơi nước cảnh báo trước khi làm chậm. Mỗi màn có bảng màu, vùng làm việc và trang trí riêng.

Thêm salad nấm rừng và burger hành tây (8 công thức), cùng hiệu ứng thái, rửa, hơi nấu, món chín, cháy, lướt, ném/bắt và giao món. Hạt/vòng dùng pool hữu hạn, hai draw call; chế độ Nhẹ giảm số hạt. Hiệu ứng không can thiệp inventory/simulation.

Kiểm tra tự động bao gồm bot chơi các công thức mới, đường tiếp cận tất cả quầy ở 9 màn, cửa luân phiên, chu kỳ hơi nước, đổi chiều băng chuyền và giới hạn hiệu ứng. Chưa có phép đo FPS trên điện thoại/iPad thật; kiểm thử online khác mạng và gamepad phần cứng vẫn còn.

## Sushi băng chuyền và bot PvP

Màn 5 là Sushi băng chuyền, vòng 6 bàn chở món và nguyên liệu, đảo chiều theo chu kỳ. Đặt món hoàn chỉnh lên vòng để tự phục vụ tại cuối tuyến; điểm ghi cho đội đặt món, đĩa bẩn trở lại bồn rửa. Món không khớp đơn giữ lại trên vòng. Quầy giao trực tiếp vẫn dùng được.

Thực đơn có 16 công thức thuộc 5 nhóm: súp, salad, burger, sushi và cơm tô. Sushi/cơm tô dùng gạo nấu trong nồi (có chín/cháy/dập lửa), cá/dưa thái và rong biển sống; ráp đúng thành phần trên đĩa.

PvP: Không bot / bot Cam / bot Xanh / bot cả hai đội (2v2). P1/P2 là người, P3/P4 là bot theo đội Cam/Xanh. Hai người online vẫn có thể dùng bot vào hai ghế còn lại; bot mô phỏng tại host. Bot tôn trọng quyền làm món ở thớt/nồi/chảo/bàn ráp/bàn chứa, nhường người đang đứng trước quầy kể cả tay không. Quyền này hết sau thời gian rời quầy, tránh bỏ món vĩnh viễn. Đây là quy tắc AI; người chơi vẫn được nhặt/chuyển đồ cho nhau.
