# Test Cases cho Logic Đăng Ký Mới

## Cấu hình mặc định
- `monthly_cutoff_day`: 25 (ngày mở đăng ký tháng kế tiếp)
- `daily_deadline_hour`: 20 (giờ deadline cho ngày mai)

## Các trường hợp test

### 1. Đăng ký tháng hiện tại
**Điều kiện:** Đang ở bất kỳ ngày nào trong tháng
**Kết quả:** Luôn cho phép xem và đăng ký tháng hiện tại

### 2. Đăng ký tháng kế tiếp
**Điều kiện:** Đã qua ngày 25 của tháng hiện tại
**Kết quả:** Cho phép đăng ký tháng kế tiếp

**Điều kiện:** Chưa đến ngày 25 của tháng hiện tại
**Kết quả:** Không cho phép đăng ký tháng kế tiếp

### 3. Chỉnh sửa ngày mai
**Điều kiện:** Hiện tại trước 20:00
**Kết quả:** Cho phép chỉnh sửa ngày mai

**Điều kiện:** Hiện tại sau 20:00
**Kết quả:** Không cho phép chỉnh sửa ngày mai

### 4. Chỉnh sửa các ngày khác trong tháng hiện tại
**Điều kiện:** Ngày trong tương lai (không phải ngày mai)
**Kết quả:** Luôn cho phép chỉnh sửa

### 5. Ngày cuối tuần
**Điều kiện:** Thứ 7 hoặc Chủ nhật
**Kết quả:** Không cho phép đăng ký (bị disable)

### 6. Ngày quá khứ
**Điều kiện:** Bất kỳ ngày nào đã qua
**Kết quả:** Không cho phép chỉnh sửa

## Ví dụ cụ thể

### Scenario 1: Hôm nay là 15/11/2025, 18:00
- ✅ Có thể đăng ký: 16/11 (ngày mai - trước 20:00)
- ✅ Có thể đăng ký: 17/11, 18/11, ... 30/11 (các ngày khác trong tháng 11)
- ❌ Không thể đăng ký: Tháng 12 (chưa đến ngày 25)
- ❌ Không thể đăng ký: 14/11 (ngày quá khứ)

### Scenario 2: Hôm nay là 15/11/2025, 21:00
- ❌ Không thể đăng ký: 16/11 (ngày mai - sau 20:00)
- ✅ Có thể đăng ký: 17/11, 18/11, ... 30/11 (các ngày khác trong tháng 11)
- ❌ Không thể đăng ký: Tháng 12 (chưa đến ngày 25)

### Scenario 3: Hôm nay là 26/11/2025, 10:00
- ✅ Có thể đăng ký: 27/11 (ngày mai - trước 20:00)
- ✅ Có thể đăng ký: 28/11, 29/11, 30/11 (các ngày khác trong tháng 11)
- ✅ Có thể đăng ký: Tháng 12 (đã qua ngày 25)

### Scenario 4: Hôm nay là 30/11/2025, 19:00
- ✅ Có thể đăng ký: 01/12 (ngày mai - trước 20:00)
- ✅ Có thể đăng ký: Các ngày khác trong tháng 12 (đã qua ngày 25)

## Lưu ý quan trọng
1. Logic này áp dụng cho cả chế độ xem và chỉnh sửa
2. Ngày cuối tuần luôn bị disable
3. Ngày quá khứ không bao giờ được chỉnh sửa
4. Deadline 20:00 chỉ áp dụng cho ngày mai
5. Các ngày khác trong tháng hiện tại không bị ảnh hưởng bởi deadline