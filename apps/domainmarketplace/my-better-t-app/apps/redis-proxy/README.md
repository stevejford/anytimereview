# Redis HTTP Proxy Service

This service exposes Railway Redis via HTTP API, allowing Cloudflare Workers to access Railway Redis without direct TCP connections.

---

## 🎯 Purpose

**Problem**: Cloudflare Workers cannot connect to Railway Redis (TCP-based).

**Solution**: This HTTP proxy service:
- Runs on Railway (has access to Railway Redis)
- Exposes Redis operations via REST API
- Cloudflare Workers call this HTTP API
- Proxy forwards requests to Railway Redis

---

## 🏗️ Architecture

```
┌──────────────────────────┐
│  Cloudflare Workers      │
│  (Redirector Service)    │
└────────────┬─────────────┘
             │ HTTP/HTTPS
             │
             ▼
┌──────────────────────────┐
│  Railway                 │
│  Redis HTTP Proxy        │
│  (This Service)          │
└────────────┬─────────────┘
             │ TCP
             │
             ▼
┌──────────────────────────┐
│  Railway Redis           │
│  (Internal Network)      │
└──────────────────────────┘
```

---

## 🚀 Deployment

### 1. Deploy to Railway

This service is automatically deployed with your Railway project.

### 2. Set Environment Variables

In Railway dashboard → redis-proxy service:

```bash
# Required
REDIS_URL=<your-railway-redis-url>

# Required - Generate a secure token
PROXY_AUTH_TOKEN=<generate-a-secure-random-token>

# Optional
PORT=8083
```

**Generate a secure token:**
```powershell
# PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

# Or use online generator
# https://www.random.org/strings/
```

### 3. Get the Service URL

After deployment:
1. Go to Railway dashboard → redis-proxy service
2. Click **Settings** → **Domains**
3. Copy the Railway-generated URL (e.g., `https://redis-proxy-production.up.railway.app`)

### 4. Configure Cloudflare Workers

Set these secrets in your Cloudflare Worker:

```bash
cd apps/redirector

# Set proxy URL
wrangler secret put REDIS_PROXY_URL
# Paste: https://redis-proxy-production.up.railway.app

# Set auth token (same as PROXY_AUTH_TOKEN in Railway)
wrangler secret put REDIS_PROXY_AUTH_TOKEN
# Paste: <your-secure-token>
```

---

## 📡 API Endpoints

### Health Check
```bash
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "service": "redis-proxy"
}
```

### GET Key
```bash
GET /redis/:key
Authorization: Bearer <token>
```

**Response:**
```json
{
  "key": "mykey",
  "value": "myvalue"
}
```

### SET Key
```bash
POST /redis/:key
Authorization: Bearer <token>
Content-Type: application/json

{
  "value": "myvalue",
  "ttl": 3600  // optional, in seconds
}
```

### DELETE Key
```bash
DELETE /redis/:key
Authorization: Bearer <token>
```

### EXISTS Key
```bash
GET /redis/:key/exists
Authorization: Bearer <token>
```

### INCR Key
```bash
POST /redis/:key/incr
Authorization: Bearer <token>
```

### Hash Operations

**HGET:**
```bash
GET /redis/:key/hash/:field
Authorization: Bearer <token>
```

**HSET:**
```bash
POST /redis/:key/hash/:field
Authorization: Bearer <token>
Content-Type: application/json

{
  "value": "fieldvalue"
}
```

**HGETALL:**
```bash
GET /redis/:key/hash
Authorization: Bearer <token>
```

---

## 🔐 Security

### Authentication

All `/redis/*` endpoints require Bearer token authentication:

```bash
Authorization: Bearer <PROXY_AUTH_TOKEN>
```

### CORS

Currently allows all origins (`*`). In production, restrict to your Worker domain:

```typescript
// In src/server.ts
app.use("*", cors({
  origin: "https://your-worker.workers.dev",
  // ...
}));
```

### Rate Limiting

Consider adding rate limiting in production:

```bash
pnpm add @hono/rate-limiter
```

---

## 🧪 Testing

### Test Locally

```bash
cd apps/redis-proxy

# Start the service
pnpm dev

# In another terminal, test endpoints
curl http://localhost:8083/health

# Test SET
curl -X POST http://localhost:8083/redis/testkey \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"value":"testvalue"}'

# Test GET
curl http://localhost:8083/redis/testkey \
  -H "Authorization: Bearer your-token"
```

### Test on Railway

```bash
# Replace with your Railway URL and token
export PROXY_URL="https://redis-proxy-production.up.railway.app"
export TOKEN="your-token"

# Health check
curl $PROXY_URL/health

# Test SET
curl -X POST $PROXY_URL/redis/testkey \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value":"testvalue"}'

# Test GET
curl $PROXY_URL/redis/testkey \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 Monitoring

### View Logs

```bash
# Railway CLI
railway logs --service redis-proxy

# Or view in Railway dashboard
```

### Metrics

Monitor in Railway dashboard:
- Request count
- Response times
- Error rates
- Memory usage

---

## 🐛 Troubleshooting

### Error: "Unauthorized"

**Cause**: Missing or incorrect auth token.

**Solution**: Ensure `Authorization: Bearer <token>` header matches `PROXY_AUTH_TOKEN`.

### Error: "Cannot connect to Redis"

**Cause**: Invalid `REDIS_URL` or Redis service not running.

**Solution**: 
1. Check `REDIS_URL` in Railway dashboard
2. Ensure Railway Redis service is running
3. Check Redis service logs

### Error: "CORS error"

**Cause**: CORS policy blocking requests.

**Solution**: Update CORS configuration in `src/server.ts` to allow your Worker domain.

---

## 💰 Cost Considerations

### Railway Pricing

- **Free tier**: 500 hours/month, $5 credit
- **Paid**: ~$5-10/month for small proxy service

### Bandwidth

- Minimal bandwidth usage (only Redis commands)
- Most requests are small (< 1KB)

### Alternative: Upstash Redis

If you prefer not to run a proxy:
- Use Upstash Redis (HTTP-native)
- Free tier: 10,000 commands/day
- Paid: $0.20 per 100k commands
- No proxy needed

---

## 🔄 Migration to Upstash (Optional)

If you want to avoid running a proxy service:

1. Create Upstash Redis account: https://upstash.com/
2. Create a database (Global region)
3. Copy REST URL
4. Update Cloudflare Worker secrets:
   ```bash
   wrangler secret put REDIS_URL
   # Paste Upstash REST URL
   ```
5. Remove `REDIS_PROXY_URL` and `REDIS_PROXY_AUTH_TOKEN`
6. Update redirector code to use Upstash SDK

---

## 📚 Related Documentation

- **Cloudflare Workers Deployment**: `apps/redirector/CLOUDFLARE_DEPLOYMENT.md`
- **Railway Deployment**: `railway/README.md`
- **Redis Package**: `packages/redis/README.md`

