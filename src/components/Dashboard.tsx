import { useDashboardStats, useActivity } from '../hooks/useActivity';
import { useNavigate } from 'react-router-dom';

const onboardingSteps = [
  {
    num: 1,
    title: 'חבר חשבון וואטסאפ',
    desc: 'עבור ל"חשבונות", לחץ "הוסף חשבון" וסרוק את קוד ה-QR באפליקציית וואטסאפ (מכשירים מקושרים).',
    path: '/accounts',
    cta: 'עבור לחשבונות',
  },
  {
    num: 2,
    title: 'הפעל חימום מספרים',
    desc: 'לאחר חיבור חשבון, הפעל חימום כדי לבנות מוניטין ולמנוע חסימות כששולחים קמפיינים.',
    path: '/warmup',
    cta: 'עבור לחימום',
  },
  {
    num: 3,
    title: 'ייבא אנשי קשר',
    desc: 'העלה קובץ CSV עם מספרי הטלפון של הלקוחות שלך (בפורמט בינלאומי, למשל 972501234567).',
    path: '/contacts',
    cta: 'עבור לאנשי קשר',
  },
  {
    num: 4,
    title: 'צור קמפיין',
    desc: 'בחר תבנית, בחר רשימת תפוצה וקבע לוח זמנים — ושלח הודעות לאלפי אנשי קשר.',
    path: '/campaigns',
    cta: 'עבור לקמפיינים',
  },
];

function GettingStarted() {
  const navigate = useNavigate();
  return (
    <div className="bg-white border border-border rounded-xl p-5 shadow-soft mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-full bg-accent-light flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-accent">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="text-sm font-semibold text-charcoal">מדריך התחלה מהירה</h2>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {onboardingSteps.map((step) => (
          <div key={step.num} className="flex gap-3 p-3 rounded-lg border border-border bg-cream/40">
            <div className="w-6 h-6 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              {step.num}
            </div>
            <div className="text-right flex-1 min-w-0">
              <p className="text-sm font-medium text-charcoal mb-0.5">{step.title}</p>
              <p className="text-xs text-muted leading-relaxed mb-2">{step.desc}</p>
              <button
                onClick={() => navigate(step.path)}
                className="text-xs text-accent hover:text-accent-hover font-medium"
              >
                {step.cta} ←
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: activity, isLoading: activityLoading } = useActivity(20);

  const isNewUser = !statsLoading && (stats?.totalAccounts ?? 0) === 0;

  return (
    <>
      <h1 className="text-2xl font-semibold text-charcoal mb-6 text-right">לוח בקרה</h1>

      {/* Onboarding guide for new users */}
      {isNewUser && <GettingStarted />}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="חשבונות" value={statsLoading ? '-' : (stats?.totalAccounts ?? 0)} sub={`${stats?.authenticatedAccounts ?? 0} מחוברים`} color="accent" />
        <StatCard label="אנשי קשר" value={statsLoading ? '-' : (stats?.totalContacts ?? 0)} color="blue" />
        <StatCard label="קמפיינים פעילים" value={statsLoading ? '-' : (stats?.activeCampaigns ?? 0)} sub={`${stats?.totalCampaigns ?? 0} סה"כ`} color="amber" />
        <StatCard label="הודעות היום" value={statsLoading ? '-' : (stats?.messagesToday ?? 0)} sub={`${stats?.warmupEnabled ?? 0} בחימום`} color="violet" />
      </div>

      {/* Activity Timeline */}
      <div className="bg-white border border-border rounded-xl p-5 shadow-soft">
        <h2 className="text-sm font-semibold text-charcoal mb-4 text-right">פעילות אחרונה</h2>

        {activityLoading && (
          <p className="text-sm text-muted text-right">טוען...</p>
        )}

        {!activityLoading && (!activity || activity.length === 0) && (
          <p className="text-sm text-muted text-right">אין פעילות עדיין.</p>
        )}

        {activity && activity.length > 0 && (
          <div className="space-y-3">
            {activity.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 text-right">
                <div className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink">{entry.message}</p>
                  <p className="text-xs text-muted mt-0.5" dir="rtl">
                    {new Date(entry.createdAt).toLocaleString('he-IL')}
                    {entry.account && <> &middot; {entry.account.label}</>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    accent: { bg: 'bg-accent-light', text: 'text-accent', border: 'border-accent/10' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/10', text: 'text-blue-600', border: 'border-blue-100 dark:border-blue-900/20' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-900/10', text: 'text-amber-600', border: 'border-amber-100 dark:border-amber-900/20' },
    violet: { bg: 'bg-violet-50 dark:bg-violet-900/10', text: 'text-violet-600', border: 'border-violet-100 dark:border-violet-900/20' },
  };

  const c = colorMap[color];

  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-4 text-right`}>
      <p className="text-xs font-medium text-muted mb-1">{label}</p>
      <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </div>
  );
}
