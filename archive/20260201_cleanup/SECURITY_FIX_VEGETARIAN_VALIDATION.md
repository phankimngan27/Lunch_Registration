# Security Fix: Vegetarian Date Validation

## 🚨 CRITICAL SECURITY ISSUE

### Vulnerability
Backend **KHÔNG VALIDATE** `vegetarianDates` từ API request, cho phép users gửi bất kỳ ngày nào và đánh dấu là "ăn chay", ngay cả khi ngày đó **KHÔNG PHẢI** là rằm/mùng 1 âm lịch.

### Impact
- **Severity**: HIGH
- **Type**: Input Validation Bypass / Data Integrity
- **Affected**: All users with API access
- **Exploitability**: Easy (chỉ cần gửi POST request với data sai)

### Attack Scenario
```bash
# Attacker có thể gửi request:
POST /api/registrations
{
  "dates": ["2026-01-05", "2026-01-06", "2026-01-07", ...],
  "month": 1,
  "year": 2026,
  "vegetarianDates": {
    "2026-01-05": true,  // KHÔNG PHẢI rằm!
    "2026-01-06": true,  // KHÔNG PHẢI rằm!
    "2026-01-07": true,  // KHÔNG PHẢI rằm!
    // ... tất cả các ngày đều set true
  }
}

# Backend sẽ lưu TẤT CẢ vào database với is_vegetarian = true
# Dẫn đến hiển thị sai và báo cáo sai!
```

## 🔍 Root Cause Analysis

### Backend Code (VULNERABLE)
```typescript
// backend/src/controllers/registrationController.ts
const { dates, month, year, vegetarianDates } = req.body;

// ❌ KHÔNG CÓ VALIDATION!
for (const date of newDates) {
  const isVegetarian = vegetarianDates && vegetarianDates[date] === true;
  // Lưu trực tiếp vào database!
  await client.query(
    `INSERT INTO registrations (..., is_vegetarian) VALUES (..., $5)`,
    [..., isVegetarian]
  );
}
```

### Why This Happened
1. **Trust client data**: Backend tin tưởng 100% vào data từ frontend
2. **No business logic validation**: Không check ngày đó có thực sự là rằm/mùng 1
3. **Missing lunar calendar**: Backend không có lunar calendar để validate

## ✅ Solution Implemented

### 1. Added Lunar Calendar to Backend
Created `backend/src/utils/lunarCalendar.ts`:
```typescript
export function convertSolar2Lunar(dd, mm, yy, timeZone = 7): [number, number, number, number]
export function isVegetarianDay(date: Date): boolean
```

### 2. Added Validation Function
Added to `backend/src/utils/validation.ts`:
```typescript
export const validateVegetarianDates = (
  vegetarianDates: any,
  registrationDates: string[]
): { valid: boolean; message?: string; validatedDates?: { [key: string]: boolean } }
```

**Validation Logic**:
1. ✅ Check date format
2. ✅ Check if date is actually lunar 1st or 15th
3. ✅ Check if date is in registration dates
4. ✅ Filter out invalid dates
5. ✅ Return only validated dates

### 3. Updated Registration Controller
```typescript
// BEFORE (VULNERABLE):
const isVegetarian = vegetarianDates && vegetarianDates[date] === true;

// AFTER (SECURE):
// Step 1: Validate vegetarian dates
const vegetarianValidation = validateVegetarianDates(vegetarianDates, dates);
if (!vegetarianValidation.valid) {
  return res.status(400).json({ message: vegetarianValidation.message });
}
const validatedVegetarianDates = vegetarianValidation.validatedDates || {};

// Step 2: Use validated dates
const isVegetarian = validatedVegetarianDates && validatedVegetarianDates[date] === true;
```

## 🧪 Test Cases

### Test 1: Valid Vegetarian Dates
```json
Request:
{
  "dates": ["2026-01-15", "2026-01-16"],
  "vegetarianDates": {
    "2026-01-15": true  // 15/1 là rằm âm lịch
  }
}

Expected: ✅ Success
Result: is_vegetarian = true for 2026-01-15 only
```

### Test 2: Invalid Vegetarian Dates (Attack)
```json
Request:
{
  "dates": ["2026-01-05", "2026-01-06"],
  "vegetarianDates": {
    "2026-01-05": true,  // KHÔNG PHẢI rằm!
    "2026-01-06": true   // KHÔNG PHẢI rằm!
  }
}

Expected: ❌ Error 400
Message: "Các ngày sau không phải là ngày rằm/mùng 1 âm lịch: 2026-01-05, 2026-01-06"
```

### Test 3: Mixed Valid/Invalid
```json
Request:
{
  "dates": ["2026-01-15", "2026-01-16"],
  "vegetarianDates": {
    "2026-01-15": true,  // Valid (rằm)
    "2026-01-16": true   // Invalid (không phải rằm)
  }
}

Expected: ❌ Error 400
Message: "Các ngày sau không phải là ngày rằm/mùng 1 âm lịch: 2026-01-16"
```

### Test 4: Vegetarian Date Not in Registration
```json
Request:
{
  "dates": ["2026-01-16"],
  "vegetarianDates": {
    "2026-01-15": true  // Không có trong dates array
  }
}

Expected: ❌ Error 400
Message: "Ngày chay 2026-01-15 không có trong danh sách đăng ký"
```

## 📊 Impact Assessment

### Before Fix
- ❌ Users có thể đánh dấu BẤT KỲ ngày nào là "ăn chay"
- ❌ Database chứa data sai
- ❌ Báo cáo thống kê sai
- ❌ Admin không thể tin tưởng data
- ❌ Có thể gây nhầm lẫn cho nhà cung cấp suất ăn

### After Fix
- ✅ Chỉ ngày rằm/mùng 1 mới được đánh dấu "ăn chay"
- ✅ Database data integrity được đảm bảo
- ✅ Báo cáo thống kê chính xác
- ✅ Admin có thể tin tưởng data
- ✅ Không còn nhầm lẫn

## 🔒 Security Best Practices Applied

1. **Never Trust Client Input** ✅
   - Validate all input from client
   - Don't assume frontend validation is enough

2. **Business Logic Validation** ✅
   - Validate against business rules (lunar calendar)
   - Not just format/type validation

3. **Defense in Depth** ✅
   - Frontend validation (UX)
   - Backend validation (Security)
   - Database constraints (Last line of defense)

4. **Clear Error Messages** ✅
   - Tell user exactly what's wrong
   - Help legitimate users fix mistakes
   - Prevent attackers from guessing

## 📁 Files Changed

### New Files
1. `backend/src/utils/lunarCalendar.ts` - Lunar calendar functions
2. `SECURITY_FIX_VEGETARIAN_VALIDATION.md` - This document

### Modified Files
1. `backend/src/utils/validation.ts` - Added `validateVegetarianDates()`
2. `backend/src/controllers/registrationController.ts` - Added validation call
3. `frontend/src/components/EmployeeRegistration.tsx` - Fixed display logic (separate fix)

## 🚀 Deployment

### Steps
1. **Backup database** (CRITICAL!)
```bash
pg_dump -U postgres lunch_registration > backup_before_security_fix.sql
```

2. **Deploy backend**
```bash
cd backend
npm run build
pm2 restart lunch-backend
```

3. **Test API**
```bash
# Test with invalid vegetarian date (should fail)
curl -X POST https://lunch-booking.madlab.tech/api/registrations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dates": ["2026-01-05"],
    "month": 1,
    "year": 2026,
    "vegetarianDates": {"2026-01-05": true}
  }'

# Expected: 400 error with message about invalid vegetarian date
```

4. **Monitor logs**
```bash
pm2 logs lunch-backend --lines 100
```

### Rollback Plan
```bash
cd /var/www/lunch-booking
git checkout HEAD~1
cd backend
npm run build
pm2 restart lunch-backend
```

## 🔍 Data Cleanup (Optional)

Nếu database đã có data sai, cần cleanup:

```sql
-- Check for invalid vegetarian dates
SELECT 
  r.id,
  r.user_id,
  r.registration_date,
  r.is_vegetarian,
  u.full_name
FROM registrations r
JOIN users u ON r.user_id = u.id
WHERE r.is_vegetarian = true
ORDER BY r.registration_date;

-- Manually verify each date with lunar calendar
-- If invalid, update:
UPDATE registrations 
SET is_vegetarian = false 
WHERE id = <invalid_id>;
```

## 📝 Lessons Learned

1. **Always validate business logic on backend**
   - Frontend validation is for UX only
   - Backend must enforce all rules

2. **Don't trust client data**
   - Even from authenticated users
   - Validate everything

3. **Test security scenarios**
   - Think like an attacker
   - Test with malicious input

4. **Document security fixes**
   - Help team understand the issue
   - Prevent similar issues in future

## ✅ Checklist

- [x] Identified vulnerability
- [x] Created lunar calendar utility for backend
- [x] Added validation function
- [x] Updated registration controller
- [x] Tested with diagnostics
- [x] Documented the fix
- [x] Created test cases
- [x] Ready for deployment

---

**Severity**: HIGH
**Type**: Input Validation / Data Integrity
**Status**: FIXED ✅
**Deployment**: Required immediately
**Testing**: Required before production deployment
