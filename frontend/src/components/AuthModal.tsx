import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Lock,
  LogIn,
  UserPlus,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MapPin
} from 'lucide-react';
import { useAuth } from '../services/AuthContext';

const LOCATION_OPTIONS = [
  'Thane',
  'Kalyan',
  'Mulund',
  'Vashi',
  'Bhandup',
  'Mumbai Central',
  'Andheri',
  'Kurla',
  'Dadar',
  'Navi Mumbai',
  'Village Sangam (Tributary Confluence) (LOW)',
  'Village Shivpuri (Upper Valley Riparian) (LOW)',
  'Village Tapovan (Foothill Terraces) (LOW)',
  'Village Kaudiyala (River Gorge) (LOW)',
  'Village Maletha (Lower Catchment Basin) (LOW)',
  'Village Kirtinagar (River Terraces) (MODERATE)'
];

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login'
}) => {
  const { login, register } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [location, setLocation] = useState<string>('Thane');
  const [password, setPassword] = useState<string>('');
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');

  if (!isOpen) return null;

  const resetForm = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSwitchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    resetForm();
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetForm();

    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!location || !location.trim()) {
      setErrorMsg('Please select your location.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await register(name.trim(), email.trim(), cleanPhone, location.trim(), password);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetForm();

    if (!loginIdentifier.trim()) {
      setErrorMsg('Please enter your registered Email or Mobile Number.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const res = await login(loginIdentifier.trim(), password);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-950 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-600/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white font-mono tracking-tight">
                JalRakshak Account Portal
              </h3>
              <p className="text-xs text-slate-400">
                {mode === 'login' ? 'Login to access saved reports & alerts' : 'Create an account to join JalRakshak'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-4 flex border-b border-slate-800 bg-slate-950/50">
          <button
            onClick={() => handleSwitchMode('login')}
            className={`flex-1 py-2.5 text-xs font-bold font-mono border-b-2 transition flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'login'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>LOGIN</span>
          </button>
          <button
            onClick={() => handleSwitchMode('register')}
            className={`flex-1 py-2.5 text-xs font-bold font-mono border-b-2 transition flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'register'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>REGISTER</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Error Callout */}
          {errorMsg && (
            <div className="bg-red-950/40 border border-red-500/50 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-red-300">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Authentication Notice</span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Success Callout */}
          {successMsg && (
            <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Success</span>
                <span>{successMsg}</span>
              </div>
            </div>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-mono font-bold text-slate-300 block mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Full Name <span className="text-red-400">*</span></span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder-slate-500"
                />
              </div>

              <div>
                <label className="text-xs font-mono font-bold text-slate-300 block mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Email Address <span className="text-red-400">*</span></span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. rahul@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder-slate-500"
                />
              </div>

              <div>
                <label className="text-xs font-mono font-bold text-slate-300 block mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Mobile Number <span className="text-red-400">*</span></span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder-slate-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-mono font-bold text-slate-300 block mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Primary Location / City <span className="text-red-400">*</span></span>
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer font-mono"
                >
                  {LOCATION_OPTIONS.map((loc) => (
                    <option key={loc} value={loc} className="bg-slate-900 text-white">
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-mono font-bold text-slate-300 block mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Password <span className="text-red-400">*</span></span>
                </label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder-slate-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 text-white rounded-xl font-bold font-mono text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-900/30 uppercase tracking-wider"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Free Account</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-mono font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Email or Mobile Number <span className="text-red-400">*</span></span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. rahul@example.com or 9876543210"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder-slate-500"
                />
              </div>

              <div>
                <label className="text-xs font-mono font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Password <span className="text-red-400">*</span></span>
                </label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder-slate-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 text-white rounded-xl font-bold font-mono text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-900/30 uppercase tracking-wider"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Login to JalRakshak</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer note */}
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 text-center font-mono">
            {mode === 'login' ? (
              <span>
                Don't have an account yet?{' '}
                <button
                  onClick={() => handleSwitchMode('register')}
                  className="text-sky-400 font-bold hover:underline cursor-pointer"
                >
                  Register here
                </button>
              </span>
            ) : (
              <span>
                Already registered?{' '}
                <button
                  onClick={() => handleSwitchMode('login')}
                  className="text-sky-400 font-bold hover:underline cursor-pointer"
                >
                  Login here
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
