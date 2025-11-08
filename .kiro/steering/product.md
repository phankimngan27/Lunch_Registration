# Product Overview

**Madison Lunch Registration System** - Internal lunch meal registration management system for Madison Technologies.

## Production Environment
- **URL**: https://lunch-booking.madlab.tech
- **Server**: Ubuntu 25.10 on DigitalOcean (IP: 178.128.92.112)
- **Database**: PostgreSQL 17
- **Web Server**: Nginx 1.28.0 with Let's Encrypt SSL

## Purpose
Web application for employees to register for daily lunch meals with admin oversight and reporting capabilities.

## Core Features

**For Employees:**
- Register for lunch using calendar interface (supports lunar calendar display)
- View personal registration history
- Cancel registrations within allowed timeframe
- Personal dashboard with statistics

**For Admins:**
- Employee management (CRUD operations)
- Statistics by day/month/department/project
- Excel export with detailed formatting
- Configure registration settings and meal pricing
- Bulk import employees from CSV

## User Roles
- **User**: Regular employees who register for meals
- **Admin**: Full system access including user management and reporting

## Default Credentials
- **Production Admin**: `ngan.phan.thi.kim@madison.dev` / `12345`
- **Development Super Admin**: `admin@madison.dev` / `admin1234`
- **Development Sample User**: `ngan.phan.thi.kim@madison.dev` / `1234`

## Language
Primary language is Vietnamese for UI and documentation.
