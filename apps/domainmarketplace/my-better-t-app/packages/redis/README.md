# @my-better-t-app/redis

Redis-backed replacements for Cloudflare Durable Objects for Railway deployment.

## Overview

This package provides Redis-backed implementations of the RouteCoordinator and ClickDeduplicator services, replacing Cloudflare Durable Objects for Railway deployment. The services maintain the same API interfaces as the original Durable Objects while using Redis for state management.

## Installation

Add as a dependency in other workspace packages:

```json
{
  "dependencies": {
    "@my-better-t-app/redis": "workspace:*"
  }
}
```

## Usage

### RouteCoordinatorService

Manages route synchronization between PostgreSQL and Redis cache.

```typescript
import { createRedisClient, RouteCoordinatorService } from "@my-better-t-app/redis";

// Create Redis client
const redisClient = await createRedisClient(process.env.REDIS_URL);

// Create coordinator service
const coordinator = new RouteCoordinatorService(
  redisClient,
  process.env.DATABASE_URL
);

// Sync a route
await coordinator.syncRoute(routeId, previous);

// Sync all routes for a hire
await coordinator.syncAllRoutes(hireId);

// Invalidate a route
await coordinator.invalidateRoute(host, path, hireId, routeId);
```

### ClickDeduplicatorService

Provides click deduplication with a 30-minute window.

```typescript
import { createRedisClient, ClickDeduplicatorService } from "@my-better-t-app/redis";

// Create Redis client
const redisClient = await createRedisClient(process.env.REDIS_URL);

// Create deduplicator service
const deduplicator = new ClickDeduplicatorService(redisClient);

// Check if click is duplicate
const isDuplicate = await deduplicator.checkDuplicate(routeId, ip, userAgent);

if (isDuplicate) {
  console.log("Duplicate click detected");
} else {
  console.log("New click");
}
```

## RouteCoordinatorService

### Methods

#### `syncRoute(routeId: string, previous?: {host: string; path: string; hireId: string}): Promise<void>`

Synchronizes a route from PostgreSQL to Redis cache.

**Parameters:**
- `routeId` - Route ID to sync
- `previous` - Optional previous route data for invalidation

**Redis Keys:**
- `route:meta:{routeId}` - Route metadata (hash)
- `{normalizedHost}:{normalizedPath}` - Route data (string, JSON)

#### `syncAllRoutes(hireId: string): Promise<void>`

Synchronizes all routes for a hire from PostgreSQL to Redis.

**Parameters:**
- `hireId` - Hire ID

#### `invalidateRoute(host: string, path: string, hireId: string, routeId?: string): Promise<void>`

Invalidates a route in Redis cache.

**Parameters:**
- `host` - Route host
- `path` - Route path
- `hireId` - Hire ID
- `routeId` - Optional route ID

## ClickDeduplicatorService

### Methods

#### `checkDuplicate(routeId: string, ip: string, userAgent: string): Promise<boolean>`

Checks if a click is a duplicate within the 30-minute deduplication window.

**Parameters:**
- `routeId` - Route ID
- `ip` - Client IP address
- `userAgent` - Client user agent string

**Returns:**
- `true` - Duplicate click (within 30-minute window)
- `false` - New click (not a duplicate)

**Deduplication Window:** 30 minutes

**Fingerprinting Strategy:** IP address + User Agent (case-insensitive)

**Redis Key Pattern:** `dedup:{routeId}:{fingerprint}`

**Fail-Open Strategy:** If Redis operation fails, returns `false` (not duplicate) to avoid blocking legitimate traffic.

## Redis Connection

### Environment Variables

**Required:**
- `REDIS_URL` - Redis connection string

**Format:**
```
redis://[username][:password]@host:port[/database]
```

**Railway Internal URL:**
```
redis://default:password@redis.railway.internal:6379
```

### Connection Management

The `createRedisClient` function handles:
- Connection establishment
- Error handling
- Reconnection strategy (exponential backoff)
- Event logging

**Reconnection Strategy:**
- Initial delay: 50ms
- Max delay: 5000ms
- Max retries: 3
- Exponential backoff: 50ms, 100ms, 200ms, 400ms, 800ms, ...

### Error Handling

Both services implement error handling:
- **RouteCoordinatorService**: Logs errors and throws (operations are wrapped in `waitUntil`)
- **ClickDeduplicatorService**: Logs errors and returns `false` (fail-open strategy)

## Migration from Durable Objects

### Feature Comparison

| Durable Object Feature | Redis Equivalent |
|------------------------|------------------|
| `state.storage.put()` | `redis.set()` / `redis.hSet()` |
| `state.storage.get()` | `redis.get()` / `redis.hGetAll()` |
| `state.storage.delete()` | `redis.del()` |
| `state.storage.list()` | Not needed (TTL handles cleanup) |
| `state.storage.setAlarm()` | `redis.set(..., {EX: ttl})` (TTL) |
| `alarm()` method | Not needed (Redis TTL auto-expires) |
| `fetch()` RPC | Direct method calls |
| `idFromName('global')` | Singleton service instance |

### Key Differences

1. **State Management:**
   - Durable Objects: In-memory state with persistent storage
   - Redis: Direct key-value storage

2. **Cleanup:**
   - Durable Objects: Alarm-based cleanup
   - Redis: Automatic TTL expiration

3. **API:**
   - Durable Objects: RPC via `fetch()` or stub methods
   - Redis: Direct method calls

4. **Deployment:**
   - Durable Objects: Cloudflare-specific
   - Redis: Railway-compatible, standard infrastructure

## Key Formats

### RouteCoordinator

**Route Metadata:**
```
Key: route:meta:{routeId}
Type: Hash
Fields: {host, path, hireId}
```

**Route Data (KV-compatible):**
```
Key: {normalizedHost}:{normalizedPath}
Type: String (JSON)
Value: {targetUrl, redirectCode, hireId, routeId}
```

**Example:**
```
Key: example.com:/products
Value: {"targetUrl":"https://target.com","redirectCode":301,"hireId":"hire_123","routeId":"route_456"}
```

### ClickDeduplicator

**Deduplication Key:**
```
Key: dedup:{routeId}:{fingerprint}
Type: String
Value: "1"
TTL: 1800 seconds (30 minutes)
```

**Fingerprint Format:**
```
{ip.toLowerCase()}::{userAgent.toLowerCase()}
```

**Example:**
```
Key: dedup:route_456:192.168.1.1::mozilla/5.0
Value: "1"
TTL: 1800
```

## Testing

### Local Testing with Redis

**Start Redis with Docker:**
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

**Connection String:**
```
redis://localhost:6379
```

**Test Connection:**
```typescript
import { createRedisClient } from "@my-better-t-app/redis";

const client = await createRedisClient("redis://localhost:6379");
await client.ping(); // Should return "PONG"
await client.quit();
```

### Testing RouteCoordinator

```typescript
import { createRedisClient, RouteCoordinatorService } from "@my-better-t-app/redis";

const redisClient = await createRedisClient("redis://localhost:6379");
const coordinator = new RouteCoordinatorService(
  redisClient,
  process.env.DATABASE_URL
);

// Test sync
await coordinator.syncRoute("route_123");

// Verify in Redis
const routeData = await redisClient.get("example.com:/");
console.log(JSON.parse(routeData));

await redisClient.quit();
```

### Testing ClickDeduplicator

```typescript
import { createRedisClient, ClickDeduplicatorService } from "@my-better-t-app/redis";

const redisClient = await createRedisClient("redis://localhost:6379");
const deduplicator = new ClickDeduplicatorService(redisClient);

// First click - should be false (not duplicate)
const first = await deduplicator.checkDuplicate("route_123", "192.168.1.1", "Mozilla/5.0");
console.log(first); // false

// Second click - should be true (duplicate)
const second = await deduplicator.checkDuplicate("route_123", "192.168.1.1", "Mozilla/5.0");
console.log(second); // true

await redisClient.quit();
```

## License

MIT

