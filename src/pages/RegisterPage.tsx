import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { extractApiError } from '../lib/errorUtils';
import { FormError } from '../components/shared/FormError';

export function RegisterPage() {
  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
    <div className="min-h-screen flex items-center justify-center px-4 bg-cream transition-colors relative">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 text-muted hover:text-charcoal transition-colors bg-white border border-border rounded-lg shadow-sm"
        title={theme === 'light' ? 'מצב כהה' : 'מצב בהיר'}
      >
        {theme === 'light' ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21m9.75-9h-2.25m-13.5 0H3m15.357-6.357l-1.591 1.591M6.234 17.766l-1.591 1.591m12.122 1.212l-1.591-1.591M6.234 6.234L4.643 4.643M12 7.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9z" />
          </svg>
        )}
      </button>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <Link to="/">
            <img src="/logo.png" alt="שדר" className="h-10" />
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-border shadow-soft p-6 text-right">
          <h1 className="text-lg font-semibold text-charcoal mb-5">יצירת חשבון</h1>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted mb-1.5">שם מלא</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                className="w-full bg-white border border-border text-charcoal rounded-lg px-3.5 py-2.5 text-sm placeholder-faded outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                placeholder="השם שלך"
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1.5">אימייל</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white border border-border text-charcoal rounded-lg px-3.5 py-2.5 text-sm placeholder-faded outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors text-left"
                placeholder="you@example.com"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1.5">סיסמה</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-white border border-border text-charcoal rounded-lg px-3.5 py-2.5 text-sm placeholder-faded outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors text-left"
                placeholder="לפחות 8 תווים"
                dir="ltr"
              />
            </div>
          </div>

          <FormError error={error} details={errorDetails} className="mt-3" />

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-5 bg-accent hover:bg-accent-hover disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'יוצר חשבון...' : 'הרשמה'}
          </button>

          <p className="text-sm text-muted text-center mt-4">
            כבר יש לך חשבון?{' '}
            <Link to="/login" className="text-accent hover:text-accent-hover transition-colors">
              התחברות
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
