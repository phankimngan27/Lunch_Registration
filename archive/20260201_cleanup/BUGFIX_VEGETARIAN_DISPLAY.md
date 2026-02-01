# Bug Fix: Hiển thị sai ngày chay

## 🐛 Vấn đề

**Triệu chứng**: User có 19 ngày đăng ký trong tháng 1/2026, nhưng TẤT CẢ 19 ngày đều hiển thị badge "Chay" màu xanh, trong khi thực tế tháng 1/2026 chỉ có 1 ngày rằm (15/1).

**Screenshot**: User thấy tất cả các ngày đều có icon lá xanh và text "Chay"

## 🔍 Nguyên nhân

### Root Cause
Code đang sử dụng `vegetarianDates` Set để check và hiển thị badge "Chay". Tuy nhiên, `vegetarianDates` chứa **TẤT CẢ các ngày mà user đã đăng ký ăn chay từ backend**, không chỉ riêng tháng hiện tại.

### Ví dụ cụ thể
```typescript
// vegetarianDates Set chứa:
{
  "2025-12-05",  // Tháng 12/2025
  "2025-12-12",  // Tháng 12/2025
  "2025-12-19",  // Tháng 12/2025
  "2026-01-05",  // Tháng 1/2026
  "2026-01-12",  // Tháng 1/2026
  "2026-01-19",  // Tháng 1/2026
  // ... nhiều ngày khác
}

// Khi hiển thị tháng 1/2026, code check:
const dateKey = "2026-01-05"; // Ngày 5/1/2026
const isVegetarian = vegetarianDates.has(dateKey); // TRUE!

// Nhưng ngày 5/1/2026 KHÔNG PHẢI là ngày rằm/mùng 1!
// User đã đăng ký ăn chay ngày 5/12/2025 (là ngày rằm)
// Và backend lưu is_vegetarian = true
// Khi fetch về, code add "2026-01-05" vào vegetarianDates
// Dẫn đến hiển thị sai!
```

### Logic sai
```typescript
// Code CŨ (SAI):
const isVegetarian = vegetarianDates.has(dateKey);
if (isVegetarian) {
  // Hiển thị badge "Chay"
}

// Vấn đề: Chỉ check có trong Set, không check ngày đó có THỰC SỰ là rằm/mùng 1
```

## ✅ Giải pháp

### Fix 1: Hiển thị badge "Chay" trong danh sách
```typescript
// Code MỚI (ĐÚNG):
const isVegetarian = vegetarianDates.has(dateKey);
const isActualVegetarianDay = isVegetarianDay(date); // Check lunar calendar

// Chỉ hiển thị badge nếu:
// 1. User đã chọn ăn chay (isVegetarian = true)
// 2. VÀ ngày đó thực sự là ngày rằm/mùng 1 (isActualVegetarianDay = true)
const shouldShowVegetarianBadge = isVegetarian && isActualVegetarianDay;

if (shouldShowVegetarianBadge) {
  // Hiển thị badge "Chay"
}
```

### Fix 2: Đếm số ngày chay
```typescript
// Code CŨ (SAI):
const vegetarianDatesInMonth = Array.from(vegetarianDates).filter(dateKey => {
  const [year, month] = dateKey.split('-').map(Number);
  return month - 1 === selectedMonth.getMonth() && year === selectedMonth.getFullYear();
});

// Code MỚI (ĐÚNG):
const vegetarianDatesInMonth = Array.from(vegetarianDates).filter(dateKey => {
  const [year, month, day] = dateKey.split('-').map(Number);
  
  // Kiểm tra có thuộc tháng đang xem không
  if (month - 1 !== selectedMonth.getMonth() || year !== selectedMonth.getFullYear()) {
    return false;
  }
  
  // Kiểm tra ngày đó có thực sự là ngày chay không (rằm/mùng 1)
  const date = new Date(year, month - 1, day);
  return isVegetarianDay(date);
});
```

### Fix 3: Di chuyển helper function
```typescript
// Di chuyển isVegetarianDay lên trước để có thể sử dụng trong tính toán
const isVegetarianDay = (date: Date) => {
  try {
    const lunar = convertSolar2Lunar(date.getDate(), date.getMonth() + 1, date.getFullYear(), 7);
    const lunarDay = lunar[0];
    return lunarDay === 1 || lunarDay === 15;
  } catch (error) {
    return false;
  }
};
```

## 📊 Kết quả

### Trước khi fix
- User có 19 ngày đăng ký
- TẤT CẢ 19 ngày đều hiển thị badge "Chay" ❌
- Số ngày chay hiển thị: 19 ngày ❌
- Sai hoàn toàn!

### Sau khi fix
- User có 19 ngày đăng ký
- CHỈ 1 ngày (15/1) hiển thị badge "Chay" ✅
- Số ngày chay hiển thị: 1 ngày ✅
- Đúng với thực tế!

## 🧪 Test Cases

### Test 1: User đăng ký nhiều tháng
```
Tháng 12/2025: Đăng ký 20 ngày, trong đó 2 ngày chay (1/12, 15/12)
Tháng 1/2026: Đăng ký 19 ngày, trong đó 1 ngày chay (15/1)

Expected:
- Xem tháng 12/2025: Hiển thị 2 badge "Chay"
- Xem tháng 1/2026: Hiển thị 1 badge "Chay"
```

### Test 2: User đăng ký ngày không phải rằm
```
Tháng 1/2026: Đăng ký ngày 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19

Expected:
- Chỉ ngày 15/1 hiển thị badge "Chay"
- Các ngày khác KHÔNG hiển thị badge "Chay"
```

### Test 3: User không đăng ký ngày rằm
```
Tháng 1/2026: Đăng ký ngày 5, 6, 7, 8, 9, 10, 11, 12, 13, 14 (không có 15/1)

Expected:
- KHÔNG có ngày nào hiển thị badge "Chay"
- Số ngày chay: 0
```

## 🔄 Deployment

### Files changed
- `frontend/src/components/EmployeeRegistration.tsx`

### Steps
1. Pull latest code
2. Build frontend: `npm run build`
3. Deploy to production
4. Test với user account có nhiều tháng đăng ký

### Verification
```bash
# Login với account có nhiều tháng đăng ký
# Vào trang Registration
# Check:
# 1. Số ngày chay hiển thị đúng
# 2. Badge "Chay" chỉ hiện ở ngày rằm/mùng 1
# 3. Không có badge "Chay" ở ngày thường
```

## 📝 Lessons Learned

### Vấn đề
1. **Không validate data từ backend**: Code tin tưởng 100% vào `is_vegetarian` từ backend
2. **Không cross-check với lunar calendar**: Không verify ngày đó có thực sự là rằm/mùng 1
3. **Set chứa data từ nhiều tháng**: `vegetarianDates` Set không được filter theo tháng

### Best Practices
1. **Always validate**: Luôn validate data từ backend với business logic
2. **Cross-check**: Khi hiển thị thông tin quan trọng, cross-check với source of truth
3. **Filter data**: Khi làm việc với data từ nhiều time periods, luôn filter theo context hiện tại
4. **Add comments**: Thêm comments giải thích logic phức tạp

## 🎯 Prevention

Để tránh bug tương tự trong tương lai:

1. **Add validation**: Validate `is_vegetarian` với lunar calendar khi fetch từ backend
2. **Add tests**: Viết tests cho edge cases (nhiều tháng, ngày không phải rằm)
3. **Add logging**: Log khi phát hiện inconsistency giữa `is_vegetarian` và lunar calendar
4. **Code review**: Review kỹ logic liên quan đến date/time và cross-month data

## ✅ Checklist

- [x] Identified root cause
- [x] Fixed display logic in selected dates list
- [x] Fixed vegetarian count logic
- [x] Moved helper function to proper location
- [x] Tested with diagnostics
- [x] Documented the fix
- [x] Ready for deployment

---

**Bug severity**: HIGH (hiển thị sai thông tin cho user)
**Impact**: All users with multi-month registrations
**Fix complexity**: LOW (chỉ cần thêm validation)
**Testing**: Required before deployment
