import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, UserPlus, Mail, Lock, User, AlertCircle, Shield } from 'lucide-react';
import { login, register } from '@/lib/api';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let response;
      if (mode === 'login') {
        response = await login(email, password);
      } else {
        if (!firstName || !lastName) {
          setError('First name and last name are required');
          setLoading(false);
          return;
        }
        response = await register({ email, password, first_name: firstName, last_name: lastName });
      }
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify({
        ...response.user,
        name: `${response.user.first_name} ${response.user.last_name}`,
      }));
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || 'Something went wrong');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #1e293b 100%)' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(14, 165, 233, 0.1) 0%, transparent 50%)' }} />

      {/* Decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full opacity-[0.03]" style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-[0.03]" style={{ background: 'radial-gradient(circle, #0ea5e9, transparent)' }} />

      <div className="w-full max-w-[420px] relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 shadow-xl" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <span className="text-white font-extrabold text-2xl tracking-tight">CP</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">ConsultPro</h1>
          <p className="text-indigo-200/50 mt-2 text-sm font-medium">Enterprise Consulting Management</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/[0.95] backdrop-blur-xl rounded-2xl shadow-2xl p-7 border border-white/20">
          <h2 className="text-xl font-bold text-slate-900 mb-0.5 tracking-tight">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            {mode === 'login' ? 'Sign in to your workspace' : 'Get started with ConsultPro'}
          </p>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm mb-5 animate-slide-down">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">First Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" className="input pl-10" placeholder="First" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                  </div>
                </div>
                <div>
                  <label className="label">Last Name</label>
                  <input type="text" className="input" placeholder="Last" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </div>
            )}

            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" className="input pl-10" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" className="input pl-10" placeholder={mode === 'login' ? 'Enter your password' : 'Create a password'} value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full justify-center py-3 text-[15px] mt-2"
            >
              {loading ? (
                <div className="spinner spinner-sm border-white/30 border-t-white" />
              ) : mode === 'login' ? (
                <>
                  <LogIn size={18} />
                  Sign In
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <button
              onClick={switchMode}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
            >
              {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
            {mode === 'login' && (
              <div className="flex items-center justify-center gap-2 mt-3">
                <Shield size={12} className="text-slate-300" />
                <p className="text-xs text-slate-400">
                  Demo: admin@consulting.local / admin123
                </p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-500/50 mt-6 font-medium">
          ConsultPro &copy; {new Date().getFullYear()} | Enterprise Consulting Platform
        </p>
      </div>
    </div>
  );
}
