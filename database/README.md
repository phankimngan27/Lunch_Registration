# Database Management Scripts

## Backup & Restore

### Backup Database

Tạo backup của database hiện tại:

**PowerShell (Khuyên dùng):**
```powershell
.\database\backup-database.ps1
```

**Batch (Windows CMD):**
```bash
cd database
backup-database.bat
```

Backup file sẽ được lưu trong `database/backups/` với tên dạng:
- `lunch_registration_YYYYMMDD_HHMMSS.sql`

Ví dụ: `lunch_registration_20240531_143000.sql`

### Restore Database

**Cách 1: Xem danh sách backup có sẵn**

**PowerShell (Khuyên dùng):**
```powershell
.\database\restore-database.ps1
```

**Batch (Windows CMD):**
```bash
cd database
restore-database.bat
```

Script sẽ hiển thị danh sách các backup file có sẵn.

**Cách 2: Restore từ file cụ thể**

**PowerShell:**
```powershell
.\database\restore-database.ps1 database\backups\lunch_registration_20240531_143000.sql
```

**Batch:**
```bash
cd database
restore-database.bat backups\lunch_registration_20240531_143000.sql
```

⚠️ **Cảnh báo**: Restore sẽ xóa toàn bộ data hiện tại và thay thế bằng data từ backup!

## Database Setup Scripts

### Initial Setup

Tạo database và tables lần đầu:

```bash
psql -U postgres -c "CREATE DATABASE lunch_registration;"
psql -U postgres -d lunch_registration -f setup.sql
```

### Add Performance Indexes

```bash
psql -U postgres -d lunch_registration -f add-performance-indexes.sql
```

### Add Composite Indexes

```bash
psql -U postgres -d lunch_registration -f add-composite-indexes.sql
```

### Add Refresh Token Support

```bash
psql -U postgres -d lunch_registration -f add-refresh-token-columns.sql
```

## Best Practices

### 1. Backup Thường Xuyên

- Backup trước khi deploy
- Backup trước khi chạy migration
- Backup định kỳ (hàng ngày/tuần)

### 2. Đặt Tên Backup Rõ Ràng

Backup files tự động có timestamp, nhưng bạn có thể đổi tên để dễ nhớ:

```
lunch_registration_20240531_143000.sql
→ lunch_registration_before_migration_v2.sql
```

### 3. Lưu Trữ Backup An Toàn

- Không commit backup files vào Git (đã có trong .gitignore)
- Lưu backup ở nơi an toàn (cloud storage, external drive)
- Giữ ít nhất 3-5 backup gần nhất

### 4. Test Restore

Thỉnh thoảng test restore để đảm bảo backup hoạt động:

```bash
# Backup database hiện tại
backup-database.bat

# Test restore trên database test
# (Tạo database test riêng để không ảnh hưởng data chính)
```

## Troubleshooting

### Lỗi: "pg_dump: command not found"

PostgreSQL chưa được thêm vào PATH. Thêm đường dẫn PostgreSQL bin vào PATH:

```
C:\Program Files\PostgreSQL\18\bin
```

### Lỗi: "password authentication failed"

Cập nhật password trong script:
- Mở `backup-database.bat` hoặc `restore-database.bat`
- Sửa dòng: `set PGPASSWORD=your_password`

### Lỗi: "database does not exist"

Database chưa được tạo. Chạy setup script trước:

```bash
psql -U postgres -c "CREATE DATABASE lunch_registration;"
psql -U postgres -d lunch_registration -f setup.sql
```

## Production Backup

Để backup database production từ DigitalOcean:

```bash
# SSH vào server
ssh root@your-server-ip

# Tạo backup
pg_dump -U postgres -d lunch_registration > backup_$(date +%Y%m%d_%H%M%S).sql

# Download về local
scp root@your-server-ip:~/backup_*.sql ./database/backups/
```

## Automated Backup (Optional)

Để tự động backup hàng ngày, tạo Windows Task Scheduler:

1. Mở Task Scheduler
2. Create Basic Task
3. Trigger: Daily
4. Action: Start a program
5. Program: `C:\path\to\database\backup-database.bat`

Hoặc dùng cron job trên Linux/Mac:

```bash
# Backup hàng ngày lúc 2:00 AM
0 2 * * * cd /path/to/project && ./database/backup-database.sh
```
