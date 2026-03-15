import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { updateUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    api.post('/auth/verify-email', { token })
      .then(() => {
        setStatus('success');
        updateUser({ emailVerified: true });
      })
      .catch(() => setStatus('error'));
  }, [token, updateUser]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-cream transition-colors">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-8">
          <Link to="/">
            <img src="/logo.png" alt="שדר" className="h-10" />
          </Link>
        </div>

        <div className="bg-white border border-border shadow-soft p-6 text-center">
          {status === 'loading' ? (
            <>
              <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-charcoal mb-2">מאמת אימייל...</h2>
              <p className="text-sm text-muted">אנא המתן בזמן שאנו מאמתים את כתובת האימייל שלך.</p>
            </>
          ) : status === 'success' ? (
            <>
              <div className="w-12 h-12 rounded-full bg-accent-light flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-accent">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-charcoal mb-2">האימייל אומת בהצלחה!</h2>
              <p className="text-sm text-muted mb-6">תודה שאימתת את כתובת האימייל שלך. כעת תוכל להמשיך ללוח הבקרה.</p>
              <Link to="/dashboard" className="bg-accent hover:bg-accent-hover text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors inline-block">
                מעבר ללוח הבקרה
              </Link>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-red-600">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-charcoal mb-2">האימות נכשל</h2>
              <p className="text-sm text-muted mb-6">הקישור לא תקין או פג תוקף. אנא נסה לבקש קישור חדש.</p>
              <Link
                to="/verify-email-pending"
                className="bg-cream text-charcoal text-sm font-medium py-2.5 rounded-lg transition-colors inline-block px-6 border border-border"
              >
                בקש קישור חדש
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
