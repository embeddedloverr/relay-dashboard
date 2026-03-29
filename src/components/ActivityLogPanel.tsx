'use client';

import { useState } from 'react';
import { 
  History, 
  Filter, 
  Download, 
  Trash2, 
  Power,
  Clock,
  User,
  Calendar,
  ChevronDown,
  Search
} from 'lucide-react';
import { ActivityLog } from '@/types';
import { useRelayStore } from '@/store/relayStore';
import { cn, formatTimestamp, formatTimeAgo } from '@/lib/utils';

export default function ActivityLogPanel() {
  const { activityLogs, relays, clearLogs } = useRelayStore();
  const [filter, setFilter] = useState<'all' | 'manual' | 'schedule' | 'api'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const filteredLogs = activityLogs.filter(log => {
    const matchesFilter = filter === 'all' || log.triggeredBy === filter;
    const matchesSearch = searchTerm === '' || 
      log.relayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'ON':
        return 'text-relay-on';
      case 'OFF':
        return 'text-relay-off';
      case 'TOGGLE':
        return 'text-accent-cyan';
      default:
        return 'text-industrial-300';
    }
  };

  const getTriggerBadge = (triggeredBy: string) => {
    switch (triggeredBy) {
      case 'manual':
        return 'badge-manual';
      case 'schedule':
        return 'badge-auto';
      case 'api':
        return 'badge-on';
      case 'system':
        return 'badge-disabled';
      default:
        return 'badge-disabled';
    }
  };

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'Relay', 'Action', 'Triggered By', 'Schedule', 'Details'].join(','),
      ...filteredLogs.map(log => [
        log.timestamp,
        log.relayName,
        log.action,
        log.triggeredBy,
        log.scheduleName || '',
        log.details || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relay-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-purple/20 border border-accent-purple/30 flex items-center justify-center">
            <History size={20} className="text-accent-purple" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Activity Logs</h2>
            <p className="text-sm text-industrial-400">
              {filteredLogs.length} entries
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportLogs}
            className="btn btn-ghost text-sm"
          >
            <Download size={16} />
            Export
          </button>
          {showClearConfirm ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  clearLogs();
                  setShowClearConfirm(false);
                }}
                className="btn btn-danger text-sm"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="btn btn-ghost text-sm"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="btn btn-ghost text-sm text-relay-off hover:bg-relay-off/10"
            >
              <Trash2 size={16} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-industrial-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'manual', 'schedule', 'api'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize',
                filter === f
                  ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30'
                  : 'bg-industrial-700/50 text-industrial-300 border border-industrial-600 hover:border-industrial-500'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr className="bg-industrial-700/50">
                <th>Timestamp</th>
                <th>Relay</th>
                <th>Action</th>
                <th>Triggered By</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-industrial-400">
                    <History size={48} className="mx-auto mb-4 opacity-30" />
                    <p>No activity logs found</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="group">
                    <td>
                      <div>
                        <div className="font-mono text-sm text-white">
                          {formatTimestamp(log.timestamp).split(',')[1]?.trim()}
                        </div>
                        <div className="text-xs text-industrial-500">
                          {formatTimeAgo(log.timestamp)}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Power size={14} className="text-industrial-400" />
                        <span className="font-medium text-white">{log.relayName}</span>
                      </div>
                    </td>
                    <td>
                      <span className={cn(
                        'font-mono font-bold',
                        getActionColor(log.action)
                      )}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span className={cn('badge capitalize', getTriggerBadge(log.triggeredBy))}>
                        {log.triggeredBy}
                      </span>
                      {log.scheduleName && (
                        <span className="ml-2 text-xs text-industrial-400">
                          ({log.scheduleName})
                        </span>
                      )}
                    </td>
                    <td className="text-sm text-industrial-400 max-w-xs truncate">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
