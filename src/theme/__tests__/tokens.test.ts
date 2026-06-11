/// <reference types="jest" />
import { lightColors, darkColors, typography, spacing, borderRadius, shadows } from '../tokens';

describe('Theme tokens', () => {
  describe('lightColors', () => {
    it('has all 11 keys with correct hex values', () => {
      expect(lightColors.primary).toBe('#0057FF');
      expect(lightColors.secondary).toBe('#23DCE1');
      expect(lightColors.background).toBe('#F5F7FA');
      expect(lightColors.card).toBe('#FFFFFF');
      expect(lightColors.textPrimary).toBe('#111827');
      expect(lightColors.textSecondary).toBe('#6B7280');
      expect(lightColors.border).toBe('#E5E7EB');
      expect(lightColors.success).toBe('#059669');
      expect(lightColors.warning).toBe('#D97706');
      expect(lightColors.error).toBe('#DC2626');
      expect(lightColors.info).toBe('#0284C7');
      expect(Object.keys(lightColors)).toHaveLength(11);
    });
  });

  describe('darkColors', () => {
    it('has all 11 keys with correct hex values', () => {
      expect(darkColors.primary).toBe('#0057FF');
      expect(darkColors.secondary).toBe('#23DCE1');
      expect(darkColors.background).toBe('#0B0D12');
      expect(darkColors.card).toBe('#161A22');
      expect(darkColors.textPrimary).toBe('#F3F4F6');
      expect(darkColors.textSecondary).toBe('#9CA3AF');
      expect(darkColors.border).toBe('#2D3348');
      expect(darkColors.success).toBe('#34D399');
      expect(darkColors.warning).toBe('#FBBF24');
      expect(darkColors.error).toBe('#F87171');
      expect(darkColors.info).toBe('#38BDF8');
      expect(Object.keys(darkColors)).toHaveLength(11);
    });
  });

  describe('typography', () => {
    it('has 8 variants with fontSize/fontWeight/lineHeight', () => {
      expect(typography.display).toEqual({
        fontSize: 36,
        fontWeight: '700',
        lineHeight: 44,
      });
      expect(typography.h1).toEqual({
        fontSize: 28,
        fontWeight: '700',
        lineHeight: 36,
      });
      expect(typography.h2).toEqual({
        fontSize: 22,
        fontWeight: '600',
        lineHeight: 30,
      });
      expect(typography.h3).toEqual({
        fontSize: 18,
        fontWeight: '600',
        lineHeight: 26,
      });
      expect(typography.body).toEqual({
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24,
      });
      expect(typography.bodySmall).toEqual({
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 20,
      });
      expect(typography.caption).toEqual({
        fontSize: 12,
        fontWeight: '400',
        lineHeight: 16,
      });
      expect(typography.button).toEqual({
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
      });
      expect(Object.keys(typography)).toHaveLength(8);
    });
  });

  describe('spacing', () => {
    it('has 8 numeric values in ascending order', () => {
      expect(spacing.xs).toBe(4);
      expect(spacing.sm).toBe(8);
      expect(spacing.md).toBe(12);
      expect(spacing.lg).toBe(16);
      expect(spacing.xl).toBe(20);
      expect(spacing.xxl).toBe(24);
      expect(spacing.xxxl).toBe(32);
      expect(spacing.huge).toBe(48);
      expect(Object.keys(spacing)).toHaveLength(8);

      const values = Object.values(spacing);
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThan(values[i - 1]);
      }
    });
  });

  describe('borderRadius', () => {
    it('has 5 values with full === 9999', () => {
      expect(borderRadius.small).toBe(8);
      expect(borderRadius.medium).toBe(12);
      expect(borderRadius.large).toBe(20);
      expect(borderRadius.xlarge).toBe(24);
      expect(borderRadius.full).toBe(9999);
      expect(Object.keys(borderRadius)).toHaveLength(5);
    });
  });

  describe('shadows', () => {
    it('has 5 levels (sm/md/lg/xl have y/blur/opacity; none is null)', () => {
      expect(shadows.none).toBeNull();
      expect(shadows.sm).toEqual({ y: 1, blur: 2, opacity: 0.05 });
      expect(shadows.md).toEqual({ y: 2, blur: 8, opacity: 0.08 });
      expect(shadows.lg).toEqual({ y: 4, blur: 16, opacity: 0.1 });
      expect(shadows.xl).toEqual({ y: 8, blur: 32, opacity: 0.12 });
      expect(Object.keys(shadows)).toHaveLength(5);
    });
  });

  describe('WCAG AA contrast', () => {
    it('light mode textPrimary on card >= 4.5:1', () => {
      expect(getContrastRatio(lightColors.textPrimary, lightColors.card)).toBeGreaterThanOrEqual(
        4.5,
      );
    });

    it('light mode textSecondary on card >= 4.5:1', () => {
      expect(getContrastRatio(lightColors.textSecondary, lightColors.card)).toBeGreaterThanOrEqual(
        4.5,
      );
    });

    it('dark mode textPrimary on card >= 4.5:1', () => {
      expect(getContrastRatio(darkColors.textPrimary, darkColors.card)).toBeGreaterThanOrEqual(4.5);
    });

    it('dark mode textSecondary on card >= 4.5:1', () => {
      expect(getContrastRatio(darkColors.textSecondary, darkColors.card)).toBeGreaterThanOrEqual(
        4.5,
      );
    });
  });

  describe('triangulate typography thresholds', () => {
    it('display fontSize >= 34', () => {
      expect(typography.display.fontSize).toBeGreaterThanOrEqual(34);
    });

    it('h1 fontSize >= 28', () => {
      expect(typography.h1.fontSize).toBeGreaterThanOrEqual(28);
    });
  });
});

import { getContrastRatio } from '../../utils/contrast';
