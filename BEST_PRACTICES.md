# 🎯 Best Practices

## Code Quality

### TypeScript
- ✅ Luôn định nghĩa types/interfaces cho data structures
- ✅ Tránh dùng `any`, sử dụng `unknown` nếu cần
- ✅ Enable strict mode trong tsconfig.json
- ✅ Sử dụng type guards khi cần

### Error Handling
```typescript
// ❌ Bad
try {
  const data = await api.get('/users');
  return data;
} catch (error) {
  console.log(error);
}

// ✅ Good
try {
  const data = await api.get('/users');
  return data;
} catch (error) {
  if (error instanceof Error) {
    toast.error(error.message);
  }
  throw error;
}
```

### Console Logs
- ❌ Không commit console.log vào production code
- ✅ Sử dụng proper logging library (Winston, Pino)
- ✅ Chỉ log trong development mode

### API Calls
```typescript
// ❌ Bad - Không handle loading state
const fetchData = async () => {
  const data = await api.get('/users');
  setUsers(data);
};

// ✅ Good - Handle loading và error
const fetchData = async () => {
  setLoading(true);
  try {
    const response = await api.get('/users');
    setUsers(response.data);
  } catch (error) {
    toast.error('Không thể tải dữ liệu');
  } finally {
    setLoading(false);
  }
};
```

## Security

### Environment Variables
- ✅ Không commit file .env
- ✅ Sử dụng .env.example để document required variables
- ✅ Validate environment variables khi app start
- ✅ Sử dụng strong JWT_SECRET (minimum 32 characters)

### Password Security
- ✅ Hash passwords với bcrypt (salt rounds >= 10)
- ✅ Không log passwords
- ✅ Enforce password complexity rules
- ✅ Implement password reset flow

### SQL Injection Prevention
```typescript
// ❌ Bad - SQL injection vulnerable
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ Good - Parameterized query
const query = 'SELECT * FROM users WHERE email = $1';
const result = await pool.query(query, [email]);
```

### CORS Configuration
```typescript
// ❌ Bad - Allow all origins
app.use(cors());

// ✅ Good - Specific origin
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
```

## Performance

### Database Queries
- ✅ Sử dụng indexes cho frequently queried columns
- ✅ Limit results với LIMIT clause
- ✅ Sử dụng connection pooling
- ✅ Avoid N+1 queries, sử dụng JOINs

### Frontend Optimization
- ✅ Lazy load components với React.lazy()
- ✅ Memoize expensive computations với useMemo
- ✅ Debounce search inputs
- ✅ Optimize images (WebP, lazy loading)

### API Response
```typescript
// ❌ Bad - Return all data
const users = await pool.query('SELECT * FROM users');

// ✅ Good - Select only needed fields
const users = await pool.query(
  'SELECT id, full_name, email, department FROM users'
);
```

## React Best Practices

### Component Structure
```typescript
// ✅ Good structure
const UserCard = ({ user }: { user: User }) => {
  // 1. Hooks
  const [isEditing, setIsEditing] = useState(false);
  
  // 2. Event handlers
  const handleEdit = () => setIsEditing(true);
  
  // 3. Render helpers
  const renderActions = () => (
    <button onClick={handleEdit}>Edit</button>
  );
  
  // 4. Main render
  return (
    <div>
      <h3>{user.full_name}</h3>
      {renderActions()}
    </div>
  );
};
```

### State Management
- ✅ Sử dụng local state cho UI state
- ✅ Sử dụng Zustand/Context cho global state
- ✅ Avoid prop drilling, sử dụng composition
- ✅ Keep state as close to where it's used as possible

### useEffect Dependencies
```typescript
// ❌ Bad - Missing dependencies
useEffect(() => {
  fetchData(userId);
}, []);

// ✅ Good - All dependencies included
useEffect(() => {
  fetchData(userId);
}, [userId]);
```

## Git Workflow

### Commit Messages
```bash
# ✅ Good commit messages
feat: Add user profile page
fix: Resolve login redirect loop
refactor: Improve database query performance
docs: Update API documentation
style: Format code with prettier
test: Add unit tests for auth controller
chore: Update dependencies

# ❌ Bad commit messages
update
fix bug
changes
wip
```

### Branch Naming
```bash
# ✅ Good branch names
feature/user-profile
fix/login-redirect-loop
refactor/database-queries
docs/api-documentation

# ❌ Bad branch names
new-feature
fix
update
test
```

## Testing

### Unit Tests
```typescript
// ✅ Test structure
describe('AuthController', () => {
  describe('login', () => {
    it('should return token for valid credentials', async () => {
      // Arrange
      const credentials = { email: 'test@test.com', password: '1234' };
      
      // Act
      const result = await login(credentials);
      
      // Assert
      expect(result).toHaveProperty('token');
    });
    
    it('should throw error for invalid credentials', async () => {
      // Test error case
    });
  });
});
```

### Integration Tests
- ✅ Test API endpoints end-to-end
- ✅ Use test database
- ✅ Clean up after tests
- ✅ Test error scenarios

## Documentation

### Code Comments
```typescript
// ❌ Bad - Obvious comment
// Set user to null
user = null;

// ✅ Good - Explain why
// Clear user data to prevent memory leak in long-running sessions
user = null;
```

### API Documentation
```typescript
/**
 * Create a new user
 * @route POST /api/users
 * @access Admin only
 * @param {string} email - User email
 * @param {string} full_name - User full name
 * @returns {Object} Created user object
 * @throws {400} Invalid input
 * @throws {409} Email already exists
 */
```

### README
- ✅ Clear setup instructions
- ✅ Prerequisites listed
- ✅ Environment variables documented
- ✅ Common issues and solutions
- ✅ Contributing guidelines

## Deployment

### Pre-deployment Checklist
- [ ] All tests passing
- [ ] No console.logs in production code
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Build succeeds without warnings
- [ ] Security audit passed
- [ ] Performance tested
- [ ] Error tracking configured

### Production Environment
- ✅ Use NODE_ENV=production
- ✅ Enable HTTPS/SSL
- ✅ Set up monitoring (Sentry, LogRocket)
- ✅ Configure proper CORS
- ✅ Set up database backups
- ✅ Use CDN for static assets
- ✅ Enable rate limiting
- ✅ Set up health checks

## Monitoring

### Logging
```typescript
// ✅ Good logging
logger.info('User logged in', { userId, timestamp });
logger.error('Database connection failed', { error, context });
logger.warn('API rate limit approaching', { userId, requestCount });
```

### Metrics to Track
- ✅ Response times
- ✅ Error rates
- ✅ Database query performance
- ✅ Memory usage
- ✅ Active users
- ✅ API endpoint usage

## Accessibility

### HTML Semantics
```tsx
// ❌ Bad
<div onClick={handleClick}>Click me</div>

// ✅ Good
<button onClick={handleClick}>Click me</button>
```

### ARIA Labels
```tsx
// ✅ Good
<button aria-label="Close dialog" onClick={onClose}>
  <X />
</button>
```

### Keyboard Navigation
- ✅ All interactive elements keyboard accessible
- ✅ Proper tab order
- ✅ Focus indicators visible
- ✅ Skip links for navigation

## Mobile Responsiveness

### Breakpoints
```css
/* Mobile first approach */
.container {
  padding: 1rem; /* Mobile */
}

@media (min-width: 640px) {
  .container {
    padding: 1.5rem; /* Tablet */
  }
}

@media (min-width: 1024px) {
  .container {
    padding: 2rem; /* Desktop */
  }
}
```

### Touch Targets
- ✅ Minimum 44x44px for touch targets
- ✅ Adequate spacing between clickable elements
- ✅ No hover-only interactions

---

**Remember:** Code is read more often than it's written. Write code for humans, not machines.
