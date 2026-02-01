# Bugfix: Lỗi Filter Danh Sách Đăng Ký Theo Ngày

## Vấn đề
Khi filter danh sách đăng ký cơm theo ngày (đặc biệt là ngày quá khứ), hệ thống báo lỗi SQL và không hiển thị đúng data.

## Nguyên nhân
Lỗi SQL syntax trong file `backend/src/controllers/dailyRegistrationController.ts`:
- Dòng 24: Sử dụng `${paramCount}` thay vì `$${paramCount}` hoặc `$` + paramCount
- Điều này tạo ra SQL query không hợp lệ: `AND u.department = 2` thay vì `AND u.department = $2`
- PostgreSQL không thể bind parameter đúng cách, dẫn đến lỗi query

## Giải pháp
Sửa dòng 24 trong hàm `buildRegistrationQuery`:

**Trước:**
```typescript
if (department) {
  query += ` AND u.department = ${paramCount}`;
  params.push(department);
  paramCount++;
}
```

**Sau:**
```typescript
if (department) {
  query += ' AND u.department = $' + paramCount;
  params.push(department);
  paramCount++;
}
```

## Files đã sửa
- `backend/src/controllers/dailyRegistrationController.ts` - Sửa SQL placeholder syntax
- `backend/src/server.ts` - Thêm type annotation cho compression filter
- `backend/package.json` - Thêm @types/compression

## Testing
1. Backend build thành công: ✅
2. Backend server chạy thành công: ✅
3. Frontend server chạy thành công: ✅
4. Cần test trên UI:
   - Truy cập trang "Danh sách đăng ký theo ngày"
   - Chọn ngày quá khứ (ví dụ: 01/05/2026)
   - Filter theo bộ phận
   - Kiểm tra data hiển thị đúng và không có lỗi

## Deployment
Sau khi test thành công trên development:
1. Build backend: `cd backend && npm run build`
2. Deploy lên production server
3. Restart PM2: `pm2 restart lunch-backend`
4. Test trên production URL: https://lunch-booking.madlab.tech

## Ngày sửa
06/01/2026
