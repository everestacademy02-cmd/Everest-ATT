export type UserRole = 'ADMIN' | 'STAFF';

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole;
}

export interface AttendanceRecord {
  id: string;
  staffName: string;
  timestamp: Date;
  photoUrl: string;
  type: 'CLOCK_IN' | 'CLOCK_OUT';
  aiGreeting?: string;
  isSyncing: boolean;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export enum CameraStatus {
  IDLE,
  ACTIVE,
  CAPTURING,
  ERROR,
  DENIED
}