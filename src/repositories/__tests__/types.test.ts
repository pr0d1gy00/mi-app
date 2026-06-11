import type { BaseRepository } from '../types';
import type { Category, Product, Store } from '@/types/entities';

// This is a compile-time test. If it compiles, the type contract is correct.
// We add runtime assertions to satisfy Jest.

describe('BaseRepository type contract', () => {
  test('1. BaseRepository<Category> requires all 5 methods', () => {
    const mockRepo: BaseRepository<Category> = {
      create: async (_dto) =>
        ({
          id: '1',
          name: 'Test',
          metadata: null,
          userId: null,
          createdAt: '',
          updatedAt: '',
          deletedAt: null,
          syncStatus: 'created',
          lastSyncedAt: '',
        }) as Category,
      getById: async (_id) => null,
      getAll: async () => [],
      update: async (_id, _dto) =>
        ({
          id: '1',
          name: 'Test',
          metadata: null,
          userId: null,
          createdAt: '',
          updatedAt: '',
          deletedAt: null,
          syncStatus: 'updated',
          lastSyncedAt: '',
        }) as Category,
      softDelete: async (_id) => {},
    };

    expect(typeof mockRepo.create).toBe('function');
    expect(typeof mockRepo.getById).toBe('function');
    expect(typeof mockRepo.getAll).toBe('function');
    expect(typeof mockRepo.update).toBe('function');
    expect(typeof mockRepo.softDelete).toBe('function');
  });

  test('2. BaseRepository<Product> requires all 5 methods', () => {
    const mockRepo: BaseRepository<Product> = {
      create: async (_dto) =>
        ({
          id: '1',
          name: 'Test',
          brand: null,
          categoryId: 'c1',
          metadata: null,
          barcode: null,
          userId: 'u1',
          createdAt: '',
          updatedAt: '',
          deletedAt: null,
          syncStatus: 'created',
          lastSyncedAt: '',
        }) as Product,
      getById: async (_id) => null,
      getAll: async () => [],
      update: async (_id, _dto) =>
        ({
          id: '1',
          name: 'Test',
          brand: null,
          categoryId: 'c1',
          metadata: null,
          barcode: null,
          userId: 'u1',
          createdAt: '',
          updatedAt: '',
          deletedAt: null,
          syncStatus: 'updated',
          lastSyncedAt: '',
        }) as Product,
      softDelete: async (_id) => {},
    };

    expect(typeof mockRepo.create).toBe('function');
    expect(typeof mockRepo.getById).toBe('function');
    expect(typeof mockRepo.getAll).toBe('function');
    expect(typeof mockRepo.update).toBe('function');
    expect(typeof mockRepo.softDelete).toBe('function');
  });

  test('3. BaseRepository<Store> requires all 5 methods', () => {
    const mockRepo: BaseRepository<Store> = {
      create: async (_dto) =>
        ({
          id: '1',
          name: 'Test',
          location: null,
          userId: null,
          createdAt: '',
          updatedAt: '',
          deletedAt: null,
          syncStatus: 'created',
          lastSyncedAt: '',
        }) as Store,
      getById: async (_id) => null,
      getAll: async () => [],
      update: async (_id, _dto) =>
        ({
          id: '1',
          name: 'Test',
          location: null,
          userId: null,
          createdAt: '',
          updatedAt: '',
          deletedAt: null,
          syncStatus: 'updated',
          lastSyncedAt: '',
        }) as Store,
      softDelete: async (_id) => {},
    };

    expect(typeof mockRepo.create).toBe('function');
    expect(typeof mockRepo.getById).toBe('function');
    expect(typeof mockRepo.getAll).toBe('function');
    expect(typeof mockRepo.update).toBe('function');
    expect(typeof mockRepo.softDelete).toBe('function');
  });

  test('4. create returns a full entity with BaseEntity fields', async () => {
    const mockRepo: BaseRepository<Category> = {
      create: async () => ({
        id: 'cat-1',
        name: 'Test',
        metadata: null,
        userId: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        deletedAt: null,
        syncStatus: 'created',
        lastSyncedAt: '2024-01-01T00:00:00.000Z',
      }),
      getById: async () => null,
      getAll: async () => [],
      update: async () => ({}) as any,
      softDelete: async () => {},
    };

    const result = await mockRepo.create({ name: 'Test', metadata: null, userId: null });
    expect(result.id).toBe('cat-1');
    expect(result.syncStatus).toBe('created');
    expect(result.createdAt).toBeTruthy();
    expect(result.updatedAt).toBeTruthy();
  });

  test('5. update accepts partial DTO and returns full entity', async () => {
    const mockRepo: BaseRepository<Category> = {
      create: async () => ({}) as any,
      getById: async () => null,
      getAll: async () => [],
      update: async (_id, dto) =>
        ({
          id: 'cat-1',
          name: (dto as any).name ?? 'Old',
          metadata: null,
          userId: null,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-02-01T00:00:00.000Z',
          deletedAt: null,
          syncStatus: 'updated',
          lastSyncedAt: '2024-02-01T00:00:00.000Z',
        }) as Category,
      softDelete: async () => {},
    };

    const result = await mockRepo.update('cat-1', { name: 'Updated' });
    expect(result.name).toBe('Updated');
    expect(result.syncStatus).toBe('updated');
  });

  test('6. getById returns null for non-existent ID', async () => {
    const mockRepo: BaseRepository<Category> = {
      create: async () => ({}) as any,
      getById: async () => null,
      getAll: async () => [],
      update: async () => ({}) as any,
      softDelete: async () => {},
    };

    const result = await mockRepo.getById('nonexistent');
    expect(result).toBeNull();
  });
});
