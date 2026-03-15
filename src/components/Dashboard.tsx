import { useDashboardStats, useActivity } from '../hooks/useActivity';

export function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: activity, isLoading: activityLoading } = useActivity(20);

  return (
    <>
      <h1 className="text-2xl font-semibold text-charcoal mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Accounts" value={statsLoading ? '-' : stats?.totalAccounts ?? 0} sub={`${stats?.authenticatedAccounts ?? 0} connected`} color="accent" />
        <StatCard label="Contacts" value={statsLoading ? '-' : stats?.totalContacts ?? 0} color="blue" />
        <StatCard label="Active Campaigns" value={statsLoading ? '-' : stats?.activeCampaigns ?? 0} sub={`${stats?.totalCampaigns ?? 0} total`} color="amber" />
        <StatCard label="Messages Today" value={statsLoading ? '-' : stats?.messagesToday ?? 0} sub={`${stats?.warmupEnabled ?? 0} warming`} color="violet" />
      </div>

      {/* Activity Timeline */}
      <div className="bg-white border border-border rounded-xl p-5 shadow-soft">
        <h2 className="text-sm font-semibold text-charcoal mb-4">Recent Activity</h2>

        {activityLoading && (
          <p className="text-sm text-muted">Loading...</p>
        )}

        {!activityLoading && (!activity || activity.length === 0) && (
          <p className="text-sm text-muted">No activity yet.</p>
        )}

        {activity && activity.length > 0 && (
          <div className="space-y-3">
            {activity.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-border mt-1.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink">{entry.message}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {new Date(entry.createdAt).toLocaleString()}
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
    accent: { bg: 'bg-accent-light', text: 'text-accent', border: 'border-border' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-border' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-border' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-border' },
  };

  const c = colorMap[color];

  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-4`}>
      <p className="text-xs font-medium text-muted mb-1">{label}</p>
      <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </div>
  );
}
