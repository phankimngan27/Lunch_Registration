# 🤝 Hướng dẫn đóng góp

## Quy tắc code

### TypeScript/JavaScript
- Sử dụng TypeScript cho tất cả code mới
- Tuân thủ ESLint rules
- Đặt tên biến rõ ràng, có ý nghĩa
- Comment cho logic phức tạp

### React Components
- Sử dụng functional components với hooks
- Tách component nhỏ, tái sử dụng được
- Props phải có TypeScript types
- Sử dụng Tailwind CSS cho styling

### API Routes
- RESTful conventions
- Validate input với express-validator
- Error handling đầy đủ
- Response format nhất quán

## Git Workflow

### Branch naming
- `feature/ten-tinh-nang` - Tính năng mới
- `fix/ten-loi` - Sửa lỗi
- `refactor/ten-phan` - Refactor code
- `docs/ten-tai-lieu` - Cập nhật docs

### Commit messages
```
feat: Thêm tính năng đăng ký theo tuần
fix: Sửa lỗi không hiển thị toast error
refactor: Cải thiện performance query database
docs: Cập nhật README với hướng dẫn mới
```

### Pull Request
1. Tạo branch từ `main`
2. Code và test kỹ
3. Commit với message rõ ràng
4. Push và tạo PR
5. Request review từ team lead
6. Merge sau khi được approve

## Testing

### Backend
```bash
cd backend
npm run dev
# Test API với Postman hoặc curl
```

### Frontend
```bash
cd frontend
npm run dev
# Test UI trên browser
```

### Database
```bash
# Test queries trực tiếp
psql -U postgres -d lunch_registration
```

## Code Review Checklist

- [ ] Code chạy không lỗi
- [ ] Đã test các edge cases
- [ ] TypeScript types đầy đủ
- [ ] Error handling đúng
- [ ] UI responsive trên mobile
- [ ] Không có console.log dư thừa
- [ ] Comment cho logic phức tạp
- [ ] Tuân thủ coding conventions

## Liên hệ

Có thắc mắc? Liên hệ team lead hoặc tạo issue trên repository.
