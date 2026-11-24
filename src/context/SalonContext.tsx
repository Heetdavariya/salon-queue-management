import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Barber, QueueEntry, SalonSettings, Service } from '../domain/types';
import { initialBarbers, initialQueueEntries, initialServices, initialSettings } from '../mock/seedData';
import { canBarberTakeCustomer, canTransition, findNextEligibleCustomer, validateJoinQueue } from '../domain/queueRules';

const STORAGE_KEY_PREFIX = 'royal_touch_salon_';
const QUEUE_STORAGE_KEY = `${STORAGE_KEY_PREFIX}entries`;
const BARBERS_STORAGE_KEY = `${STORAGE_KEY_PREFIX}barbers`;
const SERVICES_STORAGE_KEY = `${STORAGE_KEY_PREFIX}services`;
const SETTINGS_STORAGE_KEY = `${STORAGE_KEY_PREFIX}settings`;
const TOKEN_COUNTER_KEY = `${STORAGE_KEY_PREFIX}token_counter`;

interface SyncPayload {
  entries: QueueEntry[];
  barbers: Barber[];
  services: Service[];
  settings: SalonSettings;
  tokenCounter: number;
  lastCalledToken: QueueEntry | null;
  updatedAt: number;
}

interface SalonContextType {
  entries: QueueEntry[];
  barbers: Barber[];
  services: Service[];
  settings: SalonSettings;
  tokenCounter: number;
  lastCalledToken: QueueEntry | null;
  syncMode: 'local_tab' | 'cloud';
  isConnected: boolean;
  
  // Actions
  joinQueue: (name: string, phone: string, serviceIds: string[], preferredBarberId: string) => { success: boolean; entry?: QueueEntry; error?: string; existingActiveEntry?: QueueEntry };
  addWalkIn: (name: string, phone: string, serviceIds: string[], preferredBarberId: string) => { success: boolean; entry?: QueueEntry; error?: string; existingActiveEntry?: QueueEntry };
  callNext: (barberId: string) => { success: boolean; entry?: QueueEntry; error?: string };
  startService: (entryId: string) => { success: boolean; error?: string };
  doneService: (entryId: string) => { success: boolean; error?: string };
  markNoShow: (entryId: string) => { success: boolean; error?: string };
  cancelSpot: (entryId: string) => { success: boolean; error?: string };
  toggleBarberBreak: (barberId: string) => void;
  toggleBarberDuty: (barberId: string) => void;
  updateSettings: (updates: Partial<SalonSettings>) => void;
  updateService: (serviceId: string, updates: Partial<Service>) => void;
  addService: (service: Omit<Service, 'id'>) => void;
  resetToDemoData: () => void;
  clearLastCalledToken: () => void;
}

const SalonContext = createContext<SalonContextType | undefined>(undefined);

export const SalonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial state from localStorage or fallback to mock seed data
  const [entries, setEntries] = useState<QueueEntry[]>(() => {
    try {
      const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialQueueEntries;
    } catch {
      return initialQueueEntries;
    }
  });

  const [barbers, setBarbers] = useState<Barber[]>(() => {
    try {
      const saved = localStorage.getItem(BARBERS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialBarbers;
    } catch {
      return initialBarbers;
    }
  });

  const [services, setServices] = useState<Service[]>(() => {
    try {
      const saved = localStorage.getItem(SERVICES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialServices;
    } catch {
      return initialServices;
    }
  });

  const [settings, setSettings] = useState<SalonSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialSettings;
    } catch {
      return initialSettings;
    }
  });

  const [tokenCounter, setTokenCounter] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(TOKEN_COUNTER_KEY);
      return saved ? parseInt(saved, 10) : 16; // seed entries go up to S-15
    } catch {
      return 16;
    }
  });

  const [lastCalledToken, setLastCalledToken] = useState<QueueEntry | null>(null);
  const isConnected = true;
  const syncMode: 'local_tab' | 'cloud' = 'local_tab';

  const channelRef = useRef<BroadcastChannel | null>(null);

  // Broadcast state updates to all open tabs and persist to localStorage
  const broadcastAndPersist = useCallback(
    (
      newEntries: QueueEntry[],
      newBarbers: Barber[],
      newServices: Service[],
      newSettings: SalonSettings,
      newTokenCounter: number,
      newCalledToken: QueueEntry | null = null
    ) => {
      try {
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(newEntries));
        localStorage.setItem(BARBERS_STORAGE_KEY, JSON.stringify(newBarbers));
        localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(newServices));
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
        localStorage.setItem(TOKEN_COUNTER_KEY, newTokenCounter.toString());

        const payload: SyncPayload = {
          entries: newEntries,
          barbers: newBarbers,
          services: newServices,
          settings: newSettings,
          tokenCounter: newTokenCounter,
          lastCalledToken: newCalledToken,
          updatedAt: Date.now()
        };

        if (channelRef.current) {
          channelRef.current.postMessage(payload);
        }
      } catch (err) {
        console.error('Failed to persist or broadcast salon state:', err);
      }
    },
    []
  );

  // Setup multi-tab BroadcastChannel listener
  useEffect(() => {
    try {
      const channel = new BroadcastChannel('royal_touch_salon_sync');
      channelRef.current = channel;

      channel.onmessage = (event: MessageEvent<SyncPayload>) => {
        const data = event.data;
        if (data && data.updatedAt) {
          setEntries(data.entries);
          setBarbers(data.barbers);
          setServices(data.services);
          setSettings(data.settings);
          setTokenCounter(data.tokenCounter);
          if (data.lastCalledToken) {
            setLastCalledToken(data.lastCalledToken);
          }
        }
      };

      // Storage event fallback for older browser tabs
      const handleStorage = (e: StorageEvent) => {
        if (e.key === QUEUE_STORAGE_KEY && e.newValue) {
          try {
            setEntries(JSON.parse(e.newValue));
          } catch {}
        }
      };
      window.addEventListener('storage', handleStorage);

      return () => {
        channel.close();
        window.removeEventListener('storage', handleStorage);
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported, falling back to local storage only:', e);
    }
  }, []);

  // Online Customer Join
  const joinQueue = useCallback(
    (name: string, phone: string, serviceIds: string[], preferredBarberId: string) => {
      const validation = validateJoinQueue(name, phone, serviceIds, services, entries, settings, false);
      if (!validation.valid) {
        return {
          success: false,
          error: Object.values(validation.errors)[0] || 'Validation failed',
          existingActiveEntry: validation.existingActiveEntry
        };
      }

      const newTokenNumber = `S-${tokenCounter}`;
      const newEntry: QueueEntry = {
        id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        tokenNumber: newTokenNumber,
        customerName: name.trim(),
        phone: phone.replace(/\D/g, ''),
        serviceIds,
        preferredBarberId,
        status: 'WAITING',
        createdAt: new Date().toISOString()
      };

      const updatedEntries = [...entries, newEntry];
      const nextCounter = tokenCounter + 1;

      setEntries(updatedEntries);
      setTokenCounter(nextCounter);
      broadcastAndPersist(updatedEntries, barbers, services, settings, nextCounter, null);

      return { success: true, entry: newEntry };
    },
    [entries, barbers, services, settings, tokenCounter, broadcastAndPersist]
  );

  // Walk-In Customer Join (from Reception)
  const addWalkIn = useCallback(
    (name: string, phone: string, serviceIds: string[], preferredBarberId: string) => {
      const validation = validateJoinQueue(name, phone, serviceIds, services, entries, settings, true);
      if (!validation.valid) {
        return {
          success: false,
          error: Object.values(validation.errors)[0] || 'Validation failed',
          existingActiveEntry: validation.existingActiveEntry
        };
      }

      const newTokenNumber = `S-${tokenCounter}`;
      const newEntry: QueueEntry = {
        id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        tokenNumber: newTokenNumber,
        customerName: name.trim(),
        phone: phone.replace(/\D/g, ''),
        serviceIds,
        preferredBarberId,
        status: 'WAITING',
        createdAt: new Date().toISOString()
      };

      const updatedEntries = [...entries, newEntry];
      const nextCounter = tokenCounter + 1;

      setEntries(updatedEntries);
      setTokenCounter(nextCounter);
      broadcastAndPersist(updatedEntries, barbers, services, settings, nextCounter, null);

      return { success: true, entry: newEntry };
    },
    [entries, barbers, services, settings, tokenCounter, broadcastAndPersist]
  );

  // Call Next for Barber
  const callNext = useCallback(
    (barberId: string) => {
      const barber = barbers.find(b => b.id === barberId);
      if (!barber) {
        return { success: false, error: 'Barber not found' };
      }

      if (!canBarberTakeCustomer(barber, entries)) {
        return { success: false, error: 'Barber cannot receive assignments (busy, on break, or off duty)' };
      }

      const nextCustomer = findNextEligibleCustomer(entries, barberId);
      if (!nextCustomer) {
        return { success: false, error: 'No eligible waiting customer found' };
      }

      const nowIso = new Date().toISOString();
      const updatedEntries = entries.map(entry => {
        if (entry.id === nextCustomer.id) {
          return {
            ...entry,
            status: 'CALLED' as const,
            assignedBarberId: barberId,
            calledAt: nowIso
          };
        }
        return entry;
      });

      const calledEntry = updatedEntries.find(e => e.id === nextCustomer.id) || null;

      setEntries(updatedEntries);
      setLastCalledToken(calledEntry);
      broadcastAndPersist(updatedEntries, barbers, services, settings, tokenCounter, calledEntry);

      return { success: true, entry: calledEntry || undefined };
    },
    [barbers, entries, services, settings, tokenCounter, broadcastAndPersist]
  );

  // Start Service (Called -> In chair)
  const startService = useCallback(
    (entryId: string) => {
      const entry = entries.find(e => e.id === entryId);
      if (!entry) return { success: false, error: 'Entry not found' };
      if (!canTransition(entry.status, 'IN_CHAIR')) {
        return { success: false, error: `Cannot transition from ${entry.status} to IN_CHAIR` };
      }

      const updatedEntries = entries.map(e => {
        if (e.id === entryId) {
          return {
            ...e,
            status: 'IN_CHAIR' as const,
            startedAt: new Date().toISOString()
          };
        }
        return e;
      });

      setEntries(updatedEntries);
      broadcastAndPersist(updatedEntries, barbers, services, settings, tokenCounter, null);
      return { success: true };
    },
    [entries, barbers, services, settings, tokenCounter, broadcastAndPersist]
  );

  // Done Service (In chair -> Done)
  const doneService = useCallback(
    (entryId: string) => {
      const entry = entries.find(e => e.id === entryId);
      if (!entry) return { success: false, error: 'Entry not found' };
      if (!canTransition(entry.status, 'DONE')) {
        return { success: false, error: `Cannot transition from ${entry.status} to DONE` };
      }

      const updatedEntries = entries.map(e => {
        if (e.id === entryId) {
          return {
            ...e,
            status: 'DONE' as const,
            completedAt: new Date().toISOString()
          };
        }
        return e;
      });

      setEntries(updatedEntries);
      broadcastAndPersist(updatedEntries, barbers, services, settings, tokenCounter, null);
      return { success: true };
    },
    [entries, barbers, services, settings, tokenCounter, broadcastAndPersist]
  );

  // Mark No-Show (Called -> No-Show)
  const markNoShow = useCallback(
    (entryId: string) => {
      const entry = entries.find(e => e.id === entryId);
      if (!entry) return { success: false, error: 'Entry not found' };
      if (!canTransition(entry.status, 'NO_SHOW')) {
        return { success: false, error: `Cannot mark ${entry.status} as NO_SHOW` };
      }

      const updatedEntries = entries.map(e => {
        if (e.id === entryId) {
          return {
            ...e,
            status: 'NO_SHOW' as const,
            noShowAt: new Date().toISOString()
          };
        }
        return e;
      });

      setEntries(updatedEntries);
      broadcastAndPersist(updatedEntries, barbers, services, settings, tokenCounter, null);
      return { success: true };
    },
    [entries, barbers, services, settings, tokenCounter, broadcastAndPersist]
  );

  // Cancel Spot (Waiting/Called -> Cancelled)
  const cancelSpot = useCallback(
    (entryId: string) => {
      const entry = entries.find(e => e.id === entryId);
      if (!entry) return { success: false, error: 'Entry not found' };
      if (!canTransition(entry.status, 'CANCELLED')) {
        return { success: false, error: `Cannot cancel entry in status ${entry.status}` };
      }

      const updatedEntries = entries.map(e => {
        if (e.id === entryId) {
          return {
            ...e,
            status: 'CANCELLED' as const,
            cancelledAt: new Date().toISOString()
          };
        }
        return e;
      });

      setEntries(updatedEntries);
      broadcastAndPersist(updatedEntries, barbers, services, settings, tokenCounter, null);
      return { success: true };
    },
    [entries, barbers, services, settings, tokenCounter, broadcastAndPersist]
  );

  // Toggle Barber Break
  const toggleBarberBreak = useCallback(
    (barberId: string) => {
      const updatedBarbers = barbers.map(b => {
        if (b.id === barberId) {
          return {
            ...b,
            status: b.status === 'AVAILABLE' ? ('ON_BREAK' as const) : ('AVAILABLE' as const)
          };
        }
        return b;
      });

      setBarbers(updatedBarbers);
      broadcastAndPersist(entries, updatedBarbers, services, settings, tokenCounter, null);
    },
    [barbers, entries, services, settings, tokenCounter, broadcastAndPersist]
  );

  // Toggle Barber Duty
  const toggleBarberDuty = useCallback(
    (barberId: string) => {
      const updatedBarbers = barbers.map(b => {
        if (b.id === barberId) {
          return {
            ...b,
            isOnDuty: !b.isOnDuty
          };
        }
        return b;
      });

      setBarbers(updatedBarbers);
      broadcastAndPersist(entries, updatedBarbers, services, settings, tokenCounter, null);
    },
    [barbers, entries, services, settings, tokenCounter, broadcastAndPersist]
  );

  // Update Settings
  const updateSettings = useCallback(
    (updates: Partial<SalonSettings>) => {
      const updated = { ...settings, ...updates };
      setSettings(updated);
      broadcastAndPersist(entries, barbers, services, updated, tokenCounter, null);
    },
    [settings, entries, barbers, services, tokenCounter, broadcastAndPersist]
  );

  // Update Service
  const updateService = useCallback(
    (serviceId: string, updates: Partial<Service>) => {
      const updatedServices = services.map(s => {
        if (s.id === serviceId) {
          return { ...s, ...updates };
        }
        return s;
      });

      setServices(updatedServices);
      broadcastAndPersist(entries, barbers, updatedServices, settings, tokenCounter, null);
    },
    [services, entries, barbers, settings, tokenCounter, broadcastAndPersist]
  );

  // Add Service
  const addService = useCallback(
    (newServiceData: Omit<Service, 'id'>) => {
      const newService: Service = {
        ...newServiceData,
        id: `srv-${Date.now()}`
      };
      const updatedServices = [...services, newService];
      setServices(updatedServices);
      broadcastAndPersist(entries, barbers, updatedServices, settings, tokenCounter, null);
    },
    [services, entries, barbers, settings, tokenCounter, broadcastAndPersist]
  );

  // Reset to Demo Data
  const resetToDemoData = useCallback(() => {
    localStorage.removeItem(QUEUE_STORAGE_KEY);
    localStorage.removeItem(BARBERS_STORAGE_KEY);
    localStorage.removeItem(SERVICES_STORAGE_KEY);
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
    localStorage.removeItem(TOKEN_COUNTER_KEY);

    setEntries(initialQueueEntries);
    setBarbers(initialBarbers);
    setServices(initialServices);
    setSettings(initialSettings);
    setTokenCounter(16);
    setLastCalledToken(null);

    broadcastAndPersist(initialQueueEntries, initialBarbers, initialServices, initialSettings, 16, null);
  }, [broadcastAndPersist]);

  const clearLastCalledToken = useCallback(() => {
    setLastCalledToken(null);
  }, []);

  return (
    <SalonContext.Provider
      value={{
        entries,
        barbers,
        services,
        settings,
        tokenCounter,
        lastCalledToken,
        syncMode,
        isConnected,
        joinQueue,
        addWalkIn,
        callNext,
        startService,
        doneService,
        markNoShow,
        cancelSpot,
        toggleBarberBreak,
        toggleBarberDuty,
        updateSettings,
        updateService,
        addService,
        resetToDemoData,
        clearLastCalledToken
      }}
    >
      {children}
    </SalonContext.Provider>
  );
};

export const useSalon = () => {
  const context = useContext(SalonContext);
  if (!context) {
    throw new Error('useSalon must be used within a SalonProvider');
  }
  return context;
};
