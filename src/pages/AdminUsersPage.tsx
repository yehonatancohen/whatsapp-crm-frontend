import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { AdminUser, AdminOverview } from '../types';

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [search, setSearch] = useState('');
  const [rateLimitIp, setRateLimitIp] = useState('');
  const [rateLimitStatus, setRateLimitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const { data: overview, isLoading: overviewLoading } = useQuery<AdminOverview>({
    queryKey: ['admin', 'overview'],
    queryFn: async () => {
      const { data } = await api.get('/users/stats/overview');
      return data;
    },
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ['admin', 'users', search],
    queryFn: async () => {
      const { data } = await api.get(`/users${search ? `?search=${search}` : ''}`);
      return data;
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      await api.patch(`/users/${userId}`, { isActive });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const changePlanMutation = useMutation({
    mutationFn: async ({ userId, planTier }: { userId: string; planTier: string }) => {
      await api.patch(`/users/${userId}`, { planTier });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
    },
  });

  const verifyEmailMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.patch(`/users/${userId}`, { emailVerified: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
    },
  });

  const stopTrialMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.patch(`/users/${userId}`, { subscriptionStatus: 'ACTIVE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
    },
  });

  const impersonateMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.post(`/users/${userId}/impersonate`);
      return data;
    },
    onSuccess: async (data) => {
      // Store the new tokens and user
      localStorage.setItem('accessToken', data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Refresh the context and navigate to dashboard
      await refreshUser();
      navigate('/');
      window.location.reload(); // Hard reload to ensure all states are cleared
    },
  });

  async function handleClearRateLimit() {
    if (!rateLimitIp.trim()) return;
    setRateLimitStatus('idle');
    try {
      await api.post('/users/clear-rate-limit', { ip: rateLimitIp.trim() });
      setRateLimitStatus('success');
      setRateLimitIp('');
    } catch {
      setRateLimitStatus('error');
    }
  }

  return (
    <div className="text-right">
      <h1 className="text-2xl font-semibold text-charcoal mb-6">ניהול משתמשים</h1>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <AdminStatCard label={'סה"כ משתמשים'} value={overviewLoading ? '...' : (overview?.totalUsers ?? 0)} color="accent" />
        <AdminStatCard label={'משתמשים פעילים'} value={overviewLoading ? '...' : (overview?.activeUsers ?? 0)} color="green" />
        <AdminStatCard label={'חדשים (שבוע)'} value={overviewLoading ? '...' : (overview?.newUsersWeek ?? 0)} color="blue" />
        <AdminStatCard label={'מאומתים'} value={overviewLoading ? '...' : (overview?.verifiedUsers ?? 0)} color="violet" />
      </div>

      <div className="bg-white border border-border rounded-xl shadow-soft overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חפש משתמש..."
              className="w-full bg-cream border border-border text-charcoal rounded-lg pr-10 pl-3 py-2 text-sm outline-none focus:border-accent transition-colors text-right"
            />
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-muted absolute right-3 top-1/2 -translate-y-1/2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-cream-dark/50 border-b border-border text-xs font-semibold text-muted uppercase tracking-wider">
                <th className="px-3 sm:px-6 py-3 sm:py-4">משתמש</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4">סטטוס</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">מנוי</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-center hidden md:table-cell">חשבונות</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-center hidden md:table-cell">קמפיינים</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 hidden lg:table-cell">תאריך הצטרפות</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {usersLoading ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-muted">טוען משתמשים...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-muted">לא נמצאו משתמשים</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="text-sm hover:bg-cream/30 transition-colors">
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="font-medium text-charcoal">{u.name}</div>
                      <div className="text-xs text-faded" dir="ltr" style={{ textAlign: 'right' }}>{u.email}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {u.isActive ? 'פעיל' : 'חסום'}
                      </span>
                      {!u.emailVerified && (
                        <button
                          onClick={() => verifyEmailMutation.mutate(u.id)}
                          disabled={verifyEmailMutation.isPending}
                          title="לחץ לאימות אימייל"
                          className="mr-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors cursor-pointer"
                        >
                          לא מאומת ✓
                        </button>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                      {u.subscription ? (
                        <>
                          <select
                            value={u.subscription.planTier}
                            onChange={(e) => changePlanMutation.mutate({ userId: u.id, planTier: e.target.value })}
                            disabled={changePlanMutation.isPending}
                            className="bg-cream border border-border text-charcoal text-xs font-medium rounded-lg px-2 py-1 outline-none focus:border-accent transition-colors cursor-pointer"
                          >
                            <option value="STARTER">Starter</option>
                            <option value="PRO">Pro</option>
                            <option value="ENTERPRISE">Enterprise</option>
                          </select>
                          <div className="text-[10px] text-faded uppercase mt-0.5">{u.subscription.status}</div>
                          {u.subscription.status === 'TRIALING' && (
                            <button
                              onClick={() => stopTrialMutation.mutate(u.id)}
                              disabled={stopTrialMutation.isPending}
                              title="סיים תקופת ניסיון"
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors mt-0.5 block"
                            >
                              {stopTrialMutation.isPending ? 'סוגר...' : 'סיים ניסיון'}
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-muted">ללא מנוי</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-center whitespace-nowrap hidden md:table-cell">{u._count.accounts}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-center whitespace-nowrap hidden md:table-cell">{u._count.campaigns}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs text-muted hidden lg:table-cell">
                      {new Date(u.createdAt).toLocaleDateString('he-IL')}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => impersonateMutation.mutate(u.id)}
                          disabled={impersonateMutation.isPending || !u.isActive}
                          title="התחבר כמשתמש זה"
                          className="text-xs font-semibold px-3 py-1 rounded border border-accent/20 text-accent hover:bg-accent/5 transition-colors disabled:opacity-50"
                        >
                          {impersonateMutation.isPending ? 'מתחבר...' : 'התחבר כ...'}
                        </button>
                        <button
                          onClick={() => toggleStatusMutation.mutate({ userId: u.id, isActive: !u.isActive })}
                          className={`text-xs font-semibold px-3 py-1 rounded border transition-colors ${
                            u.isActive
                              ? 'text-red-600 border-red-200 hover:bg-red-50'
                              : 'text-green-600 border-green-200 hover:bg-green-50'
                          }`}
                        >
                          {u.isActive ? 'חסום' : 'בטל חסימה'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Rate Limit Management */}
      <div className="mt-8 bg-white border border-border rounded-xl shadow-soft p-5">
        <h2 className="text-base font-semibold text-charcoal mb-1">ביטול Rate Limit</h2>
        <p className="text-xs text-muted mb-4">הזן כתובת IP של משתמש שחסום על ידי rate limiter כדי לשחרר אותו.</p>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs text-muted block mb-1">כתובת IP</label>
            <input
              type="text"
              value={rateLimitIp}
              onChange={(e) => { setRateLimitIp(e.target.value); setRateLimitStatus('idle'); }}
              onKeyDown={(e) => e.key === 'Enter' && handleClearRateLimit()}
              placeholder="1.2.3.4"
              dir="ltr"
              className="w-full bg-cream border border-border text-charcoal rounded-lg px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
            />
          </div>
          <button
            onClick={handleClearRateLimit}
            disabled={!rateLimitIp.trim()}
            className="px-4 py-2 bg-accent hover:bg-accent-hover disabled:opacity-40 text-[#ffffff] text-sm font-medium rounded-lg transition-colors"
          >
            שחרר
          </button>
        </div>
        {rateLimitStatus === 'success' && <p className="text-xs text-accent mt-2">Rate limit שוחרר בהצלחה.</p>}
        {rateLimitStatus === 'error' && <p className="text-xs text-red-500 mt-2">שגיאה בשחרור rate limit. נסה שוב.</p>}
      </div>
    </div>
  );
}

function AdminStatCard({ label, value, color }: { label: string; value: any; color: string }) {
  const colors: any = {
    accent: 'bg-accent-light text-accent border-accent/10',
    green: 'bg-green-50 text-green-600 border-green-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
  };

  return (
    <div className={`rounded-xl border p-4 text-right shadow-sm ${colors[color]}`}>
      <p className="text-xs font-medium opacity-80 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value ?? 0}</p>
    </div>
  );
}
