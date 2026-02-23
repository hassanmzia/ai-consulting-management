import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, UserPlus, Mail, Lock, User, AlertCircle } from 'lucide-react';
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 mb-4">
            <span className="text-white font-bold text-lg">CP</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ConsultPro</h1>
          <p className="text-gray-500 mt-1 text-sm">Consulting Management Platform</p>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {mode === 'login' ? 'Sign in to your workspace' : 'Get started with ConsultPro'}
          </p>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm mb-4">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">First Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" className="input pl-9" placeholder="First" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
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
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" className="input pl-9" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="password" className="input pl-9" placeholder={mode === 'login' ? 'Enter your password' : 'Create a password'} value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center py-2.5">
              {loading ? (
                <div className="spinner spinner-sm border-white/30 border-t-white" />
              ) : mode === 'login' ? (
                <><LogIn size={16} /> Sign In</>
              ) : (
                <><UserPlus size={16} /> Create Account</>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
            {mode === 'login' && (
              <p className="text-xs text-gray-400 mt-3">Demo: admin@consulting.local / admin123</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
