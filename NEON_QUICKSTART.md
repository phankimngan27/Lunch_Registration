# 🚀 Neon.tech Quick Start (5 phút)

## Bước 1: Tạo database trên Neon (2 phút)

1. Vào https://neon.tech và đăng ký (dùng GitHub)
2. Click **"New Project"**
   - Name: `madison-lunch-registration`
   - Region: **Singapore** (gần VN nhất)
3. Copy **Connection String** (có dạng `postgresql://...`)

## Bước 2: Setup database schema (1 phút)

### Cách 1: Dùng Web SQL Editor (Dễ nhất)

1. Vào Neon Dashboard → Click **"SQL Editor"**
2. Mở file `database/railway-setup.sql` trong project
3. Copy toàn bộ nội dung
4. Paste vào SQL Editor
5. Click **"Run"**
6. ✅ Xong!

### Cách 2: Dùng script (Nhanh hơn)

```bash
cd backend

# Thay YOUR_CONNECTION_STRING bằng connection string từ Neon
DATABASE_URL="postgresql://..." npm run setup-neon
```

## Bước 3: Test connection (30 giây)

```bash
cd backend
DATABASE_URL="postgresql://..." npm run test-neon
```

Bạn sẽ thấy:
```
✅ Connected!
📊 Database Info
📋 Tables: users, registrations, settings, registration_config
👥 Total users: 2
```

## Bước 4: Cấu hình backend

### Local Development

Tạo file `backend/.env`:
```env
DATABASE_URL=postgresql://your-neon-connection-string
NODE_ENV=development
PORT=5000
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d
```

### Railway/Render Production

```bash
# Railway
railway variables set DATABASE_URL="postgresql://your-neon-connection-string"

# Render
# Vào Dashboard → Environment → Add DATABASE_URL
```

## Bước 5: Chạy backend (30 giây)

```bash
cd backend
npm install
npm run dev
```

Truy cập: http://localhost:5000/api/health

## 🎉 Xong! Login thử:

- **Admin**: admin@madison.dev / 1234
- **User**: ngan.phan.thi.kim@madison.dev / 1234

## 💡 Tips

### Neon tự động sleep sau 5 phút không dùng
- Connection đầu tiên sẽ mất 1-2 giây để wake up
- Sau đó sẽ nhanh bình thường

### Xem database
- Dashboard: https://console.neon.tech
- SQL Editor: Chạy queries trực tiếp
- Tables: Xem data, schema

### Free tier limits
- ✅ 0.5 GB storage
- ✅ 1 project
- ✅ Unlimited queries
- ✅ Auto-suspend khi không dùng

### Nếu cần nhiều hơn
- Upgrade: $19/month
- Hoặc dùng Railway Postgres: $5/month

## Troubleshooting

### Lỗi SSL
Đảm bảo connection string có `?sslmode=require` ở cuối

### Lỗi timeout
Database đang sleep, đợi 2-3 giây và thử lại

### Không connect được
1. Kiểm tra connection string
2. Vào Neon dashboard xem database có active không
3. Thử test connection: `npm run test-neon`
