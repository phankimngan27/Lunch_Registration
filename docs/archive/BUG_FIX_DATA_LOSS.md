# Bug Fix: Mất dữ liệu đăng ký khi hủy ngày tương lai

## Mô tả Bug

**Triệu chứng**: 
- Ngày 28/7: Đăng ký cơm cho ngày 29/7
- Ngày 28/7: Hủy đăng ký ngày 29/7
- **Kết quả**: Mất HẾT dữ liệu đăng ký từ ngày 28/7 trở về trước

## Nguyên nhân

Bug xảy ra do **lỗi logic trong frontend** kết hợp với **thiếu bảo vệ trong backend**.

### 1. Lỗi Frontend (EmployeeRegistration.tsx)

**Code cũ** (dòng 329-334):
```typescript
const datesInCurrentMonth = selectedDates.filter(d => {
  // Loại bỏ ngày quá khứ và ngày hôm nay
  const dateStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  return dateStart.getTime() > todayStart.getTime();  // CHỈ gửi ngày SAU hôm nay
});
```

**Vấn đề**: 
- Frontend chỉ gửi các ngày **SAU hôm nay** lên server
- Khi user hủy ngày 29/7, `selectedDates` chỉ còn ngày 28/7
- Do ngày 28 = ngày hôm nay, nó bị filter ra → `dates = []`
- Backend nhận `dates = []`, nghĩ rằng user muốn **xóa HẾT** đăng ký của tháng

### 2. Lỗi Backend (registrationController.ts)

**Code cũ** (dòng 161-167):
```typescript
const result = await pool.query(
  `DELETE FROM registrations 
   WHERE user_id = $1 AND month = $2 AND year = $3`,
  [userId, targetMonth, targetYear]
);
```

**Vấn đề**: 
- Khi `dates.length === 0`, backend xóa **TẤT CẢ** registrations của tháng
- Không có điều kiện bảo vệ ngày quá khứ → xóa cả ngày 28, 27, 26, ...

## Giải pháp

### 1. Fix Frontend

**Code mới**:
```typescript
// GỬI TẤT CẢ các ngày đã chọn thuộc tháng đang xem (bao gồm cả quá khứ, hôm nay, tương lai)
// Backend sẽ tự xử lý logic: chỉ thêm/xóa ngày tương lai, giữ nguyên ngày quá khứ
const datesInCurrentMonth = selectedDates.filter(d => {
  // Chỉ gửi các ngày thuộc tháng đang xem
  return d.getMonth() + 1 === month && d.getFullYear() === year;
});
```

**Lợi ích**:
- Frontend gửi đầy đủ tất cả ngày đã chọn (kể cả quá khứ)
- Backend sẽ tự động bỏ qua việc xóa ngày quá khứ theo logic hiện có

### 2. Fix Backend

**Code mới**:
```typescript
// CHỈ xóa các ngày tương lai (sau hôm nay)
const today = new Date();
const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);

const result = await pool.query(
  `DELETE FROM registrations 
   WHERE user_id = $1 AND month = $2 AND year = $3 
   AND registration_date > $4`,
  [userId, targetMonth, targetYear, todayStart]
);
```

**Lợi ích**:
- Thêm điều kiện `registration_date > todayStart` 
- Chỉ xóa ngày tương lai, **KHÔNG BAO GIỜ** xóa ngày quá khứ và hôm nay
- Bảo vệ dữ liệu đã ăn cơm (ngày quá khứ) khỏi bị xóa nhầm

## Test Case

### Trước khi fix:
1. Ngày 28/7: Đã đăng ký [3, 10, 14, 17, 21, 24, 28] tháng 7
2. Click "Chỉnh sửa" → chọn thêm ngày 29 → Save
3. Click "Chỉnh sửa" → bỏ chọn ngày 29 → Save
4. **KẾT QUẢ**: Mất hết data [3, 10, 14, 17, 21, 24, 28] ❌

### Sau khi fix:
1. Ngày 28/7: Đã đăng ký [3, 10, 14, 17, 21, 24, 28] tháng 7
2. Click "Chỉnh sửa" → chọn thêm ngày 29 → Save
   - Frontend gửi: `dates = [3, 10, 14, 17, 21, 24, 28, 29]`
   - Backend thêm: ngày 29 (giữ nguyên các ngày khác)
3. Click "Chỉnh sửa" → bỏ chọn ngày 29 → Save
   - Frontend gửi: `dates = [3, 10, 14, 17, 21, 24, 28]`
   - Backend xóa: chỉ ngày 29 (vì 29 > 28)
   - Backend GIỮ NGUYÊN: ngày 28 (vì logic `datesToDelete` chỉ xóa ngày > hôm nay)
4. **KẾT QUẢ**: Giữ nguyên data [3, 10, 14, 17, 21, 24, 28] ✅

## Deployment

Sau khi deploy:
1. Build lại frontend: `cd frontend && npm run build`
2. Build lại backend: `cd backend && npm run build`
3. Restart backend: `pm2 restart lunch-backend`
4. Copy frontend build sang production: xem PRODUCTION_DEPLOYMENT_GUIDE.md

## Files đã thay đổi

1. `frontend/src/components/EmployeeRegistration.tsx` - Bỏ filter ngày quá khứ khi gửi lên server
2. `backend/src/controllers/registrationController.ts` - Thêm điều kiện bảo vệ ngày quá khứ khi xóa

## Status

✅ **ĐÃ FIX** - Code đã được sửa và kiểm tra không có lỗi compile/lint
