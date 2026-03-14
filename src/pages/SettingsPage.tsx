import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { extractApiError } from '../lib/errorUtils';
import { useSubscription, useBillingPortal } from '../hooks/useSubscription';
import { useNavigate } from 'react-router-dom';

export function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const billingPortal = useBillingPortal();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileSaving(true);
    try {
      await api.patch('/auth/profile', { name });
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        parsed.name = name;
        localStorage.setItem('user', JSON.stringify(parsed));
      }
      setProfileMsg({ type: 'success', text: 'Profile updated successfully' });
    } catch (err) {
      const { message } = extractApiError(err);
      setProfileMsg({ type: 'error', text: message });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }
    setPasswordSaving(true);
    try {
      await api.patch('/auth/password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg({ type: 'success', text: 'Password changed successfully' });
    } catch (err) {
      const { message, details } = extractApiError(err);
      const detailText = details.length > 0 ? details.map((d) => d.message).join('. ') : message;
      setPasswordMsg({ type: 'error', text: detailText });
    } finally {
      setPasswordSaving(false);
    }
  };

  const inputClass = "w-full bg-white border border-charcoal text-charcoal rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors";

  return (
    <>
      <h1 className="text-2xl font-semibold text-charcoal mb-6">Settings</h1>

      {/* Profile Section */}
      <div className="bg-white border border-charcoal rounded-xl p-4 sm:p-6 shadow-soft mb-6">
        <h2 className="text-sm font-semibold text-charcoal mb-4">Profile</h2>
        {profileMsg && (
          <div className={`rounded-lg px-4 py-3 mb-4 text-sm ${profileMsg.type === 'success' ? 'bg-accent/10 border border-emerald-500/20 text-accent' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
            {profileMsg.text}
          </div>
        )}
        <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">Email</label>
            <input type="email" value={user?.email || ''} disabled className="w-full bg-white border border-charcoal text-faded rounded-lg px-3.5 py-2.5 text-sm cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <button type="submit" disabled={profileSaving} className="bg-accent hover:bg-accent text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50">
            {profileSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* Subscription & Billing Section */}
      <div className="bg-white border border-charcoal rounded-xl p-4 sm:p-6 shadow-soft mb-6">
        <h2 className="text-sm font-semibold text-charcoal mb-4">Subscription & Billing</h2>
        {subLoading ? (
          <p className="text-sm text-faded">Loading...</p>
        ) : subscription ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted">Plan:</span>
              <span className="text-sm font-medium text-charcoal">{subscription.planTier}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                subscription.status === 'ACTIVE' ? 'bg-accent/10 text-accent' :
                subscription.status === 'TRIALING' ? 'bg-blue-500/10 text-blue-400' :
                subscription.status === 'PAST_DUE' ? 'bg-amber-500/10 text-amber-400' :
                'bg-red-500/10 text-red-400'
              }`}>
                {subscription.status === 'TRIALING' ? 'Trial' : subscription.status}
              </span>
            </div>
            {subscription.status === 'TRIALING' && subscription.trialEndsAt && (
              <p className="text-sm text-muted">
                Trial ends: {new Date(subscription.trialEndsAt).toLocaleDateString()}
              </p>
            )}
            {subscription.cancelAtPeriodEnd && (
              <p className="text-sm text-amber-400">Your subscription will cancel at the end of the current period.</p>
            )}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => navigate('/pricing')}
                className="bg-accent hover:bg-accent text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {subscription.status === 'TRIALING' ? 'Choose a plan' : 'Change plan'}
              </button>
              {subscription.status !== 'TRIALING' && (
                <button
                  onClick={() => billingPortal.mutate()}
                  disabled={billingPortal.isPending}
                  className="bg-cream hover:bg-cream-dark text-charcoal text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {billingPortal.isPending ? 'Opening...' : 'Manage billing'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-muted mb-3">No subscription found.</p>
            <button
              onClick={() => navigate('/pricing')}
              className="bg-accent hover:bg-accent text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Choose a plan
            </button>
          </div>
        )}
      </div>

      {/* Change Password Section */}
      <div className="bg-white border border-charcoal rounded-xl p-4 sm:p-6 shadow-soft">
        <h2 className="text-sm font-semibold text-charcoal mb-4">Change Password</h2>
        {passwordMsg && (
          <div className={`rounded-lg px-4 py-3 mb-4 text-sm ${passwordMsg.type === 'success' ? 'bg-accent/10 border border-emerald-500/20 text-accent' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
            {passwordMsg.text}
          </div>
        )}
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">Current Password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} />
          </div>
          <button type="submit" disabled={passwordSaving} className="bg-accent hover:bg-accent text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50">
            {passwordSaving ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </>
  );
}
