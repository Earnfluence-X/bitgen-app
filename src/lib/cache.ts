// src/lib/cache.ts

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
}

const DEFAULT_CONFIG: CacheConfig = {
  ttl: 5 * 60 * 1000, // 5 minutes
};

class CacheManager {
  private prefix: string;

  constructor(prefix: string = 'bitgen_') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  set<T>(key: string, data: T, config?: Partial<CacheConfig>): void {
    const ttl = config?.ttl || DEFAULT_CONFIG.ttl;
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    };
    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(item));
    } catch (error) {
      console.warn('Cache set failed:', error);
    }
  }

  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(this.getKey(key));
      if (!raw) return null;

      const item: CacheItem<T> = JSON.parse(raw);
      
      // Check if expired
      if (Date.now() > item.expiresAt) {
        localStorage.removeItem(this.getKey(key));
        return null;
      }

      return item.data;
    } catch (error) {
      console.warn('Cache get failed:', error);
      return null;
    }
  }

  remove(key: string): void {
    localStorage.removeItem(this.getKey(key));
  }

  clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  // Check if cache is fresh
  isFresh(key: string): boolean {
    try {
      const raw = localStorage.getItem(this.getKey(key));
      if (!raw) return false;
      const item: CacheItem<any> = JSON.parse(raw);
      return Date.now() < item.expiresAt;
    } catch {
      return false;
    }
  }
}

export const cache = new CacheManager('bitgen_');

// ============================================
// SPECIFIC CACHE FUNCTIONS
// ============================================

export function cacheUserData(userId: string, data: any): void {
  cache.set(`user_${userId}`, data, { ttl: 5 * 60 * 1000 }); // 5 minutes
}

export function getCachedUserData(userId: string): any | null {
  return cache.get(`user_${userId}`);
}

export function cacheTransactions(userId: string, data: any[]): void {
  cache.set(`transactions_${userId}`, data, { ttl: 2 * 60 * 1000 }); // 2 minutes
}

export function getCachedTransactions(userId: string): any[] | null {
  return cache.get(`transactions_${userId}`);
}

export function cacheGigs(userId: string, data: any[]): void {
  cache.set(`gigs_${userId}`, data, { ttl: 3 * 60 * 1000 }); // 3 minutes
}

export function getCachedGigs(userId: string): any[] | null {
  return cache.get(`gigs_${userId}`);
}

export function cacheLeaderboard(data: any[]): void {
  cache.set('leaderboard', data, { ttl: 10 * 60 * 1000 }); // 10 minutes
}

export function getCachedLeaderboard(): any[] | null {
  return cache.get('leaderboard');
}

// Clear user data on logout
export function clearUserCache(userId: string): void {
  cache.remove(`user_${userId}`);
  cache.remove(`transactions_${userId}`);
  cache.remove(`gigs_${userId}`);
}