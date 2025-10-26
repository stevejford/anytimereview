# Redirector Edge Function

Vercel Edge Function for handling custom domain redirects with global edge deployment.

## Overview

The redirector Edge Function handles HTTP redirects from custom domains to target URLs. It runs on Vercel's Edge Runtime, providing low-latency redirects from a global network of edge locations.

## Architecture

### Runtime
- **Platform**: Vercel Edge Runtime
- **Deployment**: Global edge network (300+ locations)
- **Execution**: V8 isolates (not Node.js)

### Dependencies
- **Redis**: Upstash Redis (HTTP/REST API)
- **Database**: Neon PostgreSQL (for analytics)
- **App**: `@my-better-t-app/redirector-app` package

### Data Flow

```
Custom Domain Request
  ↓
Edge Function (Global)
  ↓
Upstash Redis (Route Lookup)
  ↓
Neon PostgreSQL (Click Analytics)
  ↓
HTTP 302 Redirect
```

## Features

- **Global Edge Deployment**: Runs in 300+ edge locations worldwide
- **Low Latency**: < 50ms average response time
- **Route Caching**: Redis-backed route lookup
- **Click Analytics**: Tracks clicks, referrers, geo data
- **Bot Detection**: Classifies and filters bot traffic
- **Click Deduplication**: Prevents duplicate click tracking

## Environment Variables

### Required

```bash
# Neon PostgreSQL (auto-injected by Vercel integration)
DATABASE_URL=postgresql://user:pass@host/db

# Upstash Redis (auto-injected by Vercel integration)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

### Optional

```bash
# Verified bot allowlist (comma-separated user agents)
VERIFIED_BOT_ALLOWLIST=Googlebot,Bingbot
```

## Deployment

### Prerequisites

1. Build the redirector app package:
   ```bash
   cd apps/domainmarketplace/redirector
   pnpm build
   ```

2. Ensure environment variables are configured in Vercel Dashboard

### Deploy to Vercel

```bash
cd apps/domainmarketplace/redirector-edge
vercel --prod
```

### Verify Deployment

```bash
# Test redirect endpoint
curl -I https://your-redirector.vercel.app/api/redirect

# Expected: 302 redirect or 404 if no route configured
```

## Custom Domains

### Configure Wildcard Domain

1. Go to Vercel Dashboard → Redirector Project → Settings → Domains
2. Add wildcard domain: `*.yourdomain.com`
3. Configure DNS in Cloudflare:
   - Type: `CNAME`
   - Name: `*`
   - Value: `cname.vercel-dns.com`

### Test Custom Domain

```bash
curl -I https://custom.yourdomain.com

# Expected: 302 redirect to target URL
```

## Local Development

### Start Dev Server

```bash
vercel dev
```

### Test Locally

```bash
# Test redirect
curl -I http://localhost:3000/api/redirect

# Test with custom host header
curl -I -H "Host: test.local" http://localhost:3000/api/redirect
```

## Edge Runtime Limitations

### Not Available

- Node.js APIs (`fs`, `child_process`, `net`, etc.)
- Native modules
- Dynamic `require()`
- Synchronous I/O

### Available

- Fetch API
- Web Crypto API
- Web Streams API
- URL API
- TextEncoder/TextDecoder

### Limits

- **Response Size**: 4MB maximum
- **Execution Time**: 30 seconds maximum
- **Memory**: Limited by V8 isolate

## Performance

### Response Time Targets

| Metric | Target | Acceptable |
|--------|--------|------------|
| Cache Hit | < 30ms | < 50ms |
| Cache Miss | < 100ms | < 200ms |
| Global Average | < 50ms | < 100ms |

### Optimization Strategies

1. **Redis Caching**: Route data cached in Upstash Redis
2. **Edge Deployment**: Runs close to users globally
3. **Minimal Dependencies**: Lightweight bundle size
4. **Async Analytics**: Click tracking doesn't block redirect

## Monitoring

### Vercel Dashboard

- **Logs**: Real-time edge function logs
- **Analytics**: Response times, error rates
- **Metrics**: Invocations, bandwidth, errors

### Upstash Dashboard

- **Redis Metrics**: Hit rate, latency, throughput
- **Usage**: Commands per second, bandwidth

### Neon Dashboard

- **Database Metrics**: Query performance, connections
- **Analytics**: Click data, geographic distribution

## Troubleshooting

### Common Issues

**Issue**: 404 Not Found
**Cause**: No route configured for domain
**Solution**: Create route in database via API

**Issue**: 500 Internal Server Error
**Cause**: Redis or database connection failure
**Solution**: Verify environment variables and integration status

**Issue**: Slow response times
**Cause**: Redis cache miss or database query slow
**Solution**: Check Redis hit rate and database query performance

**Issue**: Edge function timeout
**Cause**: Long-running database query or network issue
**Solution**: Optimize queries, check network connectivity

### Debug Logs

```bash
# View real-time logs
vercel logs --follow

# View logs for specific deployment
vercel logs <deployment-url>

# Filter by error level
vercel logs --follow | grep ERROR
```

## Click Analytics

### Data Collected

- **Timestamp**: Click time (UTC)
- **Host**: Custom domain
- **Path**: Request path
- **Route ID**: Matched route
- **Hire ID**: Associated hire
- **Country**: Geographic location
- **ASN**: Autonomous System Number
- **Bot Bucket**: Bot classification
- **Referrer**: HTTP referrer
- **Is Invalid**: Invalid click flag

### Bot Classification

- **human**: Regular user traffic
- **verified**: Verified bots (Google, Bing, etc.)
- **suspected**: Suspected bot traffic
- **invalid**: Invalid/malicious traffic

### Click Deduplication

Prevents duplicate clicks using Redis:
- **Key**: `click:{routeId}:{ip}:{userAgent}`
- **TTL**: 24 hours
- **Algorithm**: SHA-256 hash

## API Reference

### Redirect Endpoint

```
GET /api/redirect
Host: custom.yourdomain.com
```

**Response**:
```
HTTP/1.1 302 Found
Location: https://target.com
```

**Headers**:
- `Location`: Target URL
- `Cache-Control`: `public, max-age=300`

## Security

### Bot Protection

- User agent classification
- IP-based deduplication
- Verified bot allowlist
- Invalid traffic filtering

### Data Privacy

- No PII collected
- IP addresses hashed for deduplication
- Analytics data aggregated
- GDPR compliant

## Scaling

### Automatic Scaling

- Vercel automatically scales edge functions
- No configuration required
- Handles traffic spikes seamlessly

### Cost Optimization

- Edge functions billed per invocation
- Upstash Redis billed per command
- Neon PostgreSQL billed per compute time

## Best Practices

1. **Cache Routes**: Keep route data in Redis for fast lookups
2. **Async Analytics**: Don't block redirects for analytics
3. **Monitor Performance**: Track response times and error rates
4. **Optimize Queries**: Use indexes for database queries
5. **Handle Errors**: Gracefully handle Redis/database failures

## Related Documentation

- [Vercel Edge Runtime](https://vercel.com/docs/functions/edge-functions)
- [Upstash Redis](https://upstash.com/docs/redis)
- [Neon PostgreSQL](https://neon.tech/docs)
- [VERCEL_DEPLOYMENT_GUIDE.md](../VERCEL_DEPLOYMENT_GUIDE.md)
- [VERCEL_TESTING_GUIDE.md](../VERCEL_TESTING_GUIDE.md)

## Support

For issues or questions:
1. Check Vercel logs for errors
2. Verify environment variables
3. Test locally with `vercel dev`
4. Review Upstash and Neon dashboards
5. Consult deployment and testing guides

