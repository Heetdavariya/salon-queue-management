import { Barber, QueueEntry, QueueStatus, SalonSettings, Service } from './types';

/**
 * Checks if a queue status transition is valid according to docs/03-flows-rules.md
 */
export function canTransition(from: QueueStatus, to: QueueStatus): boolean {
  if (from === 'WAITING') {
    return to === 'CALLED' || to === 'CANCELLED';
  }
  if (from === 'CALLED') {
    return to === 'IN_CHAIR' || to === 'NO_SHOW' || to === 'CANCELLED';
  }
  if (from === 'IN_CHAIR') {
    return to === 'DONE';
  }
  // Terminal states cannot transition to anything
  return false;
}

/**
 * Returns true if an entry is active in the queue (WAITING, CALLED, IN_CHAIR)
 */
export function isEntryActive(status: QueueStatus): boolean {
  return status === 'WAITING' || status === 'CALLED' || status === 'IN_CHAIR';
}

/**
 * Finds the earliest Waiting customer eligible for barberId (FCFS).
 * Barber X rule: Customer must have preferredBarberId === barberId OR 'ANY'.
 * Never assigns a customer who selected a different barber.
 */
export function findNextEligibleCustomer(entries: QueueEntry[], barberId: string): QueueEntry | null {
  // Filter only WAITING entries, sorted by createdAt ascending
  const waitingEntries = entries
    .filter(e => e.status === 'WAITING')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  for (const entry of waitingEntries) {
    if (entry.preferredBarberId === 'ANY' || entry.preferredBarberId === barberId) {
      return entry;
    }
  }

  return null;
}

/**
 * Checks if a barber can receive a new customer.
 * A barber CANNOT receive a customer if:
 * 1. Barber is not on duty
 * 2. Barber is on break
 * 3. Barber already has an active assignment (CALLED or IN_CHAIR)
 */
export function canBarberTakeCustomer(barber: Barber, entries: QueueEntry[]): boolean {
  if (!barber.isOnDuty || barber.status === 'ON_BREAK') {
    return false;
  }

  const hasActiveAssignment = entries.some(
    e => e.assignedBarberId === barber.id && (e.status === 'CALLED' || e.status === 'IN_CHAIR')
  );

  return !hasActiveAssignment;
}

/**
 * Calculate waiting time estimation based on docs/03-flows-rules.md:
 * Estimated wait ≈ total minutes of services ahead ÷ number of barbers working
 *
 * Specific barber:
 * - Divides by 1 (the specific barber)
 * - Counts waiting customers ahead who want this barber or ANY barber
 *
 * Any barber:
 * - Counts waiting customers ahead
 * - Divides by currently working barbers (on duty and NOT on break)
 *
 * Never divides by zero. If working barbers === 0, returns isUnavailable: true.
 */
export function calculateEstimatedWait(
  entries: QueueEntry[],
  currentEntryId: string,
  barbers: Barber[],
  services: Service[]
): {
  waitMinutes: number | null;
  isUnavailable: boolean;
  position: number;
} {
  const currentEntry = entries.find(e => e.id === currentEntryId);
  if (!currentEntry) {
    return { waitMinutes: null, isUnavailable: true, position: 0 };
  }

  // If already CALLED or IN_CHAIR or terminal
  if (currentEntry.status !== 'WAITING') {
    return { waitMinutes: 0, isUnavailable: false, position: 0 };
  }

  // Get service map for quick duration lookup
  const serviceMap = new Map<string, number>();
  services.forEach(s => serviceMap.set(s.id, s.durationMinutes));

  const getEntryDuration = (entry: QueueEntry) => {
    return entry.serviceIds.reduce((sum, sId) => sum + (serviceMap.get(sId) || 0), 0);
  };

  const currentCreatedTime = new Date(currentEntry.createdAt).getTime();

  // Active working barbers
  const workingBarbers = barbers.filter(b => b.isOnDuty && b.status === 'AVAILABLE');

  if (currentEntry.preferredBarberId !== 'ANY') {
    // Specific barber requested
    const targetBarber = barbers.find(b => b.id === currentEntry.preferredBarberId);
    if (!targetBarber || !targetBarber.isOnDuty || targetBarber.status === 'ON_BREAK') {
      // Preferred barber is not working
      return { waitMinutes: null, isUnavailable: true, position: 1 };
    }

    // Find all waiting customers ahead eligible for this barber
    const eligibleAhead = entries.filter(e => {
      if (e.status !== 'WAITING') return false;
      const isEarlier = new Date(e.createdAt).getTime() < currentCreatedTime;
      if (!isEarlier) return false;
      return e.preferredBarberId === currentEntry.preferredBarberId || e.preferredBarberId === 'ANY';
    });

    const position = eligibleAhead.length + 1;
    let totalMinutesAhead = eligibleAhead.reduce((sum, e) => sum + getEntryDuration(e), 0);

    // Also consider if the barber is currently serving someone
    const activeForBarber = entries.find(
      e => e.assignedBarberId === targetBarber.id && (e.status === 'CALLED' || e.status === 'IN_CHAIR')
    );
    if (activeForBarber) {
      totalMinutesAhead += Math.max(10, getEntryDuration(activeForBarber) / 2);
    }

    return {
      waitMinutes: Math.max(5, Math.round(totalMinutesAhead)),
      isUnavailable: false,
      position
    };
  } else {
    // "Any barber" requested
    if (workingBarbers.length === 0) {
      return { waitMinutes: null, isUnavailable: true, position: 1 };
    }

    const waitingAhead = entries.filter(e => {
      if (e.status !== 'WAITING') return false;
      return new Date(e.createdAt).getTime() < currentCreatedTime;
    });

    const position = waitingAhead.length + 1;
    let totalMinutesAhead = waitingAhead.reduce((sum, e) => sum + getEntryDuration(e), 0);

    // Add estimated remaining minutes from currently serving barbers
    barbers.forEach(b => {
      const activeEntry = entries.find(
        e => e.assignedBarberId === b.id && (e.status === 'CALLED' || e.status === 'IN_CHAIR')
      );
      if (activeEntry) {
        totalMinutesAhead += Math.max(10, getEntryDuration(activeEntry) / 2);
      }
    });

    const waitMinutes = Math.max(5, Math.round(totalMinutesAhead / workingBarbers.length));

    return {
      waitMinutes,
      isUnavailable: false,
      position
    };
  }
}

/**
 * Checks whether online joining is automatically cut off (30 mins before closing)
 */
export function isOnlineQueueCutoffActive(closingTime: string, autoCutoffMinutes: number = 30): boolean {
  if (!closingTime) return false;

  const now = new Date();
  const [closeHours, closeMinutes] = closingTime.split(':').map(Number);
  if (isNaN(closeHours) || isNaN(closeMinutes)) return false;

  const closeDate = new Date(now);
  closeDate.setHours(closeHours, closeMinutes, 0, 0);

  const cutoffDate = new Date(closeDate.getTime() - autoCutoffMinutes * 60 * 1000);

  return now >= cutoffDate;
}

/**
 * Validates join queue inputs
 */
export function validateJoinQueue(
  name: string,
  phone: string,
  serviceIds: string[],
  services: Service[],
  entries: QueueEntry[],
  settings: SalonSettings,
  isWalkIn: boolean = false
): {
  valid: boolean;
  errors: Record<string, string>;
  existingActiveEntry?: QueueEntry;
} {
  const errors: Record<string, string> = {};

  // Check if queue is open (if not walk-in)
  if (!isWalkIn) {
    if (!settings.isOpen || !settings.isOnlineQueueOpen) {
      errors.queue = 'Online queue joining is currently closed.';
    } else if (isOnlineQueueCutoffActive(settings.closingTime, settings.autoCutoffMinutes)) {
      errors.queue = 'Online queue has closed for today (30-minute pre-closing cutoff).';
    }
  }

  // Name validation
  if (!name || !name.trim()) {
    errors.name = 'Customer name is required.';
  }

  // Phone validation (exactly 10 digits Indian mobile number)
  const cleanPhone = phone.replace(/\D/g, '');
  if (!/^\d{10}$/.test(cleanPhone)) {
    errors.phone = 'Phone number must be exactly 10 digits.';
  }

  // Services validation (at least 1, max 3)
  if (!serviceIds || serviceIds.length === 0) {
    errors.services = 'Please select at least 1 service.';
  } else if (serviceIds.length > 3) {
    errors.services = 'You can select a maximum of 3 services.';
  } else {
    // Check that selected services are currently enabled
    const disabledSelected = serviceIds.some(id => {
      const s = services.find(srv => srv.id === id);
      return !s || !s.isEnabled;
    });
    if (disabledSelected) {
      errors.services = 'One or more selected services are currently disabled.';
    }
  }

  // Duplicate phone check
  const existingActive = entries.find(e => e.phone === cleanPhone && isEntryActive(e.status));
  if (existingActive) {
    return {
      valid: false,
      errors: {
        phone: 'An active queue spot already exists for this phone number.'
      },
      existingActiveEntry: existingActive
    };
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}
