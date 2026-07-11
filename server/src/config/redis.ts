import NodeCache from 'node-cache';

// Simple in-memory cache fallback wrapper
class CacheManager {
  private localCache: NodeCache;
  private isRedisEnabled: boolean = false;
  // We can add actual Redis client initialization if REDIS_URL is provided, 
  // but fall back automatically to node-cache.
  
  constructor() {
    // TTL default of 1 hour (3600 seconds)
    this.localCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });
    console.log('⚡ Cache System: Local In-Memory Cache Initialized');
  }

  async get<T>(key: string): Promise<T | null> {
    const value = this.localCache.get<string>(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds) {
      return this.localCache.set(key, stringValue, ttlSeconds);
    }
    return this.localCache.set(key, stringValue);
  }

  async del(key: string): Promise<number> {
    return this.localCache.del(key);
  }

  async flush(): Promise<void> {
    this.localCache.flushAll();
  }
}

const cache = new CacheManager();
export default cache;
