# V1 — Đại sảnh Ánh Lửa

Ưu tiên mới theo phản hồi hình ảnh ngày 16/10/2026, trước M2. Tham chiếu là ảnh màn bếp lâu đài người dùng gửi; bản này dùng hình học, vật liệu và bố cục riêng.

## Thay đổi thực tế

- Khung 3D chiếm toàn bộ viewport. Đơn ở góc trên trái; điểm và giờ ở hai góc dưới. Chế độ/help/pause nằm gọn phía phải, giữ nhãn ngữ cảnh và phím H.
- Thay sân vườn đồ chơi bằng sàn đá bát giác có khe và cạnh vát, nền đá nổi nhiều tầng, vực sáng xanh, tường đá ghép khối, cửa vòm, đuốc, cờ và thư viện nhỏ.
- Khu khách dùng mô hình nhân vật và bàn đĩa phía sau bếp; hai cổng xoáy và bụi sáng chuyển động trong không gian 3D. Các phần ngoài rìa là cảnh trí, chưa phải cơ chế dịch chuyển/địa hình động.
- Quầy có gỗ với vân/bề mặt, nẹp và tay nắm kim loại, cạnh bo; nồi có phản xạ kim loại. Nhân vật có đầu/mũ rõ hơn, khăn cổ, nút áo, ria và vòng nhận diện.
- Ánh sáng lạnh ở môi trường, lửa cam cục bộ, bóng đổ, bloom vừa phải, khử răng cưa và ambient occlusion trên khung lớn. Bản nhỏ bỏ AO để giảm chi phí. Giới hạn pixel ratio ở khung lớn.
- Camera nhìn thẳng theo trục Z. Điều khiển được đổi đồng bộ: A/D là trái/phải, W/S là lên/xuống; không còn lệch theo góc camera cũ.
- Menu map đã cập nhật hình minh họa và màu theo đại sảnh. Giữ các chế độ, bố trí quầy và luật nấu dùng chung.

## Kiểm chứng

58/58 test gameplay/movement/presentation đạt, gồm kiểm tra mới về hướng điều khiển với camera. Browser kiểm tra vào trận, đóng menu, di chuyển, nấu với bot, nhãn H, thay map và HUD. Build Vite thành công. Ảnh bàn giao là ảnh chụp trực tiếp bản game chạy, không phải ảnh dựng thay màn chơi.

Không dùng số lượng test để suy ra phần trăm tương đồng hình ảnh với Overcooked! 2. Đợt này là bản dựng hình ảnh mới để đối chiếu trực tiếp; animation, độ đa dạng mô hình và màn động còn thuộc các đợt tiếp theo. Không tính cảnh trí cổng xoáy là đã có cơ chế teleport.

Các khối tĩnh được gộp theo vật liệu, còn nồi, món, hơi nước và lửa giữ trạng thái riêng. Ba ca test kiểm chứng việc gộp không làm đổi vị trí thế giới, không gộp nhầm vật động và không sửa hình học được chia sẻ. Đã quan sát bot giao món thật trên cả đại sảnh và map cảng sau thay đổi.
