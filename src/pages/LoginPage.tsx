import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { extractApiError } from '../lib/errorUtils';
import { FormError } from '../components/shared/FormError';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<Array<{ field: string; message: string }>>([]);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setErrorDetails([]);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const { message, details } = extractApiError(err);
      setError(message);
      setErrorDetails(details);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M2 12 L7 12 L9 4 L12 20 L15 8 L17 12 L22 12" />
            </svg>
          </div>
          <span className="font-logo text-charcoal text-xl">שדר</span>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-border shadow-soft p-6">
          <h1 className="text-lg font-semibold text-charcoal mb-5">Sign in</h1>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full bg-white border border-border text-charcoal rounded-lg px-3.5 py-2.5 text-sm placeholder-faded outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm text-muted">Password</label>
                <Link to="/forgot-password" className="text-xs text-accent hover:text-accent-hover transition-colors">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white border border-border text-charcoal rounded-lg px-3.5 py-2.5 text-sm placeholder-faded outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                placeholder="Min 8 characters"
              />
            </div>
          </div>

          <FormError error={error} details={errorDetails} className="mt-3" />

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-5 bg-accent hover:bg-accent-hover disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <p className="text-sm text-muted text-center mt-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent hover:text-accent-hover transition-colors">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
