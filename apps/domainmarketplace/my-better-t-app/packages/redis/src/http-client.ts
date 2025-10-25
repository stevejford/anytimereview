/**
 * HTTP-based Redis client for Cloudflare Workers
 * 
 * This client communicates with the Redis HTTP Proxy service
 * deployed on Railway, allowing Workers to access Railway Redis.
 */

export interface HttpRedisClientConfig {
  proxyUrl: string;
  authToken: string;
}

export class HttpRedisClient {
  private proxyUrl: string;
  private authToken: string;

  constructor(config: HttpRedisClientConfig) {
    this.proxyUrl = config.proxyUrl.replace(/\/$/, ""); // Remove trailing slash
    this.authToken = config.authToken;
  }

  private async request(method: string, path: string, body?: any): Promise<any> {
    const url = `${this.proxyUrl}${path}`;
    const headers: Record<string, string> = {
      "Authorization": `Bearer ${this.authToken}`,
      "Content-Type": "application/json",
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(`Redis proxy error: ${error.error || response.statusText}`);
    }

    return response.json();
  }

  // GET key
  async get(key: string): Promise<string | null> {
    try {
      const result = await this.request("GET", `/redis/${encodeURIComponent(key)}`);
      return result.value;
    } catch (error: any) {
      if (error.message?.includes("404")) {
        return null;
      }
      throw error;
    }
  }

  // SET key value [EX seconds]
  async set(key: string, value: string): Promise<string> {
    await this.request("POST", `/redis/${encodeURIComponent(key)}`, { value });
    return "OK";
  }

  // SETEX key seconds value
  async setex(key: string, seconds: number, value: string): Promise<string> {
    await this.request("POST", `/redis/${encodeURIComponent(key)}`, { value, ttl: seconds });
    return "OK";
  }

  // DEL key
  async del(key: string): Promise<number> {
    const result = await this.request("DELETE", `/redis/${encodeURIComponent(key)}`);
    return result.deleted ? 1 : 0;
  }

  // EXISTS key
  async exists(key: string): Promise<number> {
    const result = await this.request("GET", `/redis/${encodeURIComponent(key)}/exists`);
    return result.exists ? 1 : 0;
  }

  // EXPIRE key seconds
  async expire(key: string, seconds: number): Promise<number> {
    const result = await this.request("POST", `/redis/${encodeURIComponent(key)}/expire`, { ttl: seconds });
    return result.success ? 1 : 0;
  }

  // INCR key
  async incr(key: string): Promise<number> {
    const result = await this.request("POST", `/redis/${encodeURIComponent(key)}/incr`);
    return result.value;
  }

  // HGET key field
  async hget(key: string, field: string): Promise<string | null> {
    try {
      const result = await this.request("GET", `/redis/${encodeURIComponent(key)}/hash/${encodeURIComponent(field)}`);
      return result.value;
    } catch (error: any) {
      if (error.message?.includes("404")) {
        return null;
      }
      throw error;
    }
  }

  // HSET key field value
  async hset(key: string, field: string, value: string): Promise<number> {
    await this.request("POST", `/redis/${encodeURIComponent(key)}/hash/${encodeURIComponent(field)}`, { value });
    return 1;
  }

  // HGETALL key
  async hgetall(key: string): Promise<Record<string, string>> {
    const result = await this.request("GET", `/redis/${encodeURIComponent(key)}/hash`);
    return result.value || {};
  }

  // Compatibility methods (no-op for HTTP client)
  async quit(): Promise<void> {
    // No persistent connection to close
  }

  async disconnect(): Promise<void> {
    // No persistent connection to close
  }
}

/**
 * Create HTTP Redis client for Cloudflare Workers
 */
export function createHttpRedisClient(config: HttpRedisClientConfig): HttpRedisClient {
  return new HttpRedisClient(config);
}

