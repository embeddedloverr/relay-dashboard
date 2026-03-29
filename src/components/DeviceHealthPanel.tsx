'use client';

import {
  Wifi,
  WifiOff,
  Cpu,
  Clock,
  Activity,
  Signal,
  HardDrive,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useRelayStore, DeviceHealth } from '@/store/relayStore';
import { cn } from '@/lib/utils';

function getRssiColor(rssi: number): string {
  if (rssi >= -50) return 'text-relay-on';
  if (rssi >= -60) return 'text-accent-cyan';
  if (rssi >= -70) return 'text-accent-orange';
  return 'text-relay-off';
}

function getRssiBgColor(rssi: number): string {
  if (rssi >= -50) return 'bg-relay-on/20 border-relay-on/40';
  if (rssi >= -60) return 'bg-accent-cyan/20 border-accent-cyan/40';
  if (rssi >= -70) return 'bg-accent-orange/20 border-accent-orange/40';
  return 'bg-relay-off/20 border-relay-off/40';
}

function getRssiLabel(rssi: number): string {
  if (rssi >= -50) return 'Excellent';
  if (rssi >= -60) return 'Good';
  if (rssi >= -70) return 'Fair';
  if (rssi >= -80) return 'Weak';
  return 'Very Weak';
}

function getRssiBarWidth(rssi: number): string {
  // Map RSSI range (-100 to -30) to percentage (0 to 100)
  const clamped = Math.max(-100, Math.min(-30, rssi));
  const pct = ((clamped + 100) / 70) * 100;
  return `${Math.round(pct)}%`;
}

function formatLastSeen(seconds: number): string {
  if (seconds < 5) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function DeviceHealthCard({ device }: { device: DeviceHealth }) {
  return (
    <div className={cn(
      'card overflow-hidden transition-all duration-300',
      device.isOnline ? 'card-hover' : 'opacity-70'
    )}>
      {/* Status bar */}
      <div className={cn(
        'h-1 transition-colors duration-300',
        device.isOnline ? 'bg-relay-on relay-active' : 'bg-relay-off'
      )} />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300',
              device.isOnline
                ? 'bg-relay-on/20 border-relay-on/50 glow-on'
                : 'bg-industrial-700 border-industrial-600'
            )}>
              {device.isOnline ? (
                <Wifi size={20} className="text-relay-on" />
              ) : (
                <WifiOff size={20} className="text-relay-off" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-white font-mono text-sm">
                {device.mac}
              </h3>
              <div className="flex items-center gap-1.5">
                <div className={cn(
                  'status-dot',
                  device.isOnline ? 'status-dot-on' : 'status-dot-off'
                )} />
                <span className={cn(
                  'text-xs font-medium',
                  device.isOnline ? 'text-relay-on' : 'text-relay-off'
                )}>
                  {device.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs text-industrial-400">Last seen</p>
            <p className="text-sm font-mono text-industrial-200">
              {formatLastSeen(device.lastSeenAgo)}
            </p>
          </div>
        </div>

        {/* RSSI Signal Strength */}
        <div className={cn(
          'rounded-lg p-3 border transition-colors',
          getRssiBgColor(device.rssi)
        )}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Signal size={14} className={getRssiColor(device.rssi)} />
              <span className="text-xs text-industrial-300">WiFi Signal</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('font-mono text-sm font-semibold', getRssiColor(device.rssi))}>
                {device.rssi} dBm
              </span>
              <span className={cn('text-xs px-1.5 py-0.5 rounded', getRssiColor(device.rssi))}>
                {getRssiLabel(device.rssi)}
              </span>
            </div>
          </div>
          <div className="progress-bar h-1.5">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                device.rssi >= -50 ? 'bg-relay-on' :
                device.rssi >= -60 ? 'bg-accent-cyan' :
                device.rssi >= -70 ? 'bg-accent-orange' : 'bg-relay-off'
              )}
              style={{ width: getRssiBarWidth(device.rssi) }}
            />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Heap Memory */}
          <div className="bg-industrial-700/50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <HardDrive size={12} className="text-accent-purple" />
              <span className="text-xs text-industrial-400">Free Heap</span>
            </div>
            <p className="font-mono text-sm font-semibold text-white">
              {(device.heap / 1024).toFixed(0)} <span className="text-xs text-industrial-400">KB</span>
            </p>
          </div>

          {/* Uptime */}
          <div className="bg-industrial-700/50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowUp size={12} className="text-accent-cyan" />
              <span className="text-xs text-industrial-400">Uptime</span>
            </div>
            <p className="font-mono text-sm font-semibold text-white">
              {device.uptimeFormatted}
            </p>
          </div>
        </div>

        {/* Device Timestamp */}
        <div className="flex items-center justify-between text-xs text-industrial-500 pt-1 border-t border-industrial-700/50">
          <div className="flex items-center gap-1.5">
            <Clock size={11} />
            <span>Device time: {device.timestamp}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DeviceHealthPanel() {
  const { deviceHealths, isLoading, fetchError } = useRelayStore();

  if (deviceHealths.length === 0 && !isLoading) {
    return (
      <div className="card p-8 text-center">
        <Activity size={40} className="text-industrial-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-white mb-1">No Devices Found</h3>
        <p className="text-sm text-industrial-400">
          {fetchError
            ? `Error: ${fetchError}`
            : 'Waiting for device heartbeat data from MongoDB...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Activity size={20} className="text-accent-cyan" />
          Device Health
        </h2>
        <div className="flex items-center gap-2">
          <span className={cn(
            'badge text-xs',
            deviceHealths.filter(d => d.isOnline).length === deviceHealths.length
              ? 'badge-on'
              : 'badge-off'
          )}>
            {deviceHealths.filter(d => d.isOnline).length}/{deviceHealths.length} Online
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {deviceHealths.map((device) => (
          <DeviceHealthCard key={device.mac} device={device} />
        ))}
      </div>
    </div>
  );
}
