'use client';

import { useState, useEffect } from 'react';
import { 
  Zap, 
  Settings, 
  Bell, 
  Wifi, 
  WifiOff,
  Menu,
  X,
  RefreshCw,
  LogOut,
  User
} from 'lucide-react';
import { useRelayStore } from '@/store/relayStore';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import Link from 'next/link';

interface HeaderProps {
  onMenuToggle: () => void;
  menuOpen: boolean;
}

export default function Header({ onMenuToggle, menuOpen }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { getStats, isLoading, fetchAllLiveData, deviceHealths } = useRelayStore();
  const { user, logout } = useAuthStore();
  const stats = getStats();

  const connected = deviceHealths.length > 0 && deviceHealths.some(d => d.isOnline);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = () => {
    fetchAllLiveData();
  };

  return (
    <header className="sticky top-0 z-40 bg-industrial-900/90 backdrop-blur-lg border-b border-industrial-700">
      <div className="container-main">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 text-industrial-400 hover:text-white transition-colors"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-cyan/50 flex items-center justify-center shadow-neon-cyan">
                <Zap size={24} className="text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-display text-xl font-bold text-white tracking-wider">
                  RELAY<span className="text-accent-cyan">CTRL</span>
                </h1>
                <p className="text-xs text-industrial-400 font-mono">
                  Industrial IoT Dashboard
                </p>
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-4 px-4 py-2 bg-industrial-800/50 rounded-lg border border-industrial-700">
              <div className="flex items-center gap-2">
                <div className={`status-dot ${stats.relaysOn > 0 ? 'status-dot-on relay-active' : 'status-dot-off'}`} />
                <span className="text-sm font-mono">
                  <span className="text-relay-on">{stats.relaysOn}</span>
                  <span className="text-industrial-500">/</span>
                  <span className="text-industrial-300">{stats.totalRelays}</span>
                </span>
              </div>
              <div className="w-px h-4 bg-industrial-600" />
              <div className="flex items-center gap-2">
                {connected ? (
                  <Wifi size={16} className="text-relay-on" />
                ) : (
                  <WifiOff size={16} className="text-relay-off" />
                )}
                <span className="text-xs text-industrial-400">
                  {connected ? 'Connected' : 'Offline'}
                </span>
              </div>
            </div>

            {/* Time Display */}
            <div className="text-right">
              <div className="font-mono text-lg text-white">
                {format(currentTime, 'HH:mm:ss')}
              </div>
              <div className="text-xs text-industrial-400 font-mono">
                {format(currentTime, 'dd MMM yyyy')}
              </div>
            </div>
          </div>

          {/* Actions & User */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className={`p-2 rounded-lg text-industrial-400 hover:text-white hover:bg-industrial-700 transition-all ${
                  isLoading ? 'animate-spin' : ''
                }`}
                title="Refresh"
              >
                <RefreshCw size={20} />
              </button>
              <button
                className="p-2 rounded-lg text-industrial-400 hover:text-white hover:bg-industrial-700 transition-all relative"
                title="Notifications"
              >
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent-orange rounded-full" />
              </button>
              {user?.role === 'admin' && (
                <Link
                  href="/settings"
                  className="p-2 rounded-lg text-industrial-400 hover:text-white hover:bg-industrial-700 transition-all block"
                  title="Settings"
                >
                  <Settings size={20} />
                </Link>
              )}
            </div>

            {/* User Profile */}
            {user && (
              <div className="flex items-center gap-3 pl-4 border-l border-industrial-700">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-white">{user.name}</p>
                  <p className="text-xs text-industrial-400 font-mono uppercase tracking-wider">{user.role}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-industrial-800 border border-industrial-600 flex items-center justify-center text-accent-cyan">
                  <User size={18} />
                </div>
                <button
                  onClick={logout}
                  className="ml-2 p-2 rounded-lg text-industrial-500 hover:text-accent-orange hover:bg-accent-orange/10 transition-all"
                  title="Sign Out"
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
