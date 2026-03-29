'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Power, 
  Save,
  Trash2,
  AlertCircle,
  Plus,
  Send,
  Loader2
} from 'lucide-react';
import { Schedule, DayOfWeek } from '@/types';
import { useRelayStore } from '@/store/relayStore';
import { cn, generateId, getDayShort } from '@/lib/utils';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule?: Schedule | null;
  preselectedRelayId?: string;
}

// Device schedule entry — matches MQTT payload format
interface DeviceScheduleEntry {
  relay: number;
  on: string;   // HH:mm
  off: string;  // HH:mm
}

const DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export default function ScheduleModal({ 
  isOpen, 
  onClose, 
  schedule, 
  preselectedRelayId 
}: ScheduleModalProps) {
  const { relays, addSchedule, updateSchedule, deleteSchedule, sendScheduleToDevice, getActiveMac } = useRelayStore();
  
  // Device schedule entries (what gets sent to ESP32 via MQTT)
  const [entries, setEntries] = useState<DeviceScheduleEntry[]>([
    { relay: 1, on: '08:00', off: '20:00' },
  ]);
  const [scheduleName, setScheduleName] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isEditing = !!schedule;

  useEffect(() => {
    if (schedule) {
      setScheduleName(schedule.name);
      // Convert existing schedule to device entry format
      const relayNum = parseInt(schedule.relayId.split('-')[1], 10) || 1;
      const onTime = schedule.time || '08:00';
      // Calculate off time from duration if available
      let offTime = '20:00';
      if (schedule.time && schedule.durationMinutes) {
        const [h, m] = schedule.time.split(':').map(Number);
        const totalMinutes = h * 60 + m + schedule.durationMinutes;
        const offH = Math.floor(totalMinutes / 60) % 24;
        const offM = totalMinutes % 60;
        offTime = `${String(offH).padStart(2, '0')}:${String(offM).padStart(2, '0')}`;
      }
      setEntries([{ relay: relayNum, on: onTime, off: offTime }]);
    } else {
      setScheduleName('');
      setEntries([{ relay: 1, on: '08:00', off: '20:00' }]);
    }
    setErrors({});
    setSendResult(null);
    setShowDeleteConfirm(false);
  }, [schedule, isOpen]);

  const addEntry = () => {
    if (entries.length < 6) {
      // Pick next available relay number
      const usedRelays = entries.map(e => e.relay);
      let nextRelay = 1;
      for (let i = 1; i <= 6; i++) {
        if (!usedRelays.includes(i)) { nextRelay = i; break; }
      }
      setEntries([...entries, { relay: nextRelay, on: '08:00', off: '20:00' }]);
    }
  };

  const removeEntry = (index: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter((_, i) => i !== index));
    }
  };

  const updateEntry = (index: number, field: keyof DeviceScheduleEntry, value: string | number) => {
    setEntries(entries.map((entry, i) => 
      i === index ? { ...entry, [field]: value } : entry
    ));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!scheduleName.trim()) {
      newErrors.name = 'Schedule name is required';
    }

    entries.forEach((entry, i) => {
      if (!entry.on) newErrors[`entry_${i}_on`] = 'ON time required';
      if (!entry.off) newErrors[`entry_${i}_off`] = 'OFF time required';
      if (entry.relay < 1 || entry.relay > 6) newErrors[`entry_${i}_relay`] = 'Relay 1-6';
    });

    // Check for duplicate relays
    const relayNums = entries.map(e => e.relay);
    if (new Set(relayNums).size !== relayNums.length) {
      newErrors.duplicate = 'Each relay can only have one schedule entry';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveLocal = () => {
    if (!validate()) return;

    const now = new Date().toISOString();
    
    // Save first entry as the primary schedule in the local store
    const firstEntry = entries[0];
    const relayId = `relay-${firstEntry.relay}`;

    if (isEditing && schedule) {
      updateSchedule(schedule.id, {
        name: scheduleName,
        relayId,
        time: firstEntry.on,
        // Calculate duration from on/off times
        durationMinutes: calculateDuration(firstEntry.on, firstEntry.off),
        updatedAt: now,
      });
    } else {
      const newSchedule: Schedule = {
        id: generateId('sch'),
        name: scheduleName,
        relayId,
        enabled: true,
        action: 'ON',
        scheduleType: 'daily',
        time: firstEntry.on,
        durationMinutes: calculateDuration(firstEntry.on, firstEntry.off),
        createdAt: now,
        updatedAt: now,
      };
      addSchedule(newSchedule);
    }
  };

  const handleSendToDevice = async () => {
    if (!validate()) return;

    const mac = getActiveMac();
    if (!mac) {
      setSendResult({ success: false, message: 'No device connected. Connect a device first.' });
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      const success = await sendScheduleToDevice(mac, entries);
      
      if (success) {
        // Also save locally
        handleSaveLocal();
        setSendResult({ success: true, message: `Schedule sent to device ${mac}` });
        // Close after a short delay
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setSendResult({ success: false, message: 'Failed to send schedule. Check MQTT broker connection.' });
      }
    } catch {
      setSendResult({ success: false, message: 'Error sending schedule to device.' });
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveAndSend = async () => {
    await handleSendToDevice();
  };

  const handleDelete = () => {
    if (schedule) {
      deleteSchedule(schedule.id);
      onClose();
    }
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
                {isEditing ? 'Edit Schedule' : 'New Device Schedule'}
              </h2>
              <p className="text-sm text-industrial-400">
                Set ON/OFF times for relays — pushed to device via MQTT
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
              placeholder="e.g., Daily Pump Schedule"
              value={scheduleName}
              onChange={e => setScheduleName(e.target.value)}
            />
            {errors.name && (
              <p className="text-xs text-relay-off mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.name}
              </p>
            )}
          </div>

          {/* Schedule Entries */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="input-label mb-0">Relay Schedules</label>
              {entries.length < 6 && (
                <button
                  type="button"
                  onClick={addEntry}
                  className="btn btn-ghost text-xs py-1 px-2"
                >
                  <Plus size={14} />
                  Add Relay
                </button>
              )}
            </div>

            {errors.duplicate && (
              <p className="text-xs text-relay-off mb-2 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.duplicate}
              </p>
            )}

            <div className="space-y-3">
              {entries.map((entry, index) => (
                <div 
                  key={index}
                  className="p-4 bg-industrial-700/30 rounded-xl border border-industrial-600/50 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">
                      Entry {index + 1}
                    </span>
                    {entries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEntry(index)}
                        className="p-1 rounded hover:bg-industrial-600 text-industrial-400 hover:text-relay-off transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {/* Relay Number */}
                    <div>
                      <label className="text-xs text-industrial-400 mb-1 block">Relay</label>
                      <select
                        className={cn('input text-sm py-2', errors[`entry_${index}_relay`] && 'border-relay-off')}
                        value={entry.relay}
                        onChange={e => updateEntry(index, 'relay', parseInt(e.target.value))}
                      >
                        {[1, 2, 3, 4, 5, 6].map(n => (
                          <option key={n} value={n}>
                            Relay {n}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* ON Time */}
                    <div>
                      <label className="text-xs text-industrial-400 mb-1 block flex items-center gap-1">
                        <Power size={10} className="text-relay-on" /> ON Time
                      </label>
                      <input
                        type="time"
                        className={cn('input text-sm py-2 font-mono', errors[`entry_${index}_on`] && 'border-relay-off')}
                        value={entry.on}
                        onChange={e => updateEntry(index, 'on', e.target.value)}
                      />
                    </div>

                    {/* OFF Time */}
                    <div>
                      <label className="text-xs text-industrial-400 mb-1 block flex items-center gap-1">
                        <Power size={10} className="text-relay-off" /> OFF Time
                      </label>
                      <input
                        type="time"
                        className={cn('input text-sm py-2 font-mono', errors[`entry_${index}_off`] && 'border-relay-off')}
                        value={entry.off}
                        onChange={e => updateEntry(index, 'off', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MQTT Payload Preview */}
          <div>
            <label className="input-label">MQTT Payload Preview</label>
            <div className="bg-industrial-900 rounded-lg p-3 font-mono text-xs text-industrial-300 overflow-x-auto">
              <span className="text-industrial-500">Topic: </span>
              <span className="text-accent-cyan">sdwell/{'{MAC}'}/cmd/schedule</span>
              <br />
              <span className="text-industrial-500">Payload: </span>
              <span className="text-relay-on">
                {JSON.stringify(entries.map(e => ({ relay: e.relay, on: e.on, off: e.off })))}
              </span>
            </div>
          </div>

          {/* Send Result */}
          {sendResult && (
            <div className={cn(
              'p-3 rounded-lg border flex items-center gap-2 text-sm',
              sendResult.success 
                ? 'bg-relay-on/10 border-relay-on/30 text-relay-on'
                : 'bg-relay-off/10 border-relay-off/30 text-relay-off'
            )}>
              <AlertCircle size={16} />
              {sendResult.message}
            </div>
          )}
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
            <button 
              onClick={handleSaveAndSend} 
              disabled={isSending}
              className={cn(
                'btn btn-primary',
                isSending && 'opacity-70 cursor-not-allowed'
              )}
            >
              {isSending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
              {isSending ? 'Sending...' : 'Save & Send to Device'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper: calculate minutes between two HH:mm times
function calculateDuration(onTime: string, offTime: string): number {
  const [onH, onM] = onTime.split(':').map(Number);
  const [offH, offM] = offTime.split(':').map(Number);
  const onMinutes = onH * 60 + onM;
  let offMinutes = offH * 60 + offM;
  if (offMinutes <= onMinutes) offMinutes += 24 * 60; // next day
  return offMinutes - onMinutes;
}
