import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function VerifyEmailPendingPage() {
  const { user, resendVerification, logout } = useAuth();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    setLoading(true);
    try {
      await resendVerification();
      setSent(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-cream transition-colors">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-8">
          <img src="/logo.png" alt="שדר" className="h-10" />
        </div>

        <div className="bg-white border border-border shadow-soft p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-accent-light flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-accent">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>

          <h1 className="text-xl font-bold text-charcoal mb-2">אמת את האימייל שלך</h1>
          <p className="text-sm text-muted mb-6 text-right">
            שלחנו קישור אימות לכתובת <span className="font-semibold text-charcoal" dir="ltr">{user?.email}</span>.
            אנא בדוק את תיבת הדואר הנכנס שלך (ואת תיקיית הספאם) ולחץ על הקישור כדי להפעיל את חשבונך.
          </p>

          <button
            onClick={handleResend}
            disabled={loading || sent}
            className="w-full bg-accent hover:bg-accent-hover disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium py-2.5 rounded-lg transition-colors mb-4"
          >
            {loading ? 'שולח...' : sent ? 'האימייל נשלח שוב' : 'שלח שוב אימייל אימות'}
          </button>

          <button
            onClick={logout}
            className="text-sm text-muted hover:text-charcoal transition-colors"
          >
            התנתק
          </button>
        </div>
      </div>
    </div>
  );
}
