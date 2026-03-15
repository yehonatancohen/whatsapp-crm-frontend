import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { extractApiError } from '../lib/errorUtils';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
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
          {sent ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent-light flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-accent">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-charcoal mb-2">האימייל נשלח</h2>
              <p className="text-sm text-muted mb-6">אם קים חשבון עם הכתובת שהזנת, יישלח אליו קישור לאיפוס הסיסמה.</p>
              <Link to="/login" className="text-accent hover:text-accent-hover text-sm font-medium">
                חזרה להתחברות
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-charcoal mb-2">שכחת סיסמה?</h1>
              <p className="text-sm text-muted mb-6">הכנס את כתובת האימייל שלך ונשלח לך קישור לאיפוס.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-muted mb-1.5">אימייל</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white border border-border text-charcoal rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors text-left"
                    placeholder="you@example.com"
                    dir="ltr"
                  />
                </div>

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-accent hover:bg-accent-hover disabled:bg-gray-200 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                >
                  {loading ? 'שולח...' : 'שלח קישור לאיפוס'}
                </button>

                <p className="text-sm text-muted text-center mt-4">
                  <Link to="/login" university-colors className="text-accent hover:text-accent-hover transition-colors">
                    חזרה להתחברות
                  </Link>
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
