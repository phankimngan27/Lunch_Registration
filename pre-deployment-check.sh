#!/bin/bash

# Pre-Deployment Safety Check Script
# Chạy script này TRƯỚC KHI deploy để đảm bảo mọi thứ sẵn sàng

echo "=================================="
echo "PRE-DEPLOYMENT SAFETY CHECK"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to check command
check_command() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1"
        ((ERRORS++))
    fi
}

# Function to warn
warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

echo "1. Checking Database Connection..."
sudo -u postgres psql lunch_registration -c "SELECT 1;" > /dev/null 2>&1
check_command "Database connection OK"

echo ""
echo "2. Checking Current Data..."
TOTAL_REGISTRATIONS=$(sudo -u postgres psql lunch_registration -t -c "SELECT COUNT(*) FROM registrations;")
echo "   Total registrations: $TOTAL_REGISTRATIONS"

INVALID_COUNT=$(sudo -u postgres psql lunch_registration -t -c "SELECT COUNT(*) FROM registrations WHERE vegetarian_date IS NOT NULL AND vegetarian_date NOT IN (1, 14, 15);")
echo "   Invalid vegetarian dates: $INVALID_COUNT"

if [ "$INVALID_COUNT" -gt 0 ]; then
    warn "Found $INVALID_COUNT invalid vegetarian date records (will be cleaned)"
fi

echo ""
echo "3. Checking Backup Directory..."
if [ -d "/root/backups" ]; then
    check_command "Backup directory exists"
    LATEST_BACKUP=$(ls -t /root/backups/ | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
        echo "   Latest backup: $LATEST_BACKUP"
    fi
else
    echo -e "${RED}✗${NC} Backup directory not found"
    ((ERRORS++))
fi

echo ""
echo "4. Checking PM2 Status..."
pm2 status lunch-backend > /dev/null 2>&1
check_command "PM2 process running"

echo ""
echo "5. Checking Nginx Status..."
sudo systemctl is-active nginx > /dev/null 2>&1
check_command "Nginx is active"

echo ""
echo "6. Checking Disk Space..."
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
echo "   Disk usage: ${DISK_USAGE}%"
if [ "$DISK_USAGE" -gt 80 ]; then
    warn "Disk usage is high (${DISK_USAGE}%)"
fi

echo ""
echo "7. Checking Git Repository..."
cd /var/www/lunch-booking
git status > /dev/null 2>&1
check_command "Git repository OK"

CURRENT_COMMIT=$(git rev-parse --short HEAD)
echo "   Current commit: $CURRENT_COMMIT"

echo ""
echo "=================================="
echo "SUMMARY"
echo "=================================="
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "You can proceed with deployment."
    echo "Follow the steps in PRODUCTION_DEPLOYMENT_GUIDE.md"
else
    echo -e "${RED}✗ Found $ERRORS error(s)${NC}"
    echo ""
    echo "Please fix the errors before deploying."
    exit 1
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠ Found $WARNINGS warning(s)${NC}"
    echo "Review warnings before proceeding."
fi

echo ""
echo "=================================="
echo "NEXT STEPS:"
echo "=================================="
echo "1. Create backup: See PRODUCTION_DEPLOYMENT_GUIDE.md Section 1"
echo "2. Review invalid data: See Section 2"
echo "3. Deploy code: See Section 3-5"
echo "4. Test thoroughly: See Section 6"
echo ""
