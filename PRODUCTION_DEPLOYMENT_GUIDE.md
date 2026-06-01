bbbbbbbb# Hướng Dẫn Deploy Production An Toàn

## ⚠️ QUAN TRỌNG: ĐỌC KỸ TRƯỚC KHI THỰC HIỆN

Hướng dẫn này đảm bảo deploy an toàn với backup đầy đủ để có thể rollback nếu cần.

---

## PHẦN 1: CHUẨN BỊ VÀ BACKUP (BẮT BUỘC)

### Bước 1.1: Kết nối SSH vào server
```bash
ssh root@YOUR_SERVER_IP
```

### Bước 1.2: Backup Database (QUAN TRỌNG NHẤT)
```bash
# Tạo thư mục backup với timestamp
mkdir -p /root/backups/$(date +%Y%m%d_%H%M%S)
cd /root/backups/$(date +%Y%m%d_%H%M%S)

# Backup toàn bộ database
sudo -u postgres pg_dump lunch_registration > lunch_registration_full_backup.sql

# Backup riêng bảng registrations (bảng quan trọng nhất)
sudo -u postgres pg_dump lunch_registration -t registrations > registrations_backup.sql

# Verify backup file có data
ls -lh *.sql
# File phải có kích thước > 0 bytes

# Kiểm tra số dòng trong backup
wc -l *.sql
# Phải có nhiều dòng, không phải file rỗng

echo "✅ Backup completed at: $(pwd)"
```

### Bước 1.3: Backup code hiện tại
```bash
# Backup backend code
cd /var/www/lunch-booking
tar -czf /root/backups/$(date +%Y%m%d_%H%M%S)/backend_backup.tar.gz backend/

# Backup frontend code
tar -czf /root/backups/$(date +%Y%m%d_%H%M%S)/frontend_backup.tar.gz frontend/

echo "✅ Code backup completed"
```

### Bước 1.4: Kiểm tra trạng thái hiện tại
```bash
# Kiểm tra PM2 đang chạy
pm2 status

# Kiểm tra database connection
sudo -u postgres psql lunch_registration -c "SELECT COUNT(*) FROM registrations;"

# Lưu lại output để so sánh sau khi deploy
```

---

## PHẦN 2: PHÂN TÍCH DATA LỖI (TRƯỚC KHI XÓA)

### Bước 2.1: Kiểm tra data lỗi vegetarian
```bash
sudo -u postgres psql lunch_registration
```

Trong psql, chạy các query sau:

```sql
-- Xem tổng số registrations
SELECT COUNT(*) as total_registrations FROM registrations;

-- Xem số lượng registrations có vegetarian_date lỗi
SELECT COUNT(*) as invalid_vegetarian_dates 
FROM registrations 
WHERE vegetarian_date IS NOT NULL 
  AND vegetarian_date NOT IN (1, 14, 15);

-- Xem chi tiết các records lỗi (để review)
SELECT id, user_id, date, vegetarian_date, created_at 
FROM registrations 
WHERE vegetarian_date IS NOT NULL 
  AND vegetarian_date NOT IN (1, 14, 15)
ORDER BY date DESC
LIMIT 20;

-- Kiểm tra xem có user nào bị ảnh hưởng nhiều không
SELECT user_id, COUNT(*) as invalid_count
FROM registrations 
WHERE vegetarian_date IS NOT NULL 
  AND vegetarian_date NOT IN (1, 14, 15)
GROUP BY user_id
ORDER BY invalid_count DESC;
```

**📝 GHI CHÚ KẾT QUẢ:**
- Tổng số registrations: _______
- Số registrations lỗi: _______
- Tỷ lệ lỗi: _______% 

### Bước 2.2: Export data lỗi ra file (để lưu trữ)
```sql
-- Export data lỗi trước khi xóa
\copy (SELECT * FROM registrations WHERE vegetarian_date IS NOT NULL AND vegetarian_date NOT IN (1, 14, 15)) TO '/tmp/invalid_vegetarian_data.csv' CSV HEADER;

\q
```

```bash
# Copy file export về backup folder
cp /tmp/invalid_vegetarian_data.csv /root/backups/$(ls -t /root/backups/ | head -1)/

echo "✅ Invalid data exported for reference"
```

---

## PHẦN 3: DEPLOY CODE MỚI

### Bước 3.1: Pull code mới từ Git
```bash
cd /var/www/lunch-booking

# Kiểm tra branch hiện tại
git branch

# Pull code mới
git pull origin main

# Verify code đã được pull
git log -1
```

### Bước 3.2: Update Backend Dependencies
```bash
cd /var/www/lunch-booking/backend

# Install dependencies mới (nếu có)
npm install

# Build TypeScript
npm run build

# Verify build thành công
ls -la dist/
```

### Bước 3.3: Update Frontend
```bash
cd /var/www/lunch-booking/frontend

# Install dependencies mới (nếu có)
npm install

# Build production
npm run build

# Verify build thành công
ls -la dist/
```

### Bước 3.4: Copy Frontend Build
```bash
# Backup frontend cũ
sudo mv /var/www/lunch-booking-frontend /var/www/lunch-booking-frontend.backup.$(date +%Y%m%d_%H%M%S)

# Copy build mới
sudo cp -r /var/www/lunch-booking/frontend/dist /var/www/lunch-booking-frontend

# Set permissions
sudo chown -R www-data:www-data /var/www/lunch-booking-frontend

echo "✅ Frontend deployed"
```

---

## PHẦN 4: APPLY DATABASE CHANGES

### Bước 4.1: Add Performance Indexes (An toàn - không ảnh hưởng data)
```bash
cd /var/www/lunch-booking

# Apply indexes
sudo -u postgres psql lunch_registration < database/add-performance-indexes.sql
```

Verify indexes đã được tạo:
```bash
sudo -u postgres psql lunch_registration -c "\d registrations"
```

### Bước 4.2: Clean Up Invalid Vegetarian Data (CẨN THẬN)

**⚠️ CHECKPOINT: Trước khi chạy, confirm:**
- [ ] Đã backup database? 
- [ ] Đã export invalid data ra CSV?
- [ ] Đã review số lượng records sẽ bị xóa?

Nếu TẤT CẢ đều YES, tiếp tục:

```bash
# Chạy cleanup script
sudo -u postgres psql lunch_registration < database/cleanup-invalid-vegetarian-dates.sql
```

### Bước 4.3: Verify Cleanup
```bash
sudo -u postgres psql lunch_registration
```

```sql
-- Kiểm tra không còn data lỗi
SELECT COUNT(*) as remaining_invalid 
FROM registrations 
WHERE vegetarian_date IS NOT NULL 
  AND vegetarian_date NOT IN (1, 14, 15);
-- Kết quả phải là 0

-- Kiểm tra tổng số registrations còn lại
SELECT COUNT(*) as total_after_cleanup FROM registrations;
-- So sánh với số ban đầu

-- Kiểm tra data hợp lệ vẫn còn nguyên
SELECT COUNT(*) as valid_vegetarian 
FROM registrations 
WHERE vegetarian_date IN (1, 14, 15);
-- Số này phải giống như trước cleanup

\q
```

---

## PHẦN 5: RESTART SERVICES

### Bước 5.1: Restart Backend với PM2
```bash
cd /var/www/lunch-booking/backend

# Restart PM2
pm2 restart lunch-backend

# Kiểm tra logs
pm2 logs lunch-backend --lines 50

# Verify không có error
pm2 status
```

### Bước 5.2: Reload Nginx
```bash
# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Verify nginx đang chạy
sudo systemctl status nginx
```

---

## PHẦN 6: TESTING VÀ VERIFICATION

### Bước 6.1: Test Backend API
```bash
# Test health check
curl https://lunch-booking.madlab.tech/api/auth/profile

# Test database connection
curl -X POST https://lunch-booking.madlab.tech/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your.email@madison.dev","password":"your_password"}'
```

### Bước 6.2: Test Frontend
Mở browser và truy cập: https://lunch-booking.madlab.tech

**Checklist test:**
- [ ] Trang login hiển thị bình thường
- [ ] Đăng nhập thành công
- [ ] Dashboard load được data
- [ ] Calendar hiển thị đúng (bao gồm lunar dates)
- [ ] Đăng ký cơm mới hoạt động
- [ ] Xem lịch sử đăng ký
- [ ] Admin: Xem statistics
- [ ] Admin: Export Excel

### Bước 6.3: Verify Database Integrity
```bash
sudo -u postgres psql lunch_registration
```

```sql
-- Kiểm tra data integrity
SELECT 
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM registrations) as total_registrations,
  (SELECT COUNT(*) FROM registrations WHERE vegetarian_date IN (1,14,15)) as valid_vegetarian_registrations;

-- Kiểm tra registrations gần đây
SELECT * FROM registrations ORDER BY created_at DESC LIMIT 10;

\q
```

---

## PHẦN 7: ROLLBACK (NẾU CẦN)

**Chỉ thực hiện nếu có vấn đề nghiêm trọng!**

### Rollback Database
```bash
# Tìm backup folder gần nhất
ls -lt /root/backups/

# Restore database
sudo -u postgres psql lunch_registration < /root/backups/[TIMESTAMP]/lunch_registration_full_backup.sql
```

### Rollback Code
```bash
# Restore backend
cd /var/www/lunch-booking
tar -xzf /root/backups/[TIMESTAMP]/backend_backup.tar.gz

# Restore frontend
sudo rm -rf /var/www/lunch-booking-frontend
sudo mv /var/www/lunch-booking-frontend.backup.[TIMESTAMP] /var/www/lunch-booking-frontend

# Restart services
pm2 restart lunch-backend
sudo systemctl reload nginx
```

---

## PHẦN 8: POST-DEPLOYMENT

### Bước 8.1: Monitor Logs
```bash
# Monitor PM2 logs trong 5-10 phút
pm2 logs lunch-backend

# Monitor Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Bước 8.2: Notify Team
Thông báo cho team về:
- ✅ Deploy thành công
- 📊 Số lượng invalid data đã được clean up
- 🚀 Performance improvements đã được apply
- 📝 Các tính năng mới

### Bước 8.3: Clean Up Old Backups (Sau 1 tuần)
```bash
# Giữ lại backups trong 30 ngày
find /root/backups/ -type d -mtime +30 -exec rm -rf {} \;
```

---

## 📋 CHECKLIST TỔNG HỢP

### Pre-Deployment
- [ ] Backup database hoàn tất
- [ ] Backup code hoàn tất
- [ ] Phân tích data lỗi
- [ ] Export invalid data ra CSV

### Deployment
- [ ] Pull code mới
- [ ] Build backend thành công
- [ ] Build frontend thành công
- [ ] Deploy frontend
- [ ] Apply database indexes
- [ ] Clean up invalid data
- [ ] Restart services

### Post-Deployment
- [ ] Test backend API
- [ ] Test frontend UI
- [ ] Verify database integrity
- [ ] Monitor logs (no errors)
- [ ] Notify team

---

## 🆘 LIÊN HỆ KHI CẦN HỖ TRỢ

Nếu gặp vấn đề:
1. KHÔNG PANIC
2. Kiểm tra logs: `pm2 logs lunch-backend`
3. Kiểm tra database connection
4. Nếu cần rollback, làm theo PHẦN 7
5. Liên hệ team để hỗ trợ

---

## 📊 EXPECTED RESULTS

Sau khi deploy thành công:
- ✅ Performance cải thiện (queries nhanh hơn nhờ indexes)
- ✅ Không còn invalid vegetarian dates
- ✅ Lunar calendar hiển thị chính xác
- ✅ Registration cancellation validation hoạt động đúng
- ✅ Bulk edit feature available cho admin
- ✅ Database connection pooling giảm load

---

**Thời gian ước tính:** 30-45 phút (bao gồm backup và testing)

**Downtime:** ~2-3 phút (trong lúc restart PM2)
