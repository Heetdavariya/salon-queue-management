import { Barber, Service, QueueEntry, SalonSettings } from '../domain/types';

export const initialBarbers: Barber[] = [
  {
    id: 'barber-ravi',
    name: 'Ravi',
    nameGu: 'રવિ',
    status: 'AVAILABLE',
    isOnDuty: true,
  },
  {
    id: 'barber-amit',
    name: 'Amit',
    nameGu: 'અમિત',
    status: 'AVAILABLE',
    isOnDuty: true,
  },
  {
    id: 'barber-suresh',
    name: 'Suresh',
    nameGu: 'સુરેશ',
    status: 'AVAILABLE',
    isOnDuty: true,
  }
];

export const initialServices: Service[] = [
  {
    id: 'srv-haircut',
    nameEn: 'Haircut & Styling',
    nameGu: 'વાળ કાપવા અને સ્ટાઇલ',
    durationMinutes: 30,
    price: 250,
    isEnabled: true
  },
  {
    id: 'srv-beard',
    nameEn: 'Beard Trim & Shape',
    nameGu: 'દાઢી ટ્રીમ અને શેપ',
    durationMinutes: 20,
    price: 150,
    isEnabled: true
  },
  {
    id: 'srv-massage',
    nameEn: 'Head Massage with Oil',
    nameGu: 'માથાનો તેલ માલિશ',
    durationMinutes: 25,
    price: 200,
    isEnabled: true
  },
  {
    id: 'srv-cleanup',
    nameEn: 'Face Cleanup & Tan Removal',
    nameGu: 'ફેસ ક્લીનઅપ',
    durationMinutes: 35,
    price: 350,
    isEnabled: true
  },
  {
    id: 'srv-color',
    nameEn: 'Hair Color & Touchup',
    nameGu: 'હેર કલર અને ટચઅપ',
    durationMinutes: 45,
    price: 600,
    isEnabled: true
  },
  {
    id: 'srv-royal-shave',
    nameEn: 'Royal Hot Towel Shave',
    nameGu: 'રોયલ હોટ ટુવાલ શેવ',
    durationMinutes: 20,
    price: 180,
    isEnabled: true
  }
];

export const initialSettings: SalonSettings = {
  salonName: 'Royal Touch Hair Studio',
  salonNameGu: 'રોયલ ટચ હેર સ્ટુડિયો',
  isOpen: true,
  isOnlineQueueOpen: true,
  closingTime: '21:00', // 9:00 PM
  autoCutoffMinutes: 30
};

// Seed realistic demo queue entries reflecting various statuses
const now = Date.now();
const minutesAgo = (m: number) => new Date(now - m * 60 * 1000).toISOString();

export const initialQueueEntries: QueueEntry[] = [
  {
    id: 'queue-1',
    tokenNumber: 'S-11',
    customerName: 'Aarav Patel',
    phone: '9876543210',
    serviceIds: ['srv-haircut'],
    preferredBarberId: 'barber-ravi',
    assignedBarberId: 'barber-ravi',
    status: 'IN_CHAIR',
    createdAt: minutesAgo(40),
    calledAt: minutesAgo(20),
    startedAt: minutesAgo(15)
  },
  {
    id: 'queue-2',
    tokenNumber: 'S-12',
    customerName: 'Vikram Mehta',
    phone: '9823456781',
    serviceIds: ['srv-haircut', 'srv-beard'],
    preferredBarberId: 'ANY',
    assignedBarberId: 'barber-amit',
    status: 'CALLED',
    createdAt: minutesAgo(30),
    calledAt: minutesAgo(4)
  },
  {
    id: 'queue-3',
    tokenNumber: 'S-13',
    customerName: 'Kunal Shah',
    phone: '9898123456',
    serviceIds: ['srv-massage', 'srv-haircut'],
    preferredBarberId: 'ANY',
    status: 'WAITING',
    createdAt: minutesAgo(25)
  },
  {
    id: 'queue-4',
    tokenNumber: 'S-14',
    customerName: 'Pritesh Desai',
    phone: '9712345678',
    serviceIds: ['srv-beard'],
    preferredBarberId: 'barber-suresh',
    status: 'WAITING',
    createdAt: minutesAgo(20)
  },
  {
    id: 'queue-5',
    tokenNumber: 'S-15',
    customerName: 'Devang Joshi',
    phone: '9909012345',
    serviceIds: ['srv-cleanup'],
    preferredBarberId: 'ANY',
    status: 'WAITING',
    createdAt: minutesAgo(10)
  }
];
