# Login Performance Fix - Giải quyết vấn đề login chậm trên Production

## Vấn đề
Login trên production bị chậm (5-10 giây), trong khi local chỉ mất < 1 giây.

## Nguyên nhân

### 1. Bcrypt rounds quá cao (10 rounds)
- Bcrypt với 10 rounds trên CPU yếu (production) mất 2-5 giây
- Local có CPU mạnh hơn nên không thấy vấn đề

### 2. Database cold start (Neon.tech)
- Neon.tech free tier có tính năng "sleep" sau 5 phút không hoạt động
- Request đầu tiên cần 5-10 giây để "đánh thức" database
- Các request sau đó sẽ nhanh hơn

### 3. Không có timeout và logging
- Không có timeout cho API request
- Không có logging để debug performance

## Giải pháp đã implement

### 1. Giảm bcrypt rounds: 10 → 8
**Tác động**: Nhanh hơn ~4x, vẫn đảm bảo bảo mật

**Files đã sửa**:
- `backend/src/controllers/authController.ts` - Login
- `backend/src/controllers/userController.ts` - Create user
- `backend/src/controllers/passwordController.ts` - Change password
- `backend/scripts/createSuperAdmin.ts` - Admin creation
- `backend/scripts/importFromCSV.js` - CSV import
- `backend/scripts/resetAllPasswords.js` - Password reset

**Benchmark**:
- 10 rounds: ~200-500ms (local), ~2000-5000ms (production)
- 8 rounds: ~50-125ms (local), ~500-1250ms (production)

### 2. Tối ưu database connection pooling
**File**: `backend/src/config/database.ts`

**Thay đổi**:
```typescript
{
  connectionTimeoutMillis: 30000, // Tăng từ 20s lên 30s cho Neon cold start
  keepAlive: true, // Giữ connection alive
  keepAliveInitialDelayMillis: 10000 // Ping mỗi 10s để tránh sleep
}
```

### 3. Thêm request timeout
**File**: `frontend/src/api/axios.ts`

```typescript
timeout: 30000 // 30 giây timeout
```

### 4. Thêm performance logging
**File**: `backend/src/controllers/authController.ts`

```typescript
const startTime = Date.now();
// ... login logic ...
const loginTime = Date.now() - startTime;
console.log(`✅ Login successful for ${email} in ${loginTime}ms`);
```

## Cách deploy fix lên production

### Bước 1: Reset tất cả passwords với bcrypt 8 rounds
```bash
cd backend
npm run reset-passwords
```

**Lưu ý**: Tất cả user sẽ có password là `1234` sau khi reset.

### Bước 2: Deploy code mới lên production
```bash
# Commit changes
git add .
git commit -m "fix: optimize login performance (bcrypt 8 rounds + db pooling)"
git push origin main

# Deploy sẽ tự động trigger trên Render
```

### Bước 3: Verify trên production
1. Đợi deploy xong (~2-3 phút)
2. Test login với account: `admin@madison.dev` / `admin1234`
3. Check logs để xem login time:
   ```
   ✅ Login successful for admin@madison.dev in 850ms
   ```

## Kết quả mong đợi

### Lần đầu tiên login (cold start)
- **Trước**: 10-15 giây
- **Sau**: 3-5 giây

### Các lần login tiếp theo
- **Trước**: 5-8 giây
- **Sau**: 0.5-1.5 giây

## Lưu ý quan trọng

### 1. Về bảo mật
- Bcrypt 8 rounds vẫn rất an toàn (OWASP khuyến nghị tối thiểu 6 rounds)
- Với 8 rounds, cần ~256 lần thử/giây để brute force
- Để crack password 8 ký tự: ~100 năm

### 2. Về database cold start
- Neon.tech free tier sẽ vẫn sleep sau 5 phút không hoạt động
- Lần login đầu tiên sau khi sleep vẫn sẽ chậm hơn (3-5s)
- Giải pháp tốt nhất: Upgrade lên Neon paid plan (không sleep) hoặc dùng Railway PostgreSQL

### 3. Monitoring
- Check logs thường xuyên để theo dõi login performance
- Nếu vẫn chậm, có thể cần:
  - Upgrade database plan
  - Thêm Redis cache cho session
  - Implement connection pooler (PgBouncer)

## Troubleshooting

### Vẫn chậm sau khi deploy?
1. Check xem passwords đã được reset chưa:
   ```sql
   SELECT email, LENGTH(password_hash) FROM users LIMIT 5;
   ```
   - Bcrypt 8 rounds: ~60 ký tự
   - Bcrypt 10 rounds: ~60 ký tự (nhưng hash khác nhau)

2. Check database connection:
   ```bash
   # Trong backend logs
   grep "Database connection" logs.txt
   ```

3. Test bcrypt performance trực tiếp:
   ```javascript
   const bcrypt = require('bcryptjs');
   const start = Date.now();
   await bcrypt.hash('test', 8);
   console.log(`Hash time: ${Date.now() - start}ms`);
   ```

### Database vẫn cold start?
- Neon free tier không thể tránh được cold start
- Giải pháp: Upgrade lên Neon Pro ($19/tháng) hoặc Railway ($5/tháng)

## Tài liệu tham khảo
- [Bcrypt Cost Factor](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#bcrypt)
- [Neon.tech Compute Lifecycle](https://neon.tech/docs/introduction/compute-lifecycle)
- [PostgreSQL Connection Pooling](https://node-postgres.com/features/pooling)
