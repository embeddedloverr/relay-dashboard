'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Loader2, Lock, Mail, User as UserIcon, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isInitialized, user, fetchSession } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin 
        ? { email, password } 
        : { email, password, name };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (json.success) {
        if (isLogin) {
          await fetchSession();
          router.push('/');
        } else {
          // Registration successful, now login
          setIsLogin(true);
          setPassword('');
          setError('Account created securely. Please log in.');
        }
      } else {
        setError(json.error || 'Authentication failed');
      }
    } catch (err) {
      setError('A network error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isInitialized || user) {
    return (
      <div className="min-h-screen bg-industrial-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-accent-cyan" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-industrial-900 flex items-center justify-center p-4">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-industrial-800 border-2 border-accent-cyan/50 rounded-2xl flex items-center justify-center mx-auto mb-4 glow-on shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Zap className="text-accent-cyan" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wider glow-text">SMARTDWELL</h1>
          <p className="text-industrial-400 mt-2 font-mono text-sm uppercase tracking-widest">
            {isLogin ? 'Secure Access Portal' : 'Administrator Setup'}
          </p>
        </div>

        <div className="card p-8 neon-border">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className={cn(
                "p-3 rounded text-sm text-center font-medium",
                error.includes('created') ? "bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
              )}>
                {error}
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-xs font-mono text-industrial-400 uppercase tracking-wider mb-2">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-industrial-500" size={18} />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className="w-full bg-industrial-800 border border-industrial-600 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-industrial-500 focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition-all"
                    placeholder="Admin User"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-industrial-400 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-industrial-500" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-industrial-800 border border-industrial-600 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-industrial-500 focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition-all"
                  placeholder="admin@smartdwell.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-industrial-400 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-industrial-500" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full bg-industrial-800 border border-industrial-600 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-industrial-500 focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-accent-cyan text-industrial-900 font-bold py-3 rounded-lg hover:bg-cyan-400 transition-colors flex items-center justify-center gap-2 mt-6 uppercase tracking-wider text-sm"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
              {isLogin ? 'Authenticate' : 'Initialize Root Admin'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-industrial-400 hover:text-white transition-colors"
            >
              {isLogin ? 'Initialize new root admin?' : 'Return to authentication'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
