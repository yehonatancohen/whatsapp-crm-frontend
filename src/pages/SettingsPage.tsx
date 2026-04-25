import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { extractApiError } from '../lib/errorUtils';
import { useSubscription } from '../hooks/useSubscription';

const WA_NUMBER = '972586181898';
const WA_LINK = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('שלום, אני מעוניין בשדרוג/שינוי המנוי שלי')}`;

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
  const { data: subscription, isLoading: subLoading } = useSubscription();
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
          <button type="submit" disabled={profileSaving} className="bg-accent hover:bg-accent-hover text-[#ffffff] text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50">
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
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-accent hover:bg-accent-hover text-[#ffffff] text-sm font-medium px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {subscription.status === 'TRIALING' ? 'בחר תוכנית — צור קשר' : 'שנה תוכנית — צור קשר'}
              </a>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-muted mb-3">לא נמצא מנוי פעיל.</p>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-accent hover:bg-accent-hover text-[#ffffff] text-sm font-medium px-5 py-2.5 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              בחר תוכנית — צור קשר
            </a>
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
          <button type="submit" disabled={passwordSaving} className="bg-accent hover:bg-accent-hover text-[#ffffff] text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50">
            {passwordSaving ? 'משנה...' : 'שנה סיסמה'}
          </button>
        </form>
      </div>
    </div>
  );
}
