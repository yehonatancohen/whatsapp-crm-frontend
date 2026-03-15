import { useState } from 'react';
import { useUsers, useUpdateUser, useDeleteUser, useAdminOverview } from '../hooks/useUsers';
import { useAuth } from '../context/AuthContext';
import type { AdminUser } from '../types';

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-white border border-border rounded-xl p-4 shadow-soft">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className="text-2xl font-bold text-charcoal">{value}</p>
      {sub && <p className="text-xs text-faded mt-1">{sub}</p>}
    </div>
  );
}

function OverviewTab() {
  const { data, isLoading } = useAdminOverview();

  if (isLoading || !data) {
    return <p className="text-sm text-faded py-8 text-center">Loading overview...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Total Users" value={data.totalUsers} />
        <StatCard label="Verified" value={data.verifiedUsers} />
        <StatCard label="Active" value={data.activeUsers} />
        <StatCard label="New this week" value={data.newUsersWeek} />
        <StatCard label="New this month" value={data.newUsersMonth} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white border border-border rounded-xl p-4 shadow-soft">
          <h3 className="text-sm font-semibold text-charcoal mb-3">Subscriptions by Status</h3>
          {Object.keys(data.subsByStatus).length === 0 ? (
            <p className="text-sm text-faded">No subscriptions yet</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(data.subsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    status === 'ACTIVE' ? 'bg-accent-light text-accent' :
                    status === 'TRIALING' ? 'bg-blue-50 text-blue-600' :
                    status === 'PAST_DUE' ? 'bg-amber-50 text-amber-600' :
                    'bg-red-50 text-red-600'
                  }`}>{status}</span>
                  <span className="text-sm font-medium text-charcoal">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-border rounded-xl p-4 shadow-soft">
          <h3 className="text-sm font-semibold text-charcoal mb-3">Subscriptions by Plan</h3>
          {Object.keys(data.subsByTier).length === 0 ? (
            <p className="text-sm text-faded">No subscriptions yet</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(data.subsByTier).map(([tier, count]) => (
                <div key={tier} className="flex items-center justify-between">
                  <span className="text-sm text-muted">{tier}</span>
                  <span className="text-sm font-medium text-charcoal">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UsersTab({ currentUserId }: { currentUserId: string }) {
  const { data: users, isLoading, error } = useUsers();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin w-6 h-6 text-faded" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (error) {
    return <p className="text-red-600 text-sm">{error.message}</p>;
  }

  const filtered = (users || []).filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleRole = (user: AdminUser) => {
    updateMutation.mutate({ id: user.id, data: { role: user.role === 'ADMIN' ? 'USER' : 'ADMIN' } });
  };

  const toggleActive = (user: AdminUser) => {
    updateMutation.mutate({ id: user.id, data: { isActive: !user.isActive } });
  };

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      deleteMutation.mutate(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
    }
  };

  return (
    <>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm bg-white border border-border text-charcoal rounded-lg px-3.5 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors placeholder-faded"
        />
      </div>

      <div className="bg-white border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase">User</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase">Role</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase">Plan</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase">Accounts</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-cream/20">
                <td className="px-5 py-3">
                  <p className="text-charcoal font-medium">{u.name}</p>
                  <p className="text-xs text-faded">{u.email}</p>
                  {!u.emailVerified && (
                    <span className="text-[10px] text-amber-600">Unverified</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.role === 'ADMIN' ? 'bg-violet-50 text-violet-600' : 'bg-gray-100 text-muted'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {u.subscription ? (
                    <div>
                      <span className="text-xs text-charcoal">{u.subscription.planTier}</span>
                      <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                        u.subscription.status === 'ACTIVE' ? 'bg-accent/10 text-accent' :
                        u.subscription.status === 'TRIALING' ? 'bg-blue-50 text-blue-600' :
                        u.subscription.status === 'PAST_DUE' ? 'bg-amber-50 text-amber-600' :
                        'bg-red-50 text-red-600'
                      }`}>{u.subscription.status}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-faded">None</span>
                  )}
                </td>
                <td className="px-5 py-3 text-muted">{u._count.accounts}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-medium ${u.isActive ? 'text-accent' : 'text-red-600'}`}>
                    {u.isActive ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {u.id !== currentUserId && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleRole(u)} disabled={updateMutation.isPending} className="text-xs text-muted hover:text-charcoal transition-colors disabled:opacity-50">
                        {u.role === 'ADMIN' ? 'Demote' : 'Promote'}
                      </button>
                      <button onClick={() => toggleActive(u)} disabled={updateMutation.isPending} className={`text-xs transition-colors disabled:opacity-50 ${u.isActive ? 'text-red-600 hover:text-red-500' : 'text-accent hover:text-accent-hover'}`}>
                        {u.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button onClick={() => handleDelete(u.id)} disabled={deleteMutation.isPending} className="text-xs text-red-600 hover:text-red-500 transition-colors disabled:opacity-50">
                        {confirmDelete === u.id ? 'Confirm?' : 'Delete'}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [tab, setTab] = useState<'overview' | 'users'>('overview');

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
        <p className="text-red-600 text-sm">Admin access required.</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-semibold text-charcoal mb-6">Admin Dashboard</h1>

      <div className="flex gap-1 mb-6 bg-white border border-border rounded-lg p-1 shadow-soft w-fit">
        <button
          onClick={() => setTab('overview')}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${tab === 'overview' ? 'bg-cream text-charcoal' : 'text-muted hover:text-charcoal'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setTab('users')}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${tab === 'users' ? 'bg-cream text-charcoal' : 'text-muted hover:text-charcoal'}`}
        >
          Users
        </button>
      </div>

      {tab === 'overview' ? <OverviewTab /> : <UsersTab currentUserId={currentUser.id} />}
    </>
  );
}
