/// <reference types="jest" />
import {
  loginSchema,
  registerSchema,
  categorySchema,
  productSchema,
  storeSchema,
} from '../validation';

describe('loginSchema', () => {
  it('should pass with valid email and password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'secret123',
    });
    expect(result.success).toBe(true);
  });

  it('should fail with empty email', () => {
    const result = loginSchema.safeParse({
      email: '',
      password: 'secret123',
    });
    expect(result.success).toBe(false);
  });

  it('should fail with malformed email', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'secret123',
    });
    expect(result.success).toBe(false);
  });

  it('should fail with empty password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('registerSchema', () => {
  it('should pass with valid name, email, and password', () => {
    const result = registerSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'securePass123',
    });
    expect(result.success).toBe(true);
  });

  it('should fail with short password (< 8 chars)', () => {
    const result = registerSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'short1',
    });
    expect(result.success).toBe(false);
  });

  it('should pass with password exactly 8 chars', () => {
    const result = registerSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
      password: '12345678',
    });
    expect(result.success).toBe(true);
  });

  it('should fail with empty name', () => {
    const result = registerSchema.safeParse({
      name: '',
      email: 'john@example.com',
      password: 'securePass123',
    });
    expect(result.success).toBe(false);
  });

  it('should fail with name too long (> 100 chars)', () => {
    const result = registerSchema.safeParse({
      name: 'a'.repeat(101),
      email: 'john@example.com',
      password: 'securePass123',
    });
    expect(result.success).toBe(false);
  });

  it('should fail with password too long (> 100 chars)', () => {
    const result = registerSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'a'.repeat(101),
    });
    expect(result.success).toBe(false);
  });
});

describe('categorySchema', () => {
  it('should pass with valid name', () => {
    const result = categorySchema.safeParse({ name: 'Electronics' });
    expect(result.success).toBe(true);
  });

  it('should fail with empty name', () => {
    const result = categorySchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('should fail with whitespace-only name after trim', () => {
    const result = categorySchema.safeParse({ name: '   ' });
    expect(result.success).toBe(false);
  });

  it('should pass with name at max length (100)', () => {
    const result = categorySchema.safeParse({ name: 'a'.repeat(100) });
    expect(result.success).toBe(true);
  });

  it('should fail with name too long (> 100)', () => {
    const result = categorySchema.safeParse({ name: 'a'.repeat(101) });
    expect(result.success).toBe(false);
  });
});

describe('productSchema', () => {
  it('should pass with valid name', () => {
    const result = productSchema.safeParse({ name: 'Laptop' });
    expect(result.success).toBe(true);
  });

  it('should fail with empty name', () => {
    const result = productSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('should fail with name too long (> 200)', () => {
    const result = productSchema.safeParse({ name: 'a'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('should pass with optional brand provided', () => {
    const result = productSchema.safeParse({
      name: 'Laptop',
      brand: 'Apple',
    });
    expect(result.success).toBe(true);
  });

  it('should pass with optional brand as null', () => {
    const result = productSchema.safeParse({
      name: 'Laptop',
      brand: null,
    });
    expect(result.success).toBe(true);
  });

  it('should pass with optional categoryId as valid UUID', () => {
    const result = productSchema.safeParse({
      name: 'Laptop',
      categoryId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('should fail with invalid categoryId format', () => {
    const result = productSchema.safeParse({
      name: 'Laptop',
      categoryId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('should pass with optional barcode', () => {
    const result = productSchema.safeParse({
      name: 'Laptop',
      barcode: '123456789012',
    });
    expect(result.success).toBe(true);
  });

  it('should pass with barcode at max length (50)', () => {
    const result = productSchema.safeParse({
      name: 'Laptop',
      barcode: '1'.repeat(50),
    });
    expect(result.success).toBe(true);
  });

  it('should fail with barcode too long (> 50)', () => {
    const result = productSchema.safeParse({
      name: 'Laptop',
      barcode: '1'.repeat(51),
    });
    expect(result.success).toBe(false);
  });
});

describe('storeSchema', () => {
  it('should pass with valid name', () => {
    const result = storeSchema.safeParse({ name: 'Walmart' });
    expect(result.success).toBe(true);
  });

  it('should fail with empty name', () => {
    const result = storeSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('should pass with name and location', () => {
    const result = storeSchema.safeParse({
      name: 'Walmart',
      location: 'Downtown',
    });
    expect(result.success).toBe(true);
  });

  it('should pass with location as null', () => {
    const result = storeSchema.safeParse({
      name: 'Walmart',
      location: null,
    });
    expect(result.success).toBe(true);
  });

  it('should pass with name at max length (200)', () => {
    const result = storeSchema.safeParse({ name: 'a'.repeat(200) });
    expect(result.success).toBe(true);
  });

  it('should fail with name too long (> 200)', () => {
    const result = storeSchema.safeParse({ name: 'a'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('should pass with location at max length (200)', () => {
    const result = storeSchema.safeParse({
      name: 'Store',
      location: 'b'.repeat(200),
    });
    expect(result.success).toBe(true);
  });

  it('should fail with location too long (> 200)', () => {
    const result = storeSchema.safeParse({
      name: 'Store',
      location: 'b'.repeat(201),
    });
    expect(result.success).toBe(false);
  });
});
