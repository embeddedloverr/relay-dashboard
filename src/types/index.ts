// Relay Types
export interface Relay {
  id: string;
  name: string;
  description: string;
  state: 'ON' | 'OFF';
  mode: 'manual' | 'auto' | 'disabled';
  gpio: number;
  lastUpdated: string;
  lastTriggeredBy: 'manual' | 'schedule' | 'api' | 'system';
  group?: string;
}

// Schedule Types
export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export interface Schedule {
  id: string;
  name: string;
  relayId: string;
  enabled: boolean;
  action: 'ON' | 'OFF' | 'TOGGLE';
  scheduleType: 'once' | 'daily' | 'weekly' | 'interval';
  // For once/daily schedules
  time?: string; // HH:mm format
  // For weekly schedules
  days?: DayOfWeek[];
  // For interval schedules
  intervalMinutes?: number;
  // For once schedules
  date?: string; // YYYY-MM-DD format
  // Duration for auto-off
  durationMinutes?: number;
  lastRun?: string;
  nextRun?: string;
  createdAt: string;
  updatedAt: string;
}

// Activity Log Types
export interface ActivityLog {
  id: string;
  timestamp: string;
  relayId: string;
  relayName: string;
  action: 'ON' | 'OFF' | 'TOGGLE';
  triggeredBy: 'manual' | 'schedule' | 'api' | 'system';
  scheduleId?: string;
  scheduleName?: string;
  details?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalRelays: number;
  relaysOn: number;
  relaysOff: number;
  activeSchedules: number;
  todayActivations: number;
  uptime: string;
}

// Group Type
export interface RelayGroup {
  id: string;
  name: string;
  relayIds: string[];
  color: string;
}

// MQTT Config
export interface MqttConfig {
  broker: string;
  port: number;
  username?: string;
  topic: string;
  clientId: string;
  connected: boolean;
}
