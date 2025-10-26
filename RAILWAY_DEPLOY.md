# 🚂 Deploy Backend lên Railway

Hướng dẫn deploy backend lên Railway sử dụng Railway CLI.

## Bước 1: Cài đặt Railway CLI

```powershell
npm install -g @railway/cli
```

## Bước 2: Login vào Railway

```powershell
railway login
```

Browser sẽ mở để bạn đăng nhập vào tài khoản Railway.

## Bước 3: Khởi tạo project

```powershell
cd backend
railway init
```

Chọn:
- **Create a new project** 
- Đặt tên: `lunch-registration-backend`

## Bước 4: Thêm PostgreSQL Database

```powershell
railway add --database postgres
```

Railway sẽ tự động tạo database và biến môi trường `DATABASE_URL`.

## Bước 5: Set các biến môi trường

```powershell
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
railway variables set JWT_EXPIRE=7d
railway variables set LUNCH_PRICE=20000
railway variables set DEFAULT_PASSWORD=1234
railway variables set PORT=5000
```

## Bước 6: Setup Database Schema

Sau khi database được tạo, cần chạy setup script:

```powershell
# Lấy DATABASE_URL
railway variables

# Connect vào database và chạy setup
railway run psql $DATABASE_URL -f ../database/setup.sql
```

Hoặc copy nội dung file `database/setup.sql` và chạy trong Railway Dashboard → Database → Query.

## Bước 7: Tạo Super Admin

```powershell
railway run npm run create-admin
```

## Bước 8: Deploy

```powershell
railway up
```

Hoặc nếu bạn dùng Git:

```powershell
git add .
git commit -m "Deploy to Railway"
railway up
```

## Bước 9: Lấy URL của backend

```powershell
railway domain
```

Hoặc tạo domain mới:

```powershell
railway domain create
```

URL sẽ có dạng: `https://lunch-registration-backend-production.up.railway.app`

## Bước 10: Test API

```powershell
# Test health check
curl https://your-backend-url.railway.app/api/health

# Test login
curl -X POST https://your-backend-url.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@madison.dev","password":"admin1234"}'
```

## Các lệnh hữu ích

```powershell
# Xem logs
railway logs

# Xem biến môi trường
railway variables

# Mở dashboard
railway open

# Xem status
railway status

# Connect vào database
railway connect postgres

# Chạy lệnh trong Railway environment
railway run <command>
```

## Cập nhật code

Mỗi khi có thay đổi code:

```powershell
cd backend
railway up
```

Hoặc nếu dùng Git và đã link với Railway:

```powershell
git push
```

Railway sẽ tự động deploy khi có push mới.

## Troubleshooting

### Build failed
```powershell
# Xem logs chi tiết
railway logs --build
```

### Database connection error
```powershell
# Kiểm tra DATABASE_URL
railway variables | grep DATABASE_URL

# Test connection
railway run node -e "const {Pool}=require('pg');const p=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}});p.query('SELECT NOW()',console.log)"
```

### Port issues
Railway tự động set biến `PORT`. Đảm bảo backend listen trên `process.env.PORT`:

```typescript
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

## Cập nhật Frontend

Sau khi deploy backend, cập nhật URL API trong frontend:

```typescript
// frontend/src/api/axios.ts
const API_URL = 'https://your-backend-url.railway.app/api';
```

## 🎉 Done!

Backend đã được deploy lên Railway. Bạn có thể:
- ✅ Truy cập API qua public URL
- ✅ Xem logs real-time
- ✅ Scale resources nếu cần
- ✅ Auto-deploy khi push code mới
