// In-memory cache with TTL
class Cache {
  constructor(defaultTTL = 3600) {
    this.cache = new Map();
    this.defaultTTL = defaultTTL * 1000; // Convert to milliseconds
  }

  set(key, value, ttl = this.defaultTTL) {
    const expiresAt = Date.now() + (ttl * 1000);
    this.cache.set(key, { value, expiresAt });
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  // Clean up expired entries (optional, can be called periodically)
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
const cache = new Cache(process.env.CACHE_TTL || 3600);

// Uncomment below to use Redis instead (requires redis package)
/*
const redis = require('redis');
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

class RedisCache {
  constructor(defaultTTL = 3600) {
    this.defaultTTL = defaultTTL;
  }

  async set(key, value, ttl = this.defaultTTL) {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
  }

  async get(key) {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  }

  async delete(key) {
    await redisClient.del(key);
  }

  async clear() {
    await redisClient.flushAll();
  }
}

// Use Redis cache instead:
// const cache = new RedisCache(process.env.CACHE_TTL || 3600);
*/

module.exports = cache;

