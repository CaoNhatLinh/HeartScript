# IMPLEMENTATION PLAN - GIAI ĐOẠN 1: CHIỀU SÂU CẢM XÚC

Dựa trên yêu cầu của bạn, chúng ta sẽ bắt đầu nâng cấp ứng dụng chính tập trung vào trải nghiệm cảm xúc và sự tinh tế.

## 🛠 DANH SÁCH NHIỆM VỤ

### 1. Nâng cấp Hệ thống Diary (Mood & Soul)
- [ ] Xây dựng bộ nhận diện tâm trạng (Mood Detection) dựa trên từ khóa.
- [ ] Cập nhật giao diện thư tay (Postcard) thay đổi theo tâm trạng.
- [ ] Thêm các hiệu ứng "Atmosphere" (Hạt particles, hình vẽ doodle) cho từng lá thư.

### 2. Modernize Navigation & Transitions
- [ ] Thiết kế lại Navigation Dock theo phong cách **Glassmorphism v4** (Visual Premium).
- [ ] Thêm hiệu ứng chuyển cảnh (Page Transitions) mượt mà hơn giữa các Section.

### 3. Tinh chỉnh Visual & Aesthetics
- [ ] Cập nhật hệ thống màu sắc (Color Palette) đồng bộ hơn cho toàn bộ ứng dụng.
- [ ] Thêm các micro-interactions (phản hồi nhỏ khi click, hover).

---

## 📐 CHI TIẾT KỸ THUẬT

### A. Mood Analysis (Keyword-based)
Chúng ta sẽ sử dụng một bộ từ điển nhỏ để phân loại tâm trạng:
- `love`: yêu, thương, hôn, nhớ, ...
- `happy`: vui, cười, tuyệt vời, hạnh phúc, ...
- `calm`: bình yên, nhẹ nhàng, ngủ ngon, ...
- `sad`: buồn, khóc, xin lỗi, ...

### B. UI/UX Enhancements
- Sử dụng `framer-motion` để tạo các chuyển động tự nhiên cho Doodle.
- Sử dụng `lucide-react` kết hợp với SVG tùy chỉnh để làm icon.

---

## 🚀 TIẾN ĐỘ THỰC HIỆN

1. **Task 1**: Cấu hình Mood Engine & Cập nhật DiarySection.
2. **Task 2**: Nâng cấp Navigation Dock.
3. **Task 3**: Refine Visuals & Polish.

---
*Người thực hiện: @lov er*
