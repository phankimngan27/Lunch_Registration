# ⚡ Quick Deploy Guide - 15 phút

Hướng dẫn deploy nhanh nhất để chia sẻ website.

## Chuẩn bị

- [ ] Tài khoản GitHub
- [ ] Tài khoản Render.com (miễn phí)
- [ ] Tài khoản Vercel.com (miễn phí)

---

## Bước 1: Push code lên GitHub (5 phút)

```bash
# Khởi tạo git (nếu chưa có)
git init
git add .
git commit -m "Initial commit"

# Tạo repository trên GitHub
# Truy cập: https://github.com/new
# Tên: madison-lunch-registration

# Push code
git remote add origin https://github.com/your-username/madison-lunch-registration.git
git branch -M main
git push -u origin main
```

---

## Bước 2: Deploy Database (3 phút)

### Option A: Render PostgreSQL (Recommended)

1. Vào https://render.com/
2. Click **New** → **PostgreSQL**
3. Điền:
   - Name: `madison-lunch-db`
   - Database: `lunch_registration`
   - User: `madison`
   - Region: `Singapore`
   - Plan: **Free**
4. Click **Create Database**
5. Đợi 2-3 phút
6. Copy **Internal Database URL**
7. Vào **Shell** tab, chạy:

```sql
-- Copy nội dung từ database/setup.sql và paste vào
```

### Option B: ElephantSQL (Alternative)

1. Vào https://www.elephantsql.com/
2. Sign up → Create New Instance
3. Plan: **Tiny Turtle (Free)**
4. Region: **Asia Pacific**
5. Copy **URL**
6. Dùng pgAdmin hoặc psql để chạy `database/setup.sql`

---

## Bước 3: Deploy Backend (4 phút)

1. Vào https://render.com/
2. Click **New** → **Web Service**
3. Connect GitHub repository
4. Điền:
   - Name: `madison-lunch-backend`
   - Region: `Singapore`
   - Branch: `main`
   - Root Directory: `backend`
   - Runtime: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Plan: **Free**

5. Click **Advanced** → Add Environment Variables:

```
NODE_ENV=production
PORT=5000
DB_HOST=<from-step-2>
DB_PORT=5432
DB_NAME=lunch_registration
DB_USER=madison
DB_PASSWORD=<from-step-2>
JWT_SECRET=madison-lunch-jwt-secret-key-2024-production
LUNCH_PRICE=25000
```

6. Click **Create Web Service**
7. Đợi 5-10 phút deploy
8. Copy URL: `https://madison-lunch-backend.onrender.com`

---

## Bước 4: Deploy Frontend (3 phút)

1. Vào https://vercel.com/
2. Click **Add New** → **Project**
3. Import GitHub repository
4. Điền:
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. Add Environment Variable:
```
VITE_API_URL=https://madison-lunch-backend.onrender.com/api
```

6. Click **Deploy**
7. Đợi 2-3 phút
8. Copy URL: `https://madison-lunch.vercel.app`

---

## Bước 5: Tạo Admin Account

1. Vào Render Dashboard
2. Chọn `madison-lunch-backend`
3. Click **Shell** tab
4. Chạy:

```bash
npm run create-admin
```

Credentials:
- Email: `admin@madison.dev`
- Password: `admin1234`

---

## ✅ Hoàn tất!

**Website của bạn:** `https://madison-lunch.vercel.app`

### Test ngay:
1. Mở link trên
2. Login với admin account
3. Tạo user mới
4. Test đăng ký cơm

---

## 🔧 Troubleshooting

### Backend không start?
- Check logs trong Render Dashboard
- Verify environment variables
- Check database connection

### Frontend không connect backend?
- Verify `VITE_API_URL` trong Vercel
- Check CORS settings
- Open browser DevTools → Network tab

### Database connection error?
- Check DB credentials
- Verify database đã chạy setup.sql
- Test connection từ Render Shell

---

## 📱 Chia sẻ với team

Gửi link cho team:
```
🍱 Madison Lunch Registration
https://madison-lunch.vercel.app

Login:
- Email: your.name@madison.dev
- Password: 1234
```

---

## 🔄 Update sau này

### Update code:
```bash
git add .
git commit -m "Update features"
git push
```

Render và Vercel sẽ tự động deploy!

### Update database:
1. Vào Render Database Shell
2. Chạy SQL commands

---

## 💰 Chi phí

- Database: **FREE** (500MB)
- Backend: **FREE** (750 hours/month)
- Frontend: **FREE** (100GB bandwidth)

**Tổng: $0/tháng** 🎉

---

## 🚀 Next Steps

- [ ] Đổi admin password
- [ ] Thêm users
- [ ] Setup custom domain (optional)
- [ ] Enable analytics (optional)
- [ ] Setup monitoring (optional)

---

**Cần help?** Xem [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) để biết thêm chi tiết!
