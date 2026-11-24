import { describe, it, expect } from 'vitest';
import {
  canTransition,
  isEntryActive,
  findNextEligibleCustomer,
  canBarberTakeCustomer,
  calculateEstimatedWait,
  isOnlineQueueCutoffActive,
  validateJoinQueue
} from '../../src/domain/queueRules';
import { Barber, QueueEntry, SalonSettings, Service } from '../../src/domain/types';

describe('Salon Queue Rules & Business Logic', () => {
  const mockServices: Service[] = [
    { id: 's1', nameEn: 'Haircut', nameGu: 'વાળ કાપવા', durationMinutes: 30, price: 250, isEnabled: true },
    { id: 's2', nameEn: 'Beard', nameGu: 'દાઢી', durationMinutes: 20, price: 150, isEnabled: true },
    { id: 's3', nameEn: 'Massage', nameGu: 'માલિશ', durationMinutes: 25, price: 200, isEnabled: true },
    { id: 's4', nameEn: 'Facial', nameGu: 'ફેસિયલ', durationMinutes: 40, price: 400, isEnabled: true },
    { id: 's-disabled', nameEn: 'Disabled', nameGu: 'બંધ', durationMinutes: 15, price: 100, isEnabled: false }
  ];

  const mockBarbers: Barber[] = [
    { id: 'b-ravi', name: 'Ravi', nameGu: 'રવિ', status: 'AVAILABLE', isOnDuty: true },
    { id: 'b-amit', name: 'Amit', nameGu: 'અમિત', status: 'AVAILABLE', isOnDuty: true },
    { id: 'b-suresh', name: 'Suresh', nameGu: 'સુરેશ', status: 'ON_BREAK', isOnDuty: true }
  ];

  const mockSettings: SalonSettings = {
    salonName: 'Royal Touch Hair Studio',
    salonNameGu: 'રોયલ ટચ હેર સ્ટુડિયો',
    isOpen: true,
    isOnlineQueueOpen: true,
    closingTime: '21:00',
    autoCutoffMinutes: 30
  };

  it('1. Transition rules follow documented lifecycle', () => {
    // Allowed transitions
    expect(canTransition('WAITING', 'CALLED')).toBe(true);
    expect(canTransition('WAITING', 'CANCELLED')).toBe(true);
    expect(canTransition('CALLED', 'IN_CHAIR')).toBe(true);
    expect(canTransition('CALLED', 'NO_SHOW')).toBe(true);
    expect(canTransition('CALLED', 'CANCELLED')).toBe(true);
    expect(canTransition('IN_CHAIR', 'DONE')).toBe(true);

    // Forbidden transitions
    expect(canTransition('WAITING', 'IN_CHAIR')).toBe(false);
    expect(canTransition('WAITING', 'DONE')).toBe(false);
    expect(canTransition('DONE', 'WAITING')).toBe(false);
    expect(canTransition('DONE', 'CALLED')).toBe(false);
    expect(canTransition('NO_SHOW', 'WAITING')).toBe(false);
    expect(canTransition('CANCELLED', 'WAITING')).toBe(false);
    expect(canTransition('IN_CHAIR', 'CANCELLED')).toBe(false);
  });

  it('2. Active spot status checking', () => {
    expect(isEntryActive('WAITING')).toBe(true);
    expect(isEntryActive('CALLED')).toBe(true);
    expect(isEntryActive('IN_CHAIR')).toBe(true);
    expect(isEntryActive('DONE')).toBe(false);
    expect(isEntryActive('CANCELLED')).toBe(false);
    expect(isEntryActive('NO_SHOW')).toBe(false);
  });

  it('3. Phone number validation requires exactly 10 digits', () => {
    const invalidPhoneResult = validateJoinQueue(
      'Aarav',
      '12345',
      ['s1'],
      mockServices,
      [],
      mockSettings
    );
    expect(invalidPhoneResult.valid).toBe(false);
    expect(invalidPhoneResult.errors.phone).toBeDefined();

    const validPhoneResult = validateJoinQueue(
      'Aarav',
      '9876543210',
      ['s1'],
      mockServices,
      [],
      mockSettings
    );
    expect(validPhoneResult.valid).toBe(true);
  });

  it('4. Prevents selecting more than 3 services', () => {
    const fourServicesResult = validateJoinQueue(
      'Aarav',
      '9876543210',
      ['s1', 's2', 's3', 's4'],
      mockServices,
      [],
      mockSettings
    );
    expect(fourServicesResult.valid).toBe(false);
    expect(fourServicesResult.errors.services).toContain('maximum of 3 services');
  });

  it('5. Prevents selecting disabled services', () => {
    const disabledServiceResult = validateJoinQueue(
      'Aarav',
      '9876543210',
      ['s-disabled'],
      mockServices,
      [],
      mockSettings
    );
    expect(disabledServiceResult.valid).toBe(false);
    expect(disabledServiceResult.errors.services).toContain('disabled');
  });

  it('6. Duplicate phone detection prevents multiple active spots', () => {
    const activeEntries: QueueEntry[] = [
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

    const duplicateResult = validateJoinQueue(
      'Aarav Patel',
      '9876543210',
      ['s2'],
      mockServices,
      activeEntries,
      mockSettings
    );
    expect(duplicateResult.valid).toBe(false);
    expect(duplicateResult.existingActiveEntry?.id).toBe('q-1');
  });

  it('7. FCFS Barber selection: Customer who selected Ravi is never called by Amit', () => {
    const entries: QueueEntry[] = [
      {
        id: 'q-1',
        tokenNumber: 'S-1',
        customerName: 'Customer For Ravi',
        phone: '9876543210',
        serviceIds: ['s1'],
        preferredBarberId: 'b-ravi',
        status: 'WAITING',
        createdAt: '2026-11-24T10:00:00Z'
      },
      {
        id: 'q-2',
        tokenNumber: 'S-2',
        customerName: 'Customer For Any',
        phone: '9876543211',
        serviceIds: ['s1'],
        preferredBarberId: 'ANY',
        status: 'WAITING',
        createdAt: '2026-11-24T10:05:00Z'
      }
    ];

    // Amit calls next: MUST skip q-1 (who asked for Ravi) and select q-2
    const amitNext = findNextEligibleCustomer(entries, 'b-amit');
    expect(amitNext?.id).toBe('q-2');

    // Ravi calls next: MUST pick q-1 (earliest eligible)
    const raviNext = findNextEligibleCustomer(entries, 'b-ravi');
    expect(raviNext?.id).toBe('q-1');
  });

  it('8. Barber on break or already assigned cannot receive new customer', () => {
    const suresh = mockBarbers.find(b => b.id === 'b-suresh')!;
    expect(canBarberTakeCustomer(suresh, [])).toBe(false);

    const ravi = mockBarbers.find(b => b.id === 'b-ravi')!;
    const busyEntries: QueueEntry[] = [
      {
        id: 'q-10',
        tokenNumber: 'S-10',
        customerName: 'Active',
        phone: '9876543210',
        serviceIds: ['s1'],
        preferredBarberId: 'ANY',
        assignedBarberId: 'b-ravi',
        status: 'CALLED',
        createdAt: new Date().toISOString()
      }
    ];
    expect(canBarberTakeCustomer(ravi, busyEntries)).toBe(false);
  });
});
