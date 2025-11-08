# 🔒 Hướng Dẫn Tăng Cường Bảo Mật

## 📋 Mục Lục
1. [Database Security](#database-security)
2. [Backend Security](#backend-security)
3. [Frontend Security](#frontend-security)
4. [Server Security](#server-security)
5. [Network Security](#network-security)
6. [Monitoring & Logging](#monitoring--logging)

---

## 🗄️ Database Security

### 1. Không Cho Phép Remote Access Trực Tiếp

**Hiện tại:** PostgreSQL chỉ listen trên localhost (✅ Đúng)

**Kiểm tra:**
```bash
# SSH vào server
ssh root@178.128.92.112

# Kiểm tra PostgreSQL config
sudo cat /etc/postgresql/17/main/postgresql.conf | grep listen_addresses

# Nên thấy:
# listen_addresses = 'localhost'  hoặc  '127.0.0.1'
```

**Nếu đang là '*', sửa lại:**
```bash
sudo nano /etc/postgresql/17/main/postgresql.conf

# Sửa thành:
listen_addresses = 'localhost'

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### 2. Giới Hạn Quyền User Database

```bash
# SSH vào server
sudo -u postgres psql

-- Revoke tất cả quyền không cần thiết
REVOKE ALL ON DATABASE lunch_registration FROM PUBLIC;

-- Chỉ cho lunch_user quyền cần thiết
GRANT CONNECT ON DATABASE lunch_registration TO lunch_user;

-- Trong database
\c lunch_registration

-- Revoke quyền tạo schema
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

-- Chỉ cho quyền trên các tables cần thiết
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO lunch_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO lunch_user;

-- Không cho quyền DROP, TRUNCATE
\q
```

### 3. Thay Đổi Password Mạnh Hơn

```bash
sudo -u postgres psql -d lunch_registration

-- Tạo password mạnh (ít nhất 16 ký tự, có chữ hoa, chữ thường, số, ký tự đặc biệt)
ALTER USER lunch_user WITH PASSWORD 'M@d1s0n_Lunch_2024!#Secure';

\q
```

**Cập nhật .env:**
```bash
cd /root/lunch_req/backend
nano .env

# Sửa dòng:
DB_PASSWORD=M@d1s0n_Lunch_2024!#Secure

# Restart backend
pm2 restart lunch-backend
```

### 4. Backup Database Định Kỳ

**Tạo script backup tự động:**
```bash
# Tạo thư mục backup
sudo mkdir -p /root/backups/database
sudo chmod 700 /root/backups/database

# Tạo backup script
cat > /root/backups/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/root/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/lunch_registration_$DATE.sql"

# Backup database
sudo -u postgres pg_dump lunch_registration > "$BACKUP_FILE"

# Compress
gzip "$BACKUP_FILE"

# Xóa backup cũ hơn 30 ngày
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
EOF

chmod +x /root/backups/backup-db.sh

# Test backup
/root/backups/backup-db.sh
```

**Setup cron job (backup hàng ngày lúc 2 giờ sáng):**
```bash
# Mở crontab
crontab -e

# Thêm dòng này:
0 2 * * * /root/backups/backup-db.sh >> /root/backups/backup.log 2>&1
```

### 5. Enable PostgreSQL Logging

```bash
sudo nano /etc/postgresql/17/main/postgresql.conf

# Bật logging
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_statement = 'mod'  # Log INSERT, UPDATE, DELETE
log_duration = on
log_connections = on
log_disconnections = on

# Restart
sudo systemctl restart postgresql
```

---

## 🔐 Backend Security

### 1. Thay Đổi JWT Secret Mạnh Hơn

```bash
cd /root/lunch_req/backend

# Tạo JWT secret mạnh (32+ ký tự)
# Có thể dùng: openssl rand -base64 32

nano .env

# Sửa:
JWT_SECRET=your_very_strong_jwt_secret_at_least_32_characters_long_2024

# Restart
pm2 restart lunch-backend
```

### 2. Thêm Rate Limiting

**Cài đặt express-rate-limit:**
```bash
cd /root/lunch_req/backend
npm install express-rate-limit
```

**Cập nhật server.ts:**
```typescript
import rateLimit from 'express-rate-limit';

// Rate limiter cho login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // Tối đa 5 requests
  message: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter chung
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // Tối đa 100 requests
  message: 'Quá nhiều requests. Vui lòng thử lại sau.',
});

// Apply rate limiters
app.use('/api/auth/login', loginLimiter);
app.use('/api', generalLimiter);
```

### 3. Thêm Helmet.js (Security Headers)

```bash
cd /root/lunch_req/backend
npm install helmet
```

**Cập nhật server.ts:**
```typescript
import helmet from 'helmet';

// Thêm security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### 4. Validate & Sanitize Input

**Đảm bảo tất cả inputs được validate:**
```typescript
// Ví dụ trong authController.ts
import { body, validationResult } from 'express-validator';

export const loginValidation = [
  body('email')
    .isEmail().withMessage('Email không hợp lệ')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 4 }).withMessage('Password phải có ít nhất 4 ký tự')
    .trim()
    .escape(),
];

// Trong route
app.post('/api/auth/login', loginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // ... login logic
});
```

### 5. Hide Sensitive Information

**Cập nhật server.ts:**
```typescript
// Không expose stack trace trong production
if (process.env.NODE_ENV === 'production') {
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
      message: 'Internal server error',
      // Không trả về err.stack
    });
  });
}

// Hide X-Powered-By header
app.disable('x-powered-by');
```

### 6. Rebuild và Deploy

```bash
cd /root/lunch_req/backend
npm install
npm run build
pm2 restart lunch-backend
```

---

## 🌐 Frontend Security

### 1. Environment Variables

**Đảm bảo không expose sensitive data:**
```bash
cd /root/lunch_req/frontend

# Kiểm tra .env.production
cat .env.production

# Chỉ nên có:
VITE_API_URL=https://lunch-booking.madlab.tech/api

# KHÔNG được có: API keys, secrets, passwords
```

### 2. Content Security Policy

**Thêm CSP headers trong Nginx:**
```bash
sudo nano /etc/nginx/sites-available/lunch-booking

# Thêm vào server block:
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://lunch-booking.madlab.tech;" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Test và reload
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Secure Cookie Settings

**Nếu dùng cookies, cập nhật backend:**
```typescript
// Set secure cookie options
res.cookie('token', token, {
  httpOnly: true,
  secure: true, // Chỉ qua HTTPS
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});
```

---

## 🖥️ Server Security

### 1. Firewall Configuration

```bash
# Enable UFW firewall
sudo ufw enable

# Chỉ cho phép các ports cần thiết
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# KHÔNG mở port 5000 (backend) và 5432 (PostgreSQL)
# Chúng chỉ nên accessible từ localhost

# Kiểm tra
sudo ufw status verbose
```

### 2. SSH Security

```bash
# Disable root login qua SSH
sudo nano /etc/ssh/sshd_config

# Sửa các dòng:
PermitRootLogin no
PasswordAuthentication no  # Chỉ dùng SSH key
PubkeyAuthentication yes
Port 2222  # Đổi port SSH (optional)

# Restart SSH
sudo systemctl restart sshd
```

**Setup SSH Key (nếu chưa có):**
```bash
# Trên máy local (PowerShell)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy public key lên server
ssh-copy-id root@178.128.92.112

# Test login bằng key
ssh root@178.128.92.112
```

### 3. Automatic Security Updates

```bash
# Cài đặt unattended-upgrades
sudo apt-get install unattended-upgrades

# Enable
sudo dpkg-reconfigure -plow unattended-upgrades

# Cấu hình
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades

# Bật auto-reboot nếu cần:
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "02:00";
```

### 4. Fail2Ban (Chống Brute Force)

```bash
# Cài đặt Fail2Ban
sudo apt-get install fail2ban

# Tạo config
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local

# Cấu hình:
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = 22
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

# Start Fail2Ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Kiểm tra
sudo fail2ban-client status
```

### 5. Disable Unused Services

```bash
# Xem services đang chạy
systemctl list-units --type=service --state=running

# Disable services không cần thiết
# Ví dụ:
sudo systemctl disable bluetooth
sudo systemctl stop bluetooth
```

---

## 🌍 Network Security

### 1. SSL/TLS Configuration

**Cải thiện SSL config trong Nginx:**
```bash
sudo nano /etc/nginx/sites-available/lunch-booking

# Thêm/sửa SSL settings:
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_stapling on;
ssl_stapling_verify on;

# Test và reload
sudo nginx -t
sudo systemctl reload nginx
```

### 2. HTTPS Redirect

**Đảm bảo tất cả traffic qua HTTPS:**
```bash
sudo nano /etc/nginx/sites-available/lunch-booking

# Thêm server block redirect HTTP -> HTTPS:
server {
    listen 80;
    server_name lunch-booking.madlab.tech;
    return 301 https://$server_name$request_uri;
}
```

### 3. DigitalOcean Cloud Firewall

**Trong DigitalOcean Dashboard:**
1. Vào **Networking** → **Firewalls**
2. Create Firewall
3. **Inbound Rules:**
   - SSH: TCP 22 (chỉ từ IP của bạn)
   - HTTP: TCP 80 (All IPv4, All IPv6)
   - HTTPS: TCP 443 (All IPv4, All IPv6)
4. **Outbound Rules:**
   - All TCP, All UDP (cho updates)
5. Apply to Droplet

---

## 📊 Monitoring & Logging

### 1. Setup Log Rotation

```bash
# Tạo logrotate config
sudo nano /etc/logrotate.d/lunch-registration

# Nội dung:
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}

/root/.pm2/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
}
```

### 2. Monitor Failed Login Attempts

**Tạo script monitor:**
```bash
cat > /root/scripts/monitor-failed-logins.sh << 'EOF'
#!/bin/bash
LOG_FILE="/root/.pm2/logs/lunch-backend-out.log"
ALERT_EMAIL="admin@madlab.tech"

# Đếm failed login trong 1 giờ qua
FAILED_COUNT=$(grep -c "Login failed" "$LOG_FILE" | tail -100)

if [ "$FAILED_COUNT" -gt 10 ]; then
    echo "Warning: $FAILED_COUNT failed login attempts in the last hour" | \
    mail -s "Security Alert: Multiple Failed Logins" "$ALERT_EMAIL"
fi
EOF

chmod +x /root/scripts/monitor-failed-logins.sh

# Chạy mỗi giờ
crontab -e
# Thêm:
0 * * * * /root/scripts/monitor-failed-logins.sh
```

### 3. Setup Monitoring với PM2

```bash
# Enable PM2 monitoring
pm2 install pm2-logrotate

# Cấu hình
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

---

## ✅ Security Checklist

### Database
- [ ] PostgreSQL chỉ listen trên localhost
- [ ] Password mạnh (16+ ký tự)
- [ ] Giới hạn quyền user
- [ ] Backup tự động hàng ngày
- [ ] Enable logging

### Backend
- [ ] JWT secret mạnh (32+ ký tự)
- [ ] Rate limiting enabled
- [ ] Helmet.js installed
- [ ] Input validation
- [ ] Hide error details trong production
- [ ] CORS configured đúng

### Frontend
- [ ] Không expose sensitive data
- [ ] CSP headers configured
- [ ] HTTPS only
- [ ] Secure cookie settings

### Server
- [ ] Firewall enabled (UFW)
- [ ] SSH key authentication
- [ ] Disable root login
- [ ] Automatic security updates
- [ ] Fail2Ban installed
- [ ] Unused services disabled

### Network
- [ ] SSL/TLS configured đúng
- [ ] HTTPS redirect
- [ ] Cloud Firewall configured
- [ ] Only necessary ports open

### Monitoring
- [ ] Log rotation configured
- [ ] Failed login monitoring
- [ ] PM2 monitoring enabled
- [ ] Regular security audits

---

## 🔄 Regular Maintenance

### Daily
- Kiểm tra PM2 logs: `pm2 logs --lines 50`
- Kiểm tra Nginx logs: `sudo tail -50 /var/log/nginx/error.log`

### Weekly
- Review failed login attempts
- Check disk space: `df -h`
- Update packages: `sudo apt-get update && sudo apt-get upgrade`

### Monthly
- Review firewall rules
- Check SSL certificate expiry
- Audit user accounts
- Review backup integrity
- Security scan

---

## 📞 Emergency Response

### Nếu Phát Hiện Tấn Công

1. **Block IP ngay lập tức:**
```bash
sudo ufw deny from <IP_ADDRESS>
```

2. **Kiểm tra logs:**
```bash
sudo tail -100 /var/log/nginx/access.log
pm2 logs lunch-backend --lines 100
```

3. **Thay đổi passwords:**
```bash
# Database password
sudo -u postgres psql -d lunch_registration
ALTER USER lunch_user WITH PASSWORD 'new_strong_password';

# JWT secret
nano /root/lunch_req/backend/.env
# Sửa JWT_SECRET

pm2 restart lunch-backend
```

4. **Restore từ backup nếu cần:**
```bash
sudo -u postgres psql -d lunch_registration -f /root/backups/database/latest_backup.sql
```

---

**Last Updated**: November 8, 2025  
**Priority**: 🔴 HIGH - Implement ASAP
