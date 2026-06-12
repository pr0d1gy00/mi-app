import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const productSchema = z.object({
  name: z.string().trim().min(1).max(200),
  brand: z.string().max(100).nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  barcode: z.string().max(50).nullable().optional(),
});

export const storeSchema = z.object({
  name: z.string().trim().min(1).max(200),
  location: z.string().max(200).nullable().optional(),
});

// Purchase item schema (inner schema, used in purchaseSchema)
const purchaseItemSchema = z.object({
  productId: z.string().uuid().nullable().optional(),
  productName: z.string().trim().min(1, 'Product name is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.string().regex(/^\d+\.?\d{0,2}$/, 'Invalid price format'),
  notes: z.string().max(500).nullable().optional(),
});

export const purchaseSchema = z.object({
  storeId: z.string().uuid().nullable().optional(),
  totalAmount: z.string().regex(/^\d+\.?\d{0,2}$/, 'Invalid amount format'),
  currency: z.string().default('USD'),
  notes: z.string().max(500).nullable().optional(),
  purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  items: z.array(purchaseItemSchema).min(1, 'At least one item is required'),
});

export const purchaseGroupSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(100),
    description: z.string().max(500).nullable().optional(),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
      .nullable()
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
      .nullable()
      .optional(),
  })
  .refine(
    (data) => {
      // If both dates are provided, endDate must be >= startDate
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    },
  );

// Exchange Rate validation
export const exchangeRateSchema = z.object({
  baseCurrency: z.string().length(3), // e.g., 'USD'
  targetCurrency: z.string().length(3), // e.g., 'VES'
  rate: z.string().regex(/^\d+\.?\d{0,4}$/, 'Invalid rate format'),
  source: z.enum(['BCV', 'Paralelo', 'Custom']),
  rateDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
});

export const customRateSchema = z.object({
  rate: z.string().regex(/^\d+\.?\d{0,4}$/, 'Invalid rate format'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
});
