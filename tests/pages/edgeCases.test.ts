import { describe, it, expect } from 'vitest';
import {
  calculateEstimatedWait,
  findNextEligibleCustomer,
  validateJoinQueue
} from '../../src/domain/queueRules';
import { translations } from '../../src/i18n/translations';
import { Barber, QueueEntry, SalonSettings, Service } from '../../src/domain/types';

describe('Phase 7 Acceptance Tests: Edge Cases, Translations & Integrity', () => {
  const mockServices: Service[] = [
    { id: 's1', nameEn: 'Haircut', nameGu: 'વાળ કાપવા', durationMinutes: 30, price: 250, isEnabled: true },
    { id: 's2', nameEn: 'Beard', nameGu: 'દાઢી', durationMinutes: 20, price: 150, isEnabled: true }
  ];

  const defaultSettings: SalonSettings = {
    salonName: 'Royal Touch Hair Studio',
    salonNameGu: 'રોયલ ટચ હેર સ્ટુડિયો',
    isOpen: true,
    isOnlineQueueOpen: true,
    closingTime: '23:59',
    autoCutoffMinutes: 30
  };

  it('Checklist #20: English and Gujarati translation dictionaries have complete parity', () => {
    const enKeys = Object.keys(translations.en) as (keyof typeof translations.en)[];
    const guKeys = Object.keys(translations.gu) as (keyof typeof translations.gu)[];

    expect(guKeys.length).toBe(enKeys.length);

    enKeys.forEach(key => {
      expect(translations.gu[key]).toBeDefined();
      expect(typeof translations.gu[key]).toBe('string');
      expect(translations.gu[key].length).toBeGreaterThan(0);
    });
  });

  it('Never divides by zero when all barbers are on break or off-duty', () => {
    const allOnBreakBarbers: Barber[] = [
      { id: 'b1', name: 'Ravi', nameGu: 'રવિ', status: 'ON_BREAK', isOnDuty: true },
      { id: 'b2', name: 'Amit', nameGu: 'અમિત', status: 'ON_BREAK', isOnDuty: true },
      { id: 'b3', name: 'Suresh', nameGu: 'સુરેશ', status: 'AVAILABLE', isOnDuty: false } // Off duty
    ];

    const entries: QueueEntry[] = [
      {
        id: 'q-1',
        tokenNumber: 'S-1',
        customerName: 'Aarav',
        phone: '9876543210',
        serviceIds: ['s1'],
        preferredBarberId: 'ANY',
        status: 'WAITING',
        createdAt: new Date().toISOString()
      }
    ];

    const result = calculateEstimatedWait(entries, 'q-1', allOnBreakBarbers, mockServices);
    expect(result.isUnavailable).toBe(true);
    expect(result.waitMinutes).toBeNull();
  });

  it('Atomic reservation: once a customer is called, findNextEligibleCustomer never selects them again', () => {
    const queue: QueueEntry[] = [
      {
        id: 'q-1',
        tokenNumber: 'S-1',
        customerName: 'Customer 1',
        phone: '9876543210',
        serviceIds: ['s1'],
        preferredBarberId: 'ANY',
        status: 'WAITING',
        createdAt: '2026-11-24T10:00:00Z'
      },
      {
        id: 'q-2',
        tokenNumber: 'S-2',
        customerName: 'Customer 2',
        phone: '9876543211',
        serviceIds: ['s1'],
        preferredBarberId: 'ANY',
        status: 'WAITING',
        createdAt: '2026-11-24T10:05:00Z'
      }
    ];

    // Staff 1 calls next
    const firstCall = findNextEligibleCustomer(queue, 'barber-ravi');
    expect(firstCall?.id).toBe('q-1');

    // Simulate entry 1 transitioned to CALLED
    const updatedQueue: QueueEntry[] = queue.map(e =>
      e.id === firstCall?.id
        ? { ...e, status: 'CALLED' as const, assignedBarberId: 'barber-ravi' }
        : e
    );

    // Staff 2 immediately calls next for Amit
    const secondCall = findNextEligibleCustomer(updatedQueue, 'barber-amit');
    expect(secondCall?.id).toBe('q-2');
    expect(secondCall?.id).not.toBe('q-1');
  });

  it('Phone number can join again once earlier spot is Cancelled or Done', () => {
    const finishedEntries: QueueEntry[] = [
      {
        id: 'q-cancelled',
        tokenNumber: 'S-1',
        customerName: 'Aarav Patel',
        phone: '9876543210',
        serviceIds: ['s1'],
        preferredBarberId: 'ANY',
        status: 'CANCELLED',
        createdAt: '2026-11-24T09:00:00Z'
      }
    ];

    // Can join again
    const canJoinAgain = validateJoinQueue(
      'Aarav Patel',
      '9876543210',
      ['s1'],
      mockServices,
      finishedEntries,
      defaultSettings
    );
    expect(canJoinAgain.valid).toBe(true);
    expect(canJoinAgain.existingActiveEntry).toBeUndefined();
  });
});
