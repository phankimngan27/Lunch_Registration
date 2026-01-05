# Fix Vegetarian Data - January 2026

## Vấn đề
Admin thấy "Cơm chay: 1" cho ngày **6/1/2026**, nhưng ngày này KHÔNG PHẢI ngày chay.

**Xác nhận**:
- ✅ **3/1/2026** = Rằm (15) tháng 11 âm lịch
- ✅ **19/1/2026** = Mùng 1 tháng 12 âm lịch
- ❌ **6/1/2026** = Ngày 18 tháng 11 âm lịch (KHÔNG phải ngày chay)

## Cách fix trên Production

### Bước 1: SSH vào server
```bash
ssh root@178.128.92.112
```

### Bước 2: Kết nối PostgreSQL
```bash
psql -U postgres -d lunch_registration
```

### Bước 3: Chạy SQL script
```bash
\i /var/www/lunch-booking/database/fix-production-vegetarian-jan2026.sql
```

Hoặc copy-paste từng command:

```sql
-- 1. Backup
CREATE TABLE IF NOT EXISTS registrations_backup_jan2026 AS 
SELECT * FROM registrations 
WHERE registration_date >= '2026-01-01' 
AND registration_date < '2026-02-01'
AND is_vegetarian = true;

-- 2. Fix invalid dates
UPDATE registrations
SET is_vegetarian = false
WHERE registration_date >= '2026-01-01' 
AND registration_date < '2026-02-01'
AND is_vegetarian = true
AND registration_date NOT IN ('2026-01-03', '2026-01-19');

-- 3. Verify (should return 0 rows)
SELECT * FROM registrations 
WHERE registration_date = '2026-01-06' 
AND is_vegetarian = true;
```

### Bước 4: Restart backend
```bash
pm2 restart lunch-backend
```

### Bước 5: Yêu cầu admin clear cache
- Hard refresh: `Ctrl + Shift + R` (Windows) hoặc `Cmd + Shift + R` (Mac)

## Phòng ngừa

Backend đã có validation chặt chẽ trong `backend/src/utils/validation.ts`:
- Function `validateVegetarianDates()` kiểm tra ngày chay dựa trên lunar calendar
- Reject requests có `is_vegetarian = true` cho ngày không phải âm lịch 1 hoặc 15
- Validation được áp dụng trong `registrationController.createRegistration()`

## Cleanup sau khi fix

Sau khi verify thành công, xóa file này:
```bash
rm FIX_VEGETARIAN_JAN2026.md
```
