import { useUsers, useUpdateUser } from '../hooks/useUsers';
import { useAuth } from '../context/AuthContext';
import type { AdminUser } from '../types';

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { data: users, isLoading, error } = useUsers();
  const updateMutation = useUpdateUser();

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
        <p className="text-red-400 text-sm">Admin access required.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin w-6 h-6 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
        <p className="text-red-400 text-sm">{error.message}</p>
      </div>
    );
  }

  const toggleRole = (user: AdminUser) => {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    updateMutation.mutate({ id: user.id, data: { role: newRole } });
  };

  const toggleActive = (user: AdminUser) => {
    updateMutation.mutate({ id: user.id, data: { isActive: !user.isActive } });
  };

  return (
    <>
      <h1 className="text-2xl font-semibold text-slate-100 mb-6">User Management</h1>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">User</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Role</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Accounts</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Campaigns</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <tr key={u.id} className="border-b border-slate-700/30 last:border-0 hover:bg-slate-700/20">
                <td className="px-5 py-3">
                  <p className="text-slate-200 font-medium">{u.name}</p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.role === 'ADMIN' ? 'bg-violet-500/20 text-violet-400' : 'bg-slate-600/30 text-slate-400'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-400">{u._count.accounts}</td>
                <td className="px-5 py-3 text-slate-400">{u._count.campaigns}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-medium ${u.isActive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {u.isActive ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {u.id !== currentUser!.id && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleRole(u)}
                        disabled={updateMutation.isPending}
                        className="text-xs text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
                      >
                        {u.role === 'ADMIN' ? 'Demote' : 'Promote'}
                      </button>
                      <button
                        onClick={() => toggleActive(u)}
                        disabled={updateMutation.isPending}
                        className={`text-xs transition-colors disabled:opacity-50 ${u.isActive ? 'text-red-400 hover:text-red-300' : 'text-emerald-400 hover:text-emerald-300'}`}
                      >
                        {u.isActive ? 'Disable' : 'Enable'}
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
