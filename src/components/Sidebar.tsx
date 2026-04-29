import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Logo } from './Logo';

const topItems = [
  {
    label: 'לוח בקרה',
    path: '/dashboard',
    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
  },
  {
    label: 'חשבונות',
    path: '/accounts',
    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  },
  {
    label: "צ'אט",
    path: '/chat',
    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M3 15v4c0 1.1.9 2 2 2h14" /></svg>,
  },
  {
    label: 'קמפיינים',
    path: '/campaigns',
    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  },
  {
    label: 'קידום קבוצות',
    path: '/promotions',
    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>,
  },
  {
    label: 'אנליטיקס',
    path: '/analytics',
    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  },
];

const groups = [
  {
    label: 'אוטומציה',
    paths: ['/auto-replies', '/scheduled-messages', '/templates'],
    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" /></svg>,
    items: [
      {
        label: 'תגובות אוטומטיות',
        path: '/auto-replies',
        icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" /></svg>,
      },
      {
        label: 'הודעות מתוזמנות',
        path: '/scheduled-messages',
        icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
      },
      {
        label: 'תבניות',
        path: '/templates',
        icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
      },
    ],
  },
  {
    label: 'ניהול',
    paths: ['/warmup', '/contacts', '/group-collections'],
    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    items: [
      {
        label: 'חימום',
        path: '/warmup',
        icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 2v10l4.5 4.5" /><circle cx="12" cy="12" r="10" /></svg>,
      },
      {
        label: 'אנשי קשר',
        path: '/contacts',
        icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
      },
      {
        label: 'אוספי קבוצות',
        path: '/group-collections',
        icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="2" y="3" width="20" height="5" rx="1" /><rect x="2" y="10" width="20" height="5" rx="1" /><rect x="2" y="17" width="20" height="5" rx="1" /></svg>,
      },
    ],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Auto-expand the group containing the current route
  const initialOpen = groups.reduce<Record<string, boolean>>((acc, g) => {
    acc[g.label] = g.paths.some(p => location.pathname.startsWith(p));
    return acc;
  }, {});
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(initialOpen);

  // Re-check when route changes (e.g. navigating to a grouped page from elsewhere)
  useEffect(() => {
    setOpenGroups(prev => {
      const next = { ...prev };
      groups.forEach(g => {
        if (g.paths.some(p => location.pathname.startsWith(p))) {
          next[g.label] = true;
        }
      });
      return next;
    });
  }, [location.pathname]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleGroup = (label: string) =>
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed right-0 top-0 h-[100dvh] w-60 bg-cream-dark border-l border-border flex flex-col z-50 transition-transform duration-300 ease-in-out will-change-transform ${
          open ? 'translate-x-0' : 'translate-x-full'
        } md:translate-x-0 md:z-30`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-border bg-white">
          <Logo className="h-8" />
          <button onClick={onClose} className="text-faded hover:text-ink transition-colors md:hidden" aria-label="סגור תפריט">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <ul className="space-y-1">
            {/* Top-level items */}
            {topItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <li key={item.path}>
                  <button
                    onClick={() => { navigate(item.path); onClose(); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-accent-subtle text-accent border-r-2 border-accent'
                        : 'text-muted hover:text-charcoal hover:bg-cream'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                </li>
              );
            })}

            {/* Collapsible groups */}
            {groups.map((group) => {
              const isGroupActive = group.paths.some(p => location.pathname.startsWith(p));
              const isExpanded = openGroups[group.label];
              return (
                <li key={group.label}>
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isGroupActive
                        ? 'text-accent'
                        : 'text-muted hover:text-charcoal hover:bg-cream'
                    }`}
                  >
                    {group.icon}
                    <span className="flex-1 text-right">{group.label}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`w-3.5 h-3.5 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {isExpanded && (
                    <ul className="mt-1 mr-3 border-r border-border space-y-0.5">
                      {group.items.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                          <li key={item.path}>
                            <button
                              onClick={() => { navigate(item.path); onClose(); }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                isActive
                                  ? 'bg-accent-subtle text-accent border-r-2 border-accent'
                                  : 'text-muted hover:text-charcoal hover:bg-cream'
                              }`}
                            >
                              {item.icon}
                              {item.label}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}

            {/* Admin */}
            {user?.role === 'ADMIN' && (
              <li>
                <button
                  onClick={() => { navigate('/admin/users'); onClose(); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname.startsWith('/admin')
                      ? 'bg-violet-50 text-violet-600 border-r-2 border-violet-500'
                      : 'text-muted hover:text-charcoal hover:bg-cream'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  ניהול
                </button>
              </li>
            )}
          </ul>
        </nav>

        {/* Theme + User + Logout */}
        <div className="p-3 border-t border-border">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2 mb-2 rounded-lg text-sm font-medium text-muted hover:text-charcoal hover:bg-cream transition-colors"
          >
            {theme === 'light' ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
                מצב כהה
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21m9.75-9h-2.25m-13.5 0H3m15.357-6.357l-1.591 1.591M6.234 17.766l-1.591 1.591m12.122 1.212l-1.591-1.591M6.234 6.234L4.643 4.643M12 7.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9z" />
                </svg>
                מצב בהיר
              </>
            )}
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { navigate('/settings'); onClose(); }}
              className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-cream min-w-0 ${
                location.pathname.startsWith('/settings') ? 'bg-accent-subtle' : ''
              }`}
            >
              <div className="w-8 h-8 shrink-0 rounded-full bg-cream-dark flex items-center justify-center text-xs font-medium text-ink">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-charcoal truncate">{user?.name}</p>
                <p className="text-xs text-muted truncate text-right" dir="ltr">{user?.email}</p>
              </div>
            </button>
            <button onClick={handleLogout} className="shrink-0 text-faded hover:text-red-500 transition-colors pr-3" title="התנתקות">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
