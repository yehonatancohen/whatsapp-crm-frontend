import type { AccountResponse } from '../types';

interface Props {
  accounts: AccountResponse[];
}

export function StatsBar({ accounts }: Props) {
  const total = accounts.length;
  const active = accounts.filter((a) => a.status === 'AUTHENTICATED').length;
  const qrPending = accounts.filter((a) => a.status === 'QR_READY').length;
  const disconnected = accounts.filter((a) => a.status === 'DISCONNECTED').length;

  const stats = [
    {
      label: 'סה"כ',
      value: total,
      color: 'text-charcoal',
      bg: 'bg-white',
      iconColor: 'text-muted',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: 'פעילים',
      value: active,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-900/10',
      iconColor: 'text-green-500',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
    {
      label: 'ממתין לסריקה',
      value: qrPending,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/10',
      iconColor: 'text-blue-500',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <path d="M14 14h7v7" />
        </svg>
      ),
    },
    {
      label: 'מנותקים',
      value: disconnected,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-900/10',
      iconColor: 'text-red-500',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`${stat.bg} border border-border rounded-xl px-4 py-4 flex items-center gap-4 shadow-sm text-right`}
        >
          <div className={`${stat.iconColor}`}>{stat.icon}</div>
          <div>
            <p className={`text-2xl font-semibold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted uppercase tracking-wide">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
