# Project Structure & Conventions

## Monorepo Layout
```
lunch-registration/
├── backend/              # Express API server
├── frontend/             # React application
├── database/             # SQL setup scripts
└── [docs & config]       # Root-level documentation
```

## Backend Architecture

### Directory Structure
```
backend/
├── src/
│   ├── config/           # Database connection config
│   ├── controllers/      # Business logic & route handlers
│   │   ├── authController.ts
│   │   ├── userController.ts
│   │   ├── registrationController.ts
│   │   └── statisticsController.ts
│   ├── middleware/       # Auth, validation middleware
│   ├── routes/           # API route definitions
│   ├── types/            # TypeScript interfaces
│   └── server.ts         # Application entry point
├── scripts/              # Utility scripts (admin creation, CSV import)
├── dist/                 # Compiled JavaScript output
└── [config files]
```

### API Route Pattern
- **Auth**: `/api/auth/*` - Login, profile
- **Users**: `/api/users/*` - Employee CRUD (admin only)
- **Registrations**: `/api/registrations/*` - Meal registration operations
- **Statistics**: `/api/statistics/*` - Reports & Excel export (admin only)

### Controller Pattern
- Each controller handles one domain (auth, users, registrations, statistics)
- Controllers contain route handler functions
- Database queries are inline (no separate repository layer)
- Use parameterized queries to prevent SQL injection

### Middleware
- `auth.ts`: JWT verification and role-based access control
- Applied per-route or per-router basis

## Frontend Architecture

### Directory Structure
```
frontend/
├── src/
│   ├── api/              # Axios configuration & interceptors
│   ├── components/       # Reusable UI components
│   │   ├── ui/           # Base UI components
│   │   ├── Layout.tsx    # Main layout with sidebar
│   │   ├── PrivateRoute.tsx
│   │   └── [feature components]
│   ├── pages/            # Route-level page components
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Registration.tsx
│   │   ├── Statistics.tsx
│   │   └── UserManagement.tsx
│   ├── store/            # Zustand stores
│   │   └── authStore.ts
│   ├── utils/            # Helper functions
│   ├── App.tsx           # Router setup
│   └── main.tsx          # React entry point
├── public/               # Static assets
└── [config files]
```

### Component Conventions
- Use functional components with hooks
- TypeScript interfaces for all props
- Tailwind CSS for styling (utility-first approach)
- Component file names match component names (PascalCase)

### State Management
- **Local state**: `useState` for component-specific UI state
- **Global state**: Zustand for auth state (user, token, login/logout)
- **Server state**: Fetch on component mount, store in local state

### Routing
- React Router DOM v6
- Protected routes wrapped with `PrivateRoute` component
- Role-based rendering (admin vs user features)

## Database Schema

### Tables
- **users**: Employee information, credentials, role
- **registrations**: Meal registrations with date, user_id, status
- **settings**: System configuration (meal price, etc.)

### Naming Conventions
- Table names: lowercase, plural
- Column names: snake_case
- Foreign keys: `{table}_id` pattern
- Timestamps: `created_at`, `updated_at`

## Code Conventions

### TypeScript
- Strict mode enabled
- Define interfaces for all data structures
- Avoid `any`, use `unknown` if type is truly unknown
- Export types from `types/index.ts` (backend) or inline (frontend)

### Naming
- **Variables/Functions**: camelCase
- **Components/Classes**: PascalCase
- **Constants**: UPPER_SNAKE_CASE
- **Files**: Match export name (PascalCase for components, camelCase for utilities)

### Error Handling
- Backend: Try-catch blocks, return appropriate HTTP status codes
- Frontend: Try-catch with toast notifications for user feedback
- Always handle loading and error states in UI

### Security
- Parameterized SQL queries (use `$1, $2` placeholders)
- JWT tokens for authentication
- Password hashing with bcrypt (salt rounds: 10)
- CORS configured for specific origin
- Input validation with express-validator

### Git Workflow
- Branch naming: `feature/`, `fix/`, `refactor/`, `docs/`
- Commit messages: `feat:`, `fix:`, `refactor:`, `docs:`, `style:`, `test:`, `chore:`
- No console.logs in production code

## Important Rules

### Code Quality & Review
1. **ALWAYS review code after making changes**:
   - Use `getDiagnostics` tool to check for syntax errors, type issues, and linting problems
   - Verify all imports are correct and used
   - Check for missing dependencies or unused variables
   - Ensure proper error handling is in place
   - Review the code matches the requirements

2. **ALWAYS clean up temporary files**:
   - Delete any temporary/utility scripts created for one-time tasks (e.g., data migration scripts, check scripts)
   - Remove debug files, test data files, or experimental code
   - Delete duplicate files or backup files
   - Keep only production-ready code in the repository
   - Examples of files to remove: `check-*.js`, `test-*.js`, `debug-*.js`, `temp-*.js`, backup files

3. **Test before committing**:
   - Run dev servers and verify functionality works as expected
   - Test both happy path and error scenarios
   - Verify UI displays correctly with Vietnamese text
   - Check API responses and error messages

### Development Standards
4. **Vietnamese language** - All UI text and user-facing messages must be in Vietnamese

5. **No direct database access in routes** - Always use controllers for database operations

6. **Validate all inputs** - Implement validation on both client and server side

7. **No console.logs in production code** - Remove all debug console statements before committing

8. **Security first**:
   - Always use parameterized queries (never string concatenation)
   - Validate and sanitize all user inputs
   - Handle sensitive data (passwords, tokens) securely
   - Never commit credentials or secrets to repository
