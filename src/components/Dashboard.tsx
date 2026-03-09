import { useDashboardStats, useActivity } from '../hooks/useActivity';

export function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: activity, isLoading: activityLoading } = useActivity(20);

  return (
    <>
      <h1 className="text-2xl font-semibold text-slate-100 mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Accounts" value={statsLoading ? '-' : stats?.totalAccounts ?? 0} sub={`${stats?.authenticatedAccounts ?? 0} connected`} color="emerald" />
        <StatCard label="Contacts" value={statsLoading ? '-' : stats?.totalContacts ?? 0} color="blue" />
        <StatCard label="Active Campaigns" value={statsLoading ? '-' : stats?.activeCampaigns ?? 0} sub={`${stats?.totalCampaigns ?? 0} total`} color="amber" />
        <StatCard label="Messages Today" value={statsLoading ? '-' : stats?.messagesToday ?? 0} sub={`${stats?.warmupEnabled ?? 0} warming`} color="violet" />
      </div>

      {/* Activity Timeline */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Recent Activity</h2>

        {activityLoading && (
          <p className="text-sm text-slate-500">Loading...</p>
        )}

        {!activityLoading && (!activity || activity.length === 0) && (
          <p className="text-sm text-slate-500">No activity yet.</p>
        )}

        {activity && activity.length > 0 && (
          <div className="space-y-3">
            {activity.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-slate-600 mt-1.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-300">{entry.message}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
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
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  };

  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <p className="text-xs font-medium text-slate-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colorMap[color].split(' ')[0]}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}
