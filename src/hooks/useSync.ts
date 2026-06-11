import { useState, useCallback } from 'react';
import { getDatabase } from '@/database/connection';
import { SyncMetadataRepository } from '@/repositories/SyncMetadataRepository';
import { SyncService } from '@/services/SyncService';

export function useSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sync = useCallback(async () => {
    try {
      setIsSyncing(true);
      setError(null);
      const db = await getDatabase();
      const syncMetaRepo = new SyncMetadataRepository(db);
      const syncService = new SyncService(db);
      
      const result = await syncService.sync();
      
      if (result.success) {
        const now = new Date().toISOString();
        setLastSyncAt(now);
        await syncMetaRepo.setLastPullAt(now);
        await syncMetaRepo.setLastPushAt(now);
      } else {
        setError(result.errors.join(', '));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return { sync, isSyncing, lastSyncAt, error };
}