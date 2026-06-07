# AWS Deployment Guide - Frontend (S3 + CloudFront)

## Overview
Frontend will be deployed as static files on S3 with CloudFront CDN for optimal performance and security.

## Architecture
```
S3 Bucket (Static Files) -> CloudFront CDN -> Users
                         |
                         v
                EC2 Backend (API + WebSocket)
```

## Deployment Steps

### 1. Create S3 Bucket
```bash
aws s3 mb s3://your-frontend-bucket-name
aws s3api put-public-access-block \
    --bucket your-frontend-bucket-name \
    --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
```

### 2. Build and Deploy Frontend
```bash
# Build frontend
cd frontend
npm run build

# Deploy to S3
aws s3 sync dist/ s3://your-frontend-bucket-name --delete
```

### 3. Create CloudFront Distribution
```bash
# Create OAI (Origin Access Identity)
aws cloudfront create-cloud-front-origin-access-identity --cloud-front-origin-access-identity-config "CallerReference=frontend-oai-$(date +%s)"

# Update S3 bucket policy for OAI
aws s3api put-bucket-policy --bucket your-frontend-bucket-name --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity YOUR-OAI-ID"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-frontend-bucket-name/*"
    }
  ]
}'
```

### 4. CloudFront Configuration
Create distribution with:
- **Origin**: S3 bucket with OAI
- **Viewer Protocol Policy**: Redirect HTTP to HTTPS
- **Allowed HTTP Methods**: GET, HEAD, OPTIONS
- **Cache Policy**: Managed-CachingOptimized
- **Origin Request Policy**: CORS-S3Origin

### 5. Custom Headers for CloudFront
Add these custom headers to CloudFront origin:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, HEAD, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### 6. API Integration
Update frontend environment variables:
```javascript
// In frontend/.env.production
VITE_API_URL=https://your-ec2-domain.com:5000
VITE_WS_URL=wss://your-ec2-domain.com:5000
```

## Security Configuration

### S3 Bucket Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity YOUR-OAI-ID"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-frontend-bucket-name/*"
    }
  ]
}
```

### CloudFront Behaviors
- **Default**: Cache static assets (JS, CSS, images)
- **Path Pattern**: `*.html` - No cache for HTML files
- **Path Pattern**: `/api/*` - Forward to EC2 backend

## Performance Optimization

### Cache Headers
- **Static assets**: 1 year cache
- **HTML files**: No cache
- **API responses**: Handled by backend

### Compression
- Gzip enabled in nginx.conf
- CloudFront automatic compression

## Monitoring

### CloudFront Metrics
- Requests per second
- Cache hit ratio
- Error rates
- Latency

### S3 Metrics
- Storage usage
- Request count
- Error rates

## Deployment Script
```bash
#!/bin/bash
# deploy-frontend.sh

set -e

BUCKET_NAME="your-frontend-bucket-name"
CLOUDFRONT_ID="YOUR_CLOUDFRONT_ID"

echo "Building frontend..."
cd frontend
npm run build

echo "Uploading to S3..."
aws s3 sync dist/ s3://$BUCKET_NAME --delete --exclude "*.html" --include "*.html" --no-cache-control

echo "Uploading HTML files with no-cache..."
aws s3 sync dist/ s3://$BUCKET_NAME --delete --include "*.html" --cache-control "no-cache, no-store, must-revalidate"

echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_ID --paths "/*"

echo "Deployment completed!"
```

## WebSocket Configuration
For WebSocket connections through CloudFront:
1. Enable WebSocket support in CloudFront distribution
2. Configure origin protocol policy: HTTPS Only
3. Set connection timeout to 30 seconds
4. Use WSS protocol in frontend

## Environment Variables
```bash
# Production
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com
VITE_ENVIRONMENT=production

# Development
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000
VITE_ENVIRONMENT=development
```

## Troubleshooting

### Common Issues
1. **CORS errors**: Check CloudFront origin headers
2. **WebSocket not connecting**: Verify WSS URL and CloudFront WebSocket support
3. **404 errors**: Check S3 bucket contents and CloudFront cache
4. **Old content**: Clear CloudFront cache

### Debug Commands
```bash
# Check S3 bucket contents
aws s3 ls s3://your-frontend-bucket-name --recursive

# Check CloudFront distribution status
aws cloudfront get-distribution --id YOUR_DISTRIBUTION_ID

# Invalidate cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/index.html"
```
