# Performance Upgrade Deployment Checklist

## ✅ Pre-Deployment Checklist

### Preparation
- [ ] Read `PERFORMANCE_SUMMARY.md` to understand changes
- [ ] Read `DEPLOYMENT_PERFORMANCE_UPGRADE.md` for detailed steps
- [ ] Have SSH access to production server (178.128.92.112)
- [ ] Have PostgreSQL admin credentials
- [ ] Have PM2 access
- [ ] Backup current database
- [ ] Notify team about deployment
- [ ] Schedule deployment during low-traffic time

### Backup
- [ ] SSH to production server
- [ ] Create database backup: `pg_dump -U postgres lunch_registration > /tmp/lunch_backup_$(date +%Y%m%d_%H%M%S).sql`
- [ ] Verify backup file exists and has size > 0
- [ ] Note backup filename for rollback

## 🚀 Deployment Checklist

### Step 1: Database Indexes (2 minutes)
- [ ] Copy SQL file to server: `scp database/add-performance-indexes.sql root@178.128.92.112:/tmp/`
- [ ] SSH to server
- [ ] Run SQL: `psql -U postgres -d lunch_registration -f /tmp/add-performance-indexes.sql`
- [ ] Verify indexes created: Check for 9 indexes
- [ ] Run ANALYZE: `psql -U postgres -d lunch_registration -c "ANALYZE registrations; ANALYZE users;"`

### Step 2: Backend Dependencies (1 minute)
- [ ] SSH to server
- [ ] Navigate to backend: `cd /var/www/lunch-booking/backend`
- [ ] Install compression: `npm install compression@^1.7.4`
- [ ] Install types: `npm install --save-dev @types/compression@^1.7.5`
- [ ] Verify installation: `npm list compression`

### Step 3: Deploy Code (3 minutes)
- [ ] Push code to git: `git push origin main`
- [ ] SSH to server
- [ ] Navigate to project: `cd /var/www/lunch-booking`
- [ ] Pull latest code: `git pull origin main`
- [ ] Navigate to backend: `cd backend`
- [ ] Build: `npm run build`
- [ ] Check for build errors
- [ ] Restart backend: `pm2 restart lunch-backend`
- [ ] Check logs: `pm2 logs lunch-backend --lines 20`

### Step 4: Deploy Frontend (2 minutes)
- [ ] Navigate to frontend: `cd /var/www/lunch-booking/frontend`
- [ ] Build: `npm run build`
- [ ] Check for build errors
- [ ] Copy to nginx: `sudo cp -r dist/* /var/www/lunch-booking/`
- [ ] Reload nginx: `sudo systemctl reload nginx`

## 🧪 Testing Checklist

### Database Tests
- [ ] Test query speed: Should be < 10ms
- [ ] Verify indexes are used: Check EXPLAIN output
- [ ] Check connection pool: Should be 5-15 connections

### Backend Tests
- [ ] Backend is running: `pm2 status lunch-backend`
- [ ] No errors in logs: `pm2 logs lunch-backend --err --lines 50`
- [ ] API responds: `curl https://lunch-booking.madlab.tech/health`
- [ ] Compression working: Check `Content-Encoding: gzip` header
- [ ] Caching working: Check `Cache-Control` header

### Frontend Tests
- [ ] Website loads: Open https://lunch-booking.madlab.tech
- [ ] Login works
- [ ] Registration page loads < 1s
- [ ] Calendar interaction is smooth (no lag)
- [ ] Month switching is fast
- [ ] Statistics page loads < 2s
- [ ] No console errors in browser

### Performance Tests
- [ ] Run `TEST_PERFORMANCE.md` tests
- [ ] All tests pass
- [ ] Response times meet expectations
- [ ] No errors or warnings

## 📊 Monitoring Checklist (First 24 hours)

### Hour 1
- [ ] Check PM2 logs every 15 minutes
- [ ] Monitor CPU/Memory usage
- [ ] Check for any errors
- [ ] Test user workflows

### Hour 2-4
- [ ] Check PM2 logs every 30 minutes
- [ ] Monitor database connections
- [ ] Check response times
- [ ] Gather user feedback

### Hour 4-24
- [ ] Check PM2 logs every 2 hours
- [ ] Monitor system resources
- [ ] Check for any anomalies
- [ ] Document any issues

## 🔄 Rollback Checklist (If needed)

### Quick Rollback
- [ ] SSH to server
- [ ] Navigate to project: `cd /var/www/lunch-booking`
- [ ] Revert code: `git checkout HEAD~1`
- [ ] Rebuild backend: `cd backend && npm run build`
- [ ] Restart: `pm2 restart lunch-backend`
- [ ] Rebuild frontend: `cd ../frontend && npm run build`
- [ ] Copy to nginx: `sudo cp -r dist/* /var/www/lunch-booking/`

### Full Rollback (If database issues)
- [ ] Stop backend: `pm2 stop lunch-backend`
- [ ] Drop indexes: See `DEPLOYMENT_PERFORMANCE_UPGRADE.md`
- [ ] Restore database: `psql -U postgres -d lunch_registration < /tmp/lunch_backup_YYYYMMDD_HHMMSS.sql`
- [ ] Revert code (see Quick Rollback)
- [ ] Start backend: `pm2 start lunch-backend`
- [ ] Test system

## ✅ Success Criteria

Mark deployment as successful when:
- [ ] All indexes created (9 total)
- [ ] Backend running without errors
- [ ] Frontend loads in < 1 second
- [ ] API responses in < 500ms
- [ ] Compression enabled
- [ ] Caching enabled
- [ ] No errors in logs
- [ ] Database connections stable
- [ ] Users report faster experience
- [ ] All tests pass

## 📝 Post-Deployment Tasks

### Immediate (Day 1)
- [ ] Monitor logs continuously
- [ ] Check performance metrics
- [ ] Gather user feedback
- [ ] Document any issues
- [ ] Update team on status

### Week 1
- [ ] Daily log checks
- [ ] Weekly performance review
- [ ] User satisfaction survey
- [ ] Document lessons learned
- [ ] Update documentation if needed

### Month 1
- [ ] Monthly performance report
- [ ] Identify further optimizations
- [ ] Plan next improvements
- [ ] Archive deployment logs

## 🎉 Completion

When all checkboxes are marked:
- [ ] Deployment is complete
- [ ] System is stable
- [ ] Performance improved
- [ ] Users are happy
- [ ] Documentation updated
- [ ] Team notified

**Congratulations! Performance upgrade successful!** 🚀

---

**Deployment Date**: _____________
**Deployed By**: _____________
**Backup File**: _____________
**Status**: ⬜ Pending / ⬜ In Progress / ⬜ Complete / ⬜ Rolled Back
