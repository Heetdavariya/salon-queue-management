export type QueueStatus = 
  | 'WAITING' 
  | 'CALLED' 
  | 'IN_CHAIR' 
  | 'DONE' 
  | 'CANCELLED' 
  | 'NO_SHOW';

export type BarberStatus = 'AVAILABLE' | 'ON_BREAK';

export interface Barber {
  id: string;
  name: string;
  nameGu: string;
  status: BarberStatus;
  isOnDuty: boolean;
  currentEntryId?: string;
}

export interface Service {
  id: string;
  nameEn: string;
  nameGu: string;
  durationMinutes: number;
  price: number;
  isEnabled: boolean;
}

export interface QueueEntry {
  id: string;
  tokenNumber: string; // e.g. "S-14"
  customerName: string;
  phone: string; // 10 digits
  serviceIds: string[];
  preferredBarberId: string; // 'ANY' or barber id
  assignedBarberId?: string;
  status: QueueStatus;
  createdAt: string; // ISO
  calledAt?: string; // ISO
  startedAt?: string; // ISO
  completedAt?: string; // ISO
  cancelledAt?: string; // ISO
  noShowAt?: string; // ISO
}

export interface SalonSettings {
  salonName: string;
  salonNameGu: string;
  isOpen: boolean;
  isOnlineQueueOpen: boolean;
  closingTime: string; // "20:00"
  autoCutoffMinutes: number; // default 30
}

export type Language = 'en' | 'gu';
