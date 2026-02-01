# Performance Testing Guide

## 🧪 How to Test Performance Improvements

### Before Running Tests

1. Make sure you have access to production server
2. Have a valid JWT token for API testing
3. Install `curl` and `psql` if not already installed

## Database Performance Tests

### Test 1: Check Indexes Exist
```bash
ssh root@178.128.92.112
psql -U postgres -d lunch_registration -c "\d+ registrations" | grep idx_
psql -U postgres -d lunch_registration -c "\d+ users" | grep idx_
```

**Expected**: Should see 9 indexes listed

### Test 2: Query Performance - User Registrations
```bash
psql -U postgres -d lunch_registration << 'EOF'
EXPLAIN ANALYZE 
SELECT * FROM registrations 
WHERE user_id = 1 AND status = 'active' 
ORDER BY registration_date;
EOF
```

**Expected**: 
- Execution time: < 10ms
- Should use `idx_registrations_user_date` index

### Test 3: Query Performance - Monthly Statistics
```bash
psql -U postgres -d lunch_registration << 'EOF'
EXPLAIN ANALYZE 
SELECT u.id, COUNT(r.id) as total_days
FROM users u
LEFT JOIN registrations r ON u.id = r.user_id 
  AND r.status = 'active'
  AND r.month = 1 AND r.year = 2026
WHERE u.is_active = true
GROUP BY u.id;
EOF
```

**Expected**:
- Execution time: < 50ms
- Should use `idx_registrations_month_year` index

### Test 4: Query Performance - Daily Registrations
```bash
psql -U postgres -d lunch_registration << 'EOF'
EXPLAIN ANALYZE 
SELECT r.*, u.full_name
FROM registrations r
JOIN users u ON r.user_id = u.id
WHERE r.registration_date = '2026-01-15' 
  AND r.status = 'active';
EOF
```

**Expected**:
- Execution time: < 20ms
- Should use `idx_registrations_date_status` index

## API Performance Tests

### Setup: Get JWT Token
```bash
# Login to get token
TOKEN=$(curl -s -X POST https://lunch-booking.madlab.tech/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ngan.phan.thi.kim@madison.dev","password":"12345"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Token: $TOKEN"
```

### Test 5: API Response Time - Get My Registrations
```bash
time curl -s -H "Authorization: Bearer $TOKEN" \
  "https://lunch-booking.madlab.tech/api/registrations/my?month=1&year=2026" \
  -w "\nTime: %{time_total}s\n"
```

**Expected**: < 0.5 seconds

### Test 6: API Response Time - Get Statistics
```bash
time curl -s -H "Authorization: Bearer $TOKEN" \
  "https://lunch-booking.madlab.tech/api/statistics?month=1&year=2026" \
  -w "\nTime: %{time_total}s\n"
```

**Expected**: < 2 seconds

### Test 7: API Response Time - Daily Registrations
```bash
time curl -s -H "Authorization: Bearer $TOKEN" \
  "https://lunch-booking.madlab.tech/api/registrations/by-date?date=2026-01-15" \
  -w "\nTime: %{time_total}s\n"
```

**Expected**: < 0.5 seconds

### Test 8: Check Compression is Working
```bash
curl -s -I -H "Accept-Encoding: gzip" \
  -H "Authorization: Bearer $TOKEN" \
  "https://lunch-booking.madlab.tech/api/registrations/my" \
  | grep -i "content-encoding"
```

**Expected**: Should see `Content-Encoding: gzip`

### Test 9: Check Caching Headers
```bash
curl -s -I -H "Authorization: Bearer $TOKEN" \
  "https://lunch-booking.madlab.tech/api/registrations/my?month=1&year=2026" \
  | grep -i "cache-control"
```

**Expected**: Should see `Cache-Control: private, max-age=60`

## Frontend Performance Tests

### Test 10: Page Load Time
1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Navigate to https://lunch-booking.madlab.tech
4. Login with credentials
5. Go to Registration page
6. Check "Load" time at bottom of Network tab

**Expected**: < 1 second total load time

### Test 11: Calendar Interaction Speed
1. Open Registration page
2. Open DevTools > Performance tab
3. Click "Record"
4. Click on multiple dates in calendar
5. Stop recording
6. Check interaction time

**Expected**: < 100ms per click

### Test 12: Month Switch Speed
1. Open Registration page
2. Open DevTools > Network tab
3. Click "Next Month" button
4. Check API request time

**Expected**: < 500ms

## Load Testing (Optional)

### Test 13: Concurrent Users
```bash
# Install Apache Bench if not installed
# sudo apt-get install apache2-utils

# Test with 100 concurrent requests
ab -n 100 -c 10 -H "Authorization: Bearer $TOKEN" \
  "https://lunch-booking.madlab.tech/api/registrations/my?month=1&year=2026"
```

**Expected**:
- Requests per second: > 50
- Time per request: < 200ms
- Failed requests: 0

## System Resource Tests

### Test 14: Database Connection Pool
```bash
ssh root@178.128.92.112
psql -U postgres -d lunch_registration -c "SELECT count(*), state FROM pg_stat_activity WHERE datname = 'lunch_registration' GROUP BY state;"
```

**Expected**:
- Active connections: 5-15
- Idle connections: < 10

### Test 15: Backend Memory Usage
```bash
ssh root@178.128.92.112
pm2 info lunch-backend | grep memory
```

**Expected**: < 200MB

### Test 16: Backend CPU Usage
```bash
ssh root@178.128.92.112
pm2 monit
```

**Expected**: < 50% CPU usage under normal load

## Performance Comparison

### Before Optimization
| Test | Time |
|------|------|
| User Registrations Query | 100-500ms |
| Statistics Query | 500-1000ms |
| API Get Registrations | 2-3s |
| API Get Statistics | 5-10s |
| Page Load | 3-5s |
| Calendar Click | 500ms-1s |

### After Optimization (Expected)
| Test | Time | Improvement |
|------|------|-------------|
| User Registrations Query | < 10ms | **95%** ⚡ |
| Statistics Query | < 50ms | **95%** ⚡ |
| API Get Registrations | < 500ms | **85%** ⚡ |
| API Get Statistics | < 2s | **80%** ⚡ |
| Page Load | < 1s | **80%** ⚡ |
| Calendar Click | < 100ms | **90%** ⚡ |

## Automated Test Script

Save this as `test-performance.sh`:

```bash
#!/bin/bash

echo "🧪 Testing Performance Improvements..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test 1: Check indexes
echo "Test 1: Checking database indexes..."
INDEX_COUNT=$(ssh root@178.128.92.112 "psql -U postgres -d lunch_registration -t -c \"SELECT count(*) FROM pg_indexes WHERE tablename IN ('registrations', 'users') AND indexname LIKE 'idx_%';\"" | tr -d ' ')
if [ "$INDEX_COUNT" -ge 9 ]; then
    echo -e "${GREEN}✓ PASS${NC} - Found $INDEX_COUNT indexes"
else
    echo -e "${RED}✗ FAIL${NC} - Only found $INDEX_COUNT indexes (expected 9+)"
fi
echo ""

# Test 2: Get JWT token
echo "Test 2: Getting JWT token..."
TOKEN=$(curl -s -X POST https://lunch-booking.madlab.tech/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ngan.phan.thi.kim@madison.dev","password":"12345"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Got JWT token"
else
    echo -e "${RED}✗ FAIL${NC} - Failed to get JWT token"
    exit 1
fi
echo ""

# Test 3: API response time
echo "Test 3: Testing API response time..."
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" \
  -H "Authorization: Bearer $TOKEN" \
  "https://lunch-booking.madlab.tech/api/registrations/my?month=1&year=2026")

if (( $(echo "$RESPONSE_TIME < 1.0" | bc -l) )); then
    echo -e "${GREEN}✓ PASS${NC} - Response time: ${RESPONSE_TIME}s"
else
    echo -e "${RED}✗ FAIL${NC} - Response time: ${RESPONSE_TIME}s (expected < 1s)"
fi
echo ""

# Test 4: Check compression
echo "Test 4: Checking gzip compression..."
COMPRESSION=$(curl -s -I -H "Accept-Encoding: gzip" \
  -H "Authorization: Bearer $TOKEN" \
  "https://lunch-booking.madlab.tech/api/registrations/my" \
  | grep -i "content-encoding: gzip")

if [ -n "$COMPRESSION" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Compression enabled"
else
    echo -e "${RED}✗ FAIL${NC} - Compression not enabled"
fi
echo ""

# Test 5: Check caching
echo "Test 5: Checking cache headers..."
CACHE=$(curl -s -I -H "Authorization: Bearer $TOKEN" \
  "https://lunch-booking.madlab.tech/api/registrations/my?month=1&year=2026" \
  | grep -i "cache-control")

if [ -n "$CACHE" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Cache headers present: $CACHE"
else
    echo -e "${RED}✗ FAIL${NC} - Cache headers missing"
fi
echo ""

echo "🎉 Performance testing complete!"
```

Make it executable:
```bash
chmod +x test-performance.sh
./test-performance.sh
```

## Troubleshooting Failed Tests

### If indexes are missing:
```bash
ssh root@178.128.92.112
psql -U postgres -d lunch_registration -f /tmp/add-performance-indexes.sql
```

### If API is slow:
```bash
ssh root@178.128.92.112
pm2 restart lunch-backend
pm2 logs lunch-backend
```

### If compression not working:
```bash
# Check if compression module is installed
ssh root@178.128.92.112
cd /var/www/lunch-booking/backend
npm list compression
```

### If caching not working:
```bash
# Check backend code is updated
ssh root@178.128.92.112
cd /var/www/lunch-booking
git log -1 --oneline
```

## Success Criteria

All tests should pass with:
- ✅ All 9 indexes created
- ✅ Query times < 50ms
- ✅ API response times < 1s
- ✅ Compression enabled
- ✅ Caching headers present
- ✅ Page load < 1s
- ✅ No errors in logs

If all tests pass, performance optimization is **successful**! 🎉
