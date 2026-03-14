import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function VerifyEmailPendingPage() {
  const { user, resendVerification, logout } = useAuth();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResend() {
    setLoading(true);
    setError(null);
    try {
      await resendVerification();
      setSent(true);
    } catch {
      setError('Failed to resend verification email. Please try again.');
    } finally {
      setLoading(false);
    }
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

        <div className="bg-white border border-charcoal shadow-soft p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-accent-subtle flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-accent">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>

          <h1 className="text-lg font-semibold text-charcoal mb-2">Check your email</h1>
          <p className="text-sm text-muted mb-1">
            We sent a verification link to
          </p>
          <p className="text-sm text-accent font-medium mb-6">
            {user?.email || 'your email'}
          </p>

          <p className="text-sm text-muted mb-4">
            Click the link in the email to verify your account and start using שדר.
          </p>

          {sent ? (
            <p className="text-sm text-green-700 mb-4">Verification email resent!</p>
          ) : error ? (
            <p className="text-sm text-red-600 mb-4">{error}</p>
          ) : null}

          <button
            onClick={handleResend}
            disabled={loading || sent}
            className="w-full bg-white border border-charcoal hover:bg-cream disabled:opacity-50 text-charcoal text-sm font-medium py-2.5 rounded-lg transition-colors mb-3"
          >
            {loading ? 'Sending...' : sent ? 'Email sent' : 'Resend verification email'}
          </button>

          <button
            onClick={logout}
            className="text-sm text-muted hover:text-charcoal transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
