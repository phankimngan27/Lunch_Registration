-- =====================================================
-- MIGRATION: Thêm cột is_vegetarian vào bảng registrations
-- =====================================================

-- Thêm cột is_vegetarian
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS is_vegetarian BOOLEAN DEFAULT false;

-- Tạo index cho cột mới
CREATE INDEX IF NOT EXISTS idx_registrations_is_vegetarian ON registrations(is_vegetarian);

-- Kiểm tra kết quả
SELECT 'Migration hoàn tất! Cột is_vegetarian đã được thêm vào bảng registrations' as message;
