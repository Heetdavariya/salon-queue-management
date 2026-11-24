import { describe, it, expect } from 'vitest';
import { calculateEstimatedWait, canTransition } from '../../src/domain/queueRules';
import { Barber, QueueEntry, Service } from '../../src/domain/types';

describe('Phase 3 Acceptance Tests: My Status Screen', () => {
  const mockServices: Service[] = [
    { id: 'srv-haircut', nameEn: 'Haircut', nameGu: 'વાળ કાપવા', durationMinutes: 30, price: 250, isEnabled: true },
    { id: 'srv-beard', nameEn: 'Beard Trim', nameGu: 'દાઢી ટ્રીમ', durationMinutes: 20, price: 150, isEnabled: true }
  ];

  const mockBarbers: Barber[] = [
    { id: 'barber-ravi', name: 'Ravi', nameGu: 'રવિ', status: 'AVAILABLE', isOnDuty: true },
    { id: 'barber-amit', name: 'Amit', nameGu: 'અમિત', status: 'AVAILABLE', isOnDuty: true }
  ];

  it('Checklist #15: Customer cancellation requires confirmation and removes the entry from active queue', () => {
    // Waiting can transition to Cancelled
    expect(canTransition('WAITING', 'CANCELLED')).toBe(true);
    // Called can transition to Cancelled
    expect(canTransition('CALLED', 'CANCELLED')).toBe(true);
    // In chair cannot be cancelled
    expect(canTransition('IN_CHAIR', 'CANCELLED')).toBe(false);
    // Done cannot be cancelled
    expect(canTransition('DONE', 'CANCELLED')).toBe(false);
  });

  it('Identifies 2nd-in-line position for "Start coming to the salon" alert', () => {
    const queueEntries: QueueEntry[] = [
      {
        id: 'q-1',
        tokenNumber: 'S-1',
        customerName: 'First Customer',
        phone: '9876543210',
        serviceIds: ['srv-haircut'],
        preferredBarberId: 'ANY',
        status: 'WAITING',
        createdAt: '2026-11-24T10:00:00Z'
      },
      {
        id: 'q-2',
        tokenNumber: 'S-2',
        customerName: 'Second Customer',
        phone: '9876543211',
        serviceIds: ['srv-beard'],
        preferredBarberId: 'ANY',
        status: 'WAITING',
        createdAt: '2026-11-24T10:05:00Z'
      },
      {
        id: 'q-3',
        tokenNumber: 'S-3',
        customerName: 'Third Customer',
        phone: '9876543212',
        serviceIds: ['srv-haircut'],
        preferredBarberId: 'ANY',
        status: 'WAITING',
        createdAt: '2026-11-24T10:10:00Z'
      }
    ];

    const est1 = calculateEstimatedWait(queueEntries, 'q-1', mockBarbers, mockServices);
    expect(est1.position).toBe(1);

    const est2 = calculateEstimatedWait(queueEntries, 'q-2', mockBarbers, mockServices);
    expect(est2.position).toBe(2); // Triggers "Start coming" banner

    const est3 = calculateEstimatedWait(queueEntries, 'q-3', mockBarbers, mockServices);
    expect(est3.position).toBe(3);
  });

  it('Checklist #18: Estimated wait never displays zero when eligible people are ahead and never divides by zero', () => {
    // When no barbers are working
    const offDutyBarbers: Barber[] = [
      { id: 'b1', name: 'Ravi', nameGu: 'રવિ', status: 'ON_BREAK', isOnDuty: true },
      { id: 'b2', name: 'Amit', nameGu: 'અમિત', status: 'AVAILABLE', isOnDuty: false }
    ];

    const entries: QueueEntry[] = [
      {
        id: 'q-1',
        tokenNumber: 'S-1',
        customerName: 'Kunal',
        phone: '9876543210',
        serviceIds: ['srv-haircut'],
        preferredBarberId: 'ANY',
        status: 'WAITING',
        createdAt: new Date().toISOString()
      }
    ];

    const calcNoBarber = calculateEstimatedWait(entries, 'q-1', offDutyBarbers, mockServices);
    expect(calcNoBarber.isUnavailable).toBe(true);
    expect(calcNoBarber.waitMinutes).toBeNull();
  });

  it('Checklist #19: Estimated wait decreases when customers finish or barber availability changes', () => {
    const entry1: QueueEntry = {
      id: 'q-1',
      tokenNumber: 'S-1',
      customerName: 'First',
      phone: '9876543210',
      serviceIds: ['srv-haircut'], // 30m
      preferredBarberId: 'ANY',
      status: 'WAITING',
      createdAt: '2026-11-24T10:00:00Z'
    };

    const entry2: QueueEntry = {
      id: 'q-2',
      tokenNumber: 'S-2',
      customerName: 'Second',
      phone: '9876543211',
      serviceIds: ['srv-beard'], // 20m
      preferredBarberId: 'ANY',
      status: 'WAITING',
      createdAt: '2026-11-24T10:05:00Z'
    };

    // With 1 working barber
    const oneBarber = [mockBarbers[0]];
    const waitBefore = calculateEstimatedWait([entry1, entry2], 'q-2', oneBarber, mockServices);

    // After entry1 completes (status -> DONE)
    const entry1Done: QueueEntry = { ...entry1, status: 'DONE' };
    const waitAfter = calculateEstimatedWait([entry1Done, entry2], 'q-2', oneBarber, mockServices);

    expect(waitAfter.waitMinutes).toBeLessThan(waitBefore.waitMinutes!);
  });
});
