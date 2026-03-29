'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import DashboardOverview from '@/components/DashboardOverview';
import RelaysPanel from '@/components/RelaysPanel';
import SchedulesPanel from '@/components/SchedulesPanel';
import ActivityLogPanel from '@/components/ActivityLogPanel';
import SettingsPanel from '@/components/SettingsPanel';

type TabType = 'dashboard' | 'relays' | 'schedules' | 'logs' | 'settings';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'relays':
        return <RelaysPanel />;
      case 'schedules':
        return <SchedulesPanel />;
      case 'logs':
        return <ActivityLogPanel />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
        menuOpen={sidebarOpen}
      />
      
      <div className="flex flex-1">
        <Sidebar 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
