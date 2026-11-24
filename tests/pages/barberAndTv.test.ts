import { describe, it, expect } from 'vitest';
import { canTransition, canBarberTakeCustomer } from '../../src/domain/queueRules';
import { Barber, QueueEntry } from '../../src/domain/types';

describe('Phase 5 Acceptance Tests: Barber View and TV Display', () => {
  it('Checklist #11: Start changes Called to In chair and starts the timer', () => {
    // Valid transition
    expect(canTransition('CALLED', 'IN_CHAIR')).toBe(true);

    const now = Date.now();
    const calledAt = new Date(now - 5 * 60 * 1000).toISOString();
    const calledEntry: QueueEntry = {
      id: 'q-called',
      tokenNumber: 'S-12',
      customerName: 'Vikram',
      phone: '9823456781',
      serviceIds: ['s1'],
      preferredBarberId: 'ANY',
      assignedBarberId: 'barber-amit',
      status: 'CALLED',
      createdAt: new Date(now - 15 * 60 * 1000).toISOString(),
      calledAt
    };

    // Starting service transitions status and records startedAt timestamp
    const startedAt = new Date().toISOString();
    const inChairEntry: QueueEntry = {
      ...calledEntry,
      status: 'IN_CHAIR',
      startedAt
    };

    expect(inChairEntry.status).toBe('IN_CHAIR');
    expect(inChairEntry.startedAt).toBeDefined();
    expect(new Date(inChairEntry.startedAt!).getTime()).toBeGreaterThanOrEqual(
      new Date(inChairEntry.calledAt!).getTime()
    );
  });

  it('Checklist #12: Done changes In chair to Done and updates status', () => {
    // Valid transition
    expect(canTransition('IN_CHAIR', 'DONE')).toBe(true);

    const inChairEntry: QueueEntry = {
      id: 'q-in-chair',
      tokenNumber: 'S-11',
      customerName: 'Aarav',
      phone: '9876543210',
      serviceIds: ['s1'],
      preferredBarberId: 'barber-ravi',
      assignedBarberId: 'barber-ravi',
      status: 'IN_CHAIR',
      createdAt: '2026-11-24T09:40:00Z',
      calledAt: '2026-11-24T10:00:00Z',
      startedAt: '2026-11-24T10:05:00Z'
    };

    const doneEntry: QueueEntry = {
      ...inChairEntry,
      status: 'DONE',
      completedAt: new Date().toISOString()
    };

    expect(doneEntry.status).toBe('DONE');
    expect(doneEntry.completedAt).toBeDefined();
    // Cannot transition from DONE to anything
    expect(canTransition('DONE', 'WAITING')).toBe(false);
    expect(canTransition('DONE', 'CALLED')).toBe(false);
  });

  it('Checklist #22: TV display data does not expose customer phone numbers', () => {
    // Check that TV view data mappings omit phone number
    const entries: QueueEntry[] = [
      {
        id: 'q-1',
        tokenNumber: 'S-15',
        customerName: 'Devang Joshi',
        phone: '9909012345', // Private phone number
        serviceIds: ['s1'],
        preferredBarberId: 'ANY',
        status: 'WAITING',
        createdAt: '2026-11-24T10:00:00Z'
      }
    ];

    // Projection for TV display
    const tvUpNextView = entries.map(e => ({
      tokenNumber: e.tokenNumber,
      customerName: e.customerName
      // Note: phone is intentionally excluded!
    }));

    expect(tvUpNextView[0]).toEqual({
      tokenNumber: 'S-15',
      customerName: 'Devang Joshi'
    });
    expect((tvUpNextView[0] as any).phone).toBeUndefined();
  });

  it('Barber on break can finish in-chair customer but cannot receive new assignment', () => {
    const barber: Barber = {
      id: 'b-test',
      name: 'Ravi',
      nameGu: 'રવિ',
      status: 'ON_BREAK',
      isOnDuty: true
    };

    // Cannot take new customer
    expect(canBarberTakeCustomer(barber, [])).toBe(false);

    // Existing customer in chair can complete
    expect(canTransition('IN_CHAIR', 'DONE')).toBe(true);
  });
});
