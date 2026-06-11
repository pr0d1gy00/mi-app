import type { SQLiteDatabase } from 'expo-sqlite';
import { SyncMetadataRepository } from '@/repositories/SyncMetadataRepository';
import { apiClient } from '@/services/apiClient';

export interface SyncResult {
  success: boolean;
  pulledCount: number;
  pushedCount: number;
  errors: string[];
  lastSyncAt: string;
}

export interface PullResult {
  success: boolean;
  changes: Record<string, unknown[]>;
  lastPullAt: string;
}

export interface PushResult {
  success: boolean;
  pushedCount: number;
  errors: string[];
}

export class SyncService {
  constructor(db: SQLiteDatabase) {
    this.syncMetaRepo = new SyncMetadataRepository(db);
  }

  private syncMetaRepo: SyncMetadataRepository;

  async sync(): Promise<SyncResult> {
    const now = new Date().toISOString();
    const result: SyncResult = {
      success: true,
      pulledCount: 0,
      pushedCount: 0,
      errors: [],
      lastSyncAt: now,
    };

    try {
      const isInitialDone = await this.syncMetaRepo.isInitialSyncDone();

      if (!isInitialDone) {
        const pullResult = await this.pullChanges('0');
        if (pullResult.success) {
          await this.syncMetaRepo.markInitialSyncDone();
        }
        result.pulledCount = pullResult.changes ? Object.keys(pullResult.changes).length : 0;
      } else {
        const lastPull = await this.syncMetaRepo.getLastPullAt();
        const pullResult = await this.pullChanges(lastPull || '0');
        result.pulledCount = pullResult.changes ? Object.keys(pullResult.changes).length : 0;
      }

      const pushResult = await this.pushChanges();
      result.pushedCount = pushResult.pushedCount;
      result.errors = pushResult.errors;

      await this.syncMetaRepo.setLastPullAt(now);
      await this.syncMetaRepo.setLastPushAt(now);
    } catch (e) {
      result.success = false;
      result.errors.push(e instanceof Error ? e.message : 'Unknown sync error');
    }

    return result;
  }

  async pullChanges(lastPulledAt: string): Promise<PullResult> {
    try {
      const response = await apiClient.get(`/sync/pull?lastPulledAt=${lastPulledAt}`);
      const data = response.data as { changes?: Record<string, unknown[]> };
      
      return {
        success: true,
        changes: data.changes || {},
        lastPullAt: new Date().toISOString(),
      };
    } catch {
      return {
        success: false,
        changes: {},
        lastPullAt: lastPulledAt,
      };
    }
  }

  async pushChanges(): Promise<PushResult> {
    try {
      return {
        success: true,
        pushedCount: 0,
        errors: [],
      };
    } catch (e) {
      return {
        success: false,
        pushedCount: 0,
        errors: [e instanceof Error ? e.message : 'Push failed'],
      };
    }
  }

  async getLastSyncTime(): Promise<string | null> {
    return this.syncMetaRepo.getLastPullAt();
  }

  async isInitialSyncDone(): Promise<boolean> {
    return this.syncMetaRepo.isInitialSyncDone();
  }
}