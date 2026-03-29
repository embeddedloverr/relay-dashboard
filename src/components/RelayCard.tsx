'use client';

import { useState } from 'react';
import { 
  Power, 
  MoreVertical, 
  Settings, 
  Clock, 
  Cpu,
  ToggleLeft,
  ToggleRight,
  Zap,
  Loader2,
  Edit2,
  Check
} from 'lucide-react';
import { Relay } from '@/types';
import { useRelayStore } from '@/store/relayStore';
import { cn, formatTimeAgo, getModeColor } from '@/lib/utils';

interface RelayCardProps {
  relay: Relay;
  onEdit?: (relay: Relay) => void;
}

export default function RelayCard({ relay, onEdit }: RelayCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { 
    setRelayMode, 
    selectRelay, 
    selectedRelayId, 
    controlRelay, 
    getActiveMac,
    aliases,
    setAlias
  } = useRelayStore();
  
  const isSelected = selectedRelayId === relay.id;
  const isDisabled = relay.mode === 'disabled';
  const isOn = relay.state === 'ON';

  // Extract relay number from id (e.g., "relay-1" -> 1)
  const relayNum = parseInt(relay.id.split('-')[1], 10);

  // Alias
  const mac = getActiveMac();
  const aliasName = mac ? aliases[mac]?.relays?.[relayNum] : undefined;
  const displayName = aliasName || relay.name;

  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(displayName);

  const handleSaveAlias = () => {
    if (mac && editNameValue.trim() !== '' && editNameValue !== displayName) {
      setAlias(mac, undefined, relayNum, editNameValue.trim());
    }
    setIsEditingName(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveAlias();
    if (e.key === 'Escape') {
      setEditNameValue(displayName);
      setIsEditingName(false);
    }
  };

  const handleMqttControl = async (state: 'on' | 'off' | 'toggle') => {
    const mac = getActiveMac();
    if (!mac || isSending) return;

    setIsSending(true);
    try {
      await controlRelay(mac, relayNum, state);
    } finally {
      setIsSending(false);
    }
  };

  const handleToggle = () => {
    if (!isDisabled) {
      handleMqttControl('toggle');
    }
  };

  const handleModeChange = (mode: 'manual' | 'auto' | 'disabled') => {
    setRelayMode(relay.id, mode);
    setShowMenu(false);
  };

  return (
    <div
      className={cn(
        'card relative overflow-hidden transition-all duration-300',
        isSelected && 'ring-2 ring-accent-cyan ring-offset-2 ring-offset-industrial-800',
        isDisabled && 'opacity-60',
        !isDisabled && 'card-hover cursor-pointer'
      )}
      onClick={() => selectRelay(isSelected ? null : relay.id)}
    >
      {/* Status Indicator Bar */}
      <div className={cn(
        'absolute top-0 left-0 right-0 h-1 transition-colors duration-300',
        isOn ? 'bg-relay-on' : 'bg-relay-off',
        isOn && 'relay-active'
      )} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300',
              isOn 
                ? 'bg-relay-on/20 border border-relay-on/50' 
                : 'bg-industrial-700 border border-industrial-600',
              isOn && !isDisabled && 'glow-on'
            )}>
              <Power 
                size={24} 
                className={cn(
                  'transition-colors duration-300',
                  isOn ? 'text-relay-on' : 'text-industrial-400'
                )} 
              />
            </div>
            <div className="flex-1">
              {isEditingName ? (
                <div 
                  className="flex items-center gap-2"
                  onClick={e => e.stopPropagation()}
                >
                  <input
                    type="text"
                    value={editNameValue}
                    onChange={e => setEditNameValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSaveAlias}
                    autoFocus
                    className="bg-industrial-800 text-white border border-accent-cyan/50 rounded px-2 py-0.5 text-sm w-full outline-none focus:ring-1 focus:ring-accent-cyan"
                  />
                  <button onClick={handleSaveAlias} className="text-accent-cyan hover:text-white transition-colors">
                    <Check size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h3 className="font-semibold text-white">{displayName}</h3>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditNameValue(displayName);
                      setIsEditingName(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-industrial-500 hover:text-white transition-all hidden sm:block"
                  >
                    <Edit2 size={12} />
                  </button>
                </div>
              )}
              <p className="text-xs text-industrial-400">{relay.description}</p>
            </div>
          </div>

          {/* Menu Button */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-2 rounded-lg hover:bg-industrial-700 text-industrial-400 hover:text-white transition-colors"
            >
              <MoreVertical size={18} />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-industrial-700 border border-industrial-600 rounded-xl shadow-xl z-20 py-2 animate-slide-down">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleModeChange('manual');
                    }}
                    className={cn(
                      'w-full px-4 py-2 text-left text-sm hover:bg-industrial-600 flex items-center gap-3',
                      relay.mode === 'manual' ? 'text-accent-orange' : 'text-industrial-200'
                    )}
                  >
                    <ToggleRight size={16} />
                    Manual Mode
                    {relay.mode === 'manual' && <span className="ml-auto">✓</span>}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleModeChange('auto');
                    }}
                    className={cn(
                      'w-full px-4 py-2 text-left text-sm hover:bg-industrial-600 flex items-center gap-3',
                      relay.mode === 'auto' ? 'text-relay-on' : 'text-industrial-200'
                    )}
                  >
                    <Zap size={16} />
                    Auto Mode
                    {relay.mode === 'auto' && <span className="ml-auto">✓</span>}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleModeChange('disabled');
                    }}
                    className={cn(
                      'w-full px-4 py-2 text-left text-sm hover:bg-industrial-600 flex items-center gap-3',
                      relay.mode === 'disabled' ? 'text-industrial-400' : 'text-industrial-200'
                    )}
                  >
                    <ToggleLeft size={16} />
                    Disabled
                    {relay.mode === 'disabled' && <span className="ml-auto">✓</span>}
                  </button>
                  <div className="border-t border-industrial-600 my-2" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(relay);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-industrial-200 hover:bg-industrial-600 flex items-center gap-3"
                  >
                    <Settings size={16} />
                    Configure
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Status & Info */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-industrial-700/50 rounded-lg p-3">
            <p className="text-xs text-industrial-400 mb-1">State</p>
            <div className="flex items-center gap-2">
              <div className={cn(
                'status-dot',
                isOn ? 'status-dot-on' : 'status-dot-off'
              )} />
              <span className={cn(
                'font-mono font-semibold',
                isOn ? 'text-relay-on' : 'text-relay-off'
              )}>
                {relay.state}
              </span>
            </div>
          </div>
          <div className="bg-industrial-700/50 rounded-lg p-3">
            <p className="text-xs text-industrial-400 mb-1">Mode</p>
            <span className={cn(
              'font-mono font-semibold capitalize',
              getModeColor(relay.mode)
            )}>
              {relay.mode}
            </span>
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex items-center justify-between text-xs text-industrial-400 mb-4">
          <div className="flex items-center gap-1.5">
            <Cpu size={12} />
            <span className="font-mono">CH {relayNum}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={12} />
            <span>{formatTimeAgo(relay.lastUpdated)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleMqttControl('on');
            }}
            disabled={isDisabled || isOn || isSending}
            className={cn(
              'btn flex-1 text-sm py-2',
              isOn 
                ? 'bg-relay-on/20 text-relay-on border-relay-on/50' 
                : 'btn-success',
              (isDisabled || isSending) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isSending ? <Loader2 size={16} className="animate-spin" /> : <Power size={16} />}
            ON
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleMqttControl('off');
            }}
            disabled={isDisabled || !isOn || isSending}
            className={cn(
              'btn flex-1 text-sm py-2',
              !isOn 
                ? 'bg-relay-off/20 text-relay-off border-relay-off/50' 
                : 'btn-danger',
              (isDisabled || isSending) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isSending ? <Loader2 size={16} className="animate-spin" /> : <Power size={16} />}
            OFF
          </button>
        </div>
      </div>
    </div>
  );
}
