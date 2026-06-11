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
