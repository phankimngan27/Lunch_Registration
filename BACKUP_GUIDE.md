# Hướng Dẫn Backup & Restore Database

## 🔄 Backup Database

### Tạo backup ngay lập tức:

```powershell
.\database\backup-database.ps1
```

Backup file sẽ được lưu tại: `database/backups/lunch_registration_YYYYMMDD_HHMMSS.sql`

### Khi nào nên backup?

✅ **Trước khi:**
- Deploy lên production
- Chạy migration/update schema
- Import data lớn
- Thử nghiệm tính năng mới có thể ảnh hưởng data

✅ **Định kỳ:**
- Hàng ngày (nếu có nhiều thay đổi)
- Hàng tuần (cho development)
- Trước mỗi sprint/release

## 🔙 Restore Database

### Xem danh sách backup:

```powershell
.\database\restore-database.ps1
```

### Restore từ backup cụ thể:

```powershell
.\database\restore-database.ps1 database\backups\lunch_registration_20240531_143000.sql
```

⚠️ **Cảnh báo**: Restore sẽ **XÓA TOÀN BỘ DATA HIỆN TẠI**!

## 📋 Quy Trình Backup An Toàn

### 1. Backup Trước Khi Làm Việc Quan Trọng

```powershell
# Backup database hiện tại
.\database\backup-database.ps1

# Làm việc của bạn...
# (migration, import data, etc.)

# Nếu có vấn đề, restore lại
.\database\restore-database.ps1 database\backups\lunch_registration_YYYYMMDD_HHMMSS.sql
```

### 2. Backup Định Kỳ Tự Động

**Windows Task Scheduler:**

1. Mở Task Scheduler
2. Create Basic Task → "Daily Database Backup"
3. Trigger: Daily, 2:00 AM
4. Action: Start a program
5. Program: `powershell.exe`
6. Arguments: `-File "C:\path\to\database\backup-database.ps1"`

### 3. Lưu Trữ Backup

```
database/backups/
├── lunch_registration_20240531_143000.sql  (Backup mới nhất)
├── lunch_registration_20240530_143000.sql  (Hôm qua)
├── lunch_registration_20240529_143000.sql  (2 ngày trước)
└── ...
```

**Khuyến nghị:**
- Giữ 7 backup gần nhất trên local
- Upload backup quan trọng lên cloud (Google Drive, Dropbox, etc.)
- Không commit backup vào Git (đã có trong .gitignore)

## 🚨 Khôi Phục Khi Mất Data

### Tình huống 1: Vừa mới xóa nhầm data

```powershell
# Restore từ backup gần nhất
.\database\restore-database.ps1 database\backups\lunch_registration_20240531_143000.sql
```

### Tình huống 2: Database bị corrupt

```powershell
# 1. Xem danh sách backup
.\database\restore-database.ps1

# 2. Chọn backup tốt nhất (trước khi bị lỗi)
.\database\restore-database.ps1 database\backups\lunch_registration_20240530_143000.sql
```

### Tình huống 3: Cần data từ production

```bash
# SSH vào production server
ssh root@your-server-ip

# Tạo backup trên server
pg_dump -U postgres -d lunch_registration > /tmp/production_backup.sql

# Download về local
scp root@your-server-ip:/tmp/production_backup.sql ./database/backups/

# Restore vào local database
.\database\restore-database.ps1 database\backups\production_backup.sql
```

## 📊 Kiểm Tra Backup

### Xem kích thước backup:

```powershell
Get-ChildItem database\backups\*.sql | Select-Object Name, @{Name="Size(KB)";Expression={[math]::Round($_.Length/1KB,2)}}, LastWriteTime | Sort-Object LastWriteTime -Descending
```

### Test restore (không ảnh hưởng database chính):

```powershell
# Tạo database test
$env:PGPASSWORD='your_password_here'
psql -U postgres -c "CREATE DATABASE lunch_registration_test;"

# Restore vào database test
psql -U postgres -d lunch_registration_test -f database\backups\lunch_registration_20240531_143000.sql

# Kiểm tra data
psql -U postgres -d lunch_registration_test -c "SELECT COUNT(*) FROM users;"

# Xóa database test
psql -U postgres -c "DROP DATABASE lunch_registration_test;"
```

## 🔧 Troubleshooting

### Lỗi: "pg_dump: command not found"

**Giải pháp:** Thêm PostgreSQL vào PATH

```powershell
# Kiểm tra PostgreSQL đã cài chưa
Get-Command pg_dump

# Nếu không tìm thấy, thêm vào PATH:
# C:\Program Files\PostgreSQL\18\bin
```

### Lỗi: "password authentication failed"

**Giải pháp:** Cập nhật password trong script

Mở file `backup-database.ps1` hoặc `restore-database.ps1`, sửa dòng:
```powershell
$env:PGPASSWORD = "your_actual_password"
```

### Backup file quá lớn

**Giải pháp:** Nén backup file

```powershell
# Backup và nén
.\database\backup-database.ps1
Compress-Archive -Path database\backups\lunch_registration_*.sql -DestinationPath database\backups\backup.zip

# Giải nén khi cần restore
Expand-Archive -Path database\backups\backup.zip -DestinationPath database\backups\
```

## 📚 Tài Liệu Thêm

- [Database README](database/README.md) - Chi tiết về database management
- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [pg_dump Manual](https://www.postgresql.org/docs/current/app-pgdump.html)

## ✅ Checklist Backup

- [ ] Backup trước khi deploy
- [ ] Backup trước khi migration
- [ ] Backup định kỳ (hàng tuần)
- [ ] Test restore ít nhất 1 lần/tháng
- [ ] Lưu backup quan trọng lên cloud
- [ ] Xóa backup cũ (giữ 7-10 backup gần nhất)
- [ ] Document các backup quan trọng (ghi chú tại sao backup này quan trọng)
