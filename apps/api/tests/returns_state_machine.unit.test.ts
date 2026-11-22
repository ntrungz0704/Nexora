import { describe, it, expect } from 'vitest';
import {
  CreateReturnRequestInputSchema,
  UpdateReturnStatusInputSchema,
  type ReturnRequestStatus,
} from '@nexora/shared';

const ALLOWED_TRANSITIONS: Record<ReturnRequestStatus, ReturnRequestStatus[]> = {
  PENDING: ['APPROVED', 'REJECTED'],
  APPROVED: ['PROCESSING', 'REJECTED'],
  PROCESSING: ['COMPLETED', 'REJECTED'],
  REJECTED: [],
  COMPLETED: [],
};

function isValidTransition(from: ReturnRequestStatus, to: ReturnRequestStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

function isWithinReturnWindow(deliveredAt: Date, now: Date = new Date()): boolean {
  const diffMs = now.getTime() - deliveredAt.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= 7 && diffDays >= 0;
}

function calculateRemainingEligibleQuantity(
  purchasedQuantity: number,
  previousReturns: Array<{ quantity: number; status: ReturnRequestStatus }>,
): number {
  const nonRejectedRequested = previousReturns
    .filter((r) => r.status !== 'REJECTED')
    .reduce((sum, r) => sum + r.quantity, 0);
  return Math.max(0, purchasedQuantity - nonRejectedRequested);
}

describe('Return State Machine & Policy Unit Tests (Isolated)', () => {
  describe('State Machine Transitions', () => {
    it('SM-01: Should allow valid transitions from PENDING', () => {
      expect(isValidTransition('PENDING', 'APPROVED')).toBe(true);
      expect(isValidTransition('PENDING', 'REJECTED')).toBe(true);
      expect(isValidTransition('PENDING', 'PROCESSING')).toBe(false);
      expect(isValidTransition('PENDING', 'COMPLETED')).toBe(false);
      expect(isValidTransition('PENDING', 'PENDING')).toBe(false);
    });

    it('SM-02: Should allow valid transitions from APPROVED', () => {
      expect(isValidTransition('APPROVED', 'PROCESSING')).toBe(true);
      expect(isValidTransition('APPROVED', 'REJECTED')).toBe(true);
      expect(isValidTransition('APPROVED', 'COMPLETED')).toBe(false);
      expect(isValidTransition('APPROVED', 'PENDING')).toBe(false);
      expect(isValidTransition('APPROVED', 'APPROVED')).toBe(false);
    });

    it('SM-03: Should allow valid transitions from PROCESSING', () => {
      expect(isValidTransition('PROCESSING', 'COMPLETED')).toBe(true);
      expect(isValidTransition('PROCESSING', 'REJECTED')).toBe(true);
      expect(isValidTransition('PROCESSING', 'APPROVED')).toBe(false);
      expect(isValidTransition('PROCESSING', 'PENDING')).toBe(false);
      expect(isValidTransition('PROCESSING', 'PROCESSING')).toBe(false);
    });

    it('SM-04: Terminal states COMPLETED and REJECTED should have 0 allowed transitions', () => {
      const allStatuses: ReturnRequestStatus[] = [
        'PENDING',
        'APPROVED',
        'REJECTED',
        'PROCESSING',
        'COMPLETED',
      ];
      for (const s of allStatuses) {
        expect(isValidTransition('COMPLETED', s)).toBe(false);
        expect(isValidTransition('REJECTED', s)).toBe(false);
      }
    });
  });

  describe('7-Day Window Policy', () => {
    it('WIN-01: Returns within 7 days from deliveredAt are eligible', () => {
      const now = new Date('2026-11-22T12:00:00Z');

      // Exactly now
      expect(isWithinReturnWindow(now, now)).toBe(true);

      // 3 days ago
      const threeDaysAgo = new Date('2026-11-19T12:00:00Z');
      expect(isWithinReturnWindow(threeDaysAgo, now)).toBe(true);

      // Exactly 7 days (168 hours)
      const exactly7DaysAgo = new Date('2026-11-15T12:00:00Z');
      expect(isWithinReturnWindow(exactly7DaysAgo, now)).toBe(true);
    });

    it('WIN-02: Returns past 7 days from deliveredAt are rejected', () => {
      const now = new Date('2026-11-22T12:00:00Z');

      // 7 days and 1 second ago
      const slightlyOver = new Date('2026-11-15T11:59:59Z');
      expect(isWithinReturnWindow(slightlyOver, now)).toBe(false);

      // 10 days ago
      const tenDaysAgo = new Date('2026-11-12T12:00:00Z');
      expect(isWithinReturnWindow(tenDaysAgo, now)).toBe(false);

      // Future delivery date (negative diff)
      const futureDate = new Date('2026-11-23T12:00:00Z');
      expect(isWithinReturnWindow(futureDate, now)).toBe(false);
    });
  });

  describe('Remaining Eligible Return Quantity Calculation', () => {
    it('QTY-01: Should accurately deduct previous pending, approved, and completed requests but ignore rejected ones', () => {
      const purchased = 10;
      const history: Array<{ quantity: number; status: ReturnRequestStatus }> = [
        { quantity: 2, status: 'COMPLETED' },
        { quantity: 3, status: 'REJECTED' }, // Rejected request does NOT consume eligibility
        { quantity: 1, status: 'APPROVED' },
        { quantity: 2, status: 'PROCESSING' },
      ];

      // Eligible: 10 - (2 + 1 + 2) = 5
      expect(calculateRemainingEligibleQuantity(purchased, history)).toBe(5);
    });

    it('QTY-02: Should return 0 when all purchased items are tied to active return requests', () => {
      const purchased = 3;
      const history: Array<{ quantity: number; status: ReturnRequestStatus }> = [
        { quantity: 1, status: 'PENDING' },
        { quantity: 2, status: 'APPROVED' },
      ];

      expect(calculateRemainingEligibleQuantity(purchased, history)).toBe(0);
    });
  });

  describe('Zod Schema Contracts', () => {
    it('SCHEMA-01: CreateReturnRequestInputSchema accepts valid payload', () => {
      const valid = {
        orderCode: 'NX-2026-0001',
        reason: 'Sản phẩm lỗi kết nối Bluetooth',
        items: [{ orderItemId: '101', quantity: 1, resolution: 'REFUND' }],
      };
      const result = CreateReturnRequestInputSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('SCHEMA-02: CreateReturnRequestInputSchema rejects empty items or short reason', () => {
      const emptyItems = {
        orderCode: 'NX-2026-0001',
        reason: 'Lỗi',
        items: [],
      };
      const result1 = CreateReturnRequestInputSchema.safeParse(emptyItems);
      expect(result1.success).toBe(false);

      const invalidQty = {
        orderCode: 'NX-2026-0001',
        reason: 'Lỗi chuột',
        items: [{ orderItemId: '101', quantity: 0 }],
      };
      const result2 = CreateReturnRequestInputSchema.safeParse(invalidQty);
      expect(result2.success).toBe(false);
    });

    it('SCHEMA-03: UpdateReturnStatusInputSchema parses status updates correctly', () => {
      const validApproved = {
        status: 'APPROVED',
        notes: 'Chấp nhận kiểm tra',
      };
      const res = UpdateReturnStatusInputSchema.safeParse(validApproved);
      expect(res.success).toBe(true);
    });
  });
});
