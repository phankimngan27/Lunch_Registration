# Hướng dẫn Cấu hình Thời gian Đăng ký

## Tổng quan

Tính năng này cho phép Super Admin cấu hình linh hoạt thời gian đăng ký cơm trưa thay vì sử dụng giá trị cố định.

## Các thông số cấu hình

### 1. Ngày mở đăng ký tháng sau (Monthly Cutoff Day)
- **Giá trị:** 1-28
- **Mặc định:** 23
- **Ý nghĩa:** Từ ngày này trong tháng, nhân viên có thể bắt đầu đăng ký cho tháng tiếp theo
- **Ví dụ:** Nếu đặt là 23, từ ngày 23/10 nhân viên có thể đăng ký cho tháng 11

### 2. Giờ đóng đăng ký hàng ngày (Daily Deadline Hour)
- **Giá trị:** 0-23
- **Mặc định:** 17
- **Ý nghĩa:** Sau giờ này mỗi ngày, nhân viên không thể đăng ký hoặc chỉnh sửa nữa
- **Ví dụ:** Nếu đặt là 17, sau 17:00 mỗi ngày, nút đăng ký sẽ bị khóa

## Cách sử dụng

### Bước 1: Đăng nhập với tài khoản Super Admin
- Chỉ tài khoản có `employee_code = 'admin'` hoặc `email = 'admin@madison.dev'` mới có quyền truy cập

### Bước 2: Truy cập trang Cấu hình
- Vào menu **⚙️ Cấu hình** (chỉ hiển thị cho Super Admin)

### Bước 3: Thay đổi cấu hình
1. Nhập giá trị mới cho **Ngày mở đăng ký** (1-28)
2. Nhập giá trị mới cho **Giờ đóng đăng ký** (0-23)
3. Nhấn nút **Lưu cấu hình**

### Bước 4: Xác nhận thay đổi
- Hệ thống sẽ hiển thị thông báo thành công
- Cấu hình mới áp dụng ngay lập tức cho tất cả nhân viên

## Cài đặt Database

### Nếu database mới (chưa có dữ liệu)
Chạy file `database/setup.sql` - đã bao gồm bảng `registration_config`

### Nếu database đã tồn tại
Chạy migration để thêm bảng mới:

```bash
psql -U postgres -d lunch_registration -f database/add_registration_config.sql
```

Hoặc chạy trực tiếp trong psql:

```sql
\c lunch_registration

CREATE TABLE IF NOT EXISTS registration_config (
    id SERIAL PRIMARY KEY,
    monthly_cutoff_day INTEGER NOT NULL DEFAULT 23 CHECK (monthly_cutoff_day >= 1 AND monthly_cutoff_day <= 28),
    daily_deadline_hour INTEGER NOT NULL DEFAULT 17 CHECK (daily_deadline_hour >= 0 AND daily_deadline_hour <= 23),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100)
);

INSERT INTO registration_config (monthly_cutoff_day, daily_deadline_hour, updated_by) 
SELECT 23, 17, 'system'
WHERE NOT EXISTS (SELECT 1 FROM registration_config LIMIT 1);
```

## API Endpoints

### GET /api/config
Lấy cấu hình hiện tại (yêu cầu đăng nhập với quyền admin)

**Response:**
```json
{
  "monthly_cutoff_day": 23,
  "daily_deadline_hour": 17,
  "updated_at": "2025-10-25T10:30:00.000Z"
}
```

### PUT /api/config
Cập nhật cấu hình (chỉ Super Admin)

**Request:**
```json
{
  "monthly_cutoff_day": 25,
  "daily_deadline_hour": 16
}
```

**Response:**
```json
{
  "message": "Cập nhật cấu hình thành công",
  "config": {
    "monthly_cutoff_day": 25,
    "daily_deadline_hour": 16,
    "updated_at": "2025-10-25T10:35:00.000Z"
  }
}
```

## Lưu ý quan trọng

⚠️ **Thay đổi cấu hình sẽ áp dụng ngay lập tức** cho tất cả nhân viên

📅 **Ngày mở đăng ký** nên đặt trước ngày 1 của tháng sau để nhân viên có đủ thời gian đăng ký

⏰ **Giờ đóng đăng ký** nên đặt trước giờ làm việc kết thúc để có thời gian xử lý

🔒 **Chỉ Super Admin** mới có quyền thay đổi cấu hình này

## Kiểm tra cấu hình

Sau khi cập nhật, bạn có thể kiểm tra trong database:

```sql
SELECT * FROM registration_config;
```

Hoặc kiểm tra trên giao diện:
1. Đăng nhập với tài khoản nhân viên thường
2. Vào trang **Đăng ký cơm**
3. Kiểm tra thông báo về thời gian đăng ký - sẽ hiển thị theo cấu hình mới

## Troubleshooting

### Lỗi: "Không tìm thấy cấu hình"
- Chạy lại migration `add_registration_config.sql`
- Kiểm tra bảng có tồn tại: `\dt registration_config`

### Lỗi: "Bạn không có quyền truy cập"
- Đảm bảo đăng nhập với tài khoản Super Admin
- Kiểm tra `employee_code = 'admin'` hoặc `email = 'admin@madison.dev'`

### Cấu hình không áp dụng
- Làm mới trang (F5)
- Kiểm tra console log trong Developer Tools
- Kiểm tra API response từ `/api/config`
