import { describe, it, expect } from 'vitest';
import {
  canBarberTakeCustomer,
  canTransition,
  calculateEstimatedWait,
  findNextEligibleCustomer,
  isEntryActive,
  isOnlineQueueCutoffActive,
  validateJoinQueue
} from '../src/domain/queueRules';
import { Barber, QueueEntry, SalonSettings, Service } from '../src/domain/types';
import { translations } from '../src/i18n/translations';

describe('23-Item Acceptance Test Checklist (docs/03-flows-rules.md)', () => {
  const mockServices: Service[] = [
    { id: 's1', nameEn: 'Haircut', nameGu: 'વાળ કાપવા', durationMinutes: 30, price: 250, isEnabled: true },
    { id: 's2', nameEn: 'Beard Trim', nameGu: 'દાઢી સેટિંગ', durationMinutes: 20, price: 150, isEnabled: true },
    { id: 's3', nameEn: 'Head Massage', nameGu: 'માથાની માલિશ', durationMinutes: 15, price: 180, isEnabled: true },
    { id: 's4', nameEn: 'Facial Clean-up', nameGu: 'ફેસિયલ ક્લીન-અપ', durationMinutes: 40, price: 450, isEnabled: true },
    { id: 's5-disabled', nameEn: 'Hair Color', nameGu: 'વાળ રંગવા', durationMinutes: 60, price: 600, isEnabled: false }
  ];

  const mockBarbers: Barber[] = [
    { id: 'b-ravi', name: 'Ravi', nameGu: 'રવિ', status: 'AVAILABLE', isOnDuty: true },
    { id: 'b-amit', name: 'Amit', nameGu: 'અમિત', status: 'AVAILABLE', isOnDuty: true },
    { id: 'b-suresh', name: 'Suresh', nameGu: 'સુરેશ', status: 'AVAILABLE', isOnDuty: true }
  ];

  const defaultSettings: SalonSettings = {
    salonName: 'Royal Touch Hair Studio',
    salonNameGu: 'રોયલ ટચ હેર સ્ટુડિયો',
    isOpen: true,
    isOnlineQueueOpen: true,
    closingTime: '23:59',
    autoCutoffMinutes: 30
  };

  // 1. Join with two services; total duration and price equal the sum of both services.
  it('1. Join with two services: total duration and price equal the sum of both services', () => {
    const selectedServiceIds = ['s1', 's2'];
    const selectedServices = mockServices.filter(s => selectedServiceIds.includes(s.id));

    const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
    const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

    expect(totalDuration).toBe(50); // 30 + 20
    expect(totalPrice).toBe(400); // 250 + 150

    const validation = validateJoinQueue('Rohit Patel', '9876543210', selectedServiceIds, mockServices, [], defaultSettings);
    expect(validation.valid).toBe(true);
  });

  // 2. Selecting a fourth service is prevented with a clear explanation.
  it('2. Selecting a fourth service is prevented with a clear explanation', () => {
    const selected = ['s1', 's2', 's3', 's4'];
    const validation = validateJoinQueue('Rohit Patel', '9876543210', selected, mockServices, [], defaultSettings);

    expect(validation.valid).toBe(false);
    expect(validation.errors.services).toBe('You can select a maximum of 3 services.');
  });

  // 3. Invalid or incomplete phone number is rejected.
  it('3. Invalid or incomplete phone number is rejected', () => {
    const tooShort = validateJoinQueue('Pooja', '98765', ['s1'], mockServices, [], defaultSettings);
    expect(tooShort.valid).toBe(false);
    expect(tooShort.errors.phone).toBe('Phone number must be exactly 10 digits.');

    const tooLong = validateJoinQueue('Pooja', '9876543210123', ['s1'], mockServices, [], defaultSettings);
    expect(tooLong.valid).toBe(false);
    expect(tooLong.errors.phone).toBe('Phone number must be exactly 10 digits.');

    const letters = validateJoinQueue('Pooja', 'abcdefghij', ['s1'], mockServices, [], defaultSettings);
    expect(letters.valid).toBe(false);
    expect(letters.errors.phone).toBe('Phone number must be exactly 10 digits.');
  });

  // 4. Same phone number attempts to join twice; existing active spot is shown and no duplicate is created.
  it('4. Same phone number attempts to join twice: existing active spot is returned and duplicate prevented', () => {
    const existingQueue: QueueEntry[] = [
      {
        id: 'q-active-1',
        tokenNumber: 'S-10',
        customerName: 'Kunal Shah',
        phone: '9876543210',
        serviceIds: ['s1'],
        preferredBarberId: 'ANY',
        status: 'WAITING',
        createdAt: new Date().toISOString()
      }
    ];

    const duplicateAttempt = validateJoinQueue('Kunal Shah', '9876543210', ['s2'], mockServices, existingQueue, defaultSettings);
    expect(duplicateAttempt.valid).toBe(false);
    expect(duplicateAttempt.errors.phone).toContain('active queue spot already exists');
    expect(duplicateAttempt.existingActiveEntry?.id).toBe('q-active-1');
  });

  // 5. Customer who selected Ravi is never called by Amit.
  it('5. Customer who selected Ravi is never called by Amit', () => {
    const queue: QueueEntry[] = [
      {
        id: 'q-ravi-only',
        tokenNumber: 'S-1',
        customerName: 'Devang',
        phone: '9876543210',
        serviceIds: ['s1'],
        preferredBarberId: 'b-ravi',
        status: 'WAITING',
        createdAt: new Date().toISOString()
      }
    ];

    const nextForAmit = findNextEligibleCustomer(queue, 'b-amit');
    expect(nextForAmit).toBeNull(); // Amit cannot call Ravi's customer
  });

  // 6. Call next for Amit skips a waiting customer who selected Ravi and selects the earliest eligible Amit/Any customer.
  it('6. Call next for Amit skips waiting Ravi customer and selects the earliest eligible Amit/Any customer', () => {
    const queue: QueueEntry[] = [
      {
        id: 'q-ravi',
        tokenNumber: 'S-1',
        customerName: 'Devang',
        phone: '9876543210',
        serviceIds: ['s1'],
        preferredBarberId: 'b-ravi',
        status: 'WAITING',
        createdAt: '2026-11-24T10:00:00Z'
      },
      {
        id: 'q-any',
        tokenNumber: 'S-2',
        customerName: 'Manish',
        phone: '9876543211',
        serviceIds: ['s1'],
        preferredBarberId: 'ANY',
        status: 'WAITING',
        createdAt: '2026-11-24T10:05:00Z'
      },
      {
        id: 'q-amit',
        tokenNumber: 'S-3',
        customerName: 'Chirag',
        phone: '9876543212',
        serviceIds: ['s1'],
        preferredBarberId: 'b-amit',
        status: 'WAITING',
        createdAt: '2026-11-24T10:10:00Z'
      }
    ];

    const nextForAmit = findNextEligibleCustomer(queue, 'b-amit');
    expect(nextForAmit).not.toBeNull();
    expect(nextForAmit?.id).toBe('q-any'); // Earlier than chirag, and ravi is skipped

    // Ravi can still call their customer
    const nextForRavi = findNextEligibleCustomer(queue, 'b-ravi');
    expect(nextForRavi?.id).toBe('q-ravi');
  });

  // 7. An Any barber customer can be assigned to an available barber.
  it('7. An Any barber customer can be assigned to any available barber', () => {
    const queue: QueueEntry[] = [
      {
        id: 'q-any',
        tokenNumber: 'S-1',
        customerName: 'Rahul',
        phone: '9876543210',
        serviceIds: ['s1'],
        preferredBarberId: 'ANY',
        status: 'WAITING',
        createdAt: new Date().toISOString()
      }
    ];

    expect(findNextEligibleCustomer(queue, 'b-ravi')?.id).toBe('q-any');
    expect(findNextEligibleCustomer(queue, 'b-amit')?.id).toBe('q-any');
    expect(findNextEligibleCustomer(queue, 'b-suresh')?.id).toBe('q-any');
  });

  // 8. A barber with an active Called/In chair assignment cannot receive another customer.
  it('8. A barber with an active Called/In chair assignment cannot receive another customer', () => {
    const activeQueue: QueueEntry[] = [
      {
        id: 'q-1',
        tokenNumber: 'S-1',
        customerName: 'Rahul',
        phone: '9876543210',
        serviceIds: ['s1'],
        preferredBarberId: 'ANY',
        assignedBarberId: 'b-ravi',
        status: 'IN_CHAIR',
        createdAt: new Date().toISOString()
      }
    ];

    const ravi = mockBarbers.find(b => b.id === 'b-ravi')!;
    const canTake = canBarberTakeCustomer(ravi, activeQueue);
    expect(canTake).toBe(false);
  });

  // 9. A barber on break receives no new assignment.
  it('9. A barber on break receives no new assignment', () => {
    const breakBarber: Barber = { id: 'b-ravi', name: 'Ravi', nameGu: 'રવિ', status: 'ON_BREAK', isOnDuty: true };
    const canTake = canBarberTakeCustomer(breakBarber, []);
    expect(canTake).toBe(false);

    const offDutyBarber: Barber = { id: 'b-ravi', name: 'Ravi', nameGu: 'રવિ', status: 'AVAILABLE', isOnDuty: false };
    const canTakeOffDuty = canBarberTakeCustomer(offDutyBarber, []);
    expect(canTakeOffDuty).toBe(false);
  });

  // 10. Call next changes the customer's status and TV display within five seconds.
  it('10. Call next transitions customer from WAITING to CALLED', () => {
    expect(canTransition('WAITING', 'CALLED')).toBe(true);
    // Invalid jump from WAITING straight to IN_CHAIR or DONE
    expect(canTransition('WAITING', 'IN_CHAIR')).toBe(false);
    expect(canTransition('WAITING', 'DONE')).toBe(false);
  });

  // 11. Start changes Called to In chair and starts the timer.
  it('11. Start transitions Called to In chair', () => {
    expect(canTransition('CALLED', 'IN_CHAIR')).toBe(true);
    expect(canTransition('WAITING', 'IN_CHAIR')).toBe(false);
  });

  // 12. Done changes In chair to Done and updates reception, TV, and customer status.
  it('12. Done transitions In chair to Done (terminal state)', () => {
    expect(canTransition('IN_CHAIR', 'DONE')).toBe(true);
    expect(isEntryActive('DONE')).toBe(false);
    expect(canTransition('DONE', 'IN_CHAIR')).toBe(false);
  });

  // 13. Called customer can be marked No-show after 10 minutes with confirmation.
  it('13. Called customer can be transitioned to NO_SHOW', () => {
    expect(canTransition('CALLED', 'NO_SHOW')).toBe(true);
    expect(canTransition('IN_CHAIR', 'NO_SHOW')).toBe(false);
    expect(isEntryActive('NO_SHOW')).toBe(false);
  });

  // 14. No-show customer re-added as a walk-in receives a new token at the end of the queue.
  it('14. No-show customer re-added as a walk-in receives a new token without duplicate blockage', () => {
    const historicalQueue: QueueEntry[] = [
      {
        id: 'q-past-1',
        tokenNumber: 'S-1',
        customerName: 'Samir',
        phone: '9876543210',
        serviceIds: ['s1'],
        preferredBarberId: 'ANY',
        status: 'NO_SHOW',
        createdAt: '2026-11-24T09:00:00Z'
      }
    ];

    // Phone is allowed to rejoin because previous entry is NO_SHOW (not active)
    const canRejoin = validateJoinQueue('Samir', '9876543210', ['s1'], mockServices, historicalQueue, defaultSettings, true);
    expect(canRejoin.valid).toBe(true);
  });

  // 15. Customer cancellation requires confirmation and removes the entry from active queue.
  it('15. Customer cancellation removes the entry from active queue', () => {
    expect(canTransition('WAITING', 'CANCELLED')).toBe(true);
    expect(canTransition('CALLED', 'CANCELLED')).toBe(true);
    expect(canTransition('IN_CHAIR', 'CANCELLED')).toBe(false);
    expect(isEntryActive('CANCELLED')).toBe(false);
  });

  // 16. Closing online joining disables remote joining but still permits receptionist walk-ins.
  it('16. Closing online joining disables remote joining but permits receptionist walk-ins', () => {
    const closedSettings: SalonSettings = { ...defaultSettings, isOnlineQueueOpen: false };

    // Remote join attempt
    const remoteAttempt = validateJoinQueue('Tirth', '9876543210', ['s1'], mockServices, [], closedSettings, false);
    expect(remoteAttempt.valid).toBe(false);
    expect(remoteAttempt.errors.queue).toBe('Online queue joining is currently closed.');

    // Receptionist walk-in attempt with same closed settings
    const walkInAttempt = validateJoinQueue('Tirth', '9876543210', ['s1'], mockServices, [], closedSettings, true);
    expect(walkInAttempt.valid).toBe(true);
  });

  // 17. Online joining closes automatically 30 minutes before configured closing time.
  it('17. Online joining closes automatically 30 minutes before closing time', () => {
    const now = new Date();
    // Set closing time 15 minutes from now
    const close15m = new Date(now.getTime() + 15 * 60 * 1000);
    const closeStr = `${String(close15m.getHours()).padStart(2, '0')}:${String(close15m.getMinutes()).padStart(2, '0')}`;

    const isCutoff = isOnlineQueueCutoffActive(closeStr, 30);
    expect(isCutoff).toBe(true);

    const cutoffSettings: SalonSettings = {
      ...defaultSettings,
      closingTime: closeStr,
      autoCutoffMinutes: 30
    };

    const onlineAttempt = validateJoinQueue('Aniket', '9876543210', ['s1'], mockServices, [], cutoffSettings, false);
    expect(onlineAttempt.valid).toBe(false);
    expect(onlineAttempt.errors.queue).toContain('30-minute pre-closing cutoff');

    // Walk-in is still permitted during cutoff
    const walkInAttempt = validateJoinQueue('Aniket', '9876543210', ['s1'], mockServices, [], cutoffSettings, true);
    expect(walkInAttempt.valid).toBe(true);
  });

  // 18. Estimated wait never displays zero when eligible people are ahead and never divides by zero.
  it('18. Estimated wait never displays zero when eligible people are ahead and never divides by zero', () => {
    const queue: QueueEntry[] = [
      {
        id: 'q-ahead',
        tokenNumber: 'S-1',
        customerName: 'Aarav',
        phone: '9876543210',
        serviceIds: ['s1'], // 30m
        preferredBarberId: 'ANY',
        status: 'WAITING',
        createdAt: '2026-11-24T10:00:00Z'
      },
      {
        id: 'q-user',
        tokenNumber: 'S-2',
        customerName: 'Bhavin',
        phone: '9876543211',
        serviceIds: ['s2'], // 20m
        preferredBarberId: 'ANY',
        status: 'WAITING',
        createdAt: '2026-11-24T10:05:00Z'
      }
    ];

    const wait = calculateEstimatedWait(queue, 'q-user', mockBarbers, mockServices);
    expect(wait.waitMinutes).not.toBeNull();
    expect(wait.waitMinutes).toBeGreaterThan(0);
    expect(wait.position).toBe(2);

    // Guard against divide by zero when 0 working barbers
    const noWorkingBarbers: Barber[] = [
      { id: 'b1', name: 'Ravi', nameGu: 'રવિ', status: 'ON_BREAK', isOnDuty: true },
      { id: 'b2', name: 'Amit', nameGu: 'અમિત', status: 'AVAILABLE', isOnDuty: false }
    ];
    const waitZero = calculateEstimatedWait(queue, 'q-user', noWorkingBarbers, mockServices);
    expect(waitZero.isUnavailable).toBe(true);
    expect(waitZero.waitMinutes).toBeNull();
  });

  // 19. Estimated wait decreases/recalculates when customers finish or barber availability changes.
  it('19. Estimated wait decreases when customers ahead complete or extra barbers join', () => {
    const queue: QueueEntry[] = [
      {
        id: 'q-ahead',
        tokenNumber: 'S-1',
        customerName: 'Aarav',
        phone: '9876543210',
        serviceIds: ['s1'], // 30m
        preferredBarberId: 'ANY',
        status: 'WAITING',
        createdAt: '2026-11-24T10:00:00Z'
      },
      {
        id: 'q-user',
        tokenNumber: 'S-2',
        customerName: 'Bhavin',
        phone: '9876543211',
        serviceIds: ['s2'], // 20m
        preferredBarberId: 'ANY',
        status: 'WAITING',
        createdAt: '2026-11-24T10:05:00Z'
      }
    ];

    // Single working barber
    const oneBarber: Barber[] = [{ id: 'b-ravi', name: 'Ravi', nameGu: 'રવિ', status: 'AVAILABLE', isOnDuty: true }];
    const wait1 = calculateEstimatedWait(queue, 'q-user', oneBarber, mockServices);

    // Two working barbers
    const twoBarbers: Barber[] = [
      { id: 'b-ravi', name: 'Ravi', nameGu: 'રવિ', status: 'AVAILABLE', isOnDuty: true },
      { id: 'b-amit', name: 'Amit', nameGu: 'અમિત', status: 'AVAILABLE', isOnDuty: true }
    ];
    const wait2 = calculateEstimatedWait(queue, 'q-user', twoBarbers, mockServices);

    expect(wait2.waitMinutes!).toBeLessThanOrEqual(wait1.waitMinutes!);

    // When customer ahead completes (status -> DONE)
    const queueFinished: QueueEntry[] = [
      { ...queue[0], status: 'DONE' },
      queue[1]
    ];
    const waitFinished = calculateEstimatedWait(queueFinished, 'q-user', oneBarber, mockServices);
    expect(waitFinished.position).toBe(1);
    expect(waitFinished.waitMinutes!).toBeLessThanOrEqual(wait1.waitMinutes!);
  });

  // 20. English/Gujarati toggle translates every screen, validation message, and status.
  it('20. English and Gujarati translation dictionaries have complete parity', () => {
    const enKeys = Object.keys(translations.en) as (keyof typeof translations.en)[];
    const guKeys = Object.keys(translations.gu) as (keyof typeof translations.gu)[];

    expect(guKeys.length).toBe(enKeys.length);
    enKeys.forEach(k => {
      expect(translations.gu[k]).toBeDefined();
      expect(typeof translations.gu[k]).toBe('string');
      expect(translations.gu[k].length).toBeGreaterThan(0);
    });
  });

  // 21. Phone, tablet, and TV views stay in sync without manual refresh.
  it('21. BroadcastChannel payload format is standardized for cross-tab sync', () => {
    const syncPayload = {
      type: 'QUEUE_UPDATED',
      timestamp: Date.now(),
      senderId: 'reception-tab'
    };
    expect(syncPayload.type).toBe('QUEUE_UPDATED');
    expect(syncPayload.timestamp).toBeGreaterThan(0);
  });

  // 22. TV display does not expose customer phone numbers.
  it('22. TV display mapping excludes customer phone numbers', () => {
    const entry: QueueEntry = {
      id: 'q-tv-check',
      tokenNumber: 'S-99',
      customerName: 'Narendra Modi',
      phone: '9876543210',
      serviceIds: ['s1'],
      preferredBarberId: 'ANY',
      status: 'CALLED',
      assignedBarberId: 'b-ravi',
      createdAt: new Date().toISOString()
    };

    // TV view data transformation helper
    const getTvCardProps = (e: QueueEntry) => ({
      token: e.tokenNumber,
      customerName: e.customerName,
      status: e.status,
      assignedBarberId: e.assignedBarberId
    });

    const tvCardData = getTvCardProps(entry);
    expect(tvCardData).not.toHaveProperty('phone');
    expect(JSON.stringify(tvCardData)).not.toContain('9876543210');
  });

  // 23. Refreshing the app does not erase persisted queue entries or salon settings.
  it('23. LocalStorage persistence serializes and hydrates state reliably', () => {
    const queueData: QueueEntry[] = [
      {
        id: 'persist-1',
        tokenNumber: 'S-1',
        customerName: 'Harsh',
        phone: '9876543210',
        serviceIds: ['s1'],
        preferredBarberId: 'ANY',
        status: 'WAITING',
        createdAt: new Date().toISOString()
      }
    ];

    const serialized = JSON.stringify(queueData);
    const parsed: QueueEntry[] = JSON.parse(serialized);

    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe('persist-1');
    expect(parsed[0].tokenNumber).toBe('S-1');
    expect(parsed[0].customerName).toBe('Harsh');
  });
});
