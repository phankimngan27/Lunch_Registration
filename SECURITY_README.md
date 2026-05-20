# 🔒 Security & Deployment Files

## ⚠️ QUAN TRỌNG

Repository này chứa **template files** cho deployment và configuration. Các file chứa thông tin nhạy cảm thực tế (credentials, IP addresses, secrets) **KHÔNG được commit** vào Git.

## 📁 File Structure

### ✅ Public Files (Trong Git)
Các file này an toàn để public:

- `*.template.md` - Template files không chứa credentials thật
- `.env.example` - Example environment variables
- `README.md`, `QUICKSTART.md` - Documentation với development credentials only

### 🔒 Private Files (Không trong Git)
Các file này chứa thông tin nhạy cảm và được gitignore:

```
.kiro/steering/product.md              # Production environment info
DEPLOYMENT_GUIDE.md                    # Deployment guide với credentials thật
PRODUCTION_DEPLOYMENT_GUIDE.md         # Production deployment steps
SECURITY_GUIDE.md                      # Security configuration
START_HERE.md                          # Quick start với production info
PRODUCTION_DATABASE_INFO.txt           # Database credentials
backend/.env                           # Backend environment variables
frontend/.env.production               # Frontend production config
```

## 🚀 Setup cho Developer Mới

### 1. Clone Repository
```bash
git clone <repository-url>
cd lunch-registration
```

### 2. Tạo File Configuration từ Templates

```bash
# Copy templates và điền thông tin thật
cp .kiro/steering/product.template.md .kiro/steering/product.md
cp DEPLOYMENT_GUIDE.template.md DEPLOYMENT_GUIDE.md
cp PRODUCTION_DEPLOYMENT_GUIDE.template.md PRODUCTION_DEPLOYMENT_GUIDE.md

# Backend environment
cp backend/.env.example backend/.env

# Frontend environment
cp frontend/.env.example frontend/.env
```

### 3. Lấy Credentials từ Team Lead

Liên hệ team lead để lấy:
- Production server IP
- Database credentials
- JWT secret
- Admin passwords
- SSH keys

### 4. Cập nhật Configuration Files

Edit các file đã copy ở bước 2 với thông tin thật từ team lead.

**⚠️ KHÔNG BAO GIỜ commit các file này!**

## 🛡️ Security Best Practices

### ✅ DO:
- Sử dụng template files cho documentation
- Lưu credentials trong password manager (1Password, LastPass, etc.)
- Rotate passwords và secrets định kỳ
- Sử dụng SSH keys thay vì passwords
- Review code trước khi commit
- Kiểm tra `git status` trước khi push

### ❌ DON'T:
- Commit file `.env` vào Git
- Share credentials qua email hoặc chat
- Hardcode passwords trong source code
- Push file chứa production IP/credentials
- Disable `.gitignore` rules

## 🔍 Kiểm Tra Trước Khi Push

Trước mỗi lần push, chạy:

```bash
# Kiểm tra file nào sẽ được push
git status

# Kiểm tra không có credentials trong staged files
git diff --cached | grep -i "password\|secret\|credential"

# Verify .gitignore đang hoạt động
git check-ignore -v .env backend/.env frontend/.env.production
```

## 📝 Development vs Production Credentials

### Development (OK to commit)
```
Email: admin@madison.dev
Password: admin1234

Email: user@madison.dev  
Password: 1234
```

### Production (NEVER commit)
```
Server IP: <ask team lead>
Database Password: <ask team lead>
JWT Secret: <ask team lead>
Admin Password: <ask team lead>
```

## 🆘 Nếu Accidentally Commit Credentials

1. **STOP** - Không push nếu chưa push
2. **Remove from Git history:**
   ```bash
   git rm --cached <sensitive-file>
   git commit -m "Remove sensitive file"
   ```
3. **If already pushed:**
   - Thông báo team lead ngay lập tức
   - Rotate TẤT CẢ credentials bị leak
   - Consider rewriting Git history (cẩn thận!)

4. **Change all compromised credentials:**
   - Database passwords
   - JWT secrets
   - Admin passwords
   - API keys

## 📚 Related Documentation

- [README.md](README.md) - Project overview
- [QUICKSTART.md](QUICKSTART.md) - Quick setup guide
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [DEPLOYMENT_GUIDE.template.md](DEPLOYMENT_GUIDE.template.md) - Deployment template
- [PRODUCTION_DEPLOYMENT_GUIDE.template.md](PRODUCTION_DEPLOYMENT_GUIDE.template.md) - Production deployment template

## 📞 Support

Có câu hỏi về security hoặc cần credentials?
- Liên hệ team lead
- Check team password manager
- Review internal documentation

---

**Remember**: Security is everyone's responsibility! 🔒

