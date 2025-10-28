# 🚀 Deploy Backend lên Render.com

Hướng dẫn deploy backend lên Render sử dụng Neon database.

## Bước 1: Chuẩn bị Database (Neon.tech)

### 1.1. Tạo tài khoản Neon
1. Truy cập: https://neon.tech
2. Đăng ký (có thể dùng GitHub)
3. Free tier: 0.5 GB storage

### 1.2. Tạo Database
1. Click **"New Project"**
2. Điền thông tin:
   - **Project name**: `madison-lunch-registration`
   - **Region**: **Singapore** (gần VN nhất)
   - **Postgres version**: 16
3. Click **"Create Project"**

### 1.3. Lấy Connection String
Sau khi tạo xong, copy **Connection String**:
```
postgresql://neondb_owner:abc123@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

**Lưu lại connection string này!**

### 1.4. Setup Database Schema
1. Vào Neon Dashboard → Click **"SQL Editor"**
2. Copy nội dung file `database/setup.sql` từ project
3. Paste vào SQL Editor và click **"Run"**
4. Verify: Bạn sẽ thấy 4 tables được tạo (users, registrations, settings, registration_config)

---

## Bước 2: Deploy Backend lên Render

### 2.1. Tạo tài khoản Render
1. Truy cập: https://render.com
2. Sign up (dùng GitHub để dễ dàng)

### 2.2. Tạo Web Service mới

#### Option A: Deploy từ Dashboard (Dễ nhất)

1. Click **"New +"** → **"Web Service"**
2. Connect GitHub repository của bạn
3. Chọn repository: `Lunch_Registration`
4. Điền thông tin:

**Basic Settings:**
- **Name**: `madison-lunch-backend`
- **Region**: **Singapore**
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

**Advanced Settings:**
- **Plan**: **Free**
- **Health Check Path**: `/health`

5. Click **"Advanced"** để thêm Environment Variables:

```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://neondb_owner:abc123@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=madison-lunch-jwt-secret-key-production-2024-change-this
JWT_EXPIRE=7d
LUNCH_PRICE=25000
DEFAULT_PASSWORD=1234
CORS_ORIGIN=https://your-frontend-url.vercel.app
```

**Quan trọng:**
- Thay `DATABASE_URL` bằng connection string từ Neon (Bước 1.3)
- Thay `JWT_SECRET` bằng một chuỗi ngẫu nhiên dài ít nhất 32 ký tự
- `CORS_ORIGIN` sẽ cập nhật sau khi deploy frontend

6. Click **"Create Web Service"**

#### Option B: Deploy bằng Blueprint (Nhanh hơn)

1. Click **"New +"** → **"Blueprint"**
2. Connect GitHub repository
3. Chọn file `render.yaml`
4. Render sẽ tự động đọc config
5. Thêm các environment variables còn thiếu:
   - `DATABASE_URL`: Connection string từ Neon
   - `CORS_ORIGIN`: Frontend URL

### 2.3. Đợi Deploy
- Quá trình build + deploy mất khoảng 3-5 phút
- Xem logs real-time trong Dashboard
- Khi thấy "✅ Live" là đã xong

### 2.4. Lấy Backend URL
Sau khi deploy xong, copy URL:
```
https://madison-lunch-backend.onrender.com
```

---

## Bước 3: Setup Database (One-time)

### 3.1. Test Health Check
```bash
curl https://madison-lunch-backend.onrender.com/health
```

Kết quả:
```json
{
  "status": "OK",
  "message": "Server đang chạy",
  "timestamp": "2024-10-26T..."
}
```

### 3.2. Setup Database (nếu chưa chạy ở Bước 1.4)
```bash
curl -X POST https://madison-lunch-backend.onrender.com/setup-db-now
```

Kết quả:
```json
{
  "success": true,
  "message": "Database setup thành công! Login: admin@madison.dev / 1234"
}
```

### 3.3. Test Login
```bash
curl -X POST https://madison-lunch-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@madison.dev","password":"1234"}'
```

Nếu thành công, bạn sẽ nhận được token và thông tin user.

---

## Bước 4: Cập nhật Frontend

Sau khi backend đã live, cập nhật frontend để connect:

### 4.1. Update API URL
File: `frontend/src/api/axios.ts`
```typescript
const API_URL = 'https://madison-lunch-backend.onrender.com/api';
```

### 4.2. Deploy Frontend lên Render
Xem phần **Bước 3** bên dưới

### 4.3. Cập nhật CORS_ORIGIN
Sau khi có frontend URL, quay lại Render:
1. Vào Web Service → **Environment**
2. Update `CORS_ORIGIN`:
```
CORS_ORIGIN=https://madison-lunch-frontend.onrender.com
```
3. Service sẽ tự động redeploy

---

## 🎉 Hoàn tất!

Backend đã được deploy thành công!

**URLs:**
- Backend: `https://madison-lunch-backend.onrender.com`
- Health Check: `https://madison-lunch-backend.onrender.com/health`
- API: `https://madison-lunch-backend.onrender.com/api`

**Login credentials:**
- Admin: `admin@madison.dev` / `1234`
- User: `ngan.phan.thi.kim@madison.dev` / `1234`

---

## 📊 Monitoring

### Xem Logs
1. Vào Render Dashboard
2. Chọn service `madison-lunch-backend`
3. Click tab **"Logs"**
4. Xem real-time logs

### Xem Metrics
- Tab **"Metrics"**: CPU, Memory, Response time
- Tab **"Events"**: Deploy history

### Database Monitoring
1. Vào Neon Dashboard: https://console.neon.tech
2. Xem queries, connections, storage usage

---

## 🔧 Troubleshooting

### Build failed
```bash
# Xem logs trong Render Dashboard
# Thường do:
# - Missing dependencies
# - TypeScript errors
# - Build command sai
```

**Fix:**
- Check `package.json` có đầy đủ dependencies
- Run `npm run build` locally để test
- Verify build command: `npm install && npm run build`

### Database connection error
```
Error: connect ECONNREFUSED
```

**Fix:**
- Verify `DATABASE_URL` đúng format
- Check Neon database có active không (có thể bị suspend)
- Test connection từ local:
```bash
psql "postgresql://your-connection-string"
```

### CORS error
```
Access to fetch blocked by CORS policy
```

**Fix:**
- Update `CORS_ORIGIN` trong Render Environment Variables
- Đảm bảo frontend URL đúng (không có trailing slash)
- Restart service sau khi update

### Service không start
```
Application failed to respond
```

**Fix:**
- Check start command: `npm start`
- Verify `dist/server.js` được build
- Check PORT environment variable
- Xem logs để biết lỗi cụ thể

### Free tier limitations
- Service sẽ **sleep sau 15 phút không hoạt động**
- Request đầu tiên sau khi sleep sẽ mất 30-60 giây để wake up
- 750 hours/month (đủ cho 1 service chạy 24/7)

**Giải pháp:**
- Upgrade lên Paid plan ($7/month) để không bị sleep
- Hoặc dùng cron job để ping service mỗi 10 phút

---

## 🔄 Update Code

### Auto Deploy (Recommended)
Render tự động deploy khi có push mới lên GitHub:

```bash
git add .
git commit -m "Update backend"
git push origin main
```

Render sẽ tự động:
1. Detect changes
2. Build lại
3. Deploy version mới
4. Zero-downtime deployment

### Manual Deploy
1. Vào Render Dashboard
2. Chọn service
3. Click **"Manual Deploy"** → **"Deploy latest commit"**

### Rollback
1. Vào tab **"Events"**
2. Chọn deploy version cũ
3. Click **"Rollback to this version"**

---

## 💰 Chi phí

**Free Tier:**
- ✅ 750 hours/month
- ✅ 512 MB RAM
- ✅ 0.1 CPU
- ✅ Auto-sleep sau 15 phút
- ✅ Shared IP

**Paid Plan ($7/month):**
- ✅ Always on (không sleep)
- ✅ 512 MB RAM
- ✅ 0.5 CPU
- ✅ Dedicated IP
- ✅ Priority support

**Database (Neon Free):**
- ✅ 0.5 GB storage
- ✅ Auto-suspend khi không dùng
- ✅ Unlimited queries

**Tổng: $0/month** (Free tier) hoặc **$7/month** (Paid)

---

## 🚀 Next Steps

- [x] Deploy backend lên Render
- [x] Deploy frontend lên Render (static site)
- [ ] Setup custom domain (optional)
- [ ] Enable monitoring/alerts
- [ ] Setup backup strategy
- [ ] Add CI/CD pipeline
- [ ] Configure environment-specific settings

---

## 📚 Tài liệu thêm

- [Render Documentation](https://render.com/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Node.js on Render](https://render.com/docs/deploy-node-express-app)

---

**Cần help?** Tạo issue trên GitHub hoặc liên hệ team lead.
