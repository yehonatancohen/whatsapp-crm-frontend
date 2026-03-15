import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const navLinks = [
  { to: '/', label: 'דף הבית' },
  { to: '/pricing', label: 'מחירים' },
  { to: '/about', label: 'אודות' },
  { to: '/help', label: 'עזרה' },
];

export function PublicLayout() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="שדר" className="h-8" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`text-sm transition-colors ${pathname === l.to ? 'text-accent' : 'text-muted hover:text-charcoal'}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 text-muted hover:text-charcoal transition-colors"
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
            <Link to="/login" className="text-sm text-muted hover:text-charcoal transition-colors">
              התחברות
            </Link>
            <Link to="/register" className="text-sm bg-accent hover:bg-accent-hover text-white font-medium px-4 py-2 rounded-lg transition-colors">
              הרשמה
            </Link>
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 text-muted transition-colors"
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
            <button onClick={() => setMobileOpen(!mobileOpen)} className="text-muted p-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-border px-4 py-4 space-y-3">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                className={`block text-sm ${pathname === l.to ? 'text-accent' : 'text-muted'}`}
              >
                {l.label}
              </Link>
            ))}
            <div className="flex gap-3 pt-2">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="text-sm text-muted">התחברות</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="text-sm text-accent">הרשמה</Link>
            </div>
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-border mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <img src="/logo.png" alt="שדר" className="h-6" />
              </div>
              <p className="text-xs text-faded">פלטפורמת הודעות וניהול לקוחות לעסקים בצמיחה.</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-charcoal uppercase mb-3">מוצר</h4>
              <div className="space-y-2">
                <Link to="/pricing" className="block text-xs text-muted hover:text-charcoal transition-colors">מחירים</Link>
                <Link to="/help" className="block text-xs text-muted hover:text-charcoal transition-colors">עזרה ושאלות נפוצות</Link>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-charcoal uppercase mb-3">חברה</h4>
              <div className="space-y-2">
                <Link to="/about" className="block text-xs text-muted hover:text-charcoal transition-colors">אודות</Link>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-charcoal uppercase mb-3">משפטי</h4>
              <div className="space-y-2">
                <Link to="/terms" className="block text-xs text-muted hover:text-charcoal transition-colors">תנאי שימוש</Link>
                <Link to="/privacy" className="block text-xs text-muted hover:text-charcoal transition-colors">מדיניות פרטיות</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-6 text-center">
            <p className="text-xs text-faded">&copy; {new Date().getFullYear()} שדר. כל הזכויות שמורות.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
