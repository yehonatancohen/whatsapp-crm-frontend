import { useState, type FormEvent } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { extractApiError } from '../lib/errorUtils';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      setSuccess(true);
    } catch (err) {
      const { message } = extractApiError(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <p className="text-muted mb-4">Invalid reset link. No token provided.</p>
          <Link to="/forgot-password" className="text-accent hover:text-accent-hover text-sm">
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M2 12 L7 12 L9 4 L12 20 L15 8 L17 12 L22 12" />
            </svg>
          </div>
          <span className="font-logo text-charcoal text-xl">שדר</span>
        </div>

        <div className="bg-white border border-border shadow-soft p-6">
          {success ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-green-700">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h1 className="text-lg font-semibold text-charcoal mb-2">Password reset!</h1>
              <p className="text-sm text-muted mb-6">You can now sign in with your new password.</p>
              <Link
                to="/login"
                className="inline-block w-full bg-accent hover:bg-accent-hover text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                Sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-charcoal mb-5">Set new password</h1>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-muted mb-1.5">New password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoFocus
                      minLength={8}
                      className="w-full bg-white border border-border text-charcoal rounded-lg px-3.5 py-2.5 text-sm placeholder-faded outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                      placeholder="Min 8 characters"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted mb-1.5">Confirm password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full bg-white border border-border text-charcoal rounded-lg px-3.5 py-2.5 text-sm placeholder-faded outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                      placeholder="Repeat password"
                    />
                  </div>
                </div>

                {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-5 bg-accent hover:bg-accent-hover disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                >
                  {loading ? 'Resetting...' : 'Reset password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
