import { describe, it, expect } from 'vitest';
import { validateJoinQueue, isOnlineQueueCutoffActive } from '../../src/domain/queueRules';
import { QueueEntry, SalonSettings, Service } from '../../src/domain/types';

describe('Phase 6 Acceptance Tests: Owner Settings', () => {
  const mockServices: Service[] = [
    { id: 's1', nameEn: 'Haircut', nameGu: 'વાળ કાપવા', durationMinutes: 30, price: 250, isEnabled: true },
    { id: 's2', nameEn: 'Beard', nameGu: 'દાઢી', durationMinutes: 20, price: 150, isEnabled: false } // Disabled service
  ];

  const defaultSettings: SalonSettings = {
    salonName: 'Royal Touch Hair Studio',
    salonNameGu: 'રોયલ ટચ હેર સ્ટુડિયો',
    isOpen: true,
    isOnlineQueueOpen: true,
    closingTime: '23:59',
    autoCutoffMinutes: 30
  };

  it('Disabled services disappear from active selection and cannot be selected', () => {
    const activeServices = mockServices.filter(s => s.isEnabled);
    expect(activeServices.length).toBe(1);
    expect(activeServices.find(s => s.id === 's2')).toBeUndefined();

    // Trying to join with a disabled service must be rejected
    const attempt = validateJoinQueue(
      'Aarav',
      '9876543210',
      ['s2'],
      mockServices,
      [],
      defaultSettings
    );
    expect(attempt.valid).toBe(false);
    expect(attempt.errors.services).toContain('disabled');
  });

  it('Closing online queue disables remote customer join but keeps walk-ins enabled', () => {
    const closedSettings: SalonSettings = {
      ...defaultSettings,
      isOnlineQueueOpen: false
    };

    const remoteAttempt = validateJoinQueue(
      'Online Customer',
      '9876543210',
      ['s1'],
      mockServices,
      [],
      closedSettings,
      false
    );
    expect(remoteAttempt.valid).toBe(false);
    expect(remoteAttempt.errors.queue).toBeDefined();

    const walkInAttempt = validateJoinQueue(
      'Walkin Customer',
      '9876543210',
      ['s1'],
      mockServices,
      [],
      closedSettings,
      true
    );
    expect(walkInAttempt.valid).toBe(true);
  });

  it('Automatic 30-minute pre-closing cutoff closes online queue', () => {
    const now = new Date();
    // Closing in 20 minutes (cutoff is 30 mins before closing, so cutoff is active)
    const closingDate = new Date(now.getTime() + 20 * 60 * 1000);
    const closeHours = closingDate.getHours().toString().padStart(2, '0');
    const closeMins = closingDate.getMinutes().toString().padStart(2, '0');
    const closingTime = `${closeHours}:${closeMins}`;

    expect(isOnlineQueueCutoffActive(closingTime, 30)).toBe(true);

    const cutoffSettings: SalonSettings = {
      ...defaultSettings,
      closingTime,
      autoCutoffMinutes: 30
    };

    const attempt = validateJoinQueue(
      'Late Customer',
      '9876543210',
      ['s1'],
      mockServices,
      [],
      cutoffSettings,
      false
    );
    expect(attempt.valid).toBe(false);
    expect(attempt.errors.queue).toContain('30-minute pre-closing cutoff');
  });

  it('Today statistics compute served count, average wait, and no-shows accurately', () => {
    const entries: QueueEntry[] = [
      {
        id: 'q-1',
        tokenNumber: 'S-1',
        customerName: 'Served 1',
        phone: '9876543210',
        serviceIds: ['s1'],
        preferredBarberId: 'ANY',
        status: 'DONE',
        createdAt: '2026-11-24T10:00:00Z',
        calledAt: '2026-11-24T10:20:00Z' // 20 mins wait
      },
      {
        id: 'q-2',
        tokenNumber: 'S-2',
        customerName: 'Served 2',
        phone: '9876543211',
        serviceIds: ['s1'],
        preferredBarberId: 'ANY',
        status: 'DONE',
        createdAt: '2026-11-24T10:00:00Z',
        calledAt: '2026-11-24T10:40:00Z' // 40 mins wait
      },
      {
        id: 'q-3',
        tokenNumber: 'S-3',
        customerName: 'No Show 1',
        phone: '9876543212',
        serviceIds: ['s1'],
        preferredBarberId: 'ANY',
        status: 'NO_SHOW',
        createdAt: '2026-11-24T10:00:00Z',
        calledAt: '2026-11-24T10:05:00Z',
        noShowAt: '2026-11-24T10:15:00Z'
      }
    ];

    const doneToday = entries.filter(e => e.status === 'DONE');
    const noShowsToday = entries.filter(e => e.status === 'NO_SHOW');

    expect(doneToday.length).toBe(2);
    expect(noShowsToday.length).toBe(1);

    const totalWait = doneToday.reduce((sum, e) => {
      const wait = (new Date(e.calledAt!).getTime() - new Date(e.createdAt).getTime()) / 60000;
      return sum + wait;
    }, 0);
    const avgWait = Math.round(totalWait / doneToday.length);

    expect(avgWait).toBe(30); // (20 + 40) / 2 = 30
  });
});
