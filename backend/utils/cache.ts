/**
 * Simple in-memory cache with expiration
 */

interface CacheItem<T> {
  value: T;
  expiry: number;
}

class Cache<T> {
  private cache: Map<string, CacheItem<T>> = new Map();
  
  /**
   * Get an item from the cache
   * @param key The cache key
   * @returns The cached value or undefined if not found or expired
   */
  get(key: string): T | undefined {
    const item = this.cache.get(key);
    
    // Return undefined if item doesn't exist
    if (!item) return undefined;
    
    // Check if the item has expired
    if (Date.now() > item.expiry) {
      // Remove expired item
      this.cache.delete(key);
      return undefined;
    }
    
    return item.value;
  }
  
  /**
   * Set an item in the cache with expiration
   * @param key The cache key
   * @param value The value to cache
   * @param ttlMs Time to live in milliseconds
   */
  set(key: string, value: T, ttlMs: number): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlMs
    });
  }
  
  /**
   * Remove an item from the cache
   * @param key The cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear();
  }
}

// Export cache instances
export const userCache = new Cache<any>();

// Cache TTL constants
export const FIVE_MINUTES_MS = 5 * 60 * 1000; 