import { useCampaignAnalytics, useMessageTrends } from '../hooks/useAnalytics';

function BarChart({ data, maxHeight = 120 }: { data: Array<{ date: string; sent: number; delivered: number }>; maxHeight?: number }) {
  const maxVal = Math.max(1, ...data.map((d) => d.sent));
  // Show last 30 entries
  const visible = data.slice(-30);

  return (
    <div className="flex items-end gap-[2px] h-[140px] overflow-hidden">
      {visible.map((d) => {
        const sentH = (d.sent / maxVal) * maxHeight;
        const deliveredH = (d.delivered / maxVal) * maxHeight;
        const dateLabel = d.date.slice(5); // MM-DD
        return (
          <div key={d.date} className="flex flex-col items-center flex-1 min-w-0 group relative">
            <div className="w-full flex flex-col items-center justify-end" style={{ height: maxHeight }}>
              <div className="w-full rounded-t bg-accent/20 relative" style={{ height: sentH }}>
                <div className="absolute bottom-0 w-full rounded-t bg-accent" style={{ height: deliveredH }} />
              </div>
            </div>
            <span className="text-[8px] text-muted mt-1 truncate w-full text-center">{dateLabel}</span>
            {/* Tooltip */}
            <div className="absolute bottom-full mb-1 bg-charcoal text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              {d.date}: {d.sent} נשלחו, {d.delivered} הגיעו
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SummaryCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  const colors: Record<string, string> = {
    accent: 'bg-accent-light text-accent border-accent/10',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };

  return (
    <div className={`rounded-xl border p-4 text-right ${colors[color] || colors.accent}`}>
      <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-1">{sub}</p>}
    </div>
  );
}

export function AnalyticsPage() {
  const { data: stats, isLoading: statsLoading } = useCampaignAnalytics();
  const { data: trends = [], isLoading: trendsLoading } = useMessageTrends(30);

  const summary = stats?.summary;

  return (
    <>
      <h1 className="text-2xl font-semibold text-charcoal mb-6 text-right">אנליטיקס</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <SummaryCard label="קמפיינים" value={statsLoading ? '-' : (summary?.totalCampaigns ?? 0)} color="accent" />
        <SummaryCard label='סה"כ הודעות' value={statsLoading ? '-' : (summary?.totalMessages ?? 0)} color="blue" />
        <SummaryCard label="נשלחו" value={statsLoading ? '-' : (summary?.totalSent ?? 0)} color="amber" />
        <SummaryCard label="הגיעו" value={statsLoading ? '-' : (summary?.totalDelivered ?? 0)} sub={summary ? `${summary.deliveryRate}%` : ''} color="green" />
        <SummaryCard label="נכשלו" value={statsLoading ? '-' : (summary?.totalFailed ?? 0)} sub={summary ? `${summary.failureRate}%` : ''} color="red" />
      </div>

      {/* Message Trends Chart */}
      <div className="bg-white border border-border rounded-xl p-5 shadow-soft mb-8">
        <h2 className="text-sm font-semibold text-charcoal mb-4 text-right">מגמת הודעות (30 יום אחרונים)</h2>
        {trendsLoading ? (
          <p className="text-sm text-muted text-right">טוען...</p>
        ) : trends.every((t) => t.sent === 0) ? (
          <p className="text-sm text-muted text-right">אין נתונים עדיין</p>
        ) : (
          <>
            <BarChart data={trends} />
            <div className="flex gap-4 mt-3 justify-end">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-accent/20" />
                <span className="text-[10px] text-muted">נשלחו</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-accent" />
                <span className="text-[10px] text-muted">הגיעו</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Campaign Performance Table */}
      <div className="bg-white border border-border rounded-xl p-5 shadow-soft">
        <h2 className="text-sm font-semibold text-charcoal mb-4 text-right">ביצועי קמפיינים</h2>
        {statsLoading ? (
          <p className="text-sm text-muted text-right">טוען...</p>
        ) : !stats?.campaigns.length ? (
          <p className="text-sm text-muted text-right">אין קמפיינים עדיין</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" dir="rtl">
              <thead>
                <tr className="border-b border-border text-muted text-xs">
                  <th className="text-right py-2 px-2 font-medium">שם</th>
                  <th className="text-right py-2 px-2 font-medium">סטטוס</th>
                  <th className="text-right py-2 px-2 font-medium">סוג</th>
                  <th className="text-right py-2 px-2 font-medium">הודעות</th>
                  <th className="text-right py-2 px-2 font-medium">נשלחו</th>
                  <th className="text-right py-2 px-2 font-medium">הגיעו</th>
                  <th className="text-right py-2 px-2 font-medium">נכשלו</th>
                  <th className="text-right py-2 px-2 font-medium">אחוז הצלחה</th>
                </tr>
              </thead>
              <tbody>
                {stats.campaigns.map((c) => {
                  const rate = c.sentCount > 0 ? Math.round((c.deliveredCount / c.sentCount) * 100) : 0;
                  return (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-cream/30">
                      <td className="py-2 px-2 font-medium text-charcoal">{c.name}</td>
                      <td className="py-2 px-2">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-2 px-2 text-muted">{c.type === 'DIRECT_MESSAGE' ? 'ישיר' : 'קבוצה'}</td>
                      <td className="py-2 px-2 text-muted">{c.totalMessages}</td>
                      <td className="py-2 px-2 text-muted">{c.sentCount}</td>
                      <td className="py-2 px-2 text-emerald-600">{c.deliveredCount}</td>
                      <td className="py-2 px-2 text-red-500">{c.failedCount}</td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                            <div className="h-full bg-accent rounded-full" style={{ width: `${rate}%` }} />
                          </div>
                          <span className="text-xs text-muted w-8">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-600',
    SCHEDULED: 'bg-blue-50 text-blue-600',
    RUNNING: 'bg-amber-50 text-amber-600',
    PAUSED: 'bg-orange-50 text-orange-600',
    COMPLETED: 'bg-emerald-50 text-emerald-600',
    CANCELLED: 'bg-red-50 text-red-500',
    FAILED: 'bg-red-50 text-red-600',
  };
  const labels: Record<string, string> = {
    DRAFT: 'טיוטה',
    SCHEDULED: 'מתוזמן',
    RUNNING: 'פעיל',
    PAUSED: 'מושהה',
    COMPLETED: 'הושלם',
    CANCELLED: 'בוטל',
    FAILED: 'נכשל',
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {labels[status] || status}
    </span>
  );
}
