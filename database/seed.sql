-- Script tạo dữ liệu mẫu để test
-- Password mặc định cho tất cả user: 1234

-- Tạo admin (password: 1234)
-- Chạy: node backend/scripts/createAdmin.js để tạo admin

-- Tạo nhân viên mẫu (password: 1234)
-- Hash của '1234': $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
INSERT INTO users (employee_code, full_name, email, password_hash, department, project, role) VALUES 
('NV001', 'Phan Thị Kim Ngân', 'ngan.phan.thi.kim@madison.dev', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'IT', 'Project A', 'user'),
('NV002', 'Trần Văn An', 'an.tran.van@madison.dev', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'HR', 'Project B', 'user'),
('NV003', 'Lê Thị Bình', 'binh.le.thi@madison.dev', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'IT', 'Project A', 'user'),
('NV004', 'Nguyễn Văn Cường', 'cuong.nguyen.van@madison.dev', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Marketing', 'Project C', 'user'),
('NV005', 'Phạm Thị Dung', 'dung.pham.thi@madison.dev', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'IT', 'Project B', 'user');

-- Tạo đăng ký mẫu cho tháng hiện tại
INSERT INTO registrations (user_id, registration_date, month, year) VALUES 
(2, '2024-10-01', 10, 2024),
(2, '2024-10-02', 10, 2024),
(2, '2024-10-03', 10, 2024),
(3, '2024-10-01', 10, 2024),
(3, '2024-10-02', 10, 2024),
(4, '2024-10-01', 10, 2024);
