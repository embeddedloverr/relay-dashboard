'use client';

import { useState, useEffect } from 'react';
import { 
  Power, 
  Search, 
  Filter,
  Grid,
  List,
  Zap,
  ToggleLeft
} from 'lucide-react';
import { useRelayStore } from '@/store/relayStore';
import RelayCard from './RelayCard';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list';
type FilterMode = 'all' | 'on' | 'off' | 'auto' | 'manual' | 'disabled';

export default function RelaysPanel() {
  const { relays, groups, fetchAllLiveData } = useRelayStore();

  useEffect(() => {
    fetchAllLiveData();
  }, [fetchAllLiveData]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  const filteredRelays = relays.filter(relay => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      relay.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      relay.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // State/Mode filter
    let matchesFilter = true;
    switch (filter) {
      case 'on':
        matchesFilter = relay.state === 'ON';
        break;
      case 'off':
        matchesFilter = relay.state === 'OFF';
        break;
      case 'auto':
        matchesFilter = relay.mode === 'auto';
        break;
      case 'manual':
        matchesFilter = relay.mode === 'manual';
        break;
      case 'disabled':
        matchesFilter = relay.mode === 'disabled';
        break;
    }

    // Group filter
    const matchesGroup = selectedGroup === 'all' || relay.group === selectedGroup;

    return matchesSearch && matchesFilter && matchesGroup;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-cyan/20 border border-accent-cyan/30 flex items-center justify-center">
            <Power size={20} className="text-accent-cyan" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Relay Control</h2>
            <p className="text-sm text-industrial-400">
              {filteredRelays.length} of {relays.length} relays
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 bg-industrial-700/50 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-2 rounded-md transition-colors',
              viewMode === 'grid' 
                ? 'bg-industrial-600 text-white' 
                : 'text-industrial-400 hover:text-white'
            )}
          >
            <Grid size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-2 rounded-md transition-colors',
              viewMode === 'list' 
                ? 'bg-industrial-600 text-white' 
                : 'text-industrial-400 hover:text-white'
            )}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-industrial-400" />
          <input
            type="text"
            placeholder="Search relays..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>

        {/* Group Filter */}
        <select
          value={selectedGroup}
          onChange={e => setSelectedGroup(e.target.value)}
          className="input w-full lg:w-48"
        >
          <option value="all">All Groups</option>
          {groups.map(group => (
            <option key={group.id} value={group.id}>{group.name}</option>
          ))}
        </select>

        {/* State/Mode Filters */}
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'All', icon: Power },
            { value: 'on', label: 'ON', icon: Zap },
            { value: 'off', label: 'OFF', icon: ToggleLeft },
            { value: 'auto', label: 'Auto', icon: Zap },
            { value: 'manual', label: 'Manual', icon: Power },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as FilterMode)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
                filter === f.value
                  ? f.value === 'on' ? 'bg-relay-on/20 text-relay-on border border-relay-on/30'
                    : f.value === 'off' ? 'bg-relay-off/20 text-relay-off border border-relay-off/30'
                    : 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30'
                  : 'bg-industrial-700/50 text-industrial-300 border border-industrial-600 hover:border-industrial-500'
              )}
            >
              <f.icon size={14} />
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Relays Grid/List */}
      {filteredRelays.length === 0 ? (
        <div className="card p-12 text-center">
          <Power size={48} className="mx-auto mb-4 text-industrial-500" />
          <p className="text-lg text-industrial-300 mb-2">No relays found</p>
          <p className="text-sm text-industrial-500">
            Try adjusting your search or filters
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredRelays.map(relay => (
            <RelayCard key={relay.id} relay={relay} />
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr className="bg-industrial-700/50">
                <th>Relay</th>
                <th>GPIO</th>
                <th>State</th>
                <th>Mode</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRelays.map(relay => (
                <RelayListRow key={relay.id} relay={relay} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// List View Row Component
function RelayListRow({ relay }: { relay: any }) {
  const { toggleRelay, setRelayState } = useRelayStore();
  const isOn = relay.state === 'ON';
  const isDisabled = relay.mode === 'disabled';

  return (
    <tr className="group">
      <td>
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            isOn 
              ? 'bg-relay-on/20 text-relay-on' 
              : 'bg-industrial-700 text-industrial-400'
          )}>
            <Power size={16} />
          </div>
          <div>
            <p className="font-medium text-white">{relay.name}</p>
            <p className="text-xs text-industrial-500">{relay.description}</p>
          </div>
        </div>
      </td>
      <td>
        <span className="font-mono text-industrial-300">GPIO {relay.gpio}</span>
      </td>
      <td>
        <span className={cn(
          'badge',
          isOn ? 'badge-on' : 'badge-off'
        )}>
          {relay.state}
        </span>
      </td>
      <td>
        <span className={cn(
          'badge capitalize',
          relay.mode === 'auto' ? 'badge-auto' : 
          relay.mode === 'manual' ? 'badge-manual' : 'badge-disabled'
        )}>
          {relay.mode}
        </span>
      </td>
      <td className="text-sm text-industrial-400 font-mono">
        {new Date(relay.lastUpdated).toLocaleTimeString()}
      </td>
      <td>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setRelayState(relay.id, 'ON')}
            disabled={isDisabled || isOn}
            className={cn(
              'px-3 py-1 rounded text-xs font-medium transition-all',
              isOn 
                ? 'bg-relay-on/20 text-relay-on cursor-default' 
                : 'bg-industrial-600 text-white hover:bg-relay-on/30 hover:text-relay-on',
              isDisabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            ON
          </button>
          <button
            onClick={() => setRelayState(relay.id, 'OFF')}
            disabled={isDisabled || !isOn}
            className={cn(
              'px-3 py-1 rounded text-xs font-medium transition-all',
              !isOn 
                ? 'bg-relay-off/20 text-relay-off cursor-default' 
                : 'bg-industrial-600 text-white hover:bg-relay-off/30 hover:text-relay-off',
              isDisabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            OFF
          </button>
        </div>
      </td>
    </tr>
  );
}
