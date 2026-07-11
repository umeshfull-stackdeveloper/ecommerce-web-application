"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cache_1 = __importDefault(require("node-cache"));
// Simple in-memory cache fallback wrapper
class CacheManager {
    localCache;
    isRedisEnabled = false;
    // We can add actual Redis client initialization if REDIS_URL is provided, 
    // but fall back automatically to node-cache.
    constructor() {
        // TTL default of 1 hour (3600 seconds)
        this.localCache = new node_cache_1.default({ stdTTL: 3600, checkperiod: 120 });
        console.log('⚡ Cache System: Local In-Memory Cache Initialized');
    }
    async get(key) {
        const value = this.localCache.get(key);
        if (!value)
            return null;
        try {
            return JSON.parse(value);
        }
        catch {
            return value;
        }
    }
    async set(key, value, ttlSeconds) {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        if (ttlSeconds) {
            return this.localCache.set(key, stringValue, ttlSeconds);
        }
        return this.localCache.set(key, stringValue);
    }
    async del(key) {
        return this.localCache.del(key);
    }
    async flush() {
        this.localCache.flushAll();
    }
}
const cache = new CacheManager();
exports.default = cache;
