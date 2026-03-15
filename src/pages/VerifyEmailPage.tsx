import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { updateUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    api.get(`/auth/verify-email?token=${token}`)
      .then(() => {
        setStatus('success');
        setMessage('Your email has been verified!');
        updateUser({ emailVerified: true });
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Verification failed. The link may be expired.');
      });
  }, [token, updateUser]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-8">
          <Link to="/">
            <img src="/logo.png" alt="שדר" className="h-10" />
          </Link>
        </div>

        <div className="bg-white border border-border shadow-soft p-6 text-center">
          {status === 'loading' ? (
            <>
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted text-sm">Verifying your email...</p>
            </>
          ) : status === 'success' ? (
            <>
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-green-700">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h1 className="text-lg font-semibold text-charcoal mb-2">{message}</h1>
              <p className="text-sm text-muted mb-6">You can now access all features.</p>
              <Link
                to="/dashboard"
                className="inline-block w-full bg-accent hover:bg-accent-hover text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                Go to Dashboard
              </Link>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-red-600">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <h1 className="text-lg font-semibold text-charcoal mb-2">Verification failed</h1>
              <p className="text-sm text-muted mb-6">{message}</p>
              <Link
                to="/verify-email-pending"
                className="inline-block w-full bg-white border border-border hover:bg-cream text-charcoal text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                Request new verification link
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
