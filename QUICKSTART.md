# 🚀 Quick Start Guide

Hướng dẫn nhanh để chạy project trong 5 phút.

## Yêu cầu

- Node.js 18+ 
- PostgreSQL 14+
- npm hoặc yarn

## Bước 1: Clone & Install

```bash
# Clone repository
git clone <repository-url>
cd lunch-registration

# Install dependencies
cd backend && npm install
cd ../frontend && npm install
```

## Bước 2: Setup Database

```bash
# Mở PostgreSQL
psql -U postgres

# Tạo database
CREATE DATABASE lunch_registration;
\c lunch_registration

# Chạy setup script
\i database/setup.sql

# Hoặc
psql -U postgres -d lunch_registration -f database/setup.sql
```

## Bước 3: Configure Backend

```bash
cd backend

# Copy env file
cp .env.example .env

# Sửa file .env với thông tin database của bạn
# DB_PASSWORD=your_password
# JWT_SECRET=your_secret_key
```

## Bước 4: Tạo Admin Account

```bash
cd backend
npm run create-admin
```

Credentials:
- Email: `admin@madison.dev`
- Password: `admin1234`

## Bước 5: Start Application

### Option 1: Manual (2 terminals)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server chạy tại http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# App chạy tại http://localhost:3000
```

### Option 2: Batch File (Windows)

```bash
# Chạy cả backend và frontend
start-website.bat

# Dừng tất cả
stop-website.bat
```

## Bước 6: Login

Mở browser: `http://localhost:3000`

**Admin:**
- Email: `admin@madison.dev`
- Password: `admin1234`

**User mẫu:**
- Email: `ngan.phan.thi.kim@madison.dev`
- Password: `1234`

## 🎉 Done!

Bây giờ bạn có thể:
- ✅ Đăng ký cơm trưa
- ✅ Xem thống kê
- ✅ Quản lý nhân viên (admin)
- ✅ Export Excel (admin)

## Troubleshooting

### Database connection error
```bash
# Check PostgreSQL đang chạy
pg_isready

# Check credentials trong .env
cat backend/.env
```

### Port already in use
```bash
# Backend (port 5000)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Frontend (port 3000)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Module not found
```bash
# Reinstall dependencies
cd backend && rm -rf node_modules && npm install
cd frontend && rm -rf node_modules && npm install
```

## Next Steps

- Đọc [README.md](README.md) để hiểu đầy đủ về project
- Xem [CONTRIBUTING.md](CONTRIBUTING.md) để đóng góp code
- Check [DATABASE_SETUP.md](DATABASE_SETUP.md) cho database details

## Support

Có vấn đề? Tạo issue hoặc liên hệ team lead.
