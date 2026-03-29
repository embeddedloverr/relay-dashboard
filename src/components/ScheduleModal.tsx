'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Repeat, 
  Power, 
  Save,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { Schedule, DayOfWeek, Relay } from '@/types';
import { useRelayStore } from '@/store/relayStore';
import { cn, generateId, getDayShort } from '@/lib/utils';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule?: Schedule | null;
  preselectedRelayId?: string;
}

const DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const DEFAULT_SCHEDULE: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  relayId: '',
  enabled: true,
  action: 'ON',
  scheduleType: 'daily',
  time: '08:00',
  days: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
  intervalMinutes: 60,
  durationMinutes: 30,
};

export default function ScheduleModal({ 
  isOpen, 
  onClose, 
  schedule, 
  preselectedRelayId 
}: ScheduleModalProps) {
  const { relays, addSchedule, updateSchedule, deleteSchedule } = useRelayStore();
  const [formData, setFormData] = useState(DEFAULT_SCHEDULE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isEditing = !!schedule;

  useEffect(() => {
    if (schedule) {
      setFormData({
        name: schedule.name,
        relayId: schedule.relayId,
        enabled: schedule.enabled,
        action: schedule.action,
        scheduleType: schedule.scheduleType,
        time: schedule.time || '08:00',
        days: schedule.days || ['MON', 'TUE', 'WED', 'THU', 'FRI'],
        intervalMinutes: schedule.intervalMinutes || 60,
        durationMinutes: schedule.durationMinutes,
        date: schedule.date,
      });
    } else {
      setFormData({
        ...DEFAULT_SCHEDULE,
        relayId: preselectedRelayId || '',
      });
    }
    setErrors({});
    setShowDeleteConfirm(false);
  }, [schedule, preselectedRelayId, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Schedule name is required';
    }
    if (!formData.relayId) {
      newErrors.relayId = 'Please select a relay';
    }
    if (!formData.time && formData.scheduleType !== 'interval') {
      newErrors.time = 'Time is required';
    }
    if (formData.scheduleType === 'weekly' && (!formData.days || formData.days.length === 0)) {
      newErrors.days = 'Select at least one day';
    }
    if (formData.scheduleType === 'once' && !formData.date) {
      newErrors.date = 'Date is required for one-time schedule';
    }
    if (formData.scheduleType === 'interval' && (!formData.intervalMinutes || formData.intervalMinutes < 1)) {
      newErrors.intervalMinutes = 'Interval must be at least 1 minute';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const now = new Date().toISOString();
    
    if (isEditing && schedule) {
      updateSchedule(schedule.id, {
        ...formData,
        updatedAt: now,
      });
    } else {
      const newSchedule: Schedule = {
        ...formData,
        id: generateId('sch'),
        createdAt: now,
        updatedAt: now,
      };
      addSchedule(newSchedule);
    }
    
    onClose();
  };

  const handleDelete = () => {
    if (schedule) {
      deleteSchedule(schedule.id);
      onClose();
    }
  };

  const toggleDay = (day: DayOfWeek) => {
    const currentDays = formData.days || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    setFormData({ ...formData, days: newDays });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-industrial-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-cyan/20 border border-accent-cyan/30 flex items-center justify-center">
              <Calendar size={20} className="text-accent-cyan" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {isEditing ? 'Edit Schedule' : 'New Schedule'}
              </h2>
              <p className="text-sm text-industrial-400">
                {isEditing ? 'Modify schedule settings' : 'Create automated relay control'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-industrial-700 text-industrial-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Schedule Name */}
          <div>
            <label className="input-label">Schedule Name</label>
            <input
              type="text"
              className={cn('input', errors.name && 'border-relay-off')}
              placeholder="e.g., Morning Pump Cycle"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
            {errors.name && (
              <p className="text-xs text-relay-off mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.name}
              </p>
            )}
          </div>

          {/* Relay Selection */}
          <div>
            <label className="input-label">Target Relay</label>
            <select
              className={cn('input', errors.relayId && 'border-relay-off')}
              value={formData.relayId}
              onChange={e => setFormData({ ...formData, relayId: e.target.value })}
            >
              <option value="">Select a relay...</option>
              {relays.map(relay => (
                <option key={relay.id} value={relay.id}>
                  {relay.name} (GPIO {relay.gpio})
                </option>
              ))}
            </select>
            {errors.relayId && (
              <p className="text-xs text-relay-off mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.relayId}
              </p>
            )}
          </div>

          {/* Action */}
          <div>
            <label className="input-label">Action</label>
            <div className="flex gap-2">
              {(['ON', 'OFF', 'TOGGLE'] as const).map(action => (
                <button
                  key={action}
                  type="button"
                  onClick={() => setFormData({ ...formData, action })}
                  className={cn(
                    'flex-1 py-2.5 px-4 rounded-lg border font-medium transition-all flex items-center justify-center gap-2',
                    formData.action === action
                      ? action === 'ON'
                        ? 'bg-relay-on/20 border-relay-on text-relay-on'
                        : action === 'OFF'
                        ? 'bg-relay-off/20 border-relay-off text-relay-off'
                        : 'bg-accent-cyan/20 border-accent-cyan text-accent-cyan'
                      : 'bg-industrial-700/50 border-industrial-600 text-industrial-300 hover:border-industrial-500'
                  )}
                >
                  <Power size={16} />
                  {action}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule Type */}
          <div>
            <label className="input-label">Schedule Type</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'once', label: 'One Time', icon: Calendar },
                { value: 'daily', label: 'Daily', icon: Clock },
                { value: 'weekly', label: 'Weekly', icon: Repeat },
                { value: 'interval', label: 'Interval', icon: Repeat },
              ].map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, scheduleType: type.value as any })}
                  className={cn(
                    'py-2.5 px-4 rounded-lg border font-medium transition-all flex items-center justify-center gap-2',
                    formData.scheduleType === type.value
                      ? 'bg-accent-cyan/20 border-accent-cyan text-accent-cyan'
                      : 'bg-industrial-700/50 border-industrial-600 text-industrial-300 hover:border-industrial-500'
                  )}
                >
                  <type.icon size={16} />
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date (for one-time) */}
          {formData.scheduleType === 'once' && (
            <div>
              <label className="input-label">Date</label>
              <input
                type="date"
                className={cn('input', errors.date && 'border-relay-off')}
                value={formData.date || ''}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.date && (
                <p className="text-xs text-relay-off mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.date}
                </p>
              )}
            </div>
          )}

          {/* Time (for non-interval) */}
          {formData.scheduleType !== 'interval' && (
            <div>
              <label className="input-label">Time</label>
              <input
                type="time"
                className={cn('input font-mono', errors.time && 'border-relay-off')}
                value={formData.time || ''}
                onChange={e => setFormData({ ...formData, time: e.target.value })}
              />
              {errors.time && (
                <p className="text-xs text-relay-off mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.time}
                </p>
              )}
            </div>
          )}

          {/* Days (for weekly) */}
          {formData.scheduleType === 'weekly' && (
            <div>
              <label className="input-label">Days of Week</label>
              <div className="flex gap-2">
                {DAYS.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={cn(
                      'flex-1 py-2 rounded-lg border font-medium text-sm transition-all',
                      formData.days?.includes(day)
                        ? 'bg-accent-cyan/20 border-accent-cyan text-accent-cyan'
                        : 'bg-industrial-700/50 border-industrial-600 text-industrial-400 hover:border-industrial-500'
                    )}
                  >
                    {getDayShort(day)}
                  </button>
                ))}
              </div>
              {errors.days && (
                <p className="text-xs text-relay-off mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.days}
                </p>
              )}
            </div>
          )}

          {/* Interval (for interval type) */}
          {formData.scheduleType === 'interval' && (
            <div>
              <label className="input-label">Run Every (minutes)</label>
              <input
                type="number"
                className={cn('input font-mono', errors.intervalMinutes && 'border-relay-off')}
                value={formData.intervalMinutes || ''}
                onChange={e => setFormData({ ...formData, intervalMinutes: parseInt(e.target.value) || 0 })}
                min={1}
                placeholder="60"
              />
              {errors.intervalMinutes && (
                <p className="text-xs text-relay-off mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.intervalMinutes}
                </p>
              )}
            </div>
          )}

          {/* Duration */}
          <div>
            <label className="input-label">
              Auto-OFF Duration (minutes)
              <span className="text-industrial-500 font-normal ml-1">- optional</span>
            </label>
            <input
              type="number"
              className="input font-mono"
              value={formData.durationMinutes || ''}
              onChange={e => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || undefined })}
              min={1}
              placeholder="Leave empty for no auto-off"
            />
            <p className="text-xs text-industrial-500 mt-1">
              Relay will automatically turn OFF after this duration
            </p>
          </div>

          {/* Enabled Toggle */}
          <div className="flex items-center justify-between p-4 bg-industrial-700/30 rounded-xl">
            <div>
              <p className="font-medium text-white">Enable Schedule</p>
              <p className="text-sm text-industrial-400">Schedule will run when enabled</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
              className={cn(
                'toggle-switch',
                formData.enabled ? 'bg-relay-on' : 'bg-industrial-600'
              )}
            >
              <span
                className={cn(
                  'toggle-switch-thumb',
                  formData.enabled ? 'translate-x-8' : 'translate-x-1'
                )}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-industrial-700 bg-industrial-800/50">
          {isEditing ? (
            <div>
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-relay-off">Delete?</span>
                  <button
                    onClick={handleDelete}
                    className="btn btn-danger text-sm py-1.5"
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="btn btn-ghost text-sm py-1.5"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="btn btn-ghost text-relay-off hover:bg-relay-off/10"
                >
                  <Trash2 size={18} />
                  Delete
                </button>
              )}
            </div>
          ) : (
            <div />
          )}
          
          <div className="flex gap-3">
            <button onClick={onClose} className="btn btn-ghost">
              Cancel
            </button>
            <button onClick={handleSubmit} className="btn btn-primary">
              <Save size={18} />
              {isEditing ? 'Save Changes' : 'Create Schedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
