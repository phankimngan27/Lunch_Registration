# Data Cleanup Guide: Invalid Vegetarian Dates

## 🎯 Mục đích
Cleanup data lỗi trong database nơi `is_vegetarian = true` cho những ngày **KHÔNG PHẢI** rằm/mùng 1 âm lịch.

## 🔍 Vấn đề
Do bug trong validation (đã fix), database có thể chứa data sai:
- User đánh dấu ngày thường là "ăn chay"
- Database lưu `is_vegetarian = true` cho ngày không phải rằm/mùng 1
- Hiển thị sai badge "Chay" trên UI

## ✅ Giải pháp

### Option 1: Automated Script (RECOMMENDED) 🚀

Script này sử dụng lunar calendar để tự động detect và fix data sai.

#### Trên Production Server

```bash
# SSH to server
ssh root@178.128.92.112

# Navigate to backend
cd /var/www/lunch-booking/backend

# Run cleanup script
npm run cleanup-vegetarian
```

#### Output mẫu:
```
🔍 Starting cleanup of invalid vegetarian dates...

Step 1: Fetching all vegetarian registrations...
Found 45 vegetarian registrations

Step 2: Validating against lunar calendar...
✅ Valid vegetarian dates: 5
❌ Invalid vegetarian dates: 40

Invalid vegetarian registrations:
────────────────────────────────────────────────────────────────────────────────
ID      Date            User                    Employee Code
────────────────────────────────────────────────────────────────────────────────
123     07/01/2026      Trần Minh Hiếu         240189.TMH
124     08/01/2026      Trần Minh Hiếu         240189.TMH
125     09/01/2026      Trần Minh Hiếu         240189.TMH
...
────────────────────────────────────────────────────────────────────────────────

⚠️  About to fix 40 invalid vegetarian dates
This will set is_vegetarian = false for these registrations

Step 3: Creating backup...
✅ Backup created

Step 4: Fixing invalid vegetarian dates...
✅ Fixed 40 registrations

Step 5: Verifying cleanup...
Remaining vegetarian registrations: 5

Summary of remaining vegetarian dates:
────────────────────────────────────────
Date                    Count
────────────────────────────────────────
15/01/2026              5
────────────────────────────────────────

✅ Cleanup completed successfully!

Summary:
  - Total checked: 45
  - Valid: 5
  - Fixed: 40
  - Remaining: 5

🎉 Done!
```

### Option 2: Manual SQL (For specific cases)

Nếu bạn muốn cleanup manually hoặc cho specific dates:

```bash
# SSH to server
ssh root@178.128.92.112

# Connect to database
psql -U postgres -d lunch_registration
```

#### Check data lỗi:
```sql
-- Xem tất cả vegetarian registrations
SELECT 
    r.id,
    r.user_id,
    u.full_name,
    u.employee_code,
    r.registration_date,
    EXTRACT(DAY FROM r.registration_date) as day
FROM registrations r
JOIN users u ON r.user_id = u.id
WHERE r.is_vegetarian = true
ORDER BY r.registration_date, u.employee_code;
```

#### Backup trước khi fix:
```sql
-- Tạo backup table
CREATE TABLE registrations_backup_vegetarian AS 
SELECT * FROM registrations WHERE is_vegetarian = true;

-- Verify backup
SELECT COUNT(*) FROM registrations_backup_vegetarian;
```

#### Fix data lỗi:

**Example 1: Fix tháng 1/2026 (chỉ ngày 15 là rằm)**
```sql
UPDATE registrations
SET is_vegetarian = false, updated_at = CURRENT_TIMESTAMP
WHERE registration_date >= '2026-01-01' 
AND registration_date < '2026-02-01'
AND is_vegetarian = true
AND EXTRACT(DAY FROM registration_date) != 15;

-- Check kết quả
SELECT registration_date, COUNT(*) 
FROM registrations 
WHERE is_vegetarian = true 
AND registration_date >= '2026-01-01' 
AND registration_date < '2026-02-01'
GROUP BY registration_date;
```

**Example 2: Fix cho specific user**
```sql
-- Tìm user_id
SELECT id, full_name, employee_code FROM users WHERE employee_code = '240189.TMH';

-- Fix data của user đó
UPDATE registrations
SET is_vegetarian = false, updated_at = CURRENT_TIMESTAMP
WHERE user_id = <user_id>
AND registration_date IN (
  '2026-01-07', '2026-01-08', '2026-01-09', 
  '2026-01-10', '2026-01-11', '2026-01-12',
  '2026-01-13', '2026-01-14', '2026-01-16'
);
```

**Example 3: Fix tất cả ngày không phải 1 và 15**
```sql
-- Heuristic approach (may need verification)
UPDATE registrations
SET is_vegetarian = false, updated_at = CURRENT_TIMESTAMP
WHERE is_vegetarian = true
AND EXTRACT(DAY FROM registration_date) NOT IN (1, 15)
AND registration_date >= '2026-01-01';
```

#### Verify sau khi fix:
```sql
-- Check còn bao nhiêu vegetarian registrations
SELECT 
    registration_date,
    COUNT(*) as count,
    STRING_AGG(u.full_name, ', ') as users
FROM registrations r
JOIN users u ON r.user_id = u.id
WHERE r.is_vegetarian = true
AND registration_date >= '2026-01-01'
GROUP BY r.registration_date
ORDER BY r.registration_date;
```

### Option 3: Rollback (Nếu có vấn đề)

```sql
-- Restore từ backup
UPDATE registrations r
SET is_vegetarian = b.is_vegetarian, updated_at = CURRENT_TIMESTAMP
FROM registrations_backup_vegetarian b
WHERE r.id = b.id;

-- Verify
SELECT COUNT(*) FROM registrations WHERE is_vegetarian = true;
```

## 📊 Lunar Calendar Reference 2026

Để verify manually, tham khảo ngày rằm/mùng 1 âm lịch:

| Tháng | Mùng 1 (Dương lịch) | Rằm (Dương lịch) |
|-------|---------------------|------------------|
| 1/2026 | ~01/01 | ~15/01 |
| 2/2026 | ~01/02 | ~14/02 |
| 3/2026 | ~02/03 | ~16/03 |
| 4/2026 | ~01/04 | ~15/04 |
| 5/2026 | ~30/04 | ~14/05 |
| 6/2026 | ~29/05 | ~13/06 |

**Note**: Ngày chính xác có thể lệch ±1 ngày tùy timezone.

## ⚠️ Important Notes

1. **ALWAYS backup before cleanup!**
   ```sql
   CREATE TABLE registrations_backup_vegetarian AS 
   SELECT * FROM registrations WHERE is_vegetarian = true;
   ```

2. **Test on development first** (if possible)

3. **Verify results after cleanup**
   ```sql
   SELECT registration_date, COUNT(*) 
   FROM registrations 
   WHERE is_vegetarian = true 
   GROUP BY registration_date 
   ORDER BY registration_date;
   ```

4. **Monitor user feedback** after cleanup

5. **Keep backup table** for at least 1 week

## 🧪 Testing After Cleanup

1. **Login to production**: https://lunch-booking.madlab.tech
2. **Go to Registration page**
3. **Check badge "Chay"**: Chỉ hiện ở ngày rằm/mùng 1
4. **Check "Trong đó ăn chay"**: Số đúng với số ngày rằm/mùng 1 đã chọn

## 📝 Checklist

- [ ] Backup database
- [ ] Run cleanup script OR manual SQL
- [ ] Verify results
- [ ] Test on production UI
- [ ] Monitor for 24 hours
- [ ] Delete backup table (after 1 week)

## 🆘 Support

If issues occur:
```bash
# Check backup exists
psql -U postgres -d lunch_registration -c "\dt registrations_backup*"

# Restore if needed
psql -U postgres -d lunch_registration -f restore_backup.sql

# Check logs
pm2 logs lunch-backend
```

---

**Priority**: MEDIUM (data quality issue)
**Impact**: Display only (không ảnh hưởng functionality)
**Estimated time**: 5-10 minutes
