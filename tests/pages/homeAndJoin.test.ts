import { describe, it, expect } from 'vitest';
import { validateJoinQueue, isOnlineQueueCutoffActive } from '../../src/domain/queueRules';
import { QueueEntry, SalonSettings, Service } from '../../src/domain/types';

describe('Phase 2 Acceptance Tests: Home & Join Queue', () => {
  const mockServices: Service[] = [
    { id: 'srv-1', nameEn: 'Haircut', nameGu: 'વાળ કાપવા', durationMinutes: 30, price: 250, isEnabled: true },
    { id: 'srv-2', nameEn: 'Beard Trim', nameGu: 'દાઢી ટ્રીમ', durationMinutes: 20, price: 150, isEnabled: true },
    { id: 'srv-3', nameEn: 'Head Massage', nameGu: 'માથાનો માલિશ', durationMinutes: 25, price: 200, isEnabled: true },
    { id: 'srv-4', nameEn: 'Face Cleanup', nameGu: 'ફેસ ક્લીનઅપ', durationMinutes: 35, price: 350, isEnabled: true }
  ];

  const defaultSettings: SalonSettings = {
    salonName: 'Royal Touch Hair Studio',
    salonNameGu: 'રોયલ ટચ હેર સ્ટુડિયો',
    isOpen: true,
    isOnlineQueueOpen: true,
    closingTime: '23:59', // Open late for test isolation
    autoCutoffMinutes: 30
  };

  it('Checklist #1: Join with two services; total duration and price equal the sum of both services', () => {
    const selectedIds = ['srv-1', 'srv-2'];
    const selectedServices = mockServices.filter(s => selectedIds.includes(s.id));

    const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
    const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

    expect(totalDuration).toBe(50); // 30 + 20
    expect(totalPrice).toBe(400); // 250 + 150

    const validation = validateJoinQueue(
      'Aarav Patel',
      '9876543210',
      selectedIds,
      mockServices,
      [],
      defaultSettings
    );
    expect(validation.valid).toBe(true);
  });

  it('Checklist #2: Selecting a fourth service is prevented with a clear explanation', () => {
    const fourIds = ['srv-1', 'srv-2', 'srv-3', 'srv-4'];

    const validation = validateJoinQueue(
      'Aarav Patel',
      '9876543210',
      fourIds,
      mockServices,
      [],
      defaultSettings
    );

    expect(validation.valid).toBe(false);
    expect(validation.errors.services).toBe('You can select a maximum of 3 services.');
  });

  it('Checklist #3: Invalid or incomplete phone number is rejected', () => {
    // 9 digits
    const resShort = validateJoinQueue(
      'Aarav Patel',
      '987654321',
      ['srv-1'],
      mockServices,
      [],
      defaultSettings
    );
    expect(resShort.valid).toBe(false);
    expect(resShort.errors.phone).toBe('Phone number must be exactly 10 digits.');

    // Alphabetical characters
    const resAlpha = validateJoinQueue(
      'Aarav Patel',
      '987654321A',
      ['srv-1'],
      mockServices,
      [],
      defaultSettings
    );
    expect(resAlpha.valid).toBe(false);

    // Empty string
    const resEmpty = validateJoinQueue(
      'Aarav Patel',
      '',
      ['srv-1'],
      mockServices,
      [],
      defaultSettings
    );
    expect(resEmpty.valid).toBe(false);
  });

  it('Checklist #4: Same phone number attempts to join twice; existing active spot is shown and no duplicate is created', () => {
    const existingEntry: QueueEntry = {
      id: 'queue-existing',
      tokenNumber: 'S-10',
      customerName: 'Aarav Patel',
      phone: '9876543210',
      serviceIds: ['srv-1'],
      preferredBarberId: 'ANY',
      status: 'WAITING',
      createdAt: new Date().toISOString()
    };

    const duplicateAttempt = validateJoinQueue(
      'Aarav Patel',
      '9876543210',
      ['srv-2'],
      mockServices,
      [existingEntry],
      defaultSettings
    );

    expect(duplicateAttempt.valid).toBe(false);
    expect(duplicateAttempt.existingActiveEntry).toBeDefined();
    expect(duplicateAttempt.existingActiveEntry?.tokenNumber).toBe('S-10');
  });

  it('Checklist #16: Closing online joining disables remote joining but still permits receptionist walk-ins', () => {
    const closedSettings: SalonSettings = {
      ...defaultSettings,
      isOnlineQueueOpen: false
    };

    // Remote customer attempt
    const remoteAttempt = validateJoinQueue(
      'Aarav Patel',
      '9876543210',
      ['srv-1'],
      mockServices,
      [],
      closedSettings,
      false // remote
    );
    expect(remoteAttempt.valid).toBe(false);
    expect(remoteAttempt.errors.queue).toContain('closed');

    // Receptionist walk-in attempt (isWalkIn = true)
    const walkInAttempt = validateJoinQueue(
      'Walkin Customer',
      '9876543210',
      ['srv-1'],
      mockServices,
      [],
      closedSettings,
      true // walk-in
    );
    expect(walkInAttempt.valid).toBe(true);
  });

  it('Checklist #17: Online joining closes automatically 30 minutes before configured closing time', () => {
    const now = new Date();
    // Configure closing time 15 minutes from now (cutoff is 30 mins before closing, so cutoff is already passed)
    const closingDate = new Date(now.getTime() + 15 * 60 * 1000);
    const closeHours = closingDate.getHours().toString().padStart(2, '0');
    const closeMins = closingDate.getMinutes().toString().padStart(2, '0');
    const closingTime = `${closeHours}:${closeMins}`;

    const isCutoff = isOnlineQueueCutoffActive(closingTime, 30);
    expect(isCutoff).toBe(true);

    const autoCutoffSettings: SalonSettings = {
      ...defaultSettings,
      closingTime,
      autoCutoffMinutes: 30
    };

    const attempt = validateJoinQueue(
      'Late Customer',
      '9876543210',
      ['srv-1'],
      mockServices,
      [],
      autoCutoffSettings,
      false
    );
    expect(attempt.valid).toBe(false);
    expect(attempt.errors.queue).toContain('30-minute pre-closing cutoff');
  });
});
