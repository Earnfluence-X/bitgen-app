import { create } from 'zustand';
import { 
  getAdminStats, 
  getAdminUsers, 
  getAdminReports, 
  suspendUser, 
  unsuspendUser, 
  resolveReport,
  isUserAdmin 
} from './admin';
import type { AdminStats, AdminUser, AdminReport } from '../types/admin';

interface AdminStore {
  isAdmin: boolean;
  loading: boolean;
  stats: AdminStats | null;
  users: AdminUser[];
  reports: AdminReport[];
  adminChecked: boolean;
  
  checkAdmin: (userId: string, email: string) => Promise<boolean>;
  loadStats: () => Promise<void>;
  loadUsers: () => Promise<void>;
  loadReports: (status?: string) => Promise<void>;
  suspendUser: (userId: string) => Promise<void>;
  unsuspendUser: (userId: string) => Promise<void>;
  resolveReport: (reportId: string, resolution: 'warn' | 'suspend' | 'dismiss', note: string) => Promise<void>;
  resetAdmin: () => void;
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  isAdmin: false,
  loading: false,
  stats: null,
  users: [],
  reports: [],
  adminChecked: false,

  checkAdmin: async (userId: string, email: string) => {
    const isAdmin = await isUserAdmin(userId, email);
    set({ isAdmin, adminChecked: true });
    return isAdmin;
  },

  loadStats: async () => {
    const { isAdmin } = get();
    if (!isAdmin) return;
    
    set({ loading: true });
    try {
      const stats = await getAdminStats();
      set({ stats, loading: false });
    } catch (error) {
      console.error('Error loading stats:', error);
      set({ loading: false });
    }
  },

  loadUsers: async () => {
    const { isAdmin } = get();
    if (!isAdmin) return;
    
    set({ loading: true });
    try {
      const users = await getAdminUsers({ limit: 100 });
      set({ users, loading: false });
    } catch (error) {
      console.error('Error loading users:', error);
      set({ loading: false });
    }
  },

  loadReports: async (status?: string) => {
    const { isAdmin } = get();
    if (!isAdmin) return;
    
    set({ loading: true });
    try {
      const reports = await getAdminReports(status as any);
      set({ reports, loading: false });
    } catch (error) {
      console.error('Error loading reports:', error);
      set({ loading: false });
    }
  },

  suspendUser: async (userId: string) => {
    const { isAdmin } = get();
    if (!isAdmin) throw new Error('Admin access required');
    
    await suspendUser(userId);
    get().loadUsers();
  },

  unsuspendUser: async (userId: string) => {
    const { isAdmin } = get();
    if (!isAdmin) throw new Error('Admin access required');
    
    await unsuspendUser(userId);
    get().loadUsers();
  },

  resolveReport: async (reportId: string, resolution: 'warn' | 'suspend' | 'dismiss', note: string) => {
    const { isAdmin } = get();
    if (!isAdmin) throw new Error('Admin access required');
    
    await resolveReport(reportId, resolution, note);
    get().loadReports();
  },

  resetAdmin: () => {
    set({ isAdmin: false, adminChecked: false, stats: null, users: [], reports: [] });
  },
}));