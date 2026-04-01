import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { AccountResponse } from '../types';
import { api } from '../lib/api';
import {
  useAccountProfile,
  useUpdateProfile,
  useUpdateProfilePicture,
  useDeleteProfilePicture,
} from '../hooks/useAccounts';

const statusConfig: Record<string, { color: string; dot: string; label: string }> = {
  INITIALIZING: { color: 'text-amber-600', dot: 'bg-amber-500', label: 'מאתחל...' },
  QR_READY: { color: 'text-blue-600', dot: 'bg-blue-500', label: 'מוכן לסריקה' },
  AUTHENTICATED: { color: 'text-accent', dot: 'bg-accent', label: 'מחובר' },
  DISCONNECTED: { color: 'text-red-500', dot: 'bg-red-500', label: 'מנותק' },
};

interface Props {
  account: AccountResponse;
  onRemove: (id: string) => Promise<void>;
  onRename: (id: string, label: string) => Promise<void>;
}

export function AccountCard({ account, onRemove, onRename }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [newLabel, setNewLabel] = useState(account.label);
  const [isRenaming, setIsRenaming] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPairingInput, setShowPairingInput] = useState(false);
  const [pairingPhone, setPairingPhone] = useState('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingLoading, setPairingLoading] = useState(false);
  const [pairingError, setPairingError] = useState<string | null>(null);

  const handleRequestPairingCode = async () => {
    if (!pairingPhone.trim()) return;
    setPairingLoading(true);
    setPairingError(null);
    setPairingCode(null);
    try {
      const { data } = await api.post(`/accounts/${account.id}/pairing-code`, { phoneNumber: pairingPhone });
      setPairingCode(data.code);
    } catch (err: any) {
      setPairingError(err.response?.data?.error || 'נכשל בקבלת קוד');
    } finally {
      setPairingLoading(false);
    }
  };

  const status = statusConfig[account.status] ?? {
    color: 'text-muted',
    dot: 'bg-muted',
    label: account.status,
  };

  const handleRename = async () => {
    if (newLabel.trim() === '' || newLabel === account.label) {
      setIsEditing(false);
      setNewLabel(account.label);
      return;
    }
    setIsRenaming(true);
    try {
      await onRename(account.id, newLabel);
      setIsEditing(false);
    } catch (err) {
      console.error('Rename failed:', err);
      setNewLabel(account.label);
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <>
      <div className="bg-white border border-border rounded-xl p-5 hover:border-border shadow-soft group">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0 text-right">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                  autoFocus
                  disabled={isRenaming}
                  className="text-sm font-medium text-charcoal bg-cream border border-accent rounded px-2 py-0.5 outline-none w-full text-right"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 group/title justify-end">
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-muted hover:text-accent md:opacity-0 group-hover:opacity-100 transition-opacity order-2"
                  title="שנה שם"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <h3 className="text-charcoal font-medium text-sm truncate order-1">{account.label}</h3>
              </div>
            )}
            {account.phoneNumber && (
              <p className="text-muted text-xs mt-0.5" dir="ltr">{account.phoneNumber.startsWith('+') ? account.phoneNumber : `+${account.phoneNumber}`}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5 justify-end">
              <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
              <span className={`w-2 h-2 rounded-full ${status.dot} animate-pulse`} />
              {account.warmupLevel && (
                <span className="text-xs text-muted bg-cream border border-border px-1.5 py-0.5 rounded">
                  רמת חימום {account.warmupLevel}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {account.status === 'AUTHENTICATED' && (
              <button
                onClick={() => setShowProfile(true)}
                className="text-muted hover:text-accent transition-colors md:opacity-0 group-hover:opacity-100"
                title="ערוך פרופיל"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
            )}
            <button
              onClick={() => onRemove(account.id)}
              className="text-muted hover:text-red-500 transition-colors md:opacity-0 group-hover:opacity-100"
              title="הסר חשבון"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>

        {/* QR Code / Pairing Code */}
        {account.status === 'QR_READY' && account.qrCode && (
          <div className="mt-1">
            {!showPairingInput ? (
              <>
                <div className="flex justify-center">
                  <div className="bg-white rounded-lg p-4 inline-block border border-border">
                    <QRCodeSVG value={account.qrCode} size={180} bgColor="#ffffff" fgColor="#000000" />
                  </div>
                </div>
                <button
                  onClick={() => { setShowPairingInput(true); setPairingCode(null); setPairingError(null); }}
                  className="w-full mt-2 text-xs text-accent hover:text-accent/80 font-medium py-1.5 border border-accent/20 rounded-lg hover:bg-accent/5 transition-colors"
                >
                  משתמש באותו טלפון? השתמש בקוד חיבור
                </button>
              </>
            ) : (
              <div className="space-y-2 text-right">
                <p className="text-xs text-muted">
                  הכנס את מספר הטלפון של החשבון שאתה מחבר. תקבל קוד 8 ספרות שתזין בוואטסאפ ← מכשירים מקושרים ← קשר מכשיר ← קישור עם מספר טלפון.
                </p>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={pairingPhone}
                    onChange={(e) => setPairingPhone(e.target.value)}
                    placeholder="972501234567"
                    dir="ltr"
                    className="flex-1 bg-cream border border-border text-charcoal rounded-lg px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
                  />
                  <button
                    onClick={handleRequestPairingCode}
                    disabled={pairingLoading || !pairingPhone.trim()}
                    className="bg-accent hover:bg-accent/90 text-white text-xs font-medium px-3 py-2 rounded-lg disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {pairingLoading ? '...' : 'קבל קוד'}
                  </button>
                </div>
                {pairingCode && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-green-700 mb-1">הזן קוד זה בוואטסאפ:</p>
                    <p className="text-2xl font-bold text-green-800 tracking-widest" dir="ltr">{pairingCode}</p>
                  </div>
                )}
                {pairingError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{pairingError}</p>
                )}
                <button
                  onClick={() => { setShowPairingInput(false); setPairingCode(null); setPairingError(null); }}
                  className="text-xs text-muted hover:text-charcoal"
                >
                  ← חזור לסריקת QR
                </button>
              </div>
            )}
          </div>
        )}

        {/* Initializing spinner */}
        {account.status === 'INITIALIZING' && (
          <div className="flex items-center gap-2 mt-2 text-muted text-xs justify-end">
            מתחבר...
            <svg className="animate-spin w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}

        {/* Error */}
        {account.error && (
          <p className="text-red-600 text-xs mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-right">
            {account.error}
          </p>
        )}
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <ProfileModal
          accountId={account.id}
          accountLabel={account.label}
          onClose={() => setShowProfile(false)}
        />
      )}
    </>
  );
}

// ─── Profile Modal ──────────────────────────────────────────────────

function ProfileModal({ accountId, accountLabel, onClose }: { accountId: string; accountLabel: string; onClose: () => void }) {
  const { data: profile, isLoading } = useAccountProfile(accountId);
  const updateProfile = useUpdateProfile();
  const updatePicture = useUpdateProfilePicture();
  const deletePicture = useDeleteProfilePicture();

  const [displayName, setDisplayName] = useState('');
  const [statusText, setStatusText] = useState('');
  const [nameLoaded, setNameLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate form when profile loads
  if (profile && !nameLoaded) {
    setDisplayName(profile.displayName || '');
    setNameLoaded(true);
  }

  const handleSave = async () => {
    const updates: { id: string; displayName?: string; status?: string } = { id: accountId };
    if (displayName && displayName !== profile?.displayName) {
      updates.displayName = displayName;
    }
    if (statusText.trim()) {
      updates.status = statusText;
    }
    if (updates.displayName || updates.status) {
      await updateProfile.mutateAsync(updates);
      setStatusText('');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await updatePicture.mutateAsync({ id: accountId, file });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeletePicture = async () => {
    await deletePicture.mutateAsync(accountId);
  };

  const isSaving = updateProfile.isPending || updatePicture.isPending || deletePicture.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <button onClick={onClose} className="text-muted hover:text-charcoal transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <h2 className="text-sm font-semibold text-charcoal">פרופיל — {accountLabel}</h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin w-6 h-6 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Profile Picture */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group/pic">
                {profile?.profilePicUrl ? (
                  <img
                    src={profile.profilePicUrl}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-cream border-2 border-border flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-muted">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSaving}
                  className="absolute inset-0 rounded-full bg-black/0 hover:bg-black/30 flex items-center justify-center transition-colors group-hover/pic:bg-black/30 cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 opacity-0 group-hover/pic:opacity-100 transition-opacity">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSaving}
                  className="text-xs text-accent hover:text-accent/80 font-medium"
                >
                  {updatePicture.isPending ? 'מעלה...' : 'החלף תמונה'}
                </button>
                {profile?.profilePicUrl && (
                  <>
                    <span className="text-border">|</span>
                    <button
                      onClick={handleDeletePicture}
                      disabled={isSaving}
                      className="text-xs text-red-500 hover:text-red-600 font-medium"
                    >
                      {deletePicture.isPending ? 'מוחק...' : 'הסר תמונה'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-xs font-medium text-muted mb-1 text-right">שם תצוגה</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={25}
                dir="auto"
                className="w-full text-sm text-charcoal bg-cream border border-border rounded-lg px-3 py-2 outline-none focus:border-accent text-right"
                placeholder="שם שיוצג בוואטסאפ"
              />
              <p className="text-[10px] text-muted mt-1 text-right">{displayName.length}/25</p>
            </div>

            {/* Status / About */}
            <div>
              <label className="block text-xs font-medium text-muted mb-1 text-right">סטטוס / אודות</label>
              <textarea
                value={statusText}
                onChange={(e) => setStatusText(e.target.value)}
                maxLength={139}
                rows={2}
                dir="auto"
                className="w-full text-sm text-charcoal bg-cream border border-border rounded-lg px-3 py-2 outline-none focus:border-accent text-right resize-none"
                placeholder="הקלד סטטוס חדש..."
              />
              <p className="text-[10px] text-muted mt-1 text-right">{statusText.length}/139</p>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving || (!displayName && !statusText.trim())}
              className="w-full py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateProfile.isPending ? 'שומר...' : 'שמור שינויים'}
            </button>

            {/* Error display */}
            {(updateProfile.isError || updatePicture.isError || deletePicture.isError) && (
              <p className="text-red-600 text-xs text-center">
                שגיאה בעדכון הפרופיל. נסה שוב.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
