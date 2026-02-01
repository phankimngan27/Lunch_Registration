# Performance Upgrade Deployment Guide

## 🎯 Objective
Improve production performance by 80-90% through database indexing, caching, and code optimization.

## ⚠️ Prerequisites
- SSH access to production server (178.128.92.112)
- PostgreSQL admin access
- PM2 access for backend restart
- Nginx access for frontend deployment

## 📋 Deployment Steps

### Step 1: Backup Database (CRITICAL)
```bash
# SSH to production server
ssh root@178.128.92.112

# Backup database
pg_dump -U postgres lunch_registration > /tmp/lunch_backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh /tmp/lunch_backup_*.sql
```

### Step 2: Apply Database Indexes
```bash
# Copy SQL file to server
scp database/add-performance-indexes.sql root@178.128.92.112:/tmp/

# SSH to server
ssh root@178.128.92.112

# Apply indexes (takes 1-2 minutes)
psql -U postgres -d lunch_registration -f /tmp/add-performance-indexes.sql

# Verify indexes were created
psql -U postgres -d lunch_registration -c "SELECT indexname FROM pg_indexes WHERE tablename IN ('registrations', 'users');"
```

Expected output:
```
                    indexname                     
--------------------------------------------------
 idx_registrations_user_date
 idx_registrations_month_year
 idx_registrations_status
 idx_registrations_user_month_year
 idx_registrations_date_status
 idx_users_active
 idx_users_department
 idx_users_phone
 idx_users_active_dept
```

### Step 3: Install Backend Dependencies
```bash
# On production server
cd /var/www/lunch-booking/backend

# Install compression package
npm install compression@^1.7.4
npm install --save-dev @types/compression@^1.7.5

# Verify installation
npm list compression
```

### Step 4: Deploy Backend Code
```bash
# From local machine - push code to git
git add .
git commit -m "perf: Add database indexes, compression, and caching"
git push origin main

# On production server
cd /var/www/lunch-booking
git pull origin main

# Rebuild backend
cd backend
npm run build

# Restart backend with PM2
pm2 restart lunch-backend

# Check logs
pm2 logs lunch-backend --lines 50
```

### Step 5: Deploy Frontend Code
```bash
# On production server
cd /var/www/lunch-booking/frontend

# Build frontend
npm run build

# Copy to nginx directory
sudo cp -r dist/* /var/www/lunch-booking/

# Restart nginx (optional, usually not needed)
sudo systemctl reload nginx
```

### Step 6: Verify Performance

#### Test 1: Check Database Query Performance
```bash
# SSH to server
ssh root@178.128.92.112

# Test query speed
psql -U postgres -d lunch_registration -c "EXPLAIN ANALYZE SELECT * FROM registrations WHERE user_id = 1 AND status = 'active' ORDER BY registration_date;"
```

Expected: Execution time < 10ms (was 100-500ms before)

#### Test 2: Check API Response Time
```bash
# From local machine
time curl -H "Authorization: Bearer YOUR_TOKEN" https://lunch-booking.madlab.tech/api/registrations/my

# Should complete in < 500ms (was 3-5s before)
```

#### Test 3: Check Frontend Load Time
1. Open https://lunch-booking.madlab.tech
2. Open DevTools > Network tab
3. Login and navigate to registration page
4. Check total load time

Expected: < 1s (was 3-5s before)

### Step 7: Monitor Performance

#### Check PM2 Metrics
```bash
pm2 monit
```

Watch for:
- CPU usage should be < 50%
- Memory usage should be stable
- No error spikes

#### Check Database Connections
```bash
psql -U postgres -d lunch_registration -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'lunch_registration';"
```

Expected: 5-15 connections (increased pool size)

#### Check Nginx Logs
```bash
tail -f /var/log/nginx/access.log | grep lunch-booking
```

Watch for response times in logs

## 🔄 Rollback Plan

If issues occur, rollback in reverse order:

### Rollback Step 1: Revert Frontend
```bash
cd /var/www/lunch-booking
git checkout HEAD~1
cd frontend
npm run build
sudo cp -r dist/* /var/www/lunch-booking/
```

### Rollback Step 2: Revert Backend
```bash
cd /var/www/lunch-booking
git checkout HEAD~1
cd backend
npm run build
pm2 restart lunch-backend
```

### Rollback Step 3: Drop Indexes (if causing issues)
```bash
psql -U postgres -d lunch_registration << EOF
DROP INDEX IF EXISTS idx_registrations_user_date;
DROP INDEX IF EXISTS idx_registrations_month_year;
DROP INDEX IF EXISTS idx_registrations_status;
DROP INDEX IF EXISTS idx_registrations_user_month_year;
DROP INDEX IF EXISTS idx_registrations_date_status;
DROP INDEX IF EXISTS idx_users_active;
DROP INDEX IF EXISTS idx_users_department;
DROP INDEX IF EXISTS idx_users_phone;
DROP INDEX IF EXISTS idx_users_active_dept;
EOF
```

### Rollback Step 4: Restore Database (if corrupted)
```bash
# Stop backend
pm2 stop lunch-backend

# Restore from backup
psql -U postgres -d lunch_registration < /tmp/lunch_backup_YYYYMMDD_HHMMSS.sql

# Restart backend
pm2 start lunch-backend
```

## 📊 Performance Metrics to Track

### Before Upgrade (Baseline)
- Initial page load: 3-5 seconds
- Registration fetch: 2-3 seconds
- Edit response: 500ms-1s
- Statistics load: 5-10 seconds
- Month switch: 2-3 seconds

### After Upgrade (Expected)
- Initial page load: 0.5-1 second ✅ (80-90% improvement)
- Registration fetch: 200-500ms ✅ (85% improvement)
- Edit response: 50-100ms ✅ (90% improvement)
- Statistics load: 1-2 seconds ✅ (80% improvement)
- Month switch: 200-500ms ✅ (85% improvement)

## 🐛 Troubleshooting

### Issue: Indexes not being used
```bash
# Check query plan
psql -U postgres -d lunch_registration -c "EXPLAIN SELECT * FROM registrations WHERE user_id = 1;"

# Should show "Index Scan using idx_registrations_user_date"
# If showing "Seq Scan", run ANALYZE
psql -U postgres -d lunch_registration -c "ANALYZE registrations; ANALYZE users;"
```

### Issue: Backend not starting
```bash
# Check PM2 logs
pm2 logs lunch-backend --err

# Common issues:
# - Missing compression module: npm install compression
# - TypeScript errors: npm run build
# - Port already in use: pm2 delete lunch-backend && pm2 start
```

### Issue: High memory usage
```bash
# Check connection pool
psql -U postgres -d lunch_registration -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"

# If too many idle connections, reduce pool size in database.ts
# Change max: 30 to max: 20
```

### Issue: Slow queries still occurring
```bash
# Check slow queries
psql -U postgres -d lunch_registration -c "SELECT query, calls, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# If pg_stat_statements not enabled:
# Add to postgresql.conf: shared_preload_libraries = 'pg_stat_statements'
# Restart PostgreSQL: sudo systemctl restart postgresql
```

## ✅ Success Criteria

Deployment is successful when:
1. ✅ All indexes created successfully
2. ✅ Backend starts without errors
3. ✅ Frontend loads in < 1 second
4. ✅ API responses in < 500ms
5. ✅ No errors in PM2 logs
6. ✅ Database connections stable (5-15)
7. ✅ User can register/edit without lag

## 📞 Support

If issues persist:
1. Check logs: `pm2 logs lunch-backend`
2. Check database: `psql -U postgres -d lunch_registration`
3. Check nginx: `sudo nginx -t && sudo systemctl status nginx`
4. Rollback if needed (see Rollback Plan above)

## 📝 Post-Deployment Tasks

1. Monitor performance for 24 hours
2. Check error logs daily for first week
3. Gather user feedback on performance
4. Document any issues encountered
5. Update this guide with lessons learned

## 🎉 Expected User Experience

After deployment, users should notice:
- ⚡ Instant page loads
- ⚡ No lag when selecting dates
- ⚡ Fast month switching
- ⚡ Quick statistics loading
- ⚡ Smooth editing experience
- ⚡ Overall snappy feel

The system should feel **10x faster** than before!
