import { useCampaignAnalytics, useMessageTrends } from '../hooks/useAnalytics';

function BarChart({ data }: { data: Array<{ date: string; sent: number; delivered: number }> }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const visible = isMobile ? data.slice(-14) : data.slice(-30);
  const maxVal = Math.max(1, ...visible.map((d) => d.sent));
  const maxHeight = 100;

  return (
    <div className="flex items-end gap-[2px] sm:gap-[3px] overflow-hidden" style={{ height: maxHeight + 28 }}>
      {visible.map((d) => {
        const sentH = (d.sent / maxVal) * maxHeight;
        const deliveredH = (d.delivered / maxVal) * maxHeight;
        const dateLabel = d.date.slice(5);
        return (
          <div key={d.date} className="flex flex-col items-center flex-1 min-w-0 group relative">
            <div className="w-full flex flex-col items-center justify-end" style={{ height: maxHeight }}>
              <div className="w-full rounded-t bg-accent/20 relative" style={{ height: Math.max(sentH, 1) }}>
                <div className="absolute bottom-0 w-full rounded-t bg-accent" style={{ height: Math.max(deliveredH, 0) }} />
              </div>
            </div>
            <span className="text-[7px] sm:text-[8px] text-muted mt-1 truncate w-full text-center">{dateLabel}</span>
            <div className="absolute bottom-full mb-2 bg-charcoal text-[#ffffff] text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
              <div>{d.date}</div>
              <div>נשלחו: {d.sent}</div>
              <div>הגיעו: {d.delivered}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({ label, value, sub, color, icon }: { label: string; value: string | number; sub?: string; color: string; icon?: React.ReactNode }) {
  const colors: Record<string, string> = {
    accent: 'bg-accent-light text-accent border-accent/10',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };

  return (
    <div className={`rounded-xl border p-3 sm:p-4 text-right ${colors[color] || colors.accent}`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-xs font-medium opacity-70">{label}</p>
        {icon && <span className="opacity-60 shrink-0">{icon}</span>}
      </div>
      <p className="text-xl sm:text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
}

function DeliveryRing({ rate }: { rate: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (rate / 100) * circ;

  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="shrink-0">
      <circle cx="36" cy="36" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-emerald-100" />
      <circle
        cx="36" cy="36" r={r}
        fill="none" stroke="currentColor" strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
        className="text-emerald-500 transition-all duration-700"
      />
      <text x="36" y="40" textAnchor="middle" className="text-emerald-600" fontSize="12" fontWeight="bold" fill="currentColor">{rate}%</text>
    </svg>
  );
}

export function AnalyticsPage() {
  const { data: stats, isLoading: statsLoading } = useCampaignAnalytics();
  const { data: trends = [], isLoading: trendsLoading } = useMessageTrends(30);

  const summary = stats?.summary;

  const avgDailySent = trends.length > 0
    ? Math.round(trends.reduce((s, t) => s + t.sent, 0) / trends.length)
    : 0;

  const bestDay = trends.length > 0
    ? trends.reduce((best, t) => t.sent > best.sent ? t : best, trends[0])
    : null;

  const activeCount = stats?.campaigns.filter(c => c.status === 'RUNNING').length ?? 0;
  const completedCount = stats?.campaigns.filter(c => c.status === 'COMPLETED').length ?? 0;

  const topCampaigns = stats?.campaigns
    .filter(c => c.sentCount > 0)
    .sort((a, b) => {
      const rateA = a.sentCount > 0 ? a.deliveredCount / a.sentCount : 0;
      const rateB = b.sentCount > 0 ? b.deliveredCount / b.sentCount : 0;
      return rateB - rateA;
    })
    .slice(0, 3) ?? [];

  return (
    <>
      <h1 className="text-xl sm:text-2xl font-semibold text-charcoal mb-4 sm:mb-6 text-right">אנליטיקס</h1>

      {/* Summary Cards — mobile: 2-col, sm: 3-col, lg: keep 2 rows */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
        <StatCard
          label="קמפיינים"
          value={statsLoading ? '-' : (summary?.totalCampaigns ?? 0)}
          sub={`${activeCount} פעילים · ${completedCount} הושלמו`}
          color="accent"
          icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>}
        />
        <StatCard
          label="הודעות שנשלחו"
          value={statsLoading ? '-' : (summary?.totalSent ?? 0)}
          sub={avgDailySent > 0 ? `ממוצע ${avgDailySent}/יום` : undefined}
          color="blue"
          icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="20 6 9 17 4 12" /></svg>}
        />
        <StatCard
          label="הגיעו ליעד"
          value={statsLoading ? '-' : (summary?.totalDelivered ?? 0)}
          sub={summary ? `${summary.deliveryRate}% אחוז מסירה` : undefined}
          color="green"
          icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="20 6 9 17 4 12" /><polyline points="20 10 16 14" /></svg>}
        />
        <StatCard
          label="נכשלו"
          value={statsLoading ? '-' : (summary?.totalFailed ?? 0)}
          sub={summary ? `${summary.failureRate}% שיעור כישלון` : undefined}
          color="red"
          icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>}
        />
        <StatCard
          label="יום שיא"
          value={bestDay ? bestDay.date.slice(5) : '-'}
          sub={bestDay ? `${bestDay.sent} הודעות` : undefined}
          color="amber"
          icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>}
        />
        <StatCard
          label='סה"כ הודעות'
          value={statsLoading ? '-' : (summary?.totalMessages ?? 0)}
          sub="כולל ממתינות"
          color="purple"
          icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>}
        />
      </div>

      {/* Delivery Rate + Trends — two columns on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {/* Delivery Rate Ring */}
        <div className="bg-white border border-border rounded-xl p-4 shadow-soft flex flex-col items-center justify-center gap-3 text-center">
          <h2 className="text-sm font-semibold text-charcoal text-right w-full">אחוז מסירה כולל</h2>
          {statsLoading ? (
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <DeliveryRing rate={summary?.deliveryRate ?? 0} />
              <div className="text-xs text-muted space-y-1 text-right w-full">
                <div className="flex justify-between">
                  <span className="text-emerald-600 font-medium">{summary?.totalDelivered ?? 0}</span>
                  <span>הגיעו</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-500 font-medium">{summary?.totalFailed ?? 0}</span>
                  <span>נכשלו</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal font-medium">{(summary?.totalSent ?? 0) - (summary?.totalDelivered ?? 0) - (summary?.totalFailed ?? 0)}</span>
                  <span>ממתינות</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Message Trends Chart */}
        <div className="bg-white border border-border rounded-xl p-4 sm:p-5 shadow-soft sm:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded bg-accent/20" />
                <span className="text-[10px] text-muted">נשלחו</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded bg-accent" />
                <span className="text-[10px] text-muted">הגיעו</span>
              </div>
            </div>
            <h2 className="text-sm font-semibold text-charcoal">מגמת הודעות (30 יום)</h2>
          </div>
          {trendsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : trends.every((t) => t.sent === 0) ? (
            <div className="flex items-center justify-center h-32 text-sm text-muted">אין נתונים עדיין</div>
          ) : (
            <BarChart data={trends} />
          )}
        </div>
      </div>

      {/* Top Performing Campaigns */}
      {topCampaigns.length > 0 && (
        <div className="bg-white border border-border rounded-xl p-4 sm:p-5 shadow-soft mb-4 sm:mb-6">
          <h2 className="text-sm font-semibold text-charcoal mb-3 text-right">קמפיינים מובילים</h2>
          <div className="space-y-2.5">
            {topCampaigns.map((c, i) => {
              const rate = c.sentCount > 0 ? Math.round((c.deliveredCount / c.sentCount) * 100) : 0;
              return (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted w-4 shrink-0 text-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs text-muted">{c.sentCount} נשלחו</span>
                      <span className="text-xs font-medium text-charcoal truncate">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-600 w-8 text-left">{rate}%</span>
                      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${rate}%`,
                            background: rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Campaign Performance Table */}
      <div className="bg-white border border-border rounded-xl p-4 sm:p-5 shadow-soft">
        <h2 className="text-sm font-semibold text-charcoal mb-3 sm:mb-4 text-right">ביצועי קמפיינים</h2>
        {statsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !stats?.campaigns.length ? (
          <p className="text-sm text-muted text-right py-4">אין קמפיינים עדיין</p>
        ) : (
          <>
            {/* Mobile: compact card layout */}
            <div className="sm:hidden space-y-2">
              {stats.campaigns.map((c) => {
                const rate = c.sentCount > 0 ? Math.round((c.deliveredCount / c.sentCount) * 100) : 0;
                return (
                  <div key={c.id} className="border border-border rounded-lg p-3 bg-cream/20">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <StatusBadge status={c.status} />
                      <span className="text-sm font-medium text-charcoal truncate">{c.name}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-center mb-2">
                      <div className="bg-white rounded p-1.5">
                        <p className="text-[10px] text-muted">נשלחו</p>
                        <p className="text-xs font-bold text-charcoal">{c.sentCount}</p>
                      </div>
                      <div className="bg-white rounded p-1.5">
                        <p className="text-[10px] text-muted">הגיעו</p>
                        <p className="text-xs font-bold text-emerald-600">{c.deliveredCount}</p>
                      </div>
                      <div className="bg-white rounded p-1.5">
                        <p className="text-[10px] text-muted">נכשלו</p>
                        <p className="text-xs font-bold text-red-500">{c.failedCount}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${rate}%`,
                            background: rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444',
                          }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-muted w-8 text-left">{rate}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Desktop: table layout */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm" dir="rtl">
                <thead>
                  <tr className="border-b border-border text-muted text-xs">
                    <th className="text-right py-2 px-2 font-medium">שם</th>
                    <th className="text-right py-2 px-2 font-medium">סטטוס</th>
                    <th className="text-right py-2 px-2 font-medium">סוג</th>
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
                        <td className="py-2.5 px-2 font-medium text-charcoal">{c.name}</td>
                        <td className="py-2.5 px-2"><StatusBadge status={c.status} /></td>
                        <td className="py-2.5 px-2 text-muted text-xs">{c.type === 'DIRECT_MESSAGE' ? 'ישיר' : 'קבוצה'}</td>
                        <td className="py-2.5 px-2 text-muted">{c.sentCount}</td>
                        <td className="py-2.5 px-2 text-emerald-600 font-medium">{c.deliveredCount}</td>
                        <td className="py-2.5 px-2 text-red-500">{c.failedCount}</td>
                        <td className="py-2.5 px-2">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${rate}%`,
                                  background: rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444',
                                }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-muted w-8">{rate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
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
