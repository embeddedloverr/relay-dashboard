'use client';

import { useState } from 'react';
import { 
  Settings, 
  Wifi, 
  Server, 
  Bell, 
  Shield,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Globe,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MqttSettings {
  broker: string;
  port: number;
  username: string;
  password: string;
  topic: string;
  clientId: string;
}

interface NotificationSettings {
  emailEnabled: boolean;
  email: string;
  slackEnabled: boolean;
  slackWebhook: string;
  notifyOnStateChange: boolean;
  notifyOnScheduleRun: boolean;
  notifyOnError: boolean;
}

export default function SettingsPanel() {
  const [activeSection, setActiveSection] = useState<'mqtt' | 'notifications' | 'system'>('mqtt');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [mqttSettings, setMqttSettings] = useState<MqttSettings>({
    broker: 'mqtt.smartdwell.in',
    port: 1883,
    username: 'relay_user',
    password: '',
    topic: 'smartdwell/relays',
    clientId: 'relay-dashboard-001',
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailEnabled: false,
    email: '',
    slackEnabled: false,
    slackWebhook: '',
    notifyOnStateChange: true,
    notifyOnScheduleRun: true,
    notifyOnError: true,
  });

  const [systemSettings, setSystemSettings] = useState({
    timezone: 'Asia/Kolkata',
    refreshInterval: 5,
    logRetentionDays: 30,
    autoSync: true,
  });

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const sections = [
    { id: 'mqtt', label: 'MQTT Connection', icon: Wifi },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'system', label: 'System', icon: Server },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-industrial-600 border border-industrial-500 flex items-center justify-center">
          <Settings size={20} className="text-industrial-200" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <p className="text-sm text-industrial-400">
            Configure system and connection settings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Section Navigation */}
        <div className="lg:col-span-1">
          <nav className="card p-2 space-y-1">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as any)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all',
                  activeSection === section.id
                    ? 'bg-accent-cyan/20 text-accent-cyan'
                    : 'text-industrial-300 hover:bg-industrial-700/50 hover:text-white'
                )}
              >
                <section.icon size={18} />
                <span className="font-medium">{section.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="card p-6">
            {/* MQTT Settings */}
            {activeSection === 'mqtt' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-industrial-700">
                  <div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Wifi size={20} className="text-accent-cyan" />
                      MQTT Connection
                    </h3>
                    <p className="text-sm text-industrial-400">
                      Configure MQTT broker connection for relay communication
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-relay-on/10 border border-relay-on/30 rounded-full">
                    <div className="w-2 h-2 bg-relay-on rounded-full animate-pulse" />
                    <span className="text-sm text-relay-on font-medium">Connected</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Broker Address</label>
                    <input
                      type="text"
                      className="input font-mono"
                      value={mqttSettings.broker}
                      onChange={e => setMqttSettings({ ...mqttSettings, broker: e.target.value })}
                      placeholder="mqtt.example.com"
                    />
                  </div>
                  <div>
                    <label className="input-label">Port</label>
                    <input
                      type="number"
                      className="input font-mono"
                      value={mqttSettings.port}
                      onChange={e => setMqttSettings({ ...mqttSettings, port: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="input-label">Username</label>
                    <input
                      type="text"
                      className="input"
                      value={mqttSettings.username}
                      onChange={e => setMqttSettings({ ...mqttSettings, username: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="input-label">Password</label>
                    <input
                      type="password"
                      className="input"
                      value={mqttSettings.password}
                      onChange={e => setMqttSettings({ ...mqttSettings, password: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="input-label">Base Topic</label>
                    <input
                      type="text"
                      className="input font-mono"
                      value={mqttSettings.topic}
                      onChange={e => setMqttSettings({ ...mqttSettings, topic: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="input-label">Client ID</label>
                    <input
                      type="text"
                      className="input font-mono"
                      value={mqttSettings.clientId}
                      onChange={e => setMqttSettings({ ...mqttSettings, clientId: e.target.value })}
                    />
                  </div>
                </div>

                <div className="p-4 bg-industrial-700/30 rounded-xl">
                  <h4 className="font-medium text-white mb-2">Topic Structure</h4>
                  <div className="space-y-2 font-mono text-sm">
                    <p className="text-industrial-400">
                      Subscribe: <span className="text-accent-cyan">{mqttSettings.topic}/+/status</span>
                    </p>
                    <p className="text-industrial-400">
                      Publish: <span className="text-accent-orange">{mqttSettings.topic}/[relay_id]/command</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <div className="pb-4 border-b border-industrial-700">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Bell size={20} className="text-accent-orange" />
                    Notification Settings
                  </h3>
                  <p className="text-sm text-industrial-400">
                    Configure alerts and notifications
                  </p>
                </div>

                {/* Email Notifications */}
                <div className="p-4 bg-industrial-700/30 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">Email Notifications</p>
                      <p className="text-sm text-industrial-400">Receive alerts via email</p>
                    </div>
                    <button
                      onClick={() => setNotifications({ ...notifications, emailEnabled: !notifications.emailEnabled })}
                      className={cn(
                        'toggle-switch',
                        notifications.emailEnabled ? 'bg-relay-on' : 'bg-industrial-600'
                      )}
                    >
                      <span className={cn(
                        'toggle-switch-thumb',
                        notifications.emailEnabled ? 'translate-x-8' : 'translate-x-1'
                      )} />
                    </button>
                  </div>
                  {notifications.emailEnabled && (
                    <input
                      type="email"
                      className="input"
                      placeholder="your@email.com"
                      value={notifications.email}
                      onChange={e => setNotifications({ ...notifications, email: e.target.value })}
                    />
                  )}
                </div>

                {/* Slack Notifications */}
                <div className="p-4 bg-industrial-700/30 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">Slack Notifications</p>
                      <p className="text-sm text-industrial-400">Send alerts to Slack channel</p>
                    </div>
                    <button
                      onClick={() => setNotifications({ ...notifications, slackEnabled: !notifications.slackEnabled })}
                      className={cn(
                        'toggle-switch',
                        notifications.slackEnabled ? 'bg-relay-on' : 'bg-industrial-600'
                      )}
                    >
                      <span className={cn(
                        'toggle-switch-thumb',
                        notifications.slackEnabled ? 'translate-x-8' : 'translate-x-1'
                      )} />
                    </button>
                  </div>
                  {notifications.slackEnabled && (
                    <input
                      type="url"
                      className="input font-mono text-sm"
                      placeholder="https://hooks.slack.com/services/..."
                      value={notifications.slackWebhook}
                      onChange={e => setNotifications({ ...notifications, slackWebhook: e.target.value })}
                    />
                  )}
                </div>

                {/* Event Triggers */}
                <div className="space-y-3">
                  <h4 className="font-medium text-white">Notify On</h4>
                  {[
                    { key: 'notifyOnStateChange', label: 'Relay State Changes' },
                    { key: 'notifyOnScheduleRun', label: 'Schedule Executions' },
                    { key: 'notifyOnError', label: 'System Errors' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-3 bg-industrial-700/30 rounded-lg">
                      <span className="text-industrial-200">{item.label}</span>
                      <button
                        onClick={() => setNotifications({ 
                          ...notifications, 
                          [item.key]: !notifications[item.key as keyof NotificationSettings] 
                        })}
                        className={cn(
                          'toggle-switch scale-90',
                          notifications[item.key as keyof NotificationSettings] ? 'bg-relay-on' : 'bg-industrial-600'
                        )}
                      >
                        <span className={cn(
                          'toggle-switch-thumb',
                          notifications[item.key as keyof NotificationSettings] ? 'translate-x-8' : 'translate-x-1'
                        )} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* System Settings */}
            {activeSection === 'system' && (
              <div className="space-y-6">
                <div className="pb-4 border-b border-industrial-700">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Server size={20} className="text-industrial-300" />
                    System Settings
                  </h3>
                  <p className="text-sm text-industrial-400">
                    General system configuration
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label flex items-center gap-2">
                      <Globe size={14} />
                      Timezone
                    </label>
                    <select
                      className="input"
                      value={systemSettings.timezone}
                      onChange={e => setSystemSettings({ ...systemSettings, timezone: e.target.value })}
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                    </select>
                  </div>
                  <div>
                    <label className="input-label flex items-center gap-2">
                      <RefreshCw size={14} />
                      Status Refresh Interval
                    </label>
                    <select
                      className="input"
                      value={systemSettings.refreshInterval}
                      onChange={e => setSystemSettings({ ...systemSettings, refreshInterval: parseInt(e.target.value) })}
                    >
                      <option value={1}>1 second</option>
                      <option value={5}>5 seconds</option>
                      <option value={10}>10 seconds</option>
                      <option value={30}>30 seconds</option>
                    </select>
                  </div>
                  <div>
                    <label className="input-label flex items-center gap-2">
                      <Clock size={14} />
                      Log Retention
                    </label>
                    <select
                      className="input"
                      value={systemSettings.logRetentionDays}
                      onChange={e => setSystemSettings({ ...systemSettings, logRetentionDays: parseInt(e.target.value) })}
                    >
                      <option value={7}>7 days</option>
                      <option value={30}>30 days</option>
                      <option value={90}>90 days</option>
                      <option value={365}>1 year</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-industrial-700/30 rounded-xl">
                  <div>
                    <p className="font-medium text-white">Auto-sync with Hardware</p>
                    <p className="text-sm text-industrial-400">
                      Automatically sync relay states with connected devices
                    </p>
                  </div>
                  <button
                    onClick={() => setSystemSettings({ ...systemSettings, autoSync: !systemSettings.autoSync })}
                    className={cn(
                      'toggle-switch',
                      systemSettings.autoSync ? 'bg-relay-on' : 'bg-industrial-600'
                    )}
                  >
                    <span className={cn(
                      'toggle-switch-thumb',
                      systemSettings.autoSync ? 'translate-x-8' : 'translate-x-1'
                    )} />
                  </button>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-industrial-700">
              {saveSuccess && (
                <div className="flex items-center gap-2 text-relay-on">
                  <CheckCircle size={18} />
                  <span className="text-sm">Settings saved successfully</span>
                </div>
              )}
              <div className="flex-1" />
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn btn-primary"
              >
                {isSaving ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
