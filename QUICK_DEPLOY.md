# Talent Manager - Quick Deployment Guide

This guide provides a quick reference for deploying Talent Manager on your VPS.

---

## Prerequisites

- VPS with Ubuntu 20.04+ or similar Linux distribution
- Domain: adooxc.com (configured in GoDaddy)
- SSH access to your VPS
- Basic Linux command knowledge

---

## Step 1: Initial VPS Setup (5 minutes)

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Nginx
sudo apt-get install -y nginx

# Install Git
sudo apt-get install -y git

# Install Certbot for SSL
sudo apt-get install -y certbot python3-certbot-nginx
```

---

## Step 2: Clone and Setup Application (5 minutes)

```bash
# Clone repository
cd /home/ubuntu
git clone https://github.com/yourusername/talent-manager.git
cd talent-manager

# Install dependencies
npm install

# Create .env file
cp DEPLOYMENT_CONFIG.md .env

# Edit .env with your values
nano .env
# Required values:
# - NODE_ENV=production
# - JWT_SECRET=generate-random-string
# - DATABASE_URL=postgresql://user:pass@localhost/talent_manager
# - DB_PASSWORD=your-strong-password
```

---

## Step 3: Setup Database (5 minutes)

```bash
# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Create database and user
sudo -u postgres createdb talent_manager
sudo -u postgres createuser talent_manager_user
sudo -u postgres psql -c "ALTER USER talent_manager_user WITH PASSWORD 'your-password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE talent_manager TO talent_manager_user;"

# Run migrations
npm run db:push
```

---

## Step 4: Build Application (10 minutes)

```bash
# Build the application
npm run build

# Verify build
ls -la dist/
```

---

## Step 5: Setup SSL Certificate (5 minutes)

```bash
# Generate SSL certificate for all subdomains
sudo certbot certonly --standalone \
  -d adooxc.com \
  -d www.adooxc.com \
  -d app.adooxc.com \
  -d api.adooxc.com \
  -d admin.adooxc.com \
  -d files.adooxc.com

# Verify certificate
sudo certbot certificates
```

---

## Step 6: Configure Nginx (5 minutes)

```bash
# Copy nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/talent-manager

# Enable site
sudo ln -s /etc/nginx/sites-available/talent-manager /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## Step 7: Configure DNS (GoDaddy) (5 minutes)

Go to GoDaddy DNS settings and add these records:

| Type | Name | Value |
|------|------|-------|
| A | @ | your-vps-ip |
| A | www | your-vps-ip |
| A | app | your-vps-ip |
| A | api | your-vps-ip |
| A | admin | your-vps-ip |
| A | files | your-vps-ip |

Or use CNAME records:
```
app.adooxc.com CNAME adooxc.com
api.adooxc.com CNAME adooxc.com
admin.adooxc.com CNAME adooxc.com
files.adooxc.com CNAME adooxc.com
```

---

## Step 8: Start Application (5 minutes)

### Option A: Using PM2 (Recommended)

```bash
# Install PM2
sudo npm install -g pm2

# Start application
cd /home/ubuntu/talent-manager
pm2 start dist/index.js --name "talent-manager"

# Setup auto-restart on reboot
pm2 startup
pm2 save

# View logs
pm2 logs talent-manager
```

### Option B: Using Docker Compose

```bash
# Create .env file with database password
echo "DB_PASSWORD=your-strong-password" > .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app
```

---

## Step 9: Verify Deployment (5 minutes)

```bash
# Check application health
curl https://app.adooxc.com/health

# Check API health
curl https://api.adooxc.com/health

# Check Nginx status
sudo systemctl status nginx

# Check PM2 status (if using PM2)
pm2 status

# Check Docker status (if using Docker)
docker-compose ps
```

---

## Step 10: Setup Monitoring & Backups (10 minutes)

```bash
# Create backup script
cat > /home/ubuntu/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/talent-manager"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)

# Backup database
pg_dump -U talent_manager_user talent_manager > $BACKUP_DIR/db_$DATE.sql

# Backup storage files
tar -czf $BACKUP_DIR/storage_$DATE.tar.gz /app/storage

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /home/ubuntu/backup.sh

# Schedule daily backup at 2 AM
sudo crontab -e
# Add line: 0 2 * * * /home/ubuntu/backup.sh
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
cat .env | grep -v "^#"
```

### Database connection error
```bash
# Test PostgreSQL connection
psql -U talent_manager_user -d talent_manager -h localhost

# Check PostgreSQL status
sudo systemctl status postgresql
```

### SSL certificate issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew --dry-run

# Restart Nginx
sudo systemctl restart nginx
```

### Nginx not routing correctly
```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

---

## Post-Deployment Checklist

- ✅ Application running and accessible
- ✅ All subdomains resolving correctly
- ✅ SSL certificates valid
- ✅ Database connected and working
- ✅ File uploads working
- ✅ Backups scheduled
- ✅ Monitoring setup
- ✅ Logs being collected

---

## Useful Commands

```bash
# View application logs
pm2 logs talent-manager

# Restart application
pm2 restart talent-manager

# Stop application
pm2 stop talent-manager

# Start application
pm2 start talent-manager

# View system resources
pm2 monit

# Update application
cd /home/ubuntu/talent-manager
git pull
npm install
npm run build
pm2 restart talent-manager
```

---

## Support

For issues or questions, refer to:
1. DEPLOYMENT_CONFIG.md - Detailed configuration guide
2. Application logs - Check PM2 or Docker logs
3. Nginx logs - /var/log/nginx/error.log
4. PostgreSQL logs - Check system logs

---

**Estimated Total Time:** ~60 minutes

**Version:** 1.0  
**Last Updated:** January 8, 2026
