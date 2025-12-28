-- =====================================================
-- MIGRATION: Đổi cột "project" thành "phone_number"
-- =====================================================
-- 
-- Hướng dẫn:
-- 1. Backup database trước khi chạy:
--    pg_dump -U postgres lunch_registration > backup.sql
-- 
-- 2. Chạy migration:
--    psql -U postgres -d lunch_registration -f database/migrate-project-to-phone.sql
-- 
-- 3. Rebuild backend: cd backend && npm run build
-- 4. Rebuild frontend: cd frontend && npm run build
-- 5. Restart services
-- =====================================================

-- Bước 1: Thêm cột phone_number mới
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Bước 2: Copy dữ liệu từ project sang phone_number (nếu có)
-- UPDATE users SET phone_number = project WHERE project IS NOT NULL;

-- Bước 3: Xóa index cũ của project
DROP INDEX IF EXISTS idx_users_project;

-- Bước 4: Xóa cột project
ALTER TABLE users DROP COLUMN IF EXISTS project;

-- Bước 5: Tạo index mới cho phone_number (optional, nếu cần tìm kiếm theo SĐT)
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);

-- Hoàn tất
SELECT 'Migration hoan tat! Cot "project" da duoc thay the bang "phone_number"' as message;
