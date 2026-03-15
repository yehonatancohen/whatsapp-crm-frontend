import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { extractApiError } from '../lib/errorUtils';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      const { message } = extractApiError(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-8">
          <Link to="/">
            <img src="/logo.png" alt="שדר" className="h-10" />
          </Link>
        </div>

        <div className="bg-white border border-border shadow-soft p-6">
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-accent-subtle flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-accent">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <h1 className="text-lg font-semibold text-charcoal mb-2">Check your email</h1>
              <p className="text-sm text-muted mb-6">
                If an account exists for {email}, we've sent a password reset link.
              </p>
              <Link
                to="/login"
                className="text-sm text-accent hover:text-accent-hover transition-colors"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-charcoal mb-2">Reset your password</h1>
              <p className="text-sm text-muted mb-5">Enter your email and we'll send you a reset link.</p>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
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

                {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-accent hover:bg-accent-hover disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                >
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>

              <p className="text-sm text-muted text-center mt-4">
                <Link to="/login" className="text-accent hover:text-accent-hover transition-colors">
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
