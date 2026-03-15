import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { extractApiError } from '../lib/errorUtils';
import { useSubscription, useBillingPortal } from '../hooks/useSubscription';
import { useNavigate } from 'react-router-dom';

const translateStatus = (status: string) => {
  switch (status) {
    case 'TRIALING': return 'תקופת ניסיון';
    case 'ACTIVE': return 'פעיל';
    case 'PAST_DUE': return 'חוב';
    case 'CANCELED': return 'מבוטל';
    case 'UNPAID': return 'לא שולם';
    default: return status;
  }
};

const translateTier = (tier: string) => {
  switch (tier) {
    case 'STARTER': return 'מתחיל';
    case 'PRO': return 'מקצוען';
    case 'ENTERPRISE': return 'ארגוני';
    default: return tier;
  }
};

export function SettingsPage() {
  const { user, refreshUser } = useAuth();
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
      await refreshUser();
      setProfileMsg({ type: 'success', text: 'הפרופיל עודכן בהצלחה' });
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
      setPasswordMsg({ type: 'error', text: 'הסיסמאות אינן תואמות' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'הסיסמה חייבת להכיל לפחות 8 תווים' });
      return;
    }
    setPasswordSaving(true);
    try {
      await api.patch('/auth/password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg({ type: 'success', text: 'הסיסמה שונתה בהצלחה' });
    } catch (err) {
      const { message, details } = extractApiError(err);
      const detailText = details.length > 0 ? details.map((d) => d.message).join('. ') : message;
      setPasswordMsg({ type: 'error', text: detailText });
    } finally {
      setPasswordSaving(false);
    }
  };

  const inputClass = "w-full bg-white border border-border text-charcoal rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors text-right";

  return (
    <div className="text-right">
      <h1 className="text-2xl font-semibold text-charcoal mb-6">הגדרות</h1>

      {/* Profile Section */}
      <div className="bg-white border border-border rounded-xl p-4 sm:p-6 shadow-soft mb-6">
        <div className="flex items-center gap-4 mb-5 pb-4 border-b border-border">
          <div className="w-14 h-14 rounded-full bg-accent-light flex items-center justify-center text-xl font-bold text-accent shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-charcoal">{user?.name}</h2>
            <p className="text-sm text-muted" dir="ltr">{user?.email}</p>
          </div>
        </div>

        {profileMsg && (
          <div className={`rounded-lg px-4 py-3 mb-4 text-sm ${profileMsg.type === 'success' ? 'bg-accent-light border border-accent/20 text-accent' : 'bg-red-50 border border-red-200 text-red-600'}`}>
            {profileMsg.text}
          </div>
        )}
        <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">שם</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <button type="submit" disabled={profileSaving} className="bg-accent hover:bg-accent-hover text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50">
            {profileSaving ? 'שומר...' : 'שמור שינויים'}
          </button>
        </form>
      </div>

      {/* Subscription & Billing Section */}
      <div className="bg-white border border-border rounded-xl p-4 sm:p-6 shadow-soft mb-6">
        <h2 className="text-sm font-semibold text-charcoal mb-4">מנוי וחיוב</h2>

        {subLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : subscription ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-4 border-b border-border">
              <div className="p-3 bg-cream/50 rounded-lg border border-border">
                <p className="text-[10px] text-muted uppercase font-bold mb-1">תוכנית</p>
                <p className="text-sm font-bold text-charcoal">{translateTier(subscription.planTier)}</p>
              </div>
              <div className="p-3 bg-cream/50 rounded-lg border border-border">
                <p className="text-[10px] text-muted uppercase font-bold mb-1">סטטוס</p>
                <span className={`text-sm font-bold ${
                  subscription.status === 'ACTIVE' ? 'text-green-600' :
                  subscription.status === 'TRIALING' ? 'text-blue-600' :
                  'text-red-600'
                }`}>
                  {translateStatus(subscription.status)}
                </span>
              </div>
              <div className="p-3 bg-cream/50 rounded-lg border border-border">
                <p className="text-[10px] text-muted uppercase font-bold mb-1">
                  {subscription.status === 'TRIALING' ? 'תום ניסיון' : 'חידוש'}
                </p>
                <p className="text-sm font-bold text-charcoal">
                  {subscription.status === 'TRIALING' && subscription.trialEndsAt
                    ? new Date(subscription.trialEndsAt).toLocaleDateString('he-IL')
                    : subscription.currentPeriodEnd
                      ? new Date(subscription.currentPeriodEnd).toLocaleDateString('he-IL')
                      : '—'}
                </p>
              </div>
            </div>

            {subscription.cancelAtPeriodEnd && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-700">המנוי יבוטל בסוף תקופת החיוב הנוכחית.</p>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => navigate('/pricing')}
                className="bg-accent hover:bg-accent-hover text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                {subscription.status === 'TRIALING' ? 'בחר תוכנית' : 'שנה תוכנית'}
              </button>
              {subscription.status === 'ACTIVE' && (
                <button
                  onClick={() => billingPortal.mutate()}
                  disabled={billingPortal.isPending}
                  className="bg-cream hover:bg-cream-dark text-charcoal text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {billingPortal.isPending ? 'פותח...' : 'ניהול חיובים'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-muted mb-3">לא נמצא מנוי פעיל.</p>
            <button
              onClick={() => navigate('/pricing')}
              className="bg-accent hover:bg-accent-hover text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              בחר תוכנית
            </button>
          </div>
        )}
      </div>

      {/* Change Password Section */}
      <div className="bg-white border border-border rounded-xl p-4 sm:p-6 shadow-soft">
        <h2 className="text-sm font-semibold text-charcoal mb-4">שינוי סיסמה</h2>
        {passwordMsg && (
          <div className={`rounded-lg px-4 py-3 mb-4 text-sm ${passwordMsg.type === 'success' ? 'bg-accent-light border border-accent/20 text-accent' : 'bg-red-50 border border-red-200 text-red-600'}`}>
            {passwordMsg.text}
          </div>
        )}
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">סיסמה נוכחית</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">סיסמה חדשה</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">אישור סיסמה חדשה</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} />
          </div>
          <button type="submit" disabled={passwordSaving} className="bg-accent hover:bg-accent-hover text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50">
            {passwordSaving ? 'משנה...' : 'שנה סיסמה'}
          </button>
        </form>
      </div>
    </div>
  );
}
