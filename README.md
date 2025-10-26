# 🍱 Madison - Hệ thống Đăng ký Cơm Trưa

Hệ thống quản lý đăng ký suất ăn trưa nội bộ cho Madison Technologies.

## 🚀 Công nghệ

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL 14+
- **Authentication**: JWT + bcrypt

## 📁 Cấu trúc

```
lunch-registration/
├── frontend/              # React application
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── api/          # API client
│   │   └── store/        # State management
│   └── public/           # Static assets
├── backend/              # Express API server
│   ├── src/
│   │   ├── controllers/  # Route controllers
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Custom middleware
│   │   └── config/       # Configuration
│   └── scripts/          # Utility scripts
└── database/             # Database setup scripts
```

## ⚙️ Cài đặt

### 1. Database Setup
```bash
# Tạo database
psql -U postgres
CREATE DATABASE lunch_registration;
\c lunch_registration

# Chạy setup script
\i database/setup.sql
```

### 2. Backend
```bash
cd backend
npm install

# Tạo file .env
cp .env.example .env
# Cập nhật thông tin database trong .env

# Tạo super admin
npm run create-admin

# Chạy server
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Hoặc dùng batch files (Windows)
```bash
# Khởi động cả backend và frontend
start-website.bat

# Dừng tất cả
stop-website.bat
```

## 🎯 Tính năng

### Cho nhân viên:
- ✅ Đăng ký cơm trưa theo lịch (hỗ trợ âm lịch)
- ✅ Xem lịch sử đăng ký
- ✅ Hủy đăng ký (trong thời hạn)
- ✅ Dashboard thống kê cá nhân

### Cho admin:
- ✅ Quản lý nhân viên (CRUD)
- ✅ Thống kê theo ngày/tháng/phòng ban
- ✅ Export danh sách Excel
- ✅ Cấu hình thời gian đăng ký
- ✅ Quản lý giá suất ăn
- ✅ Import nhân viên từ CSV

## 🔐 Tài khoản mặc định

**Super Admin:**
- Email: `admin@madison.dev`
- Password: `admin1234`

**User mẫu:**
- Email: `ngan.phan.thi.kim@madison.dev`
- Password: `1234`

⚠️ Đổi password sau lần đăng nhập đầu tiên!

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/profile` - Lấy thông tin user

### Registrations
- `GET /api/registrations` - Lấy danh sách đăng ký
- `POST /api/registrations` - Tạo đăng ký mới
- `DELETE /api/registrations/:id` - Hủy đăng ký

### Admin
- `GET /api/users` - Danh sách nhân viên
- `POST /api/users` - Tạo nhân viên
- `PUT /api/users/:id` - Cập nhật nhân viên
- `DELETE /api/users/:id` - Xóa nhân viên
- `GET /api/statistics` - Thống kê
- `GET /api/config` - Cấu hình hệ thống

## 🛠️ Scripts hữu ích

```bash
# Backend
cd backend
npm run create-admin      # Tạo/reset super admin
npm run import-csv        # Import nhân viên từ CSV
npm run reset-passwords   # Reset tất cả password về 1234
npm run update-price      # Cập nhật giá suất ăn

# Frontend
cd frontend
npm run build            # Build production
npm run preview          # Preview production build
```

## 📚 Tài liệu thêm

- [QUICKSTART.md](QUICKSTART.md) - Hướng dẫn setup nhanh 5 phút
- [QUICK_DEPLOY.md](QUICK_DEPLOY.md) - Deploy lên cloud 15 phút
- [DATABASE_SETUP.md](DATABASE_SETUP.md) - Hướng dẫn database chi tiết
- [REGISTRATION_CONFIG_GUIDE.md](REGISTRATION_CONFIG_GUIDE.md) - Cấu hình thời gian
- [TECH_STACK.md](TECH_STACK.md) - Chi tiết công nghệ
- [CONTRIBUTING.md](CONTRIBUTING.md) - Hướng dẫn đóng góp code

## 📄 License

Internal use only - Madison Technologies © 2024
