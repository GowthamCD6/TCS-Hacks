import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, KeyRound, Mail, ArrowRight, AlertCircle, CheckCircle2, Sun, Moon } from 'lucide-react';
import { authService } from '../services/auth.service';
import { useTheme } from '../context/ThemeContext';
import logoLight from '../assets/recoveriq-logo-light.png';
import logoDark from '../assets/recoveriq-logo-dark.png';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('approver@recoveriq.local');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authService.login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (demoEmail, demoRole) => {
    setEmail(demoEmail);
    setPassword('demo123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#080512] app-shell flex flex-col items-center justify-center p-4 relative selection:bg-[#8B5CF6]/30 selection:text-[#C4B5FD]">
      {/* Theme toggle in top right */}
      <div className="absolute top-6 right-6 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full glass-pill text-[#FFFFFF] hover:bg-white/20 transition-all flex items-center justify-center cursor-pointer shadow-md"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-[#FBBF24]" />
          ) : (
            <Moon className="w-4 h-4 text-[#7C3AED]" />
          )}
        </button>
      </div>
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#8B5CF6]/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md rounded-2xl glass-card p-8 border border-white/10 shadow-2xl relative z-10 space-y-6">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <img
            src={theme === 'light' ? logoLight : logoDark}
            alt="RecoverIQ Logo"
            className="h-12 w-auto object-contain"
          />
          <p className="text-[12px] text-[#9E9BB2]">
            Approver Portal
          </p>
        </div>

        {/* Demo role quick pick */}
        <div className="bg-[#141220] p-3 rounded-xl border border-white/5 space-y-2">
          <p className="text-[11px] font-medium text-[#A8A3BA] uppercase tracking-wider">
            Quick demo sign-in:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDemoCredentials('approver@recoveriq.local', 'approver')}
              className="px-2.5 py-1.5 rounded-lg text-[12px] bg-white/5 hover:bg-white/10 text-white font-medium border border-white/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" />
              Approver
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('analyst@recoveriq.local', 'analyst')}
              className="px-2.5 py-1.5 rounded-lg text-[12px] bg-white/5 hover:bg-white/10 text-[#C4B5FD] font-medium border border-white/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Analyst
            </button>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-[12px] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#9E9BB2] block">Email address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="approver@recoveriq.local"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-pill text-white placeholder-[#706C82] text-[13px] focus:outline-none focus:border-[#8B5CF6] transition-all"
              />
              <Mail className="w-4 h-4 text-[#706C82] absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#9E9BB2] block">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-pill text-white placeholder-[#706C82] text-[13px] focus:outline-none focus:border-[#8B5CF6] transition-all"
              />
              <KeyRound className="w-4 h-4 text-[#706C82] absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] text-white font-medium text-[13px] shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to RecoverIQ</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[11px] text-[#706C82]">
          Approver role required for plan authorization & simulated actions
        </p>
      </div>
    </div>
  );
};

export default LoginPage;