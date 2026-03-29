'use client';

import { useState } from 'react';
import { 
  Calendar, 
  Plus, 
  Search,
  Filter,
  Clock,
  Repeat
} from 'lucide-react';
import { Schedule } from '@/types';
import { useRelayStore } from '@/store/relayStore';
import ScheduleCard from './ScheduleCard';
import ScheduleModal from './ScheduleModal';
import { cn } from '@/lib/utils';

type FilterMode = 'all' | 'enabled' | 'disabled' | 'daily' | 'weekly' | 'interval';

export default function SchedulesPanel() {
  const { schedules, relays } = useRelayStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRelay, setSelectedRelay] = useState<string>('all');

  const filteredSchedules = schedules.filter(schedule => {
    // Search filter
    const relay = relays.find(r => r.id === schedule.relayId);
    const matchesSearch = searchTerm === '' || 
      schedule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      relay?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status/Type filter
    let matchesFilter = true;
    switch (filter) {
      case 'enabled':
        matchesFilter = schedule.enabled;
        break;
      case 'disabled':
        matchesFilter = !schedule.enabled;
        break;
      case 'daily':
        matchesFilter = schedule.scheduleType === 'daily';
        break;
      case 'weekly':
        matchesFilter = schedule.scheduleType === 'weekly';
        break;
      case 'interval':
        matchesFilter = schedule.scheduleType === 'interval';
        break;
    }

    // Relay filter
    const matchesRelay = selectedRelay === 'all' || schedule.relayId === selectedRelay;

    return matchesSearch && matchesFilter && matchesRelay;
  });

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingSchedule(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSchedule(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-orange/20 border border-accent-orange/30 flex items-center justify-center">
            <Calendar size={20} className="text-accent-orange" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Schedules</h2>
            <p className="text-sm text-industrial-400">
              {schedules.filter(s => s.enabled).length} active of {schedules.length} total
            </p>
          </div>
        </div>

        <button
          onClick={handleCreate}
          className="btn btn-primary"
        >
          <Plus size={18} />
          New Schedule
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-industrial-400" />
          <input
            type="text"
            placeholder="Search schedules..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>

        {/* Relay Filter */}
        <select
          value={selectedRelay}
          onChange={e => setSelectedRelay(e.target.value)}
          className="input w-full lg:w-48"
        >
          <option value="all">All Relays</option>
          {relays.map(relay => (
            <option key={relay.id} value={relay.id}>{relay.name}</option>
          ))}
        </select>

        {/* Type Filters */}
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'All', icon: Calendar },
            { value: 'enabled', label: 'Active', icon: Clock },
            { value: 'daily', label: 'Daily', icon: Clock },
            { value: 'weekly', label: 'Weekly', icon: Repeat },
            { value: 'interval', label: 'Interval', icon: Repeat },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as FilterMode)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
                filter === f.value
                  ? 'bg-accent-orange/20 text-accent-orange border border-accent-orange/30'
                  : 'bg-industrial-700/50 text-industrial-300 border border-industrial-600 hover:border-industrial-500'
              )}
            >
              <f.icon size={14} />
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Schedules Grid */}
      {filteredSchedules.length === 0 ? (
        <div className="card p-12 text-center">
          <Calendar size={48} className="mx-auto mb-4 text-industrial-500" />
          <p className="text-lg text-industrial-300 mb-2">No schedules found</p>
          <p className="text-sm text-industrial-500 mb-6">
            {schedules.length === 0 
              ? 'Create your first schedule to automate relay control'
              : 'Try adjusting your search or filters'}
          </p>
          {schedules.length === 0 && (
            <button onClick={handleCreate} className="btn btn-primary">
              <Plus size={18} />
              Create Schedule
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredSchedules.map(schedule => (
            <ScheduleCard 
              key={schedule.id} 
              schedule={schedule} 
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Schedule Modal */}
      <ScheduleModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        schedule={editingSchedule}
      />
    </div>
  );
}
