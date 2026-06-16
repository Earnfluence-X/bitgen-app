// src/lib/storage.ts

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

// Get data from localStorage
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

// Save data to localStorage
export function setStorage(data: Partial<StorageData>) {
  try {
    const current = getStorage();
    const updated = { ...current, ...data };
    localStorage.setItem('bitgen_data', JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving storage:', error);
  }
}

// Search cache functions
export function getCachedSearch(query: string): any[] | null {
  const storage = getStorage();
  const cache = storage.searchCache[query];
  if (cache && Date.now() - cache.timestamp < 300000) { // 5 minutes
    return cache.results;
  }
  return null;
}

export function setCachedSearch(query: string, results: any[]) {
  const storage = getStorage();
  storage.searchCache[query] = {
    results,
    timestamp: Date.now(),
  };
  setStorage({ searchCache: storage.searchCache });
}

export function clearSearchCache() {
  const storage = getStorage();
  storage.searchCache = {};
  setStorage({ searchCache: storage.searchCache });
}

// Pending transaction functions
export function addPendingTransaction(transaction: any) {
  const storage = getStorage();
  storage.pendingTransactions.push({
    id: Date.now().toString(),
    ...transaction,
    timestamp: Date.now(),
  });
  setStorage({ pendingTransactions: storage.pendingTransactions });
}

export function getPendingTransactions() {
  return getStorage().pendingTransactions;
}

export function removePendingTransaction(id: string) {
  const storage = getStorage();
  storage.pendingTransactions = storage.pendingTransactions.filter(t => t.id !== id);
  setStorage({ pendingTransactions: storage.pendingTransactions });
}

export function clearPendingTransactions() {
  const storage = getStorage();
  storage.pendingTransactions = [];
  setStorage({ pendingTransactions: storage.pendingTransactions });
}

// Cache sync functions
export function updateCache(balance: number, transactions: any[]) {
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
  if (Date.now() - storage.cache.lastSync < 60000) { // 1 minute
    return storage.cache.balance;
  }
  return null;
}

export function getCachedTransactions(): any[] | null {
  const storage = getStorage();
  if (Date.now() - storage.cache.lastSync < 60000) { // 1 minute
    return storage.cache.transactions;
  }
  return null;
}

// Onboarding functions
export function setOnboardingComplete() {
  const storage = getStorage();
  storage.onboarding.hasSeenOnboarding = true;
  setStorage({ onboarding: storage.onboarding });
}

export function setTermsAgreed() {
  const storage = getStorage();
  storage.onboarding.hasAgreedToTerms = true;
  setStorage({ onboarding: storage.onboarding });
}

export function getOnboardingStatus() {
  return getStorage().onboarding;
}

// Preferences
export function setTheme(theme: 'dark' | 'light') {
  const storage = getStorage();
  storage.preferences.theme = theme;
  setStorage({ preferences: storage.preferences });
}

export function getTheme(): 'dark' | 'light' {
  return getStorage().preferences.theme;
}

// App State
export function setActiveTab(tab: string) {
  const storage = getStorage();
  storage.appState.activeTab = tab;
  storage.appState.lastVisited = new Date().toISOString();
  setStorage({ appState: storage.appState });
}

export function getActiveTab(): string {
  return getStorage().appState.activeTab;
}

// Clear all storage
export function clearAllStorage() {
  localStorage.removeItem('bitgen_data');
}