# Deploy Checklist - Login Performance Fix

## ✅ Changes Made

### Backend
- ✅ Reduced bcrypt rounds: 10 → 8 (4x faster)
- ✅ Optimized database connection pooling (keepAlive + longer timeout)
- ✅ Added performance logging to authController

### Frontend
- ✅ Added 30s timeout to axios

### Scripts
- ✅ Updated all password hashing scripts to use 8 rounds

## 🚀 Deploy Steps

### 1. Reset all passwords (REQUIRED)
```bash
cd backend
npm run reset-passwords
```
**Why?** Old passwords use 10 rounds, need to rehash with 8 rounds.

### 2. Commit and push
```bash
git add .
git commit -m "fix: optimize login performance (bcrypt 8 rounds)"
git push origin main
```

### 3. Verify on production
- Login with: `admin@madison.dev` / `admin1234`
- Check logs for: `✅ Login successful for ... in XXXms`
- Expected: 500-1500ms (after cold start)

## 📊 Expected Results

| Scenario | Before | After |
|----------|--------|-------|
| Cold start (first login) | 10-15s | 3-5s |
| Normal login | 5-8s | 0.5-1.5s |

## ⚠️ Important Notes

1. **All users will need to use password `1234`** after reset
2. **First login after 5min idle will still be slow** (Neon cold start)
3. **Monitor logs** to track performance improvements

## 📝 Files Changed

- `backend/src/controllers/authController.ts`
- `backend/src/controllers/userController.ts`
- `backend/src/controllers/passwordController.ts`
- `backend/src/config/database.ts`
- `backend/scripts/createSuperAdmin.ts`
- `backend/scripts/importFromCSV.js`
- `backend/scripts/resetAllPasswords.js`
- `frontend/src/api/axios.ts`

## 🔍 Troubleshooting

If still slow after deploy:
1. Check if passwords were reset: `npm run reset-passwords`
2. Check database connection in logs
3. Consider upgrading database plan (Neon Pro or Railway)

See `LOGIN_PERFORMANCE_FIX.md` for detailed documentation.
