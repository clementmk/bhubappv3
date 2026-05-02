import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncAPI, userAPI, routeAPI, communityAPI, newsAPI } from './cloudAPI';
import { getDB } from '../database/db';

// Sync configuration
const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
const SYNC_STORAGE_KEY = 'last_sync_timestamp';

export interface SyncResult {
  success: boolean;
  syncedItems: {
    leaderboard?: number;
    routes?: number;
    posts?: number;
    news?: number;
  };
  errors: string[];
  timestamp: number;
}

class SyncService {
  private syncTimer: NodeJS.Timeout | null = null;
  private isSyncing = false;

  // Start automatic sync
  startAutoSync() {
    this.stopAutoSync(); // Clear any existing timer

    this.syncTimer = setInterval(async () => {
      if (!this.isSyncing) {
        await this.performFullSync();
      }
    }, SYNC_INTERVAL);

    console.log('Auto-sync started');
  }

  // Stop automatic sync
  stopAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('Auto-sync stopped');
    }
  }

  // Perform full data synchronization
  async performFullSync(): Promise<SyncResult> {
    if (this.isSyncing) {
      return {
        success: false,
        syncedItems: {},
        errors: ['Sync already in progress'],
        timestamp: Date.now(),
      };
    }

    this.isSyncing = true;
    const errors: string[] = [];
    const syncedItems: SyncResult['syncedItems'] = {};

    try {
      console.log('Starting full data sync...');

      // Sync leaderboard data
      try {
        const leaderboardData = await userAPI.getLeaderboard(100);
        if (leaderboardData && leaderboardData.length > 0) {
          syncedItems.leaderboard = leaderboardData.length;
          // Store in local cache for offline access
          await AsyncStorage.setItem('cached_leaderboard', JSON.stringify(leaderboardData));
        }
      } catch (error) {
        errors.push(`Leaderboard sync failed: ${error}`);
      }

      // Sync routes data
      try {
        const routesData = await routeAPI.getLatestRoutes();
        if (routesData && routesData.length > 0) {
          syncedItems.routes = routesData.length;
          await AsyncStorage.setItem('cached_routes', JSON.stringify(routesData));
        }
      } catch (error) {
        errors.push(`Routes sync failed: ${error}`);
      }

      // Sync community posts
      try {
        const postsData = await communityAPI.getPosts(1, 50);
        if (postsData && postsData.length > 0) {
          syncedItems.posts = postsData.length;
          await AsyncStorage.setItem('cached_posts', JSON.stringify(postsData));
        }
      } catch (error) {
        errors.push(`Posts sync failed: ${error}`);
      }

      // Sync news
      try {
        const newsData = await newsAPI.getLatestNews();
        if (newsData && newsData.length > 0) {
          syncedItems.news = newsData.length;
          await AsyncStorage.setItem('cached_news', JSON.stringify(newsData));
        }
      } catch (error) {
        errors.push(`News sync failed: ${error}`);
      }

      // Update last sync timestamp
      const timestamp = Date.now();
      await AsyncStorage.setItem(SYNC_STORAGE_KEY, timestamp.toString());

      console.log('Sync completed:', syncedItems);

      return {
        success: errors.length === 0,
        syncedItems,
        errors,
        timestamp,
      };

    } catch (error) {
      errors.push(`Sync failed: ${error}`);
      return {
        success: false,
        syncedItems,
        errors,
        timestamp: Date.now(),
      };
    } finally {
      this.isSyncing = false;
    }
  }

  // Sync local changes to cloud
  async syncLocalChanges(): Promise<SyncResult> {
    const errors: string[] = [];
    const syncedItems: SyncResult['syncedItems'] = {};

    try {
      console.log('Syncing local changes to cloud...');

      const db = await getDB();

      // Get unsynced route completions
      try {
        const [result] = await db.executeSql(
          'SELECT * FROM route_completions WHERE synced = 0 LIMIT 10'
        );

        if (result.rows.length > 0) {
          const completions = [];
          for (let i = 0; i < result.rows.length; i++) {
            completions.push(result.rows.item(i));
          }

          // Send to cloud
          await syncAPI.syncLocalChanges({
            type: 'route_completions',
            data: completions,
          });

          // Mark as synced locally — build correct placeholders for IN clause
          const placeholders = completions.map(() => '?').join(',');
          await db.executeSql(
            `UPDATE route_completions SET synced = 1 WHERE id IN (${placeholders})`,
            completions.map(c => c.id)
          );

          syncedItems.routes = completions.length;
        }
      } catch (error) {
        errors.push(`Route completions sync failed: ${error}`);
      }

      // Get unsynced community posts
      try {
        const [result] = await db.executeSql(
          'SELECT * FROM community_posts WHERE synced = 0 LIMIT 10'
        );

        if (result.rows.length > 0) {
          const posts = [];
          for (let i = 0; i < result.rows.length; i++) {
            posts.push(result.rows.item(i));
          }

          // Send to cloud
          await syncAPI.syncLocalChanges({
            type: 'community_posts',
            data: posts,
          });

          // Mark as synced locally — build correct placeholders for IN clause
          const placeholders = posts.map(() => '?').join(',');
          await db.executeSql(
            `UPDATE community_posts SET synced = 1 WHERE id IN (${placeholders})`,
            posts.map(p => p.id)
          );

          syncedItems.posts = posts.length;
        }
      } catch (error) {
        errors.push(`Community posts sync failed: ${error}`);
      }

      return {
        success: errors.length === 0,
        syncedItems,
        errors,
        timestamp: Date.now(),
      };

    } catch (error) {
      errors.push(`Local changes sync failed: ${error}`);
      return {
        success: false,
        syncedItems,
        errors,
        timestamp: Date.now(),
      };
    }
  }

  // Get cached data for offline use
  async getCachedData(type: 'leaderboard' | 'routes' | 'posts' | 'news') {
    try {
      const cached = await AsyncStorage.getItem(`cached_${type}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error(`Failed to get cached ${type}:`, error);
      return null;
    }
  }

  // Get last sync timestamp
  async getLastSyncTime(): Promise<number | null> {
    try {
      const timestamp = await AsyncStorage.getItem(SYNC_STORAGE_KEY);
      return timestamp ? parseInt(timestamp, 10) : null;
    } catch (error) {
      return null;
    }
  }

  // Check if sync is needed (based on time interval)
  async shouldSync(): Promise<boolean> {
    const lastSync = await this.getLastSyncTime();
    if (!lastSync) return true;

    const timeSinceLastSync = Date.now() - lastSync;
    return timeSinceLastSync > SYNC_INTERVAL;
  }
}

// Export singleton instance
export const syncService = new SyncService();

// React hook for using sync service
export const useSync = () => {
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [lastSyncResult, setLastSyncResult] = React.useState<SyncResult | null>(null);

  const performSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncService.performFullSync();
      setLastSyncResult(result);
      return result;
    } finally {
      setIsSyncing(false);
    }
  };

  const syncLocalChanges = async () => {
    setIsSyncing(true);
    try {
      const result = await syncService.syncLocalChanges();
      setLastSyncResult(result);
      return result;
    } finally {
      setIsSyncing(false);
    }
  };

  React.useEffect(() => {
    // Start auto-sync when component mounts
    syncService.startAutoSync();

    // Stop auto-sync when component unmounts
    return () => {
      syncService.stopAutoSync();
    };
  }, []);

  return {
    isSyncing,
    lastSyncResult,
    performSync,
    syncLocalChanges,
    getCachedData: syncService.getCachedData.bind(syncService),
    shouldSync: syncService.shouldSync.bind(syncService),
  };
};