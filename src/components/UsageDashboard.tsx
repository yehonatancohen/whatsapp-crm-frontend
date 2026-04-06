import { useUsage } from '../hooks/useAnalytics';

const PLAN_LIMITS: Record<string, { maxAccounts: number; maxContacts: number; maxCampaignsPerMonth: number; maxMessagesPerDay: number }> = {
  STARTER: { maxAccounts: 2, maxContacts: 1_000, maxCampaignsPerMonth: 10, maxMessagesPerDay: 500 },
  PRO: { maxAccounts: 5, maxContacts: 10_000, maxCampaignsPerMonth: 50, maxMessagesPerDay: 5_000 },
  ENTERPRISE: { maxAccounts: 20, maxContacts: 100_000, maxCampaignsPerMonth: -1, maxMessagesPerDay: -1 },
};

const PLAN_LABELS: Record<string, string> = {
  STARTER: 'התחלתי',
  PRO: 'מקצוען',
  ENTERPRISE: 'ארגוני',
};

function UsageBar({ label, current, max, color }: { label: string; current: number; max: number; color: string }) {
  const isUnlimited = max === -1;
  const pct = isUnlimited ? 10 : Math.min(100, Math.round((current / max) * 100));
  const isHigh = !isUnlimited && pct >= 80;
  const isFull = !isUnlimited && pct >= 100;

  return (
    <div className="mb-3">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-right text-[10px] text-muted">
          {isUnlimited
            ? `${current.toLocaleString('he-IL')}`
            : `${current.toLocaleString('he-IL')} / ${max.toLocaleString('he-IL')}`}
          {isUnlimited && <span className="mr-1 text-emerald-500">(ללא הגבלה)</span>}
        </span>
        <span className="text-xs font-medium text-charcoal">{label}</span>
      </div>
      <div className="h-2 bg-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-red-500' : isHigh ? 'bg-amber-400' : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function UsageDashboard() {
  const { data, isLoading } = useUsage();

  if (isLoading || !data) {
    return (
      <div className="bg-white border border-border rounded-xl p-5 shadow-soft">
        <p className="text-sm text-muted text-right">טוען נתוני שימוש...</p>
      </div>
    );
  }

  const limits = PLAN_LIMITS[data.planTier] || PLAN_LIMITS.STARTER;
  const usage = data.usage;

  return (
    <div className="bg-white border border-border rounded-xl p-5 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${
          data.planTier === 'ENTERPRISE' ? 'bg-violet-50 text-violet-600' :
          data.planTier === 'PRO' ? 'bg-accent-light text-accent' :
          'bg-gray-100 text-gray-600'
        }`}>
          {PLAN_LABELS[data.planTier] || data.planTier}
        </span>
        <h2 className="text-sm font-semibold text-charcoal">שימוש נוכחי</h2>
      </div>

      <UsageBar label="חשבונות" current={usage.accounts} max={limits.maxAccounts} color="bg-accent" />
      <UsageBar label="אנשי קשר" current={usage.contacts} max={limits.maxContacts} color="bg-blue-500" />
      <UsageBar label="קמפיינים החודש" current={usage.campaignsThisMonth} max={limits.maxCampaignsPerMonth} color="bg-amber-500" />
      <UsageBar label="הודעות היום" current={usage.messagesToday} max={limits.maxMessagesPerDay} color="bg-violet-500" />
    </div>
  );
}
