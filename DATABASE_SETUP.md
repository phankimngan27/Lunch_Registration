# Hướng dẫn Setup Database PostgreSQL

## Cách 1: Dùng pgAdmin (Giao diện đồ họa - Dễ nhất)

1. **Mở pgAdmin** (ứng dụng đã cài cùng PostgreSQL)

2. **Kết nối vào PostgreSQL server**
   - Nhập password của user `postgres` (password bạn đã đặt khi cài PostgreSQL)

3. **Tạo Database mới**
   - Chuột phải vào `Databases` → `Create` → `Database...`
   - Database name: `lunch_registration`
   - Owner: `postgres`
   - Click `Save`

4. **Chạy SQL Script**
   - Chuột phải vào database `lunch_registration` → `Query Tool`
   - Mở file `database/setup.sql` bằng Notepad
   - Copy toàn bộ nội dung
   - Paste vào Query Tool
   - Click nút ▶️ (Execute/Refresh) hoặc nhấn F5
   - Xem kết quả ở phần Output

5. **Kiểm tra**
   - Refresh database
   - Xem Tables: users, registrations, settings
   - Xem dữ liệu: Chuột phải vào table `users` → `View/Edit Data` → `All Rows`

---

## Cách 2: Dùng Command Line (psql)

### Bước 1: Mở Command Prompt hoặc PowerShell

### Bước 2: Tìm đường dẫn psql
PostgreSQL thường được cài tại:
- `C:\Program Files\PostgreSQL\15\bin\psql.exe`
- `C:\Program Files\PostgreSQL\16\bin\psql.exe`

### Bước 3: Tạo database
```cmd
"C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -c "CREATE DATABASE lunch_registration;"
```

### Bước 4: Chạy setup script
```cmd
"C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d lunch_registration -f database/setup.sql
```

---

## Cách 3: Dùng SQL Shell (psql) - Đơn giản

1. **Mở SQL Shell (psql)** từ Start Menu

2. **Nhập thông tin kết nối** (nhấn Enter để dùng giá trị mặc định):
   ```
   Server [localhost]: (nhấn Enter)
   Database [postgres]: (nhấn Enter)
   Port [5432]: (nhấn Enter)
   Username [postgres]: (nhấn Enter)
   Password: (nhập password của bạn)
   ```

3. **Tạo database**:
   ```sql
   CREATE DATABASE lunch_registration;
   ```

4. **Kết nối vào database mới**:
   ```sql
   \c lunch_registration
   ```

5. **Chạy setup script**:
   ```sql
   \i 'C:/Users/phank/OneDrive/Documents/Website com trua/database/setup.sql'
   ```
   (Thay đường dẫn cho đúng với máy bạn, dùng dấu `/` thay vì `\`)

---

## Kiểm tra kết quả

Sau khi setup xong, bạn có thể kiểm tra:

```sql
-- Xem danh sách users
SELECT * FROM users;

-- Xem settings
SELECT * FROM settings;

-- Đếm số users
SELECT COUNT(*) FROM users;
```

## Thông tin đăng nhập

Sau khi setup, bạn có thể đăng nhập với:

**Admin:**
- Email: `admin@madison.dev`
- Password: `1234`

**User mẫu:**
- Email: `ngan.phan.thi.kim@madison.dev`
- Password: `1234`

---

## Cập nhật file .env

Đảm bảo file `backend/.env` có thông tin đúng:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lunch_registration
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here
```

Thay `your_postgres_password_here` bằng password PostgreSQL của bạn!

---

## Troubleshooting

### Lỗi: "password authentication failed"
→ Kiểm tra lại password trong file `backend/.env`

### Lỗi: "database already exists"
→ Database đã tồn tại, bỏ qua bước tạo database, chỉ cần chạy setup.sql

### Lỗi: "relation already exists"
→ Tables đã tồn tại, script sẽ bỏ qua và không tạo lại

### Không tìm thấy psql
→ Dùng pgAdmin (Cách 1) hoặc SQL Shell (Cách 3)
