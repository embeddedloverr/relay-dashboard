'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  Cpu, 
  Users, 
  Plus, 
  Loader2, 
  Key,
  Database,
  CheckCircle2,
  Trash2,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Header from '@/components/Header';

interface Device {
  _id: string;
  mac: string;
  name: string;
  allowedUsers: string[];
}

interface Uzer {
  _id: string;
  email: string;
  name: string;
  role: string;
}

export default function SettingsPage() {
  const { user, isInitialized } = useAuthStore();
  const router = useRouter();

  const [devices, setDevices] = useState<Device[]>([]);
  const [users, setUsers] = useState<Uzer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Forms
  const [newMac, setNewMac] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  
  const [actionError, setActionError] = useState<{ type: string, msg: string } | null>(null);
  const [actionSuccess, setActionSuccess] = useState<{ type: string, msg: string } | null>(null);

  useEffect(() => {
    if (isInitialized && !user) {
      router.push('/login');
    }
    if (isInitialized && user?.role !== 'admin') {
      router.push('/');
    }
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user, isInitialized, router]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [devRes, usrRes] = await Promise.all([
        fetch('/api/devices'),
        fetch('/api/users')
      ]);
      const devJson = await devRes.json();
      const usrJson = await usrRes.json();
      
      if (devJson.success) setDevices(devJson.data);
      if (usrJson.success) setUsers(usrJson.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const showStatus = (type: string, msg: string, isError = false) => {
    if (isError) {
      setActionError({ type, msg });
      setTimeout(() => setActionError(null), 5000);
    } else {
      setActionSuccess({ type, msg });
      setTimeout(() => setActionSuccess(null), 5000);
    }
  };

  const handleRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/devices/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mac: newMac.trim(), name: newDeviceName.trim() })
      });
      const json = await res.json();
      if (json.success) {
        setNewMac('');
        setNewDeviceName('');
        showStatus('device', 'Device registered successfully');
        fetchData();
      } else {
        showStatus('device', json.error || 'Failed to register', true);
      }
    } catch (e) {
      showStatus('device', 'Network error', true);
    }
  };

  const handleCreateSubuser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newUserEmail.trim(), password: newUserPassword, name: newUserName.trim() })
      });
      const json = await res.json();
      if (json.success) {
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserName('');
        showStatus('user', 'Subuser created successfully');
        fetchData();
      } else {
        showStatus('user', json.error || 'Failed to create subuser', true);
      }
    } catch (e) {
      showStatus('user', 'Network error', true);
    }
  };

  const handleToggleAccess = async (mac: string, userId: string, hasAccess: boolean) => {
    const action = hasAccess ? 'revoke' : 'grant';
    try {
      const res = await fetch('/api/devices/access', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mac, userId, action })
      });
      const json = await res.json();
      if (json.success) {
        fetchData();
      } else {
        alert(json.error || 'Failed to change access');
      }
    } catch (e) {
      alert('Network error while changing access');
    }
  };

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-industrial-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-accent-cyan" size={48} />
      </div>
    );
  }

  if (user?.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-industrial-900 flex flex-col pt-[72px]">
      <Header onMenuToggle={() => {}} menuOpen={false} />
      
      <main className="flex-1 container-main py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Settings className="text-accent-cyan" size={28} />
            Administration & Security
          </h1>
          <p className="text-industrial-400 mt-2">Manage devices, subusers, and role-based access controls.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Section: Register Device */}
          <section className="card p-6 h-fit">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-industrial-700">
              <div className="p-2 bg-industrial-800 rounded-lg border border-industrial-700 text-accent-orange">
                <Cpu size={20} />
              </div>
              <h2 className="text-lg font-semibold text-white">Register Device</h2>
            </div>
            
            <form onSubmit={handleRegisterDevice} className="space-y-4">
              {actionSuccess?.type === 'device' && (
                <div className="p-3 bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan text-sm rounded-lg flex items-center gap-2 font-medium">
                  <CheckCircle2 size={16} /> {actionSuccess.msg}
                </div>
              )}
              {actionError?.type === 'device' && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg font-medium">
                  {actionError.msg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-industrial-400 uppercase mb-1">MAC Address</label>
                  <input
                    type="text"
                    value={newMac}
                    onChange={e => setNewMac(e.target.value.toUpperCase())}
                    required
                    placeholder="e.g. F412FA49E248"
                    className="w-full bg-industrial-800 border border-industrial-600 rounded-lg py-2 px-3 text-white font-mono focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-industrial-400 uppercase mb-1">Device Alias (Optional)</label>
                  <input
                    type="text"
                    value={newDeviceName}
                    onChange={e => setNewDeviceName(e.target.value)}
                    placeholder="e.g. Living Room Node"
                    className="w-full bg-industrial-800 border border-industrial-600 rounded-lg py-2 px-3 text-white focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan outline-none transition-all"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-industrial-700 hover:bg-industrial-600 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 border border-industrial-600"
              >
                <Plus size={18} /> Add Device
              </button>
            </form>
          </section>

          {/* Section: Create Subuser */}
          <section className="card p-6 h-fit">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-industrial-700">
              <div className="p-2 bg-industrial-800 rounded-lg border border-industrial-700 text-accent-cyan">
                <Users size={20} />
              </div>
              <h2 className="text-lg font-semibold text-white">Create Subuser</h2>
            </div>
            
            <form onSubmit={handleCreateSubuser} className="space-y-4">
              {actionSuccess?.type === 'user' && (
                <div className="p-3 bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan text-sm rounded-lg flex items-center gap-2 font-medium">
                  <CheckCircle2 size={16} /> {actionSuccess.msg}
                </div>
              )}
              {actionError?.type === 'user' && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg font-medium">
                  {actionError.msg}
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-industrial-400 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  required
                  placeholder="e.g. John Doe"
                  className="w-full bg-industrial-800 border border-industrial-600 rounded-lg py-2 px-3 text-white focus:border-accent-cyan outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-industrial-400 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={e => setNewUserEmail(e.target.value)}
                    required
                    placeholder="john@example.com"
                    className="w-full bg-industrial-800 border border-industrial-600 rounded-lg py-2 px-3 text-white focus:border-accent-cyan outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-industrial-400 uppercase mb-1">Password</label>
                  <input
                    type="password"
                    value={newUserPassword}
                    onChange={e => setNewUserPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-industrial-800 border border-industrial-600 rounded-lg py-2 px-3 text-white focus:border-accent-cyan outline-none transition-all"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-industrial-700 hover:bg-industrial-600 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 border border-industrial-600"
              >
                <Plus size={18} /> Create User Account
              </button>
            </form>
          </section>

          {/* Section: Access Management Matrix */}
          <section className="card p-6 lg:col-span-2 overflow-x-auto">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-industrial-700">
              <div className="p-2 bg-industrial-800 rounded-lg border border-industrial-700 text-accent-purple">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Access Management</h2>
                <p className="text-xs text-industrial-400 font-mono mt-1">Matrix assigning Subusers to Devices</p>
              </div>
            </div>

            {devices.length === 0 || users.filter(u => u.role === 'subuser').length === 0 ? (
              <div className="p-8 text-center bg-industrial-800/50 rounded-lg border border-industrial-700 border-dashed">
                <Database className="mx-auto text-industrial-500 mb-2" size={32} />
                <p className="text-industrial-400">Register at least one device and one subuser to manage access.</p>
              </div>
            ) : (
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-industrial-700/50 text-left">
                    <th className="pb-3 text-xs font-mono text-industrial-400 uppercase font-medium">Subuser</th>
                    {devices.map(d => (
                      <th key={d._id} className="pb-3 px-2 text-center text-xs font-mono text-industrial-300 uppercase font-medium">
                        <div className="font-semibold text-white truncate max-w-[150px] mx-auto" title={d.name}>{d.name}</div>
                        <div className="text-[10px] text-industrial-500 tracking-wider">[{d.mac}]</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-industrial-700/30">
                  {users.filter(u => u.role === 'subuser').map(usr => (
                    <tr key={usr._id} className="group hover:bg-industrial-800/30 transition-colors">
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-industrial-800 flex items-center justify-center text-industrial-400 border border-industrial-700">
                            <span className="text-xs font-bold">{usr.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <div className="font-medium text-sm text-white">{usr.name}</div>
                            <div className="text-xs text-industrial-500">{usr.email}</div>
                          </div>
                        </div>
                      </td>
                      {devices.map(dev => {
                        const hasAccess = dev.allowedUsers.includes(usr._id);
                        return (
                          <td key={`${usr._id}-${dev._id}`} className="py-4 px-2 text-center">
                            <button
                              onClick={() => handleToggleAccess(dev.mac, usr._id, hasAccess)}
                              className={cn(
                                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:ring-offset-2 focus:ring-offset-industrial-900 border",
                                hasAccess ? 'bg-accent-cyan/20 border-accent-cyan' : 'bg-industrial-800 border-industrial-600'
                              )}
                            >
                              <span
                                className={cn(
                                  "inline-block h-4 w-4 transform rounded-full transition-transform",
                                  hasAccess ? 'translate-x-6 bg-accent-cyan shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'translate-x-1 bg-industrial-500'
                                )}
                              />
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}
