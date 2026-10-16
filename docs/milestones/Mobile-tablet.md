# Mobile / iPad — 17/10/2026

Thay dpad + chữ phím bằng joystick và cụm nút hai ngón. Hướng joystick ghép vào cùng input keyboard/gamepad, bao gồm guest online; không có simulation riêng hay cộng tốc độ khi nhiều nguồn input. Work giữ độc lập với pointer di chuyển. Pointer capture giữ ngón khi rê khỏi nút; pointerup/cancel/lost capture/reset/pause/blur/visibility/resize đều phục hồi input.

UI: cảm ứng tự nhận iPad desktop mode (`maxTouchPoints`) và thiết bị lai có mouse (`any-pointer`). Safe area viewport-fit, camera hướng bếp lên để chừa tay, nút tối thiểu 44px, dọc có gợi ý xoay ngang. Màn phân vai có nút đổi chef. Work đổi tên theo bồn / cháy. Menu giải thích một người cảm ứng mỗi thiết bị, nhóm dùng online hoặc keyboard/gamepad local.

QA: viewport 390×844, 844×390, 1024×768; screenshot điện thoại và iPad lưu ở Desktop/Overcook. Drag thật trên joystick đưa P1 từ x=-3.8 tới -3.29 rồi trả input về 0; click lướt đổi x và cooldown 1.07s. Tests gồm deadzone, clamp, trộn input, hai pointer work/stick độc lập, cancel, reset và không bị pointer khác chiếm cần.

Giới hạn: viewport/desktop browser QA chưa thay thế kiểm tra Safari / iPad và hai ngón trên phần cứng thật; online đa mạng vẫn cần kiểm chứng. Không hỗ trợ hai người dùng hai joystick trên cùng màn cảm ứng.
