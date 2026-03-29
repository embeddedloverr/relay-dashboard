import { create } from 'zustand';
import { Relay, Schedule, ActivityLog, DashboardStats, RelayGroup } from '@/types';

// === Device types for live MongoDB data ===
export interface LiveRelayState {
  id: string;
  name: string;
  description: string;
  state: 'ON' | 'OFF';
  mode: 'auto' | 'manual';
  position: number;
}

export interface DeviceStatus {
  deviceId: string;
  mac: string;
  timestamp: string;
  rssi: number;
  ip: string;
  relays: LiveRelayState[];
  relayRaw: string;
  modeRaw: string;
  scheduleCount: number;
  receivedAt: string;
}

export interface DeviceHealth {
  deviceId: string;
  mac: string;
  timestamp: string;
  rssi: number;
  rssiQuality?: string;
  heap: number;
  heapFormatted?: string;
  uptime: number;
  uptimeFormatted: string;
  receivedAt: string;
  isOnline: boolean;
  lastSeenAgo: number;
}

// Default relay info (used when no live data is available)
const defaultRelays: Relay[] = [
  {
    id: 'relay-1',
    name: 'Relay 1',
    description: 'Relay Channel 1',
    state: 'OFF',
    mode: 'manual',
    gpio: 1,
    lastUpdated: new Date().toISOString(),
    lastTriggeredBy: 'system',
  },
  {
    id: 'relay-2',
    name: 'Relay 2',
    description: 'Relay Channel 2',
    state: 'OFF',
    mode: 'manual',
    gpio: 2,
    lastUpdated: new Date().toISOString(),
    lastTriggeredBy: 'system',
  },
  {
    id: 'relay-3',
    name: 'Relay 3',
    description: 'Relay Channel 3',
    state: 'OFF',
    mode: 'manual',
    gpio: 3,
    lastUpdated: new Date().toISOString(),
    lastTriggeredBy: 'system',
  },
  {
    id: 'relay-4',
    name: 'Relay 4',
    description: 'Relay Channel 4',
    state: 'OFF',
    mode: 'manual',
    gpio: 4,
    lastUpdated: new Date().toISOString(),
    lastTriggeredBy: 'system',
  },
  {
    id: 'relay-5',
    name: 'Relay 5',
    description: 'Relay Channel 5',
    state: 'OFF',
    mode: 'manual',
    gpio: 5,
    lastUpdated: new Date().toISOString(),
    lastTriggeredBy: 'system',
  },
  {
    id: 'relay-6',
    name: 'Relay 6',
    description: 'Relay Channel 6',
    state: 'OFF',
    mode: 'manual',
    gpio: 6,
    lastUpdated: new Date().toISOString(),
    lastTriggeredBy: 'system',
  },
];

const initialSchedules: Schedule[] = [
  {
    id: 'sch-001',
    name: 'Morning Pump Cycle',
    relayId: 'relay-1',
    enabled: true,
    action: 'ON',
    scheduleType: 'daily',
    time: '06:00',
    durationMinutes: 120,
    lastRun: new Date(Date.now() - 86400000).toISOString(),
    nextRun: new Date(Date.now() + 3600000).toISOString(),
    createdAt: new Date(Date.now() - 604800000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sch-002',
    name: 'Evening Pump Cycle',
    relayId: 'relay-1',
    enabled: true,
    action: 'ON',
    scheduleType: 'daily',
    time: '18:00',
    durationMinutes: 90,
    lastRun: new Date(Date.now() - 43200000).toISOString(),
    nextRun: new Date(Date.now() + 7200000).toISOString(),
    createdAt: new Date(Date.now() - 604800000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const initialLogs: ActivityLog[] = [];

const initialGroups: RelayGroup[] = [];

interface RelayStore {
  // State
  relays: Relay[];
  schedules: Schedule[];
  activityLogs: ActivityLog[];
  groups: RelayGroup[];
  selectedRelayId: string | null;
  selectedScheduleId: string | null;
  isLoading: boolean;

  // Live device data
  deviceStatuses: DeviceStatus[];
  deviceHealths: DeviceHealth[];
  lastFetched: string | null;
  fetchError: string | null;

  // Relay Actions
  setRelays: (relays: Relay[]) => void;
  updateRelay: (id: string, updates: Partial<Relay>) => void;
  toggleRelay: (id: string) => void;
  setRelayState: (id: string, state: 'ON' | 'OFF') => void;
  setRelayMode: (id: string, mode: 'manual' | 'auto' | 'disabled') => void;

  // Schedule Actions
  setSchedules: (schedules: Schedule[]) => void;
  addSchedule: (schedule: Schedule) => void;
  updateSchedule: (id: string, updates: Partial<Schedule>) => void;
  deleteSchedule: (id: string) => Promise<void>;
  toggleScheduleEnabled: (id: string) => void;

  // Log Actions
  addLog: (log: ActivityLog) => void;
  clearLogs: () => void;

  // Selection
  selectRelay: (id: string | null) => void;
  selectSchedule: (id: string | null) => void;

  // UI
  setLoading: (loading: boolean) => void;

  // Stats
  getStats: () => DashboardStats;

  // Live data actions
  fetchDeviceStatus: () => Promise<void>;
  fetchDeviceHealth: () => Promise<void>;
  fetchAllLiveData: () => Promise<void>;

  // MQTT control actions
  controlRelay: (mac: string, relayNum: number, state: 'on' | 'off' | 'toggle') => Promise<boolean>;
  controlAllRelays: (mac: string, state: 'on' | 'off') => Promise<boolean>;
  sendScheduleToDevice: (mac: string, schedules: Array<{ relay: number; on: string; off: string }>) => Promise<boolean>;
  controlMode: (mac: string, relayNum: number, mode: 'auto' | 'manual') => Promise<boolean>;
  clearSchedule: (mac: string) => Promise<boolean>;

  // Helper to get the current device MAC
  getActiveMac: () => string | null;
}

export const useRelayStore = create<RelayStore>((set, get) => ({
  // Initial State
  relays: defaultRelays,
  schedules: initialSchedules,
  activityLogs: initialLogs,
  groups: initialGroups,
  selectedRelayId: null,
  selectedScheduleId: null,
  isLoading: false,

  // Live device data
  deviceStatuses: [],
  deviceHealths: [],
  lastFetched: null,
  fetchError: null,

  // Relay Actions
  setRelays: (relays) => set({ relays }),

  updateRelay: (id, updates) => set((state) => ({
    relays: state.relays.map((relay) =>
      relay.id === id ? { ...relay, ...updates, lastUpdated: new Date().toISOString() } : relay
    ),
  })),

  toggleRelay: (id) => {
    const relay = get().relays.find((r) => r.id === id);
    if (relay && relay.mode !== 'disabled') {
      const newState = relay.state === 'ON' ? 'OFF' : 'ON';
      set((state) => ({
        relays: state.relays.map((r) =>
          r.id === id
            ? { ...r, state: newState, lastUpdated: new Date().toISOString(), lastTriggeredBy: 'manual' }
            : r
        ),
      }));
      get().addLog({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        relayId: id,
        relayName: relay.name,
        action: newState,
        triggeredBy: 'manual',
        details: 'Manual toggle via dashboard',
      });
    }
  },

  setRelayState: (id, state) => {
    const relay = get().relays.find((r) => r.id === id);
    if (relay && relay.mode !== 'disabled') {
      set((s) => ({
        relays: s.relays.map((r) =>
          r.id === id
            ? { ...r, state, lastUpdated: new Date().toISOString(), lastTriggeredBy: 'manual' }
            : r
        ),
      }));
      get().addLog({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        relayId: id,
        relayName: relay.name,
        action: state,
        triggeredBy: 'manual',
        details: `Set to ${state} via dashboard`,
      });
    }
  },

  setRelayMode: async (id, mode) => {
    set((state) => ({
      relays: state.relays.map((relay) =>
        relay.id === id ? { ...relay, mode, lastUpdated: new Date().toISOString() } : relay
      ),
    }));
    
    // Automatically send mode command to device if it's auto or manual
    if (mode === 'auto' || mode === 'manual') {
      const mac = get().getActiveMac();
      const relayNum = parseInt(id.split('-')[1], 10) || 1;
      if (mac) {
        await get().controlMode(mac, relayNum, mode);
      }
    }
  },

  // Schedule Actions
  setSchedules: (schedules) => set({ schedules }),

  addSchedule: (schedule) => set((state) => ({
    schedules: [...state.schedules, schedule],
  })),

  updateSchedule: (id, updates) => set((state) => ({
    schedules: state.schedules.map((schedule) =>
      schedule.id === id ? { ...schedule, ...updates, updatedAt: new Date().toISOString() } : schedule
    ),
  })),

  deleteSchedule: async (id) => {
    const remaining = get().schedules.filter((schedule) => schedule.id !== id);
    set({ schedules: remaining });

    const mac = get().getActiveMac();
    if (!mac) return;

    if (remaining.length === 0) {
      // If no schedules left, clear schedules on the device entirely
      await get().clearSchedule(mac);
    } else {
      // Re-send the remaining schedules to keep device in sync
      const payload = remaining.map(sch => {
        const relayNum = parseInt(sch.relayId.split('-')[1], 10) || 1;
        const onTime = sch.time || '08:00';
        let offTime = '20:00';
        if (sch.time && sch.durationMinutes) {
          const [h, m] = sch.time.split(':').map(Number);
          const totalMinutes = h * 60 + m + sch.durationMinutes;
          const offH = Math.floor(totalMinutes / 60) % 24;
          const offM = totalMinutes % 60;
          offTime = `${String(offH).padStart(2, '0')}:${String(offM).padStart(2, '0')}`;
        }
        return { relay: relayNum, on: onTime, off: offTime };
      });
      await get().sendScheduleToDevice(mac, payload);
    }
  },

  toggleScheduleEnabled: (id) => set((state) => ({
    schedules: state.schedules.map((schedule) =>
      schedule.id === id
        ? { ...schedule, enabled: !schedule.enabled, updatedAt: new Date().toISOString() }
        : schedule
    ),
  })),

  // Log Actions
  addLog: (log) => set((state) => ({
    activityLogs: [log, ...state.activityLogs].slice(0, 100),
  })),

  clearLogs: () => set({ activityLogs: [] }),

  // Selection
  selectRelay: (id) => set({ selectedRelayId: id }),
  selectSchedule: (id) => set({ selectedScheduleId: id }),

  // UI
  setLoading: (loading) => set({ isLoading: loading }),

  // Stats
  getStats: () => {
    const state = get();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return {
      totalRelays: state.relays.length,
      relaysOn: state.relays.filter((r) => r.state === 'ON').length,
      relaysOff: state.relays.filter((r) => r.state === 'OFF').length,
      activeSchedules: state.schedules.filter((s) => s.enabled).length,
      todayActivations: state.activityLogs.filter(
        (log) => new Date(log.timestamp) >= todayStart
      ).length,
      uptime: state.deviceHealths.length > 0
        ? state.deviceHealths[0].uptimeFormatted
        : 'N/A',
    };
  },

  // === Live data fetch actions ===
  fetchDeviceStatus: async () => {
    try {
      const res = await fetch('/api/device/status');
      const json = await res.json();

      if (json.success && json.data && json.data.length > 0) {
        const deviceStatuses: DeviceStatus[] = json.data;

        // Update relay states and modes from the first device's data
        const firstDevice = deviceStatuses[0];
        const updatedRelays = get().relays.map((relay) => {
          const liveRelay = firstDevice.relays.find((lr) => lr.id === relay.id);
          if (liveRelay) {
            return {
              ...relay,
              state: liveRelay.state,
              mode: (liveRelay.mode || relay.mode) as 'manual' | 'auto' | 'disabled',
              lastUpdated: firstDevice.receivedAt || new Date().toISOString(),
              lastTriggeredBy: 'system' as const,
            };
          }
          return relay;
        });

        set({
          deviceStatuses,
          relays: updatedRelays,
          lastFetched: new Date().toISOString(),
          fetchError: null,
        });
      }
    } catch (error) {
      console.error('Failed to fetch device status:', error);
      set({ fetchError: error instanceof Error ? error.message : 'Failed to fetch status' });
    }
  },

  fetchDeviceHealth: async () => {
    try {
      const res = await fetch('/api/device/health');
      const json = await res.json();

      if (json.success && json.data) {
        set({
          deviceHealths: json.data,
          fetchError: null,
        });
      }
    } catch (error) {
      console.error('Failed to fetch device health:', error);
      set({ fetchError: error instanceof Error ? error.message : 'Failed to fetch health' });
    }
  },

  fetchAllLiveData: async () => {
    set({ isLoading: true });
    await Promise.all([
      get().fetchDeviceStatus(),
      get().fetchDeviceHealth(),
    ]);
    set({ isLoading: false });
  },

  // === MQTT Control Actions ===

  getActiveMac: () => {
    const statuses = get().deviceStatuses;
    if (statuses.length > 0) return statuses[0].mac;
    return null;
  },

  controlRelay: async (mac, relayNum, state) => {
    try {
      const res = await fetch('/api/device/control/relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mac, relay: relayNum, state }),
      });
      const json = await res.json();

      if (json.success) {
        // Optimistically update the relay state in the store
        const relayId = `relay-${relayNum}`;
        const newState = state === 'toggle'
          ? (get().relays.find(r => r.id === relayId)?.state === 'ON' ? 'OFF' : 'ON')
          : (state === 'on' ? 'ON' : 'OFF');

        set((s) => ({
          relays: s.relays.map((r) =>
            r.id === relayId
              ? { ...r, state: newState as 'ON' | 'OFF', lastUpdated: new Date().toISOString(), lastTriggeredBy: 'manual' as const }
              : r
          ),
        }));

        const relay = get().relays.find(r => r.id === relayId);
        get().addLog({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          relayId,
          relayName: relay?.name || `Relay ${relayNum}`,
          action: newState as 'ON' | 'OFF',
          triggeredBy: 'manual',
          details: `MQTT command sent to ${mac}`,
        });

        // Refresh status after a short delay to get confirmed state
        setTimeout(() => get().fetchDeviceStatus(), 2000);
        return true;
      }
      return false;
    } catch (error) {
      console.error('controlRelay error:', error);
      return false;
    }
  },

  controlAllRelays: async (mac, state) => {
    try {
      const res = await fetch('/api/device/control/allrelays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mac, state }),
      });
      const json = await res.json();

      if (json.success) {
        const newState = state === 'on' ? 'ON' : 'OFF';
        set((s) => ({
          relays: s.relays.map((r) => ({
            ...r,
            state: newState as 'ON' | 'OFF',
            lastUpdated: new Date().toISOString(),
            lastTriggeredBy: 'manual' as const,
          })),
        }));

        get().addLog({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          relayId: 'all',
          relayName: 'All Relays',
          action: newState as 'ON' | 'OFF',
          triggeredBy: 'manual',
          details: `All relays ${newState} via MQTT to ${mac}`,
        });

        setTimeout(() => get().fetchDeviceStatus(), 2000);
        return true;
      }
      return false;
    } catch (error) {
      console.error('controlAllRelays error:', error);
      return false;
    }
  },

  sendScheduleToDevice: async (mac, schedules) => {
    try {
      const res = await fetch('/api/device/control/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mac, schedules }),
      });
      const json = await res.json();

      if (json.success) {
        get().addLog({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          relayId: 'schedule',
          relayName: 'Schedule',
          action: 'ON',
          triggeredBy: 'system',
          details: `${schedules.length} schedule(s) sent to ${mac}`,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('sendScheduleToDevice error:', error);
      return false;
    }
  },

  controlMode: async (mac, relayNum, mode) => {
    try {
      const res = await fetch('/api/device/control/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mac, relay: relayNum, mode }),
      });
      const json = await res.json();

      if (json.success) {
        get().addLog({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          relayId: `relay-${relayNum}`,
          relayName: `Relay ${relayNum}`,
          action: mode === 'auto' ? 'ON' : 'OFF',
          triggeredBy: 'manual',
          details: `Relay ${relayNum} mode set to ${mode} via MQTT`,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('controlMode error:', error);
      return false;
    }
  },

  clearSchedule: async (mac) => {
    try {
      const res = await fetch('/api/device/control/clearschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mac }),
      });
      const json = await res.json();

      if (json.success) {
        get().addLog({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          relayId: 'schedule',
          relayName: 'Schedule',
          action: 'OFF',
          triggeredBy: 'manual',
          details: `All schedules cleared on device ${mac}`,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('clearSchedule error:', error);
      return false;
    }
  },
}));
