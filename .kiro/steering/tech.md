# Technology Stack

## Backend
- **Runtime**: Node.js with TypeScript 5.3.3
- **Framework**: Express 4.18.2
- **Database**: PostgreSQL with pg driver
- **Authentication**: JWT (jsonwebtoken) + bcryptjs for password hashing
- **Validation**: express-validator
- **Excel Export**: ExcelJS
- **Module System**: CommonJS (target ES2020)

### Backend Structure
```
backend/src/
├── config/database.ts       # PostgreSQL connection
├── controllers/             # Route handlers
├── middleware/auth.ts       # JWT verification, role checks
├── routes/index.ts          # API route definitions
├── types/index.ts           # TypeScript interfaces
└── server.ts                # Entry point
```

### Backend Scripts
```bash
npm run dev              # Development with nodemon
npm run build            # Compile TypeScript
npm start                # Production mode
npm run create-admin     # Create/reset super admin
npm run import-csv       # Import employees from CSV
npm run reset-passwords  # Reset all passwords to 1234
npm run update-price     # Update meal pricing
```

## Frontend
- **Framework**: React 18.2.0 with TypeScript 5.3.3
- **Build Tool**: Vite 5.0.8
- **Routing**: React Router DOM 6.20.1
- **State Management**: Zustand 4.4.7 (for auth state)
- **HTTP Client**: Axios 1.6.2
- **Styling**: Tailwind CSS 3.3.6
- **UI Components**: Lucide React (icons), React Calendar, React Toastify
- **Module System**: ESNext with react-jsx

### Frontend Structure
```
frontend/src/
├── api/axios.ts            # Axios instance with interceptors
├── components/             # Reusable UI components
├── pages/                  # Page components (Dashboard, Login, etc.)
├── store/authStore.ts      # Zustand auth store
├── utils/                  # Utilities (lunar calendar calculations)
└── App.tsx                 # Router configuration
```

### Frontend Scripts
```bash
npm run dev      # Development server (port 3000)
npm run build    # Production build
npm run preview  # Preview production build
```

## Database
- **PostgreSQL 14+**
- **Tables**: users, registrations, settings
- **Indexes**: Optimized for user_id, date, month/year, department, project queries

## Development Ports
- Backend: 5000
- Frontend: 3000 (proxies `/api` to backend)

## Environment Variables

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

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
```

## Common Commands

### Start Development
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev

# Or use batch files (Windows)
start-website.bat    # Start both
stop-website.bat     # Stop both
```

### Database Setup
```bash
psql -U postgres
CREATE DATABASE lunch_registration;
\c lunch_registration
\i database/setup.sql
```

### Build for Production
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
```

## TypeScript Configuration
- **Strict mode enabled** on both frontend and backend
- **Target**: ES2020
- **Backend**: CommonJS modules, outputs to `dist/`
- **Frontend**: ESNext modules, bundler resolution, no emit (Vite handles build)
