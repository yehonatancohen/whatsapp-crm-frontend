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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
    } catch (err: unknown) {
      const { message } = extractApiError(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-cream transition-colors">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-8">
          <Link to="/">
            <img src="/logo.png" alt="שדר" className="h-10" />
          </Link>
        </div>

        <div className="bg-white border border-border shadow-soft p-6 text-right">
          {success ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent-light flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-accent">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-charcoal mb-2">הסיסמה שונתה</h2>
              <p className="text-sm text-muted mb-6">הסיסמה שלך עודכנה בהצלחה. כעת תוכל להתחבר לחשבונך.</p>
              <Link to="/login" className="bg-accent hover:bg-accent-hover text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors inline-block">
                התחברות
              </Link>
            </div>
          ) : !token ? (
            <div className="text-center">
              <p className="text-red-600 text-sm mb-4">קישור לא תקין או פג תוקף.</p>
              <Link to="/forgot-password" university-colors className="text-accent hover:text-accent-hover text-sm font-medium">
                בקש קישור חדש
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-charcoal mb-2">איפוס סיסמה</h1>
              <p className="text-sm text-muted mb-6">הזן סיסמה חדשה לחשבון שלך.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-muted mb-1.5">סיסמה חדשה</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full bg-white border border-border text-charcoal rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors text-left"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted mb-1.5">אישור סיסמה חדשה</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full bg-white border border-border text-charcoal rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors text-left"
                    dir="ltr"
                  />
                </div>

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-accent hover:bg-accent-hover disabled:bg-gray-200 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                >
                  {loading ? 'מאפס...' : 'איפוס סיסמה'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
