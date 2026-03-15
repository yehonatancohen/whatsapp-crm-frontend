import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { extractApiError } from '../lib/errorUtils';
import { FormError } from '../components/shared/FormError';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
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
      await register(email, password, name);
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
        <div className="flex items-center justify-center mb-8">
          <Link to="/">
            <img src="/logo.png" alt="שדר" className="h-10" />
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-border shadow-soft p-6">
          <h1 className="text-lg font-semibold text-charcoal mb-5">Create account</h1>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                className="w-full bg-white border border-border text-charcoal rounded-lg px-3.5 py-2.5 text-sm placeholder-faded outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white border border-border text-charcoal rounded-lg px-3.5 py-2.5 text-sm placeholder-faded outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
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
            {loading ? 'Creating account...' : 'Create account'}
          </button>

          <p className="text-sm text-muted text-center mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:text-accent-hover transition-colors">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
