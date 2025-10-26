# Changelog

Tất cả thay đổi quan trọng của project sẽ được ghi lại ở đây.

## [1.0.0] - 2024-10-25

### ✨ Tính năng mới
- Hệ thống đăng nhập với JWT authentication
- Đăng ký cơm trưa theo lịch (hỗ trợ âm lịch)
- Dashboard thống kê cho admin và user
- Quản lý nhân viên (CRUD)
- Export danh sách đăng ký ra Excel
- Import nhân viên từ CSV
- Cấu hình thời gian đăng ký linh hoạt
- Phân quyền Admin/User
- Responsive design cho mobile

### 🎨 UI/UX
- Thiết kế với Tailwind CSS
- Màu sắc theo brand Madison (xanh dương)
- Logo Madison trên navbar và login page
- Toast notifications cho feedback
- Loading states cho tất cả actions

### 🔒 Bảo mật
- Password hashing với bcrypt
- JWT token authentication
- Protected routes
- Input validation
- SQL injection prevention

### 📝 Documentation
- README với hướng dẫn đầy đủ
- Database setup scripts
- API documentation
- Contributing guidelines

### 🐛 Bug Fixes
- Sửa lỗi toast error không hiển thị khi login sai
- Sửa lỗi axios interceptor redirect loop
- Cải thiện error handling

### 🧹 Code Quality
- Xóa files dư thừa (test files, duplicates)
- Cải thiện TypeScript types
- Thêm comments cho code phức tạp
- Chuẩn hóa code structure

### 📦 Dependencies
- React 18
- TypeScript 5
- Express 4
- PostgreSQL 14+
- Tailwind CSS 3
- Vite 5

---

## Định dạng

- `✨ Tính năng mới` - Features
- `🐛 Bug Fixes` - Bug fixes
- `🎨 UI/UX` - UI/UX improvements
- `🔒 Bảo mật` - Security
- `📝 Documentation` - Documentation
- `🧹 Code Quality` - Code improvements
- `📦 Dependencies` - Dependencies updates
