// src/lib/cache.ts

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  ttl: number;
}

const DEFAULT_CONFIG: CacheConfig = {
  ttl: 5 * 60 * 1000,
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
// USER DATA CACHE
// ============================================

export function cacheUserData(userId: string, data: any): void {
  cache.set(`user_${userId}`, data, { ttl: 5 * 60 * 1000 });
}

export function getCachedUserData(userId: string): any | null {
  return cache.get(`user_${userId}`);
}

export function clearUserCache(userId: string): void {
  cache.remove(`user_${userId}`);
  cache.remove(`transactions_${userId}`);
  cache.remove(`gigs_${userId}`);
}

// ============================================
// TRANSACTIONS CACHE
// ============================================

export function cacheTransactions(userId: string, data: any[]): void {
  cache.set(`transactions_${userId}`, data, { ttl: 2 * 60 * 1000 });
}

export function getCachedTransactions(userId: string): any[] | null {
  return cache.get(`transactions_${userId}`);
}

// ============================================
// GIGS CACHE
// ============================================

export function cacheGigs(userId: string, data: any[]): void {
  cache.set(`gigs_${userId}`, data, { ttl: 3 * 60 * 1000 });
}

export function getCachedGigs(userId: string): any[] | null {
  return cache.get(`gigs_${userId}`);
}

// ============================================
// LEADERBOARD CACHE
// ============================================

export function cacheLeaderboard(data: any[]): void {
  cache.set('leaderboard', data, { ttl: 10 * 60 * 1000 });
}

export function getCachedLeaderboard(): any[] | null {
  return cache.get('leaderboard');
}

// ============================================
// SEARCH CACHE
// ============================================

export function cacheSearch(query: string, data: any[]): void {
  cache.set(`search_${query}`, data, { ttl: 2 * 60 * 1000 });
}

export function getCachedSearch(query: string): any[] | null {
  return cache.get(`search_${query}`);
}

export function setCachedSearch(query: string, results: any[]): void {
  cacheSearch(query, results);
}

export function clearSearchCache(): void {
  const storage = getStorage();
  storage.searchCache = {};
  setStorage({ searchCache: storage.searchCache });
}

// ============================================
// STORAGE FUNCTIONS
// ============================================

interface StorageData {
  searchCache: Record<string, { results: any[]; timestamp: number }>;
  preferences: {
    theme: 'dark' | 'light';
    language: string;
  };
  appState: {
    activeTab: string;
    lastVisited: string;
  };
  pendingTransactions: any[];
  cache: {
    balance: number;
    transactions: any[];
    lastSync: number;
  };
  onboarding: {
    hasSeenOnboarding: boolean;
    hasAgreedToTerms: boolean;
  };
}

const defaultStorage: StorageData = {
  searchCache: {},
  preferences: {
    theme: 'dark',
    language: 'en',
  },
  appState: {
    activeTab: 'home',
    lastVisited: new Date().toISOString(),
  },
  pendingTransactions: [],
  cache: {
    balance: 0,
    transactions: [],
    lastSync: 0,
  },
  onboarding: {
    hasSeenOnboarding: false,
    hasAgreedToTerms: false,
  },
};

export function getStorage(): StorageData {
  try {
    const data = localStorage.getItem('bitgen_data');
    if (data) {
      const parsed = JSON.parse(data);
      return { ...defaultStorage, ...parsed };
    }
  } catch (error) {
    console.error('Error reading storage:', error);
  }
  return defaultStorage;
}

export function setStorage(data: Partial<StorageData>): void {
  try {
    const current = getStorage();
    const updated = { ...current, ...data };
    localStorage.setItem('bitgen_data', JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving storage:', error);
  }
}

export function updateCache(balance: number, transactions: any[]): void {
  setStorage({
    cache: {
      balance,
      transactions,
      lastSync: Date.now(),
    },
  });
}

export function getCachedBalance(): number | null {
  const storage = getStorage();
  if (Date.now() - storage.cache.lastSync < 60000) {
    return storage.cache.balance;
  }
  return null;
}

// ============================================
// PENDING TRANSACTIONS
// ============================================

export function addPendingTransaction(transaction: any): void {
  const storage = getStorage();
  storage.pendingTransactions.push({
    id: Date.now().toString(),
    ...transaction,
    timestamp: Date.now(),
  });
  setStorage({ pendingTransactions: storage.pendingTransactions });
}

export function getPendingTransactions(): any[] {
  return getStorage().pendingTransactions;
}

export function removePendingTransaction(id: string): void {
  const storage = getStorage();
  storage.pendingTransactions = storage.pendingTransactions.filter(t => t.id !== id);
  setStorage({ pendingTransactions: storage.pendingTransactions });
}

export function clearPendingTransactions(): void {
  const storage = getStorage();
  storage.pendingTransactions = [];
  setStorage({ pendingTransactions: storage.pendingTransactions });
}

// ============================================
// ONBOARDING
// ============================================

export function setOnboardingComplete(): void {
  const storage = getStorage();
  storage.onboarding.hasSeenOnboarding = true;
  setStorage({ onboarding: storage.onboarding });
}

export function setTermsAgreed(): void {
  const storage = getStorage();
  storage.onboarding.hasAgreedToTerms = true;
  setStorage({ onboarding: storage.onboarding });
}

export function getOnboardingStatus() {
  return getStorage().onboarding;
}

// ============================================
// PREFERENCES
// ============================================

export function setTheme(theme: 'dark' | 'light'): void {
  const storage = getStorage();
  storage.preferences.theme = theme;
  setStorage({ preferences: storage.preferences });
}

export function getTheme(): 'dark' | 'light' {
  return getStorage().preferences.theme;
}

// ============================================
// APP STATE
// ============================================

export function setActiveTab(tab: string): void {
  const storage = getStorage();
  storage.appState.activeTab = tab;
  storage.appState.lastVisited = new Date().toISOString();
  setStorage({ appState: storage.appState });
}

export function getActiveTab(): string {
  return getStorage().appState.activeTab;
}

export function clearAllStorage(): void {
  localStorage.removeItem('bitgen_data');
}