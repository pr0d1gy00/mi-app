import {
  PurchaseRepository,
  type PurchaseInsert,
  type PurchaseItemInsert,
} from '@/repositories/PurchaseRepository';
import { PurchaseGroupRepository } from '@/repositories/PurchaseGroupRepository';
import type { Purchase, PurchaseGroup } from '@/types/entities';
import type { SQLiteDatabase } from 'expo-sqlite';
import { generateUuid } from '@/utils/uuid';
import type { SyncStatus } from '@/types/entities';

/**
 * PurchaseService - Business logic for purchase operations
 * Coordinates between PurchaseRepository and PurchaseGroupRepository
 */
export class PurchaseService {
  constructor(private db: SQLiteDatabase) {
    this.purchaseRepo = new PurchaseRepository(db);
    this.groupRepo = new PurchaseGroupRepository(db);
  }

  private purchaseRepo: PurchaseRepository;
  private groupRepo: PurchaseGroupRepository;

  /**
   * Create a purchase with items
   * Automatically calculates total from item prices
   */
  async createPurchase(
    data: Omit<
      PurchaseInsert,
      'totalAmount' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'lastSyncedAt'
    >,
    items: PurchaseItemInsert[],
  ): Promise<Purchase> {
    const now = new Date().toISOString();

    return this.purchaseRepo.create(
      {
        ...data,
        createdAt: now,
        updatedAt: now,
        syncStatus: 'created',
        lastSyncedAt: null,
      },
      items.map((item) => ({
        ...item,
        createdAt: now,
        updatedAt: now,
        syncStatus: 'created' as SyncStatus,
        lastSyncedAt: null,
      })),
    );
  }

  /**
   * Create a purchase group
   */
  async createPurchaseGroup(
    data: {
      name: string;
      description?: string | null;
      startDate?: string | null;
      endDate?: string | null;
    },
    userId: string,
  ): Promise<PurchaseGroup> {
    const now = new Date().toISOString();

    return this.groupRepo.create({
      name: data.name,
      description: data.description ?? null,
      userId,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'created',
      lastSyncedAt: null,
    });
  }

  /**
   * Assign a purchase to a group
   */
  async assignPurchaseToGroup(purchaseId: string, groupId: string): Promise<void> {
    await this.groupRepo.assignPurchase(groupId, purchaseId);
  }

  /**
   * Remove a purchase from a group
   */
  async unassignPurchaseFromGroup(purchaseId: string, groupId: string): Promise<void> {
    await this.groupRepo.unassignPurchase(groupId, purchaseId);
  }

  /**
   * Get all purchases with their items
   */
  async getAllPurchases(): Promise<Purchase[]> {
    return this.purchaseRepo.getAll();
  }

  /**
   * Get all groups with their purchases and totals
   */
  async getAllGroupsWithPurchases(): Promise<
    (PurchaseGroup & { purchases: Purchase[]; total: string })[]
  > {
    return this.groupRepo.getAllWithPurchases();
  }
}
