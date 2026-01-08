# Talent Manager - Deployment Configuration Guide

This guide explains how to configure and deploy the Talent Manager application on your VPS.

---

## Environment Variables

Create a `.env` file in the root directory with the following configuration:

### Server Configuration
```
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
```

### Application Settings
```
APP_NAME=Talent Manager
APP_SLUG=talent_manager
APP_URL=https://app.adooxc.com
API_URL=https://api.adooxc.com
```

### Security Keys (Generate New Ones!)
```
JWT_SECRET=generate-a-random-string-here
ENCRYPTION_KEY=generate-another-random-string
SESSION_SECRET=generate-another-random-string
```

### Database Configuration

**For SQLite (Development):**
```
DATABASE_URL=file:./prisma/dev.db
```

**For PostgreSQL (Production - Recommended):**
```
DATABASE_URL=postgresql://username:password@localhost:5432/talent_manager
```

### File Storage
```
FILE_STORAGE_PATH=/app/storage
```

### CORS Configuration
```
CORS_ORIGIN=https://app.adooxc.com,https://admin.adooxc.com
```

---

## Docker Deployment

### Build Docker Image
```bash
docker build -t talent-manager:latest .
```

### Run Container
```bash
docker run -d \
  --name talent-manager \
  -p 3000:3000 \
  --env-file .env \
  -v /app/storage:/app/storage \
  talent-manager:latest
```

### Docker Compose (Recommended)
See `docker-compose.yml` for full stack deployment with database.

---

## Subdomain Configuration

### DNS Records (GoDaddy)

Add these DNS records in your GoDaddy account:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | app | your-vps-ip or hostname | 3600 |
| CNAME | api | your-vps-ip or hostname | 3600 |
| CNAME | admin | your-vps-ip or hostname | 3600 |
| CNAME | files | your-vps-ip or hostname | 3600 |

Or use A records if you have a static IP:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | app | your-vps-ip | 3600 |
| A | api | your-vps-ip | 3600 |
| A | admin | your-vps-ip | 3600 |
| A | files | your-vps-ip | 3600 |

---

## Nginx Configuration

See `nginx.conf` for complete nginx setup that handles:
- Subdomain routing
- SSL/HTTPS
- Reverse proxy to Node.js app
- Static file serving
- Compression

### Quick Setup
```bash
# Copy nginx config
sudo cp nginx.conf /etc/nginx/sites-available/talent-manager

# Enable site
sudo ln -s /etc/nginx/sites-available/talent-manager /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

---

## SSL/HTTPS Setup

### Using Let's Encrypt (Free)

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --nginx -d app.adooxc.com -d api.adooxc.com -d admin.adooxc.com -d files.adooxc.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

## Database Setup

### PostgreSQL Installation
```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb talent_manager

# Create user
sudo -u postgres createuser talent_manager_user
sudo -u postgres psql -c "ALTER USER talent_manager_user WITH PASSWORD 'strong-password';"

# Grant privileges
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE talent_manager TO talent_manager_user;"
```

### Run Migrations
```bash
npm run db:push
```

---

## Deployment Steps

### 1. Prepare VPS
```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker (optional but recommended)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Nginx
sudo apt-get install -y nginx
```

### 2. Clone Repository
```bash
cd /home/ubuntu
git clone https://github.com/yourusername/talent-manager.git
cd talent-manager
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment
```bash
cp DEPLOYMENT_CONFIG.md .env
# Edit .env with your values
nano .env
```

### 5. Build Application
```bash
npm run build
```

### 6. Setup Database
```bash
npm run db:push
```

### 7. Start Application

**Option A: Direct Node.js**
```bash
npm start
```

**Option B: Using PM2 (Recommended)**
```bash
npm install -g pm2
pm2 start dist/index.js --name "talent-manager"
pm2 startup
pm2 save
```

**Option C: Using Docker**
```bash
docker-compose up -d
```

### 8. Configure Nginx
```bash
sudo cp nginx.conf /etc/nginx/sites-available/talent-manager
sudo ln -s /etc/nginx/sites-available/talent-manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 9. Setup SSL Certificate
```bash
sudo certbot certonly --nginx -d app.adooxc.com -d api.adooxc.com -d admin.adooxc.com
```

### 10. Verify Deployment
```bash
# Check application health
curl https://app.adooxc.com/health

# Check API
curl https://api.adooxc.com/health

# Check logs
pm2 logs talent-manager
```

---

## Monitoring & Maintenance

### Check Application Status
```bash
# Using PM2
pm2 status

# Using Docker
docker ps
```

### View Logs
```bash
# PM2 logs
pm2 logs talent-manager

# Docker logs
docker logs talent-manager

# Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Backup Database
```bash
# PostgreSQL backup
pg_dump -U talent_manager_user talent_manager > backup.sql

# Restore
psql -U talent_manager_user talent_manager < backup.sql
```

### Update Application
```bash
# Pull latest code
git pull

# Install dependencies
npm install

# Build
npm run build

# Restart
pm2 restart talent-manager
```

---

## Troubleshooting

### Application won't start
```bash
# Check logs
pm2 logs talent-manager

# Check port availability
sudo lsof -i :3000

# Check environment variables
cat .env
```

### Database connection error
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -U talent_manager_user -d talent_manager -h localhost
```

### SSL certificate issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew --dry-run
```

### Nginx issues
```bash
# Test configuration
sudo nginx -t

# Check logs
sudo tail -f /var/log/nginx/error.log

# Restart nginx
sudo systemctl restart nginx
```

---

## Performance Optimization

### Enable Compression
Already configured in nginx.conf

### Database Optimization
```bash
# Create indexes
npm run db:push

# Analyze query performance
EXPLAIN ANALYZE SELECT * FROM talents;
```

### Caching
- Browser caching configured in nginx.conf
- Redis caching can be added for frequently accessed data

### Load Balancing
For high traffic, consider:
- Multiple Node.js instances with PM2 cluster mode
- Nginx load balancing
- CDN for static assets

---

## Security Checklist

- ✅ Change all default passwords
- ✅ Generate new JWT_SECRET
- ✅ Enable SSL/HTTPS
- ✅ Configure firewall rules
- ✅ Setup regular backups
- ✅ Enable database encryption
- ✅ Setup monitoring and alerts
- ✅ Regular security updates
- ✅ Setup rate limiting
- ✅ Configure CORS properly

---

## Support & Documentation

For issues or questions:
1. Check application logs
2. Review this deployment guide
3. Check nginx configuration
4. Verify environment variables
5. Test database connection

---

**Last Updated:** January 8, 2026  
**Version:** 1.0
