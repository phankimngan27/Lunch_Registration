# Hướng Dẫn Deployment - Madison Lunch Registration System

## Thông Tin Hệ Thống

### Website
- **URL Production**: https://lunch-booking.madlab.tech
- **Server**: Ubuntu 25.10 on DigitalOcean
- **IP Address**: 178.128.92.112
- **SSH Access**: `ssh root@178.128.92.112`

### Technology Stack
- **Frontend**: React 18.2.0 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL 17
- **Web Server**: Nginx 1.28.0
- **Process Manager**: PM2
- **SSL**: Let's Encrypt (Certbot)

### Thông Tin Đăng Nhập
- **Admin Email**: ngan.phan.thi.kim@madison.dev
- **Password**: 12345

---

## Cấu Trúc Thư Mục

```
Server Structure:
/root/lunch_req/
├── backend/
│   ├── src/              # TypeScript source code
│   ├── dist/             # Compiled JavaScript
│   ├── .env              # Environment variables
│   └── package.json
├── frontend/
│   ├── src/              # React source code
│   ├── dist/             # Production build
│   ├── .env.production   # Production environment variables
│   └── package.json
└── database/
    └── setup.sql         # Database schema

/var/www/lunch-booking/   # Frontend production files (served by Nginx)
```

---

## Cấu Hình Môi Trường

### Backend (.env)
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lunch_registration
DB_USER=lunch_user
DB_PASSWORD=Madison@2024
JWT_SECRET=madison_lunch_jwt_secret_key_2024
PORT=5000
NODE_ENV=production
CORS_ORIGIN=http://localhost:3000,https://lunch-booking.madlab.tech,http://lunch-booking.madlab.tech
```

### Frontend (.env.production)
```env
VITE_API_URL=https://lunch-booking.madlab.tech/api
```

### Nginx Configuration
Location: `/etc/nginx/sites-available/lunch-booking`

```nginx
server {
    listen 80;
    server_name lunch-booking.madlab.tech;

    # Frontend - serve static files
    location / {
        root /var/www/lunch-booking;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }

    # Backend API - proxy to Node.js
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Deployment Process

### Lần Đầu Setup (Đã Hoàn Thành)

#### 1. Setup Database
```bash
# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE lunch_registration;
CREATE USER lunch_user WITH PASSWORD 'Madison@2024';
GRANT ALL PRIVILEGES ON DATABASE lunch_registration TO lunch_user;
ALTER DATABASE lunch_registration OWNER TO lunch_user;
\q

# Import data
sudo cp /root/lunch_req/lunch_registration_backup.sql /tmp/
sudo chmod 644 /tmp/lunch_registration_backup.sql
sudo -u postgres psql -d lunch_registration -f /tmp/lunch_registration_backup.sql
```

#### 2. Setup Backend
```bash
cd /root/lunch_req/backend
npm install
npm run build

# Install PM2
sudo npm install -g pm2

# Start backend
pm2 start dist/server.js --name lunch-backend
pm2 save
pm2 startup
```

#### 3. Setup Frontend
```bash
cd /root/lunch_req/frontend
npm install
npm run build

# Copy to web directory
sudo mkdir -p /var/www/lunch-booking
sudo cp -r dist/* /var/www/lunch-booking/
sudo chown -R www-data:www-data /var/www/lunch-booking
sudo chmod -R 755 /var/www/lunch-booking
```

#### 4. Setup Nginx
```bash
# Install Nginx
sudo apt-get install -y nginx

# Create config (see Nginx Configuration section above)
sudo nano /etc/nginx/sites-available/lunch-booking

# Enable site
sudo ln -s /etc/nginx/sites-available/lunch-booking /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

#### 5. Setup SSL
```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d lunch-booking.madlab.tech --non-interactive --agree-tos --email admin@madlab.tech

# Auto-renewal is configured automatically
```

---

## Deploy Code Mới

### Phương Án 1: Deploy Từ Git (Khuyên Dùng)

#### Trên Máy Local
```bash
# Commit và push code
git add .
git commit -m "Your commit message"
git push origin main
```

#### Trên Server
```bash
# SSH vào server
ssh root@178.128.92.112

# Pull code mới
cd /root/lunch_req
git pull origin main

# Deploy Backend
cd backend
npm install                    # Nếu có dependencies mới
npm run build
pm2 restart lunch-backend

# Deploy Frontend
cd ../frontend
npm install                    # Nếu có dependencies mới
npm run build
sudo rm -rf /var/www/lunch-booking/*
sudo cp -r dist/* /var/www/lunch-booking/
sudo chown -R www-data:www-data /var/www/lunch-booking
sudo chmod -R 755 /var/www/lunch-booking

# Verify
pm2 logs lunch-backend --lines 20
curl -I https://lunch-booking.madlab.tech
```

### Phương Án 2: Script Tự Động

#### Tạo Deploy Script
```bash
# Tạo file deploy.sh
cat > /root/lunch_req/deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Pull latest code
cd /root/lunch_req
git pull origin main

# Deploy Backend
echo "📦 Building backend..."
cd backend
npm install
npm run build
pm2 restart lunch-backend
echo "✅ Backend deployed"

# Deploy Frontend
echo "📦 Building frontend..."
cd ../frontend
npm install
npm run build
sudo rm -rf /var/www/lunch-booking/*
sudo cp -r dist/* /var/www/lunch-booking/
sudo chown -R www-data:www-data /var/www/lunch-booking
sudo chmod -R 755 /var/www/lunch-booking
echo "✅ Frontend deployed"

# Verify
echo "🔍 Checking status..."
pm2 status
curl -I https://lunch-booking.madlab.tech

echo "✅ Deployment completed!"
EOF

# Cho phép execute
chmod +x /root/lunch_req/deploy.sh
```

#### Sử dụng Script
```bash
# SSH vào server
ssh root@178.128.92.112

# Chạy deploy
cd /root/lunch_req
./deploy.sh
```

---

## Các Lệnh Quản Lý Hữu Ích

### Backend (PM2)
```bash
# Xem trạng thái
pm2 status

# Xem logs
pm2 logs lunch-backend
pm2 logs lunch-backend --lines 50

# Restart
pm2 restart lunch-backend

# Reload (zero-downtime)
pm2 reload lunch-backend

# Stop
pm2 stop lunch-backend

# Start
pm2 start lunch-backend

# Xem thông tin chi tiết
pm2 show lunch-backend

# Monitor
pm2 monit
```

### Nginx
```bash
# Test cấu hình
sudo nginx -t

# Restart
sudo systemctl restart nginx

# Reload (không downtime)
sudo systemctl reload nginx

# Xem status
sudo systemctl status nginx

# Xem logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Database
```bash
# Kết nối database
sudo -u postgres psql -d lunch_registration

# Backup database
sudo -u postgres pg_dump lunch_registration > backup_$(date +%Y%m%d).sql

# Restore database
sudo -u postgres psql -d lunch_registration -f backup_20251108.sql

# Xem danh sách tables
sudo -u postgres psql -d lunch_registration -c "\dt"

# Xem số lượng users
sudo -u postgres psql -d lunch_registration -c "SELECT COUNT(*) FROM users;"
```

### SSL Certificate
```bash
# Kiểm tra certificate
sudo certbot certificates

# Renew certificate (tự động)
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

### System
```bash
# Xem disk usage
df -h

# Xem memory usage
free -h

# Xem running processes
htop

# Xem logs hệ thống
journalctl -xe
```

---

## Troubleshooting

### Backend Không Chạy
```bash
# Xem logs
pm2 logs lunch-backend --lines 100

# Kiểm tra port 5000
sudo lsof -i :5000

# Restart
pm2 restart lunch-backend

# Nếu vẫn lỗi, xóa và start lại
pm2 delete lunch-backend
cd /root/lunch_req/backend
pm2 start dist/server.js --name lunch-backend
pm2 save
```

### Frontend Không Load
```bash
# Kiểm tra Nginx
sudo nginx -t
sudo systemctl status nginx

# Xem logs
sudo tail -50 /var/log/nginx/error.log

# Kiểm tra files
ls -la /var/www/lunch-booking/

# Rebuild và deploy lại
cd /root/lunch_req/frontend
npm run build
sudo rm -rf /var/www/lunch-booking/*
sudo cp -r dist/* /var/www/lunch-booking/
sudo chown -R www-data:www-data /var/www/lunch-booking
```

### Database Connection Error
```bash
# Kiểm tra PostgreSQL
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Kiểm tra connection
sudo -u postgres psql -d lunch_registration -c "SELECT 1;"

# Kiểm tra .env
cat /root/lunch_req/backend/.env | grep DB_
```

### CORS Error
```bash
# Kiểm tra CORS_ORIGIN trong .env
cat /root/lunch_req/backend/.env | grep CORS

# Nếu thiếu, thêm vào
echo "CORS_ORIGIN=http://localhost:3000,https://lunch-booking.madlab.tech,http://lunch-booking.madlab.tech" >> /root/lunch_req/backend/.env

# Restart backend
pm2 restart lunch-backend
```

### SSL Certificate Issues
```bash
# Renew certificate
sudo certbot renew --force-renewal

# Restart Nginx
sudo systemctl restart nginx
```

---

## Rollback

### Rollback Code
```bash
# Xem danh sách commits
cd /root/lunch_req
git log --oneline

# Rollback về commit cụ thể
git checkout <commit-hash>

# Deploy lại
./deploy.sh

# Hoặc quay về commit trước đó
git reset --hard HEAD~1
./deploy.sh
```

### Rollback Database
```bash
# Restore từ backup
sudo -u postgres psql -d lunch_registration -f backup_20251108.sql
```

---

## Monitoring & Maintenance

### Daily Checks
```bash
# Kiểm tra backend status
pm2 status

# Kiểm tra disk space
df -h

# Kiểm tra logs có lỗi không
pm2 logs lunch-backend --lines 50 | grep ERROR
```

### Weekly Tasks
```bash
# Backup database
sudo -u postgres pg_dump lunch_registration > /root/backups/lunch_$(date +%Y%m%d).sql

# Update system packages
sudo apt-get update
sudo apt-get upgrade -y

# Restart services
pm2 restart lunch-backend
sudo systemctl restart nginx
```

### Monthly Tasks
```bash
# Kiểm tra SSL certificate expiry
sudo certbot certificates

# Clean old logs
pm2 flush

# Clean old backups (giữ 3 tháng gần nhất)
find /root/backups/ -name "lunch_*.sql" -mtime +90 -delete
```

---

## Security Best Practices

1. **Không commit file .env vào Git**
2. **Thay đổi password database định kỳ**
3. **Update dependencies thường xuyên**: `npm audit fix`
4. **Giữ SSL certificate luôn valid**
5. **Backup database thường xuyên**
6. **Monitor logs để phát hiện lỗi sớm**
7. **Sử dụng SSH key thay vì password**

---

## Support & Contact

- **Developer**: Madison Technologies Team
- **Documentation**: https://github.com/your-repo/lunch-registration
- **Issues**: Report via GitHub Issues

---

**Last Updated**: November 8, 2025
**Version**: 1.0.0
