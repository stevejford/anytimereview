/**
 * Redis HTTP Proxy Server
 * 
 * Exposes Railway Redis via HTTP API for Cloudflare Workers access.
 * This allows Workers to use Railway Redis without direct TCP connections.
 */
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createRedisClient, type RedisClient } from "@my-better-t-app/redis";
import "dotenv/config";

const app = new Hono();

// Redis client singleton
let redisClient: RedisClient | null = null;

async function getRedisClient(): Promise<RedisClient> {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error("REDIS_URL environment variable is required");
    }
    redisClient = await createRedisClient(redisUrl);
  }
  return redisClient;
}

// CORS middleware - restrict to your Cloudflare Worker
app.use("*", cors({
  origin: "*", // In production, restrict to your Worker domain
  allowMethods: ["GET", "POST", "PUT", "DELETE"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", service: "redis-proxy" });
});

// Authentication middleware
const AUTH_TOKEN = process.env.PROXY_AUTH_TOKEN || "change-me-in-production";

app.use("/redis/*", async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || authHeader !== `Bearer ${AUTH_TOKEN}`) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
});

// GET key
app.get("/redis/:key", async (c) => {
  try {
    const key = c.req.param("key");
    const redis = await getRedisClient();
    const value = await redis.get(key);
    
    if (value === null) {
      return c.json({ key, value: null }, 404);
    }
    
    return c.json({ key, value });
  } catch (error) {
    console.error("GET error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// SET key
app.post("/redis/:key", async (c) => {
  try {
    const key = c.req.param("key");
    const body = await c.req.json();
    const { value, ttl } = body;
    
    if (value === undefined) {
      return c.json({ error: "value is required" }, 400);
    }
    
    const redis = await getRedisClient();
    
    if (ttl) {
      await redis.setex(key, ttl, value);
    } else {
      await redis.set(key, value);
    }
    
    return c.json({ key, value, ttl: ttl || null });
  } catch (error) {
    console.error("SET error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// DELETE key
app.delete("/redis/:key", async (c) => {
  try {
    const key = c.req.param("key");
    const redis = await getRedisClient();
    const deleted = await redis.del(key);
    
    return c.json({ key, deleted: deleted > 0 });
  } catch (error) {
    console.error("DELETE error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// EXISTS key
app.get("/redis/:key/exists", async (c) => {
  try {
    const key = c.req.param("key");
    const redis = await getRedisClient();
    const exists = await redis.exists(key);
    
    return c.json({ key, exists: exists === 1 });
  } catch (error) {
    console.error("EXISTS error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// EXPIRE key
app.post("/redis/:key/expire", async (c) => {
  try {
    const key = c.req.param("key");
    const body = await c.req.json();
    const { ttl } = body;
    
    if (!ttl || typeof ttl !== "number") {
      return c.json({ error: "ttl (number) is required" }, 400);
    }
    
    const redis = await getRedisClient();
    const result = await redis.expire(key, ttl);
    
    return c.json({ key, ttl, success: result === 1 });
  } catch (error) {
    console.error("EXPIRE error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// INCR key
app.post("/redis/:key/incr", async (c) => {
  try {
    const key = c.req.param("key");
    const redis = await getRedisClient();
    const value = await redis.incr(key);
    
    return c.json({ key, value });
  } catch (error) {
    console.error("INCR error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// HGET hash field
app.get("/redis/:key/hash/:field", async (c) => {
  try {
    const key = c.req.param("key");
    const field = c.req.param("field");
    const redis = await getRedisClient();
    const value = await redis.hget(key, field);
    
    if (value === null) {
      return c.json({ key, field, value: null }, 404);
    }
    
    return c.json({ key, field, value });
  } catch (error) {
    console.error("HGET error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// HSET hash field
app.post("/redis/:key/hash/:field", async (c) => {
  try {
    const key = c.req.param("key");
    const field = c.req.param("field");
    const body = await c.req.json();
    const { value } = body;
    
    if (value === undefined) {
      return c.json({ error: "value is required" }, 400);
    }
    
    const redis = await getRedisClient();
    await redis.hset(key, field, value);
    
    return c.json({ key, field, value });
  } catch (error) {
    console.error("HSET error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// HGETALL hash
app.get("/redis/:key/hash", async (c) => {
  try {
    const key = c.req.param("key");
    const redis = await getRedisClient();
    const value = await redis.hgetall(key);
    
    return c.json({ key, value });
  } catch (error) {
    console.error("HGETALL error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, closing Redis connection...");
  if (redisClient) {
    await redisClient.quit();
  }
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, closing Redis connection...");
  if (redisClient) {
    await redisClient.quit();
  }
  process.exit(0);
});

// Start server
const port = Number(process.env.PORT) || 8083;
console.log(`🚀 Redis HTTP Proxy running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});

