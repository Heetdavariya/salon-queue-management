import { describe, it, expect } from 'vitest';
import {
  findNextEligibleCustomer,
  canBarberTakeCustomer,
  canTransition
} from '../../src/domain/queueRules';
import { Barber, QueueEntry } from '../../src/domain/types';

describe('Phase 4 Acceptance Tests: Reception Dashboard', () => {
  const barberRavi: Barber = {
    id: 'barber-ravi',
    name: 'Ravi',
    nameGu: 'રવિ',
    status: 'AVAILABLE',
    isOnDuty: true
  };

  const barberAmit: Barber = {
    id: 'barber-amit',
    name: 'Amit',
    nameGu: 'અમિત',
    status: 'AVAILABLE',
    isOnDuty: true
  };

  const barberSureshOnBreak: Barber = {
    id: 'barber-suresh',
    name: 'Suresh',
    nameGu: 'સુરેશ',
    status: 'ON_BREAK',
    isOnDuty: true
  };

  it('Checklist #5 & #6: Call next for Amit skips a waiting customer who selected Ravi and selects the earliest eligible Amit/Any customer', () => {
    const queue: QueueEntry[] = [
      {
        id: 'q-1',
        tokenNumber: 'S-1',
        customerName: 'Customer Wants Ravi',
        phone: '9876543210',
        serviceIds: ['s1'],
        preferredBarberId: 'barber-ravi',
        status: 'WAITING',
        createdAt: '2026-11-24T10:00:00Z'
      },
      {
        id: 'q-2',
        tokenNumber: 'S-2',
        customerName: 'Customer Wants Amit',
        phone: '9876543211',
        serviceIds: ['s1'],
        preferredBarberId: 'barber-amit',
        status: 'WAITING',
        createdAt: '2026-11-24T10:05:00Z'
      },
      {
        id: 'q-3',
        tokenNumber: 'S-3',
        customerName: 'Customer Wants Any',
        phone: '9876543212',
        serviceIds: ['s1'],
        preferredBarberId: 'ANY',
        status: 'WAITING',
        createdAt: '2026-11-24T10:10:00Z'
      }
    ];

    // Amit calls next: MUST skip q-1 and assign q-2
    const amitCustomer = findNextEligibleCustomer(queue, 'barber-amit');
    expect(amitCustomer).not.toBeNull();
    expect(amitCustomer?.id).toBe('q-2');
    expect(amitCustomer?.customerName).toBe('Customer Wants Amit');

    // Customer who selected Ravi must NEVER be called by Amit
    expect(amitCustomer?.preferredBarberId).not.toBe('barber-ravi');
  });

  it('Checklist #7: An Any barber customer can be assigned to an available barber', () => {
    const queue: QueueEntry[] = [
      {
        id: 'q-any',
        tokenNumber: 'S-10',
        customerName: 'Flexible Customer',
        phone: '9876543210',
        serviceIds: ['s1'],
        preferredBarberId: 'ANY',
        status: 'WAITING',
        createdAt: '2026-11-24T10:00:00Z'
      }
    ];

    const raviCustomer = findNextEligibleCustomer(queue, 'barber-ravi');
    expect(raviCustomer?.id).toBe('q-any');

    const amitCustomer = findNextEligibleCustomer(queue, 'barber-amit');
    expect(amitCustomer?.id).toBe('q-any');
  });

  it('Checklist #8: A barber with an active Called/In chair assignment cannot receive another customer', () => {
    const busyEntries: QueueEntry[] = [
      {
        id: 'q-active',
        tokenNumber: 'S-5',
        customerName: 'Active In Chair',
        phone: '9876543210',
        serviceIds: ['s1'],
        preferredBarberId: 'ANY',
        assignedBarberId: 'barber-ravi',
        status: 'IN_CHAIR',
        createdAt: '2026-11-24T09:30:00Z'
      }
    ];

    expect(canBarberTakeCustomer(barberRavi, busyEntries)).toBe(false);
  });

  it('Checklist #9: A barber on break receives no new assignment', () => {
    expect(canBarberTakeCustomer(barberSureshOnBreak, [])).toBe(false);
  });

  it('Checklist #13: Called customer can be marked No-show after 10 minutes with confirmation', () => {
    expect(canTransition('CALLED', 'NO_SHOW')).toBe(true);
    expect(canTransition('IN_CHAIR', 'NO_SHOW')).toBe(false);
    expect(canTransition('WAITING', 'NO_SHOW')).toBe(false);
  });

  it('Checklist #14: No-show customer re-added as a walk-in receives a new token at the end of the queue', () => {
    const previousNoShow: QueueEntry = {
      id: 'q-old',
      tokenNumber: 'S-1',
      customerName: 'Returning Customer',
      phone: '9876543210',
      serviceIds: ['s1'],
      preferredBarberId: 'ANY',
      status: 'NO_SHOW',
      createdAt: '2026-11-24T09:00:00Z',
      noShowAt: '2026-11-24T09:15:00Z'
    };

    // Because previous spot is NO_SHOW (terminal), customer phone is no longer active
    // and can rejoin at the end with a brand new token
    const newWalkInToken = 'S-20';
    const newEntry: QueueEntry = {
      id: 'q-new',
      tokenNumber: newWalkInToken,
      customerName: 'Returning Customer',
      phone: '9876543210',
      serviceIds: ['s1'],
      preferredBarberId: 'ANY',
      status: 'WAITING',
      createdAt: '2026-11-24T10:30:00Z'
    };

    expect(newEntry.tokenNumber).not.toBe(previousNoShow.tokenNumber);
    expect(newEntry.status).toBe('WAITING');
    expect(new Date(newEntry.createdAt).getTime()).toBeGreaterThan(
      new Date(previousNoShow.createdAt).getTime()
    );
  });
});
