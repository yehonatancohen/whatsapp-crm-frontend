import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { AccountResponse } from '../types';

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
        <button
          onClick={() => onRemove(account.id)}
          className="text-muted hover:text-red-500 transition-colors md:opacity-0 group-hover:opacity-100 shrink-0"
          title="הסר חשבון"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>

      {/* QR Code */}
      {account.status === 'QR_READY' && account.qrCode && (
        <div className="flex justify-center">
          <div className="bg-white rounded-lg p-3 inline-block mt-1 border border-border">
            <QRCodeSVG value={account.qrCode} size={180} />
          </div>
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
  );
}
