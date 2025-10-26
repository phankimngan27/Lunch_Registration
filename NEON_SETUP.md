# Setup Database với Neon.tech

## 1. Tạo tài khoản Neon

1. Truy cập: https://neon.tech
2. Đăng ký tài khoản (có thể dùng GitHub)
3. Free tier: 0.5 GB storage, 1 project

## 2. Tạo Project mới

1. Click **"New Project"**
2. Điền thông tin:
   - **Project name**: `madison-lunch-registration`
   - **Region**: Singapore (gần Việt Nam nhất)
   - **Postgres version**: 16 (mới nhất)
3. Click **"Create Project"**

## 3. Lấy Connection String

Sau khi tạo xong, bạn sẽ thấy connection string:

```
postgresql://[user]:[password]@[endpoint]/[database]?sslmode=require
```

Ví dụ:
```
postgresql://neondb_owner:abc123xyz@ep-cool-name-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

**Lưu ý**: Copy và lưu connection string này!

## 4. Setup Database Schema

### Cách 1: Dùng Neon SQL Editor (Web)

1. Vào project → Click **"SQL Editor"**
2. Copy nội dung file `database/railway-setup.sql`
3. Paste vào editor
4. Click **"Run"**

### Cách 2: Dùng script từ local

```bash
# Cài đặt psql nếu chưa có
# Windows: https://www.postgresql.org/download/windows/

# Chạy setup
psql "postgresql://[your-connection-string]" -f database/railway-setup.sql
```

### Cách 3: Dùng Node.js script

```bash
cd backend
DATABASE_URL="postgresql://[your-connection-string]" node setup-neon.js
```

## 5. Cấu hình Backend

### Local Development (.env)
```env
DATABASE_URL=postgresql://[your-neon-connection-string]
NODE_ENV=development
PORT=5000
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d
```

### Railway/Production
Thêm biến môi trường:
```bash
railway variables set DATABASE_URL="postgresql://[your-neon-connection-string]"
```

## 6. Verify Connection

Test kết nối:
```bash
cd backend
npm run test-db
```

## 7. Tính năng Neon

- ✅ **Serverless**: Tự động scale, chỉ trả tiền khi dùng
- ✅ **Branching**: Tạo database branch như Git
- ✅ **Instant restore**: Restore về bất kỳ thời điểm nào
- ✅ **Auto-suspend**: Tự động tắt khi không dùng (tiết kiệm)
- ✅ **Free tier**: 0.5 GB storage, 1 project

## 8. Monitoring

- Dashboard: https://console.neon.tech
- Xem queries, connections, storage usage
- Set up alerts

## Troubleshooting

### Lỗi SSL
Đảm bảo connection string có `?sslmode=require`

### Lỗi timeout
Neon có thể suspend database sau 5 phút không hoạt động.
Connection đầu tiên sẽ mất ~1-2 giây để wake up.

### Connection limit
Free tier: 100 connections
Nếu cần nhiều hơn, dùng connection pooling (PgBouncer)
