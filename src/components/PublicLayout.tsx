import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/about', label: 'About' },
  { to: '/help', label: 'Help' },
];

export function PublicLayout() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

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

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-sm text-muted hover:text-charcoal transition-colors">
              Sign in
            </Link>
            <Link to="/register" className="text-sm bg-accent hover:bg-accent-hover text-white font-medium px-4 py-2 rounded-lg transition-colors">
              Get started
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-muted p-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
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
              <Link to="/login" onClick={() => setMobileOpen(false)} className="text-sm text-muted">Sign in</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="text-sm text-accent">Get started</Link>
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
              <p className="text-xs text-faded">Broadcast messaging & CRM platform for growing businesses.</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-charcoal uppercase mb-3">Product</h4>
              <div className="space-y-2">
                <Link to="/pricing" className="block text-xs text-muted hover:text-charcoal transition-colors">Pricing</Link>
                <Link to="/help" className="block text-xs text-muted hover:text-charcoal transition-colors">Help & FAQ</Link>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-charcoal uppercase mb-3">Company</h4>
              <div className="space-y-2">
                <Link to="/about" className="block text-xs text-muted hover:text-charcoal transition-colors">About</Link>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-charcoal uppercase mb-3">Legal</h4>
              <div className="space-y-2">
                <Link to="/terms" className="block text-xs text-muted hover:text-charcoal transition-colors">Terms of Service</Link>
                <Link to="/privacy" className="block text-xs text-muted hover:text-charcoal transition-colors">Privacy Policy</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-6 text-center">
            <p className="text-xs text-faded">&copy; {new Date().getFullYear()} שדר. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
