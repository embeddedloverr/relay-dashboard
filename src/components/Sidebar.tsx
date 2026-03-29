'use client';

import { 
  LayoutDashboard, 
  Power, 
  Calendar, 
  History, 
  Settings,
  ChevronRight,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TabType = 'dashboard' | 'relays' | 'schedules' | 'logs' | 'settings';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'relays' as TabType, label: 'Relays', icon: Power },
  { id: 'schedules' as TabType, label: 'Schedules', icon: Calendar },
  { id: 'logs' as TabType, label: 'Activity Logs', icon: History },
  { id: 'settings' as TabType, label: 'Settings', icon: Settings },
];

export default function Sidebar({ activeTab, onTabChange, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-industrial-800/95 backdrop-blur-lg border-r border-industrial-700 transition-transform duration-300 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                onClose();
              }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group',
                activeTab === item.id
                  ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30'
                  : 'text-industrial-300 hover:bg-industrial-700/50 hover:text-white border border-transparent'
              )}
            >
              <item.icon 
                size={20} 
                className={cn(
                  'transition-transform duration-200',
                  activeTab === item.id ? 'text-accent-cyan' : 'group-hover:scale-110'
                )} 
              />
              <span className="font-medium flex-1">{item.label}</span>
              {activeTab === item.id && (
                <ChevronRight size={16} className="text-accent-cyan" />
              )}
            </button>
          ))}
        </nav>

        {/* Quick Stats */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-industrial-700">
          <div className="flex items-center gap-3 p-3 bg-industrial-700/30 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-industrial-600 flex items-center justify-center">
              <Layers size={20} className="text-accent-cyan" />
            </div>
            <div>
              <p className="text-xs text-industrial-400">System Status</p>
              <p className="text-sm font-medium text-relay-on">All Systems OK</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
