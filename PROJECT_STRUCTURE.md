# Cấu trúc Dự án

```
lunch-registration/
│
├── backend/                          # Backend API (Node.js + Express)
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts          # Cấu hình kết nối PostgreSQL
│   │   ├── controllers/
│   │   │   ├── authController.ts    # Xử lý đăng nhập, xác thực
│   │   │   ├── userController.ts    # CRUD nhân viên
│   │   │   ├── registrationController.ts  # Đăng ký cơm
│   │   │   └── statisticsController.ts    # Thống kê, xuất Excel
│   │   ├── middleware/
│   │   │   └── auth.ts              # Middleware xác thực JWT
│   │   ├── routes/
│   │   │   └── index.ts             # Định nghĩa routes
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript interfaces
│   │   └── server.ts                # Entry point
│   ├── scripts/
│   │   └── createAdmin.js           # Script tạo admin
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/                         # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.ts             # Cấu hình axios, interceptors
│   │   ├── components/
│   │   │   ├── Layout.tsx           # Layout chính với navbar
│   │   │   └── PrivateRoute.tsx     # Route bảo vệ
│   │   ├── pages/
│   │   │   ├── Login.tsx            # Trang đăng nhập
│   │   │   ├── Dashboard.tsx        # Trang chủ
│   │   │   ├── Registration.tsx     # Đăng ký cơm (calendar)
│   │   │   ├── Statistics.tsx       # Thống kê (admin)
│   │   │   └── UserManagement.tsx   # Quản lý nhân viên (admin)
│   │   ├── store/
│   │   │   └── authStore.ts         # Zustand store cho auth
│   │   ├── App.tsx                  # Router chính
│   │   ├── main.tsx                 # Entry point
│   │   └── index.css                # Tailwind CSS
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── database/                         # Database scripts
│   ├── schema.sql                   # Schema database
│   └── seed.sql                     # Dữ liệu mẫu
│
├── README.md                        # Tổng quan dự án
├── SETUP.md                         # Hướng dẫn cài đặt
└── .gitignore

```

## Công nghệ sử dụng

### Backend
- **Node.js + Express**: REST API server
- **TypeScript**: Type safety
- **PostgreSQL**: Database
- **JWT**: Authentication
- **bcryptjs**: Mã hóa mật khẩu
- **ExcelJS**: Xuất file Excel

### Frontend
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool
- **React Router**: Routing
- **Zustand**: State management
- **Axios**: HTTP client
- **Tailwind CSS**: Styling
- **react-calendar**: Calendar component
- **react-toastify**: Notifications

### Database
- **PostgreSQL**: Relational database
- 3 bảng chính: users, registrations, settings

## Tính năng chính

### Cho Nhân viên (User)
1. Đăng nhập
2. Xem dashboard cá nhân
3. Đăng ký cơm theo lịch (calendar UI)
4. Xem lịch sử đăng ký
5. Hủy đăng ký

### Cho Quản trị (Admin)
1. Tất cả tính năng của User
2. Quản lý nhân viên (CRUD)
3. Xem thống kê theo tháng/bộ phận/dự án
4. Xuất báo cáo Excel
5. Xem tổng hợp số liệu

## API Endpoints

### Public
- POST /api/auth/login

### Protected (User)
- GET /api/auth/profile
- POST /api/registrations
- GET /api/registrations/my
- POST /api/registrations/cancel

### Protected (Admin only)
- GET /api/users
- POST /api/users
- PUT /api/users/:id
- DELETE /api/users/:id
- GET /api/statistics
- GET /api/statistics/export

## Database Schema

### users
- id, employee_code, full_name, email, password_hash
- department, project, role, is_active
- created_at, updated_at

### registrations
- id, user_id, registration_date
- month, year, status
- created_at, updated_at

### settings
- id, key, value, description
- updated_at
