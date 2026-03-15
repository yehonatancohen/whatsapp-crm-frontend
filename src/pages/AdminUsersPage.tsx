import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { AdminUser, AdminOverview } from '../types';

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: overview, isLoading: overviewLoading } = useQuery<AdminOverview>({
    queryKey: ['admin', 'overview'],
    queryFn: async () => {
      const { data } = await api.get('/admin/overview');
      return data;
    },
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ['admin', 'users', search],
    queryFn: async () => {
      const { data } = await api.get(`/admin/users${search ? `?search=${search}` : ''}`);
      return data;
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      await api.patch(`/admin/users/${userId}`, { isActive });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

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
                <th className="px-6 py-4">משתמש</th>
                <th className="px-6 py-4">סטטוס</th>
                <th className="px-6 py-4">מנוי</th>
                <th className="px-6 py-4 text-center">חשבונות</th>
                <th className="px-6 py-4 text-center">קמפיינים</th>
                <th className="px-6 py-4">תאריך הצטרפות</th>
                <th className="px-6 py-4">פעולות</th>
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-charcoal">{u.name}</div>
                      <div className="text-xs text-faded" dir="ltr" style={{ textAlign: 'right' }}>{u.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {u.isActive ? 'פעיל' : 'חסום'}
                      </span>
                      {!u.emailVerified && (
                        <span className="mr-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-600">
                          לא מאומת
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-charcoal font-medium">{u.subscription?.planTier || 'ללא מנוי'}</div>
                      <div className="text-[10px] text-faded uppercase">{u.subscription?.status || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">{u._count.accounts}</td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">{u._count.campaigns}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-muted">
                      {new Date(u.createdAt).toLocaleDateString('he-IL')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
