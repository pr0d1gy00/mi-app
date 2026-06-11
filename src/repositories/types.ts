export type { SyncStatus, BaseEntity } from '@/types/entities';
import type { BaseEntity } from '@/types/entities';

export interface BaseRepository<T extends BaseEntity> {
  create(dto: Omit<T, keyof BaseEntity>): Promise<T>;
  getById(id: string): Promise<T | null>;
  getAll(): Promise<T[]>;
  update(id: string, dto: Partial<Omit<T, keyof BaseEntity>>): Promise<T>;
  softDelete(id: string): Promise<void>;
}
