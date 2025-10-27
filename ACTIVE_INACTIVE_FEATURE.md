# Tính năng Active/Inactive User

## Tổng quan
Thay vì xóa user, hệ thống sử dụng cơ chế Active/Inactive để quản lý trạng thái tài khoản.

## Lợi ích
- ✅ Giữ lại toàn bộ lịch sử đăng ký cơm của user
- ✅ Có thể kích hoạt lại tài khoản khi cần
- ✅ Dữ liệu thống kê không bị mất
- ✅ Audit trail đầy đủ

## Cách hoạt động

### 1. Trạng thái User
- **Active**: User có thể đăng nhập và sử dụng hệ thống bình thường
- **Inactive**: User không thể đăng nhập, nhưng data vẫn được giữ lại

### 2. Quyền hạn
- **Super Admin**: Có thể toggle trạng thái của tất cả user (trừ chính mình)
- **Admin thường**: Có thể toggle trạng thái của user role 'user' (không thể thay đổi admin khác)
- **User**: Không có quyền toggle trạng thái

### 3. Bảo vệ Super Admin
- Không ai có thể vô hiệu hóa tài khoản Super Admin
- Super Admin luôn ở trạng thái Active

## Khi user bị Inactive

### Đăng nhập
- User không thể đăng nhập
- Hiển thị thông báo: "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên."

### Đang sử dụng hệ thống
- Nếu user đang đăng nhập và bị inactive, các request tiếp theo sẽ bị từ chối
- Middleware `authenticate` sẽ check trạng thái is_active trong database

### Dữ liệu
- Tất cả đăng ký cơm trước đó vẫn được giữ nguyên
- Thống kê vẫn bao gồm data của user inactive
- Có thể export báo cáo bao gồm cả user inactive

## API Endpoints

### Toggle User Status
```
PATCH /api/users/:id/toggle-status
Authorization: Bearer <token>
Role: admin

Response:
{
  "message": "Kích hoạt tài khoản thành công" | "Vô hiệu hóa tài khoản thành công",
  "user": {
    "id": 1,
    "employee_code": "190601.TNQ",
    "full_name": "Thi Nhân Quy",
    "is_active": true | false
  }
}
```

### Get All Users
```
GET /api/users
Authorization: Bearer <token>
Role: admin

Response: Array of users with is_active field
```

## UI/UX

### Trang Quản lý Nhân viên
- Cột "Trạng thái" hiển thị badge:
  - 🟢 **Active** (màu xanh)
  - ⚫ **Inactive** (màu xám)
  
- Nút thao tác:
  - User Active: Hiển thị nút "Inactive" (màu cam)
  - User Inactive: Hiển thị nút "Active" (màu xanh)

### Xác nhận
- Khi toggle status, hiển thị confirm dialog:
  - "Bạn có chắc muốn vô hiệu hóa tài khoản [Tên]?"
  - "Bạn có chắc muốn kích hoạt tài khoản [Tên]?"

## Database Schema

```sql
-- users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  employee_code VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  department VARCHAR(100),
  project VARCHAR(100),
  role VARCHAR(20) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,  -- Trạng thái active/inactive
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Migration từ Delete sang Inactive

### Backend Changes
1. ✅ Thay `deleteUser` thành `toggleUserStatus` trong controller
2. ✅ Update route từ `DELETE /users/:id` thành `PATCH /users/:id/toggle-status`
3. ✅ Thêm check `is_active` trong middleware `authenticate`
4. ✅ Thêm check `is_active` trong login controller

### Frontend Changes
1. ✅ Thay nút "Xóa" thành "Active/Inactive"
2. ✅ Thêm cột "Trạng thái" trong bảng
3. ✅ Update API call từ `DELETE` thành `PATCH`
4. ✅ Update confirm message

## Testing Checklist

- [ ] User inactive không thể đăng nhập
- [ ] User đang login bị inactive sẽ bị logout ở request tiếp theo
- [ ] Admin có thể toggle status của user
- [ ] Admin thường không thể toggle status của admin khác
- [ ] Không ai có thể inactive Super Admin
- [ ] Data của user inactive vẫn hiển thị trong thống kê
- [ ] Có thể kích hoạt lại user inactive
- [ ] UI hiển thị đúng trạng thái Active/Inactive

## Rollback Plan

Nếu cần rollback về tính năng xóa:
1. Restore route `DELETE /users/:id`
2. Restore `deleteUser` function với logic DELETE
3. Update frontend button về "Xóa"
4. Remove cột "Trạng thái" trong UI

## Notes

- Tính năng này không xóa data, chỉ vô hiệu hóa tài khoản
- Nếu cần xóa vĩnh viễn, có thể thêm tính năng "Hard Delete" cho Super Admin
- Nên có cronjob để archive user inactive quá 1 năm (optional)
