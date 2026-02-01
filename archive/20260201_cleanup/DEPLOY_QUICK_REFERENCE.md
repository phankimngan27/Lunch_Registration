# Quick Reference - Production Deployment

## 🚀 DEPLOYMENT COMMANDS (Copy & Paste)

### 1️⃣ BACKUP (BẮT BUỘC - 5 phút)
```bash
# SSH vào server
ssh root@178.128.92.112

# Tạo backup folder
mkdir -p /root/backups/$(date +%Y%m%d_%H%M%S)
cd /root/backups/$(date +%Y%m%d_%H%M%S)

# Backup database
sudo -u postgres pg_dump lunch_registration > lunch_registration_full_backup.sql

# Verify backup
ls -lh *.sql && wc -l *.sql

# Backup code
cd /var/www/lunch-booking
tar -czf /root/backups/$(date +%Y%m%d_%H%M%S)/backend_backup.tar.gz backend/
tar -czf /root/backups/$(date +%Y%m%d_%H%M%S)/frontend_backup.tar.gz frontend/
```

### 2️⃣ KIỂM TRA DATA LỖI (3 phút)
```bash
sudo -u postgres psql lunch_registration -c "
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE vegetarian_date IS NOT NULL AND vegetarian_date NOT IN (1,14,15)) as invalid
FROM registrations;
"
```

### 3️⃣ DEPLOY CODE (10 phút)
```bash
cd /var/www/lunch-booking

# Pull code mới
git pull origin main

# Build backend
cd backend
npm install
npm run build

# Build frontend
cd ../frontend
npm install
npm run build

# Deploy frontend
sudo mv /var/www/lunch-booking-frontend /var/www/lunch-booking-frontend.backup.$(date +%Y%m%d_%H%M%S)
sudo cp -r dist /var/www/lunch-booking-frontend
sudo chown -R www-data:www-data /var/www/lunch-booking-frontend
```

### 4️⃣ UPDATE DATABASE (5 phút)
```bash
cd /var/www/lunch-booking

# Add indexes (an toàn)
sudo -u postgres psql lunch_registration < database/add-performance-indexes.sql

# Clean invalid data (sau khi đã backup!)
sudo -u postgres psql lunch_registration < database/cleanup-invalid-vegetarian-dates.sql

# Verify
sudo -u postgres psql lunch_registration -c "
SELECT COUNT(*) FROM registrations 
WHERE vegetarian_date IS NOT NULL 
  AND vegetarian_date NOT IN (1,14,15);
"
# Kết quả phải là 0
```

### 5️⃣ RESTART SERVICES (2 phút)
```bash
# Restart backend
cd /var/www/lunch-booking/backend
pm2 restart lunch-backend

# Reload nginx
sudo nginx -t && sudo systemctl reload nginx

# Check status
pm2 status
pm2 logs lunch-backend --lines 20
```

### 6️⃣ TEST (5 phút)
```bash
# Test API
curl https://lunch-booking.madlab.tech/api/auth/profile

# Check logs
pm2 logs lunch-backend --lines 50
```

**Mở browser:** https://lunch-booking.madlab.tech
- Login
- Test đăng ký cơm
- Test calendar
- Test statistics (admin)

---

## 🆘 ROLLBACK (Nếu có lỗi)

```bash
# Restore database
cd /root/backups
ls -lt  # Tìm backup folder mới nhất
sudo -u postgres psql lunch_registration < [TIMESTAMP]/lunch_registration_full_backup.sql

# Restore frontend
sudo rm -rf /var/www/lunch-booking-frontend
sudo mv /var/www/lunch-booking-frontend.backup.[TIMESTAMP] /var/www/lunch-booking-frontend

# Restart
pm2 restart lunch-backend
sudo systemctl reload nginx
```

---

## 📊 VERIFICATION QUERIES

```sql
-- Kiểm tra tổng quan
SELECT 
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM registrations) as registrations,
  (SELECT COUNT(*) FROM registrations WHERE vegetarian_date IN (1,14,15)) as vegetarian_meals;

-- Kiểm tra không còn data lỗi
SELECT COUNT(*) FROM registrations 
WHERE vegetarian_date IS NOT NULL 
  AND vegetarian_date NOT IN (1,14,15);
-- Phải = 0

-- Kiểm tra indexes
\d registrations
```

---

## ⏱️ TIMELINE

| Bước | Thời gian | Downtime |
|------|-----------|----------|
| Backup | 5 phút | Không |
| Kiểm tra data | 3 phút | Không |
| Deploy code | 10 phút | Không |
| Update DB | 5 phút | Không |
| Restart | 2 phút | **2 phút** |
| Test | 5 phút | Không |
| **TỔNG** | **30 phút** | **2 phút** |

---

## ✅ CHECKLIST

**Trước khi bắt đầu:**
- [ ] Đọc kỹ PRODUCTION_DEPLOYMENT_GUIDE.md
- [ ] Thông báo team về maintenance window
- [ ] Chuẩn bị terminal/SSH connection

**Trong quá trình deploy:**
- [ ] ✅ Backup database thành công
- [ ] ✅ Backup code thành công
- [ ] ✅ Kiểm tra data lỗi
- [ ] ✅ Pull code mới
- [ ] ✅ Build backend/frontend thành công
- [ ] ✅ Deploy frontend
- [ ] ✅ Apply database changes
- [ ] ✅ Restart services
- [ ] ✅ Test API
- [ ] ✅ Test UI
- [ ] ✅ Verify database

**Sau khi deploy:**
- [ ] Monitor logs 10 phút
- [ ] Thông báo team deploy thành công
- [ ] Update documentation (nếu cần)

---

## 📞 SUPPORT

**Nếu gặp lỗi:**
1. Kiểm tra logs: `pm2 logs lunch-backend`
2. Kiểm tra nginx: `sudo tail -f /var/log/nginx/error.log`
3. Kiểm tra database: `sudo -u postgres psql lunch_registration`
4. Nếu nghiêm trọng: ROLLBACK ngay

**Common Issues:**
- **Build failed**: Kiểm tra `npm install` có lỗi không
- **PM2 không start**: Kiểm tra `.env` file
- **Database error**: Kiểm tra connection string
- **Frontend 404**: Kiểm tra nginx config và permissions

---

## 🎯 EXPECTED IMPROVEMENTS

Sau deploy:
- ⚡ Queries nhanh hơn 50-70% (nhờ indexes)
- ✅ Không còn invalid vegetarian dates
- 🎨 Lunar calendar hiển thị chính xác
- 🔒 Validation chặt chẽ hơn
- 📊 Bulk edit feature cho admin
