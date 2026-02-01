# Bugfix: Nút "Bỏ tất cả" chỉ bỏ chọn ngày tương lai

## Vấn đề
Khi người dùng nhấn nút **"Bỏ tất cả"**, hệ thống đang bỏ chọn cả những ngày trong quá khứ và ngày hôm nay, mặc dù những ngày này không thể chỉnh sửa.

**Expected behavior**: Chỉ bỏ chọn những ngày ở tương lai (có thể chỉnh sửa được).

## Root Cause
Trong component `EmployeeRegistration.tsx`:
- Hàm `handleDeselectAll()` đang xóa toàn bộ `selectedDates` và `vegetarianDates` mà không kiểm tra ngày nào có thể chỉnh sửa
- Hàm `handleSelectAll()` cũng không giữ lại các ngày quá khứ khi chọn tất cả

## Giải pháp

### 1. Sửa `handleDeselectAll()`
```typescript
const handleDeselectAll = () => {
  if (!isEditing) return;
  
  // Chỉ bỏ chọn các ngày tương lai (có thể chỉnh sửa)
  // Giữ lại các ngày quá khứ và ngày hôm nay
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  
  const pastDates = selectedDates.filter(date => {
    const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    // Giữ lại ngày quá khứ và ngày hôm nay (không thể chỉnh sửa)
    return dateStart.getTime() <= todayStart.getTime();
  });
  
  // Cập nhật vegetarianDates: chỉ giữ lại các ngày quá khứ
  const newVegDates = new Set<string>();
  pastDates.forEach(date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    if (vegetarianDates.has(dateKey)) {
      newVegDates.add(dateKey);
    }
  });
  
  setSelectedDates(pastDates);
  setVegetarianDates(newVegDates);
  
  const removedCount = selectedDates.length - pastDates.length;
  if (removedCount > 0) {
    toast.info(`Đã bỏ chọn ${removedCount} ngày tương lai`);
  } else {
    toast.info('Không có ngày tương lai nào để bỏ chọn');
  }
};
```

### 2. Sửa `handleSelectAll()`
```typescript
const handleSelectAll = () => {
  if (!isEditing) return;

  const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  
  // Giữ lại các ngày quá khứ và ngày hôm nay (không thể chỉnh sửa)
  const pastDates = selectedDates.filter(date => {
    const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    return dateStart.getTime() <= todayStart.getTime();
  });
  
  const futureDates: Date[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
    const dayOfWeek = date.getDay();
    // Chỉ chọn các ngày không phải cuối tuần và có thể chỉnh sửa
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && canEditDate(date)) {
      futureDates.push(date);
    }
  }

  // Kết hợp ngày quá khứ + ngày tương lai mới chọn
  setSelectedDates([...pastDates, ...futureDates]);
  toast.success(`Đã chọn ${futureDates.length} ngày tương lai trong tháng`);
};
```

## Files Changed
- `frontend/src/components/EmployeeRegistration.tsx`

## Testing
1. Đăng ký cơm cho một số ngày trong tháng (bao gồm cả ngày hôm nay và ngày mai)
2. Đợi đến ngày hôm sau (hoặc giả lập bằng cách thay đổi ngày hệ thống)
3. Vào chế độ chỉnh sửa
4. Nhấn "Bỏ tất cả"
5. **Verify**: Chỉ các ngày tương lai bị bỏ chọn, ngày hôm nay và quá khứ vẫn được giữ lại
6. Nhấn "Chọn tất cả"
7. **Verify**: Chỉ các ngày tương lai được chọn thêm, ngày quá khứ không bị ảnh hưởng

## Impact
- **User Experience**: Người dùng không còn bị nhầm lẫn khi nhấn "Bỏ tất cả" mà các ngày quá khứ vẫn bị xóa
- **Data Integrity**: Đảm bảo dữ liệu đăng ký quá khứ không bị thay đổi ngoài ý muốn
- **Consistency**: Hành vi của nút "Bỏ tất cả" và "Chọn tất cả" giờ đây nhất quán với logic không cho phép chỉnh sửa ngày quá khứ

## Deployment
```bash
# Build frontend
cd frontend
npm run build

# Deploy to production
# (Follow standard deployment process)
```

## Date
February 1, 2026
