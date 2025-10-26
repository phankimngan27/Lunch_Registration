# Tech Stack & Architecture Documentation

## Tổng quan dự án
**Hệ thống Đăng ký Cơm Trưa** - Ứng dụng web quản lý đăng ký suất ăn trưa cho công ty

---

## BACKEND

### Ngôn ngữ & Runtime
- **TypeScript** 5.3.3
- **Node.js** (target ES2020)
- **Module System:** CommonJS

### Framework & Core Libraries
| Library | Version | Mục đích |
|---------|---------|----------|
| Express | 4.18.2 | Web framework |
| PostgreSQL (pg) | 8.11.3 | Database driver |
| jsonwebtoken | 9.0.2 | JWT authentication |
| bcryptjs | 2.4.3 | Password hashing |
| ExcelJS | 4.4.0 | Export Excel files |
| CORS | 2.8.5 | Cross-origin resource sharing |
| dotenv | 16.3.1 | Environment variables |
| express-validator | 7.0.1 | Input validation |

### Development Tools
| Tool | Version | Mục đích |
|------|---------|----------|
| nodemon | 3.0.2 | Auto-reload server |
| ts-node | 10.9.2 | Run TypeScript directly |
| TypeScript | 5.3.3 | Type checking & compilation |

### Cấu trúc Backend
```
backend/
├── src/
│   ├── config/
│   │   └── database.ts          # PostgreSQL connection config
│   ├── controllers/
│   │   ├── authController.ts    # Login, profile, JWT
│   │   ├── registrationController.ts  # CRUD đăng ký cơm
│   │   ├── statisticsController.ts    # Thống kê & export Excel
│   │   └── userController.ts    # CRUD users
│   ├── middleware/
│   │   └── auth.ts              # JWT verification, role check
│   ├── routes/
│   │   └── index.ts             # API routes definition
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces
│   ├── server.ts                # Main entry point
│   └── mockServer.ts            # Mock server for testing
├── scripts/
│   ├── importFromCSV.js         # Import data từ CSV
│   ├── updateLunchPrice.js      # Update giá cơm
│   └── resetAllPasswords.js     # Reset passwords hàng loạt
├── .env                         # Environment variables
├── package.json
└── tsconfig.json
```

### API Endpoints
**Port:** 5000

**Auth:**
- POST `/api/auth/login` - Đăng nhập
- GET `/api/auth/profile` - Lấy thông tin user

**Users (Admin only):**
- GET `/api/users` - Danh sách users
- POST `/api/users` - Tạo user mới
- PUT `/api/users/:id` - Cập nhật user
- DELETE `/api/users/:id` - Xóa user

**Registrations:**
- POST `/api/registrations` - Đăng ký cơm
- GET `/api/registrations/my` - Lịch sử đăng ký
- POST `/api/registrations/cancel` - Hủy đăng ký

**Statistics (Admin only):**
- GET `/api/statistics` - Thống kê theo tháng/năm/bộ phận
- GET `/api/statistics/export` - Export Excel

### Scripts
```bash
npm run dev      # Development mode với nodemon
npm run build    # Compile TypeScript
npm start        # Production mode
npm run mock     # Mock server
```

---

## FRONTEND

### Ngôn ngữ & Framework
- **TypeScript** 5.3.3
- **React** 18.2.0
- **Module System:** ESNext
- **JSX:** react-jsx

### Build Tool
- **Vite** 5.0.8 - Fast build tool & dev server

### UI Framework & Styling
| Library | Version | Mục đích |
|---------|---------|----------|
| Tailwind CSS | 3.3.6 | Utility-first CSS framework |
| Lucide React | 0.294.0 | Icon library |
| React Calendar | 4.7.0 | Calendar component |
| React Toastify | 9.1.3 | Toast notifications |

### Routing & State Management
| Library | Version | Mục đích |
|---------|---------|----------|
| React Router DOM | 6.20.1 | Client-side routing |
| Zustand | 4.4.7 | Lightweight state management |

### HTTP & Utilities
| Library | Version | Mục đích |
|---------|---------|----------|
| Axios | 1.6.2 | HTTP client |
| clsx | 2.1.1 | Conditional classnames |
| class-variance-authority | 0.7.1 | Component variants |
| tailwind-merge | 2.6.0 | Merge Tailwind classes |

### Cấu trúc Frontend
```
frontend/
├── src/
│   ├── api/
│   │   └── axios.ts             # Axios instance với interceptors
│   ├── components/
│   │   ├── ui/                  # Reusable UI components
│   │   ├── CustomLunarCalendar.tsx  # Lịch âm
│   │   ├── EmployeeRegistration.tsx # Form đăng ký
│   │   ├── Layout.tsx           # Main layout với sidebar
│   │   └── PrivateRoute.tsx     # Protected route wrapper
│   ├── pages/
│   │   ├── Dashboard.tsx        # Trang chủ
│   │   ├── Login.tsx            # Đăng nhập
│   │   ├── Registration.tsx     # Đăng ký cơm
│   │   ├── Statistics.tsx       # Thống kê (Admin)
│   │   └── UserManagement.tsx   # Quản lý users (Admin)
│   ├── store/
│   │   └── authStore.ts         # Zustand store cho auth
│   ├── utils/
│   │   └── lunarCalendar.ts     # Tính toán lịch âm
│   ├── App.tsx                  # Main app với routes
│   ├── main.tsx                 # Entry point
│   └── index.css                # Global styles + Tailwind
├── index.html
├── vite.config.ts               # Vite config với proxy
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── tsconfig.json
```

### Development Server
**Port:** 3000  
**Proxy:** `/api` → `http://localhost:5000`

### Scripts
```bash
npm run dev      # Development server
npm run build    # Build for production
npm run preview  # Preview production build
```

---

## DATABASE

### PostgreSQL Schema

**Tables:**

1. **users**
   - id, employee_code, full_name, email, password_hash
   - department, project, role, is_active
   - created_at, updated_at

2. **registrations**
   - id, user_id, registration_date
   - month, year, status
   - created_at, updated_at
   - UNIQUE(user_id, registration_date)

3. **settings**
   - id, key, value, description
   - updated_at

**Indexes:**
- idx_registrations_user_id
- idx_registrations_date
- idx_registrations_month_year
- idx_users_department
- idx_users_project

---

## TÍNH NĂNG CHÍNH

### 1. Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin/User)
- Protected routes
- Auto logout on token expiration

### 2. User Management (Admin only)
- CRUD operations cho users
- Import users từ CSV
- Reset passwords hàng loạt
- Filter theo department/project

### 3. Lunch Registration
- Calendar-based registration
- Lunar calendar support (hiển thị ngày âm lịch)
- Bulk registration (chọn nhiều ngày)
- Cancel registration
- View personal registration history

### 4. Statistics & Reports (Admin only)
- Thống kê theo tháng/năm
- Filter theo department/project
- Tổng số nhân viên, số suất, tổng tiền
- Export Excel với format chi tiết:
  - Header công ty
  - Cột STT, Mã NV, Họ tên, Bộ phận
  - Cột tổng ngày, số tiền
  - Các cột ngày 1-31 với dấu "x" đánh dấu

### 5. Settings
- Quản lý giá cơm
- Update giá theo tháng

---

## UTILITY SCRIPTS

### Backend Scripts
```bash
# Import data từ CSV
node backend/scripts/importFromCSV.js

# Update giá cơm
node backend/scripts/updateLunchPrice.js

# Reset tất cả passwords về 1234
node backend/scripts/resetAllPasswords.js
```

### Batch Scripts (Windows)
```bash
# Start cả backend và frontend
start-website.bat

# Stop tất cả processes
stop-website.bat
```

---

## ENVIRONMENT VARIABLES

### Backend (.env)
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lunch_registration
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
PORT=5000
```

---

## ARCHITECTURE PATTERNS

### Backend
- **MVC Pattern:** Controllers, Routes, Models (via PostgreSQL)
- **Middleware Pattern:** Authentication, validation
- **Repository Pattern:** Database queries trong controllers
- **JWT Authentication:** Stateless authentication

### Frontend
- **Component-based Architecture:** Reusable React components
- **State Management:** Zustand cho global state (auth)
- **Custom Hooks:** Có thể mở rộng
- **Proxy Pattern:** Vite proxy cho API calls

---

## SECURITY

### Backend
- Password hashing với bcryptjs (salt rounds: 10)
- JWT tokens với expiration
- CORS configuration
- SQL injection prevention (parameterized queries)
- Input validation với express-validator

### Frontend
- Protected routes với PrivateRoute component
- Token storage trong localStorage
- Axios interceptors cho auto token attachment
- Auto redirect on 401 errors

---

## PERFORMANCE OPTIMIZATIONS

### Backend
- Database indexes cho frequent queries
- Connection pooling (pg)
- Efficient SQL queries với JOINs

### Frontend
- Vite fast build & HMR
- Code splitting với React Router
- Lazy loading có thể implement
- Tailwind CSS purge unused styles

---

## BROWSER COMPATIBILITY
- Modern browsers (ES2020 support)
- Chrome, Firefox, Edge, Safari (latest versions)

---

## FUTURE ENHANCEMENTS
- [ ] Email notifications
- [ ] Mobile responsive improvements
- [ ] Real-time updates với WebSocket
- [ ] Advanced reporting với charts
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Audit logs
- [ ] Backup/restore functionality

---

**Last Updated:** October 2025  
**Version:** 1.0.0
