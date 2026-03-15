import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 md:ml-60 min-w-0">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-20 flex items-center gap-3 bg-white/95 backdrop-blur-sm px-4 py-3 border-b border-border md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-muted hover:text-charcoal transition-colors"
            aria-label="Open menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              strokeLinejoin="round" className="w-6 h-6">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <img src="/logo.png" alt="שדר" className="h-7" />
        </div>

        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
