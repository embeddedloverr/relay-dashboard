'use client';

import { useEffect, useState } from 'react';
import { 
  Power, 
  Calendar, 
  Activity, 
  Zap,
  TrendingUp,
  Clock,
  AlertTriangle,
  Wifi,
  WifiOff,
  Loader2
} from 'lucide-react';
import { useRelayStore } from '@/store/relayStore';
import StatsCard from './StatsCard';
import RelayCard from './RelayCard';
import DeviceHealthPanel from './DeviceHealthPanel';
import { cn, formatTimeAgo } from '@/lib/utils';

const POLL_INTERVAL = 10000; // 10 seconds

export default function DashboardOverview() {
  const { 
    relays, schedules, activityLogs, getStats, groups,
    deviceStatuses, deviceHealths,
    fetchAllLiveData, lastFetched, fetchError,
    controlAllRelays, getActiveMac
  } = useRelayStore();
  const stats = getStats();
  const [allSending, setAllSending] = useState<'on' | 'off' | null>(null);

  // Fetch live data on mount and poll every 10s
  useEffect(() => {
    fetchAllLiveData();
    const interval = setInterval(fetchAllLiveData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAllLiveData]);

  // Get recent activity (last 5)
  const recentActivity = activityLogs.slice(0, 5);

  // Get upcoming schedules
  const upcomingSchedules = schedules
    .filter(s => s.enabled && s.nextRun)
    .sort((a, b) => new Date(a.nextRun!).getTime() - new Date(b.nextRun!).getTime())
    .slice(0, 4);

  // For stats: use live device data
  const onlineDevices = deviceHealths.filter(d => d.isOnline).length;
  const totalDevices = deviceHealths.length;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Relays"
          value={stats.totalRelays}
          subtitle={`${stats.relaysOn} active`}
          icon={Power}
          color="cyan"
        />
        <StatsCard
          title="Relays ON"
          value={stats.relaysOn}
          subtitle="Currently active"
          icon={Zap}
          color="green"
          trend="up"
          trendValue={`${Math.round((stats.relaysOn / Math.max(stats.totalRelays, 1)) * 100)}%`}
        />
        <StatsCard
          title="Devices Online"
          value={onlineDevices}
          subtitle={`of ${totalDevices} total`}
          icon={Wifi}
          color="orange"
        />
        <StatsCard
          title="Active Schedules"
          value={stats.activeSchedules}
          subtitle={`of ${schedules.length} total`}
          icon={Calendar}
          color="purple"
        />
      </div>

      {/* Device Health Panel */}
      <DeviceHealthPanel />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Relay States from Live Data */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Power size={20} className="text-accent-cyan" />
              Relay Status
              {deviceStatuses.length > 0 && (
                <span className="text-xs font-mono text-industrial-400 bg-industrial-700/50 px-2 py-0.5 rounded-full">
                  LIVE
                </span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              {/* All ON / All OFF */}
              {getActiveMac() && (
                <>
                  <button
                    onClick={async () => {
                      const mac = getActiveMac();
                      if (!mac) return;
                      setAllSending('on');
                      await controlAllRelays(mac, 'on');
                      setAllSending(null);
                    }}
                    disabled={allSending !== null}
                    className={cn(
                      'btn text-xs px-3 py-1.5 btn-success',
                      allSending !== null && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {allSending === 'on' ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                    All ON
                  </button>
                  <button
                    onClick={async () => {
                      const mac = getActiveMac();
                      if (!mac) return;
                      setAllSending('off');
                      await controlAllRelays(mac, 'off');
                      setAllSending(null);
                    }}
                    disabled={allSending !== null}
                    className={cn(
                      'btn text-xs px-3 py-1.5 btn-danger',
                      allSending !== null && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {allSending === 'off' ? <Loader2 size={12} className="animate-spin" /> : <Power size={12} />}
                    All OFF
                  </button>
                </>
              )}
              {lastFetched && (
                <span className="text-xs text-industrial-500">
                  {formatTimeAgo(lastFetched)}
                </span>
              )}
            </div>
          </div>

          {/* Device info bar */}
          {deviceStatuses.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {deviceStatuses.map(device => (
                <div key={device.mac} className="flex items-center gap-2 px-3 py-1.5 bg-industrial-700/30 rounded-lg border border-industrial-600/50 text-xs">
                  <div className="status-dot status-dot-on" />
                  <span className="font-mono text-industrial-300">{device.mac}</span>
                  <span className="text-industrial-500">|</span>
                  <span className="text-industrial-400">IP: {device.ip}</span>
                  <span className="text-industrial-500">|</span>
                  <span className="font-mono text-accent-cyan">{device.relayRaw}</span>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {relays.map(relay => (
              <RelayCard key={relay.id} relay={relay} />
            ))}
          </div>
        </div>

        {/* Sidebar Panels */}
        <div className="space-y-6">
          {/* Upcoming Schedules */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Clock size={18} className="text-accent-orange" />
                Upcoming Schedules
              </h3>
            </div>
            
            {upcomingSchedules.length === 0 ? (
              <p className="text-sm text-industrial-400 text-center py-4">
                No upcoming schedules
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingSchedules.map(schedule => {
                  const relay = relays.find(r => r.id === schedule.relayId);
                  return (
                    <div 
                      key={schedule.id}
                      className="p-3 bg-industrial-700/30 rounded-lg border border-industrial-600/50"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white text-sm">
                          {schedule.name}
                        </span>
                        <span className={cn(
                          'badge text-xs',
                          schedule.action === 'ON' ? 'badge-on' : 'badge-off'
                        )}>
                          {schedule.action}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-industrial-400">
                        <span>{relay?.name}</span>
                        <span>•</span>
                        <span className="text-accent-cyan">
                          {formatTimeAgo(schedule.nextRun!)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Activity size={18} className="text-accent-purple" />
                Recent Activity
              </h3>
            </div>
            
            {recentActivity.length === 0 ? (
              <p className="text-sm text-industrial-400 text-center py-4">
                No recent activity
              </p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map(log => (
                  <div 
                    key={log.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-industrial-700/30 transition-colors"
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                      log.action === 'ON' 
                        ? 'bg-relay-on/20 text-relay-on' 
                        : 'bg-relay-off/20 text-relay-off'
                    )}>
                      <Power size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">
                        <span className="font-medium">{log.relayName}</span>
                        <span className="text-industrial-400"> → </span>
                        <span className={cn(
                          'font-mono',
                          log.action === 'ON' ? 'text-relay-on' : 'text-relay-off'
                        )}>
                          {log.action}
                        </span>
                      </p>
                      <p className="text-xs text-industrial-500">
                        {formatTimeAgo(log.timestamp)} • {log.triggeredBy}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* System Status */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-relay-on" />
                System Status
              </h3>
            </div>
            
            <div className="space-y-4">
              {/* Device Uptime */}
              {deviceHealths.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-industrial-400">Device Uptime</span>
                    <span className="text-sm font-mono text-relay-on">
                      {deviceHealths[0].uptimeFormatted}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-industrial-700/30 rounded-lg text-center">
                  <p className="text-2xl font-display font-bold text-relay-on">
                    {stats.relaysOn}
                  </p>
                  <p className="text-xs text-industrial-400">Relays ON</p>
                </div>
                <div className="p-3 bg-industrial-700/30 rounded-lg text-center">
                  <p className="text-2xl font-display font-bold text-relay-off">
                    {stats.relaysOff}
                  </p>
                  <p className="text-xs text-industrial-400">Relays OFF</p>
                </div>
              </div>

              {/* Connection status */}
              {fetchError && (
                <div className="flex items-center gap-2 p-3 bg-relay-off/10 border border-relay-off/30 rounded-lg">
                  <AlertTriangle size={16} className="text-relay-off" />
                  <span className="text-sm text-relay-off">
                    {fetchError}
                  </span>
                </div>
              )}

              {deviceHealths.filter(d => !d.isOnline).length > 0 && (
                <div className="flex items-center gap-2 p-3 bg-relay-off/10 border border-relay-off/30 rounded-lg">
                  <WifiOff size={16} className="text-relay-off" />
                  <span className="text-sm text-relay-off">
                    {deviceHealths.filter(d => !d.isOnline).length} device(s) offline
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
