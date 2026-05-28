import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Shield, Sparkles, User, Mail, Lock } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        // Register API Call
        const res = await axios.post('/api/auth/register', { username, email, password });
        login(res.data.token, res.data.username, res.data.email);
      } else {
        // Login API Call
        const res = await axios.post('/api/auth/login', { username, password });
        login(res.data.token, res.data.username, res.data.email);
      }
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Connection failed. Please ensure the backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      {/* Background Animated Glow Grid */}
      <div className="glow-grid" />
      
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo/Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl mb-3 shadow-lg shadow-indigo-500/5">
            <Shield className="w-8 h-8 text-indigo-500 animate-pulse-subtle" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            ProPulse
          </h1>
          <p className="text-sm text-slate-400 mt-1.5 font-medium">
            Real-time Workspace Telemetry & Analytics
          </p>
        </div>

        {/* Auth Glass Panel */}
        <div className="glass-panel rounded-3xl p-8 border border-white/5 relative overflow-hidden">
          {/* Subtle light reflect */}
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
          
          <h2 className="text-xl font-semibold text-slate-100 mb-6">
            {isRegister ? 'Create an Account' : 'Welcome Back'}
          </h2>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
              <p className="leading-tight">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="alex_admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-slate-200 text-sm"
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="admin@propulse.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-slate-200 text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-slate-200 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{isRegister ? 'Initialize Account' : 'Authenticate'}</span>
                </>
              )}
            </button>
          </form>

          {/* Toggle link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              {isRegister ? 'Already registered? Authenticate' : "New workspace occupant? Register here"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
