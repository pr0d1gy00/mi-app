// RED: Tests for purchase validation schemas
import { purchaseSchema, purchaseGroupSchema } from '@/types/validation';

describe('purchaseSchema validation', () => {
  it('validates a valid purchase with items', () => {
    const validPurchase = {
      storeId: '550e8400-e29b-41d4-a716-446655440000',
      totalAmount: '100.00',
      currency: 'USD',
      notes: 'Weekly groceries',
      purchaseDate: '2024-06-11',
      items: [
        {
          productName: 'Milk',
          quantity: 2,
          unitPrice: '3.50',
        },
      ],
    };
    const result = purchaseSchema.safeParse(validPurchase);
    expect(result.success).toBe(true);
  });

  it('rejects purchase with empty items array', () => {
    const invalidPurchase = {
      storeId: '550e8400-e29b-41d4-a716-446655440000',
      totalAmount: '0',
      currency: 'USD',
      purchaseDate: '2024-06-11',
      items: [],
    };
    const result = purchaseSchema.safeParse(invalidPurchase);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('items');
    }
  });

  it('rejects purchase with missing required fields', () => {
    const invalidPurchase = {
      storeId: '550e8400-e29b-41d4-a716-446655440000',
      currency: 'USD',
      // missing totalAmount and purchaseDate
      items: [
        {
          productName: 'Milk',
          quantity: 1,
          unitPrice: '3.50',
        },
      ],
    };
    const result = purchaseSchema.safeParse(invalidPurchase);
    expect(result.success).toBe(false);
  });

  it('rejects purchase with invalid date format', () => {
    const invalidPurchase = {
      storeId: '550e8400-e29b-41d4-a716-446655440000',
      totalAmount: '50.00',
      currency: 'USD',
      purchaseDate: 'not-a-date',
      items: [
        {
          productName: 'Milk',
          quantity: 1,
          unitPrice: '3.50',
        },
      ],
    };
    const result = purchaseSchema.safeParse(invalidPurchase);
    expect(result.success).toBe(false);
  });

  it('rejects item with quantity less than 1', () => {
    const invalidPurchase = {
      storeId: '550e8400-e29b-41d4-a716-446655440000',
      totalAmount: '50.00',
      currency: 'USD',
      purchaseDate: '2024-06-11',
      items: [
        {
          productName: 'Milk',
          quantity: 0,
          unitPrice: '3.50',
        },
      ],
    };
    const result = purchaseSchema.safeParse(invalidPurchase);
    expect(result.success).toBe(false);
  });

  it('rejects item with negative price', () => {
    const invalidPurchase = {
      storeId: '550e8400-e29b-41d4-a716-446655440000',
      totalAmount: '50.00',
      currency: 'USD',
      purchaseDate: '2024-06-11',
      items: [
        {
          productName: 'Milk',
          quantity: 1,
          unitPrice: '-5.00',
        },
      ],
    };
    const result = purchaseSchema.safeParse(invalidPurchase);
    expect(result.success).toBe(false);
  });

  it('accepts purchase without store (optional)', () => {
    const validPurchase = {
      totalAmount: '25.00',
      currency: 'USD',
      purchaseDate: '2024-06-11',
      items: [
        {
          productName: 'Bread',
          quantity: 1,
          unitPrice: '2.50',
        },
      ],
    };
    const result = purchaseSchema.safeParse(validPurchase);
    expect(result.success).toBe(true);
  });
});

describe('purchaseGroupSchema validation', () => {
  it('validates a valid purchase group', () => {
    const validGroup = {
      name: 'Weekly Shopping',
      description: 'Groceries for the week',
      startDate: '2024-06-01',
      endDate: '2024-06-07',
    };
    const result = purchaseGroupSchema.safeParse(validGroup);
    expect(result.success).toBe(true);
  });

  it('requires name field', () => {
    const invalidGroup = {
      description: 'No name provided',
    };
    const result = purchaseGroupSchema.safeParse(invalidGroup);
    expect(result.success).toBe(false);
  });

  it('rejects name longer than 100 characters', () => {
    const invalidGroup = {
      name: 'A'.repeat(101),
    };
    const result = purchaseGroupSchema.safeParse(invalidGroup);
    expect(result.success).toBe(false);
  });

  it('rejects end_date before start_date', () => {
    const invalidGroup = {
      name: 'Invalid Dates',
      startDate: '2024-06-10',
      endDate: '2024-06-01',
    };
    const result = purchaseGroupSchema.safeParse(invalidGroup);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('End');
    }
  });

  it('accepts group without dates (optional)', () => {
    const validGroup = {
      name: 'General Purchases',
    };
    const result = purchaseGroupSchema.safeParse(validGroup);
    expect(result.success).toBe(true);
  });

  it('accepts group with only startDate', () => {
    const validGroup = {
      name: 'Month Start',
      startDate: '2024-06-01',
    };
    const result = purchaseGroupSchema.safeParse(validGroup);
    expect(result.success).toBe(true);
  });

  it('accepts group with same start and end date', () => {
    const validGroup = {
      name: 'Single Day',
      startDate: '2024-06-11',
      endDate: '2024-06-11',
    };
    const result = purchaseGroupSchema.safeParse(validGroup);
    expect(result.success).toBe(true);
  });
});
