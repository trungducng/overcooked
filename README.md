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
| P1 | ↑ ↓ ← → | E | Space | Shift trái | Q | F |
| P2 | WASD | Enter | / | Shift phải | Delete | . |
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

## Màn 10 — Buffet vòng quanh

Màn bonus mở sẵn: đầu bếp ở bếp giữa, 12 bàn băng chuyền chạy quanh, khách ngồi ngoài vòng. Nguyên liệu, thớt, nồi, chảo, đĩa, bàn ráp và bồn rửa ở bên trong. Món hoàn chỉnh đặt lên vòng, chuyển bàn mỗi 3 giây và được phục vụ tự động ở cuối tuyến. Bếp rộng hơn; ranh giới di chuyển giữ đầu bếp bên trong, không đi xuyên vòng. Màn sushi 6 bàn cũ vẫn giữ. Tiến trình tăng lên 30 sao; khóa của 9 màn cũ giữ nguyên.

## Khách tại bàn và thi đấu tranh đơn

Buffet có khách đi từ lối vào tới ghế, ngồi rồi mới gọi món (tối đa 3 đơn đang chờ). Thẻ đơn và bong bóng ghi số bàn, món và thời gian. Cầm đúng món, tới mép quầy trước ghế và E để phục vụ. Khách nhận món, đội phục vụ đầu tiên nhận tiền, đĩa bẩn về bồn rửa, khách rời ghế rồi lượt mới tới. Khách hết kiên nhẫn bỏ đi. Hai đội dùng cùng đơn khách; phục vụ sai bàn/sai món hoặc lặp lại sau đội kia không tiêu thụ món và không có tiền. Băng chuyền giao món khi tới đúng ghế có khách đang đợi món đó. Bot cũng mang món tới bàn. Host quyết định kết quả và đồng bộ khách qua mạng.

Băng chuyền dùng khung extrude 3D, gỗ/kim loại phản sáng, thành bo góc, chân đỡ và con lăn. Mắt xích nổi chuyển động dùng instancing để giảm draw call. Không dùng tấm màu phẳng ghép làm thân vòng.

Phục vụ tận bàn được thưởng thêm 25% trên tổng giá món, tip và combo (sau thưởng giờ cao điểm nếu có). Băng chuyền giữ giá chuẩn. Bàn khớp món hiển thị Tận bàn +25%; hiệu ứng tiền xuất hiện ngay tại bàn được phục vụ. Hai cách dùng cùng đơn, nên không thể nhận tiền cả hai lần.

### Guided onboarding and languages

- Driver.js provides an 11-step tour from **Cách chơi / How to play** and the opening card. A first local shift opens it automatically once per browser. Closing or completing the guide restores the previous game / menu state.
- The tour points to the actual ingredient crate, board, pot, assembly counter, serving point and sink for the selected stage. Buffet guidance explains direct service +25% versus base-price belt service.
- Desktop and touch instructions differ. Local simulation pauses; online rooms continue while the touring player’s input is suppressed.
- Header language selector: Vietnamese, English, Japanese and Korean. Selection persists as `kr-language`; it changes UI text and the guide without altering recipe IDs, progress, scores or network data. UI updates localize as they are rendered, including orders, guest feedback, bot tasks, recipe book and rooms.

Desktop uses arrow keys for P1 and WASD for P2. Online participants each use the P1 arrow-key layout. Narrow desktop windows keep keyboard instructions; touch UI follows touch hardware or the explicit toggle.

### Fire safety and sushi fixes

- Two finite shared extinguishers per kitchen. E takes/returns the red rack tool; hold Space (touch: hold Work) beside a burning station to spray. Empty hands cannot extinguish. The tool can be handed off, parked or dropped, but cannot be thrown or discarded.
- Extinguishing takes 1.1 seconds; only unattended cookware can spread once per 20 seconds, with at most three fires. Counters cannot start cascading fires and racks cannot catch fire. Bots retrieve and return equipment.
- Shader flames replace stretched orange blobs; pooled smoke and white extinguisher foam show fires and suppression.
- Sushi has a dedicated prep counter. Bots park unfinished items off the belt, choose reachable serving slots, and prefer a short remaining belt journey. E at a station operates it before trying to hand an item to a nearby chef. Assembly explains existing/missing plates and incompatible preparation.

### Seasonal kitchens and music

- Use **Chọn trận đấu → Phong cách căn bếp** (or the theme button) for Original, Halloween, Christmas and Tết. Themes apply to all ten authored layouts and persist locally as `kr-season`. They change decoration, lighting and floor palette without changing collision or unlock progress.
- Seasonal decoration is batched by material and adds no lights/shadow maps. Snow / petals use one points draw call, with 48 particles in Balanced, 96 in High and none in Low.
- The ♬ button controls music independently of sound effects, remembers `kr-music`, and starts after a pointer/keyboard gesture. Playback stops while the page is hidden, and theme changes cancel previous voices/scheduling.
- Christmas plays a synthesized **monophonic Jingle Bells chorus** with held-note rhythm, no bass or harmony, based on James Lord Pierpont’s 1857 public-domain composition: https://www.loc.gov/item/2023812429/. Other themes use original motifs. No modern recording is bundled; the requested “Mùa xuân ơi” is not included.
- Station geometry batches across the whole kitchen while preserving moving carts, gates, cookware and contents. HUD and guest bubbles update only when source content changes, including across language switches. Single-bot decisions run at a reduced cadence; multi-bot shared kitchens retain immediate reservation checks.
- Local QA: first kitchen at Balanced used 164 draw calls versus 301 before this pass (~45% less), maintaining 60 FPS on the test machine. Seasonal variants added 13–16 draw calls. This is a measured local result, not a guarantee for every device.
