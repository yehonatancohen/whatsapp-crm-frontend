import { QRCodeSVG } from 'qrcode.react';
import type { AccountResponse } from '../types';

const statusConfig: Record<string, { color: string; dot: string; label: string }> = {
  INITIALIZING: { color: 'text-amber-600', dot: 'bg-amber-500', label: 'Initializing' },
  QR_READY: { color: 'text-blue-600', dot: 'bg-blue-500', label: 'QR Ready' },
  AUTHENTICATED: { color: 'text-accent', dot: 'bg-accent', label: 'Connected' },
  DISCONNECTED: { color: 'text-red-500', dot: 'bg-red-500', label: 'Disconnected' },
};

interface Props {
  account: AccountResponse;
  onRemove: (id: string) => Promise<void>;
}

export function AccountCard({ account, onRemove }: Props) {
  const status = statusConfig[account.status] ?? {
    color: 'text-muted',
    dot: 'bg-muted',
    label: account.status,
  };

  return (
    <div className="bg-white border border-charcoal rounded-xl p-5 hover:border-charcoal shadow-soft">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-charcoal font-medium text-sm">{account.label}</h3>
          {account.phoneNumber && (
            <p className="text-muted text-xs mt-0.5">+{account.phoneNumber}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`w-2 h-2 rounded-full ${status.dot} animate-pulse`} />
            <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
            {account.warmupLevel && (
              <span className="text-xs text-muted bg-cream border border-border px-1.5 py-0.5 rounded">
                {account.warmupLevel}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => onRemove(account.id)}
          className="text-muted hover:text-red-500 transition-colors md:opacity-0 md:group-hover:opacity-100"
          title="Remove account"
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
        <div className="bg-white rounded-lg p-3 inline-block mt-1 border border-border">
          <QRCodeSVG value={account.qrCode} size={180} />
        </div>
      )}

      {/* Initializing spinner */}
      {account.status === 'INITIALIZING' && (
        <div className="flex items-center gap-2 mt-2 text-muted text-xs">
          <svg className="animate-spin w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Connecting...
        </div>
      )}

      {/* Error */}
      {account.error && (
        <p className="text-red-600 text-xs mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {account.error}
        </p>
      )}
    </div>
  );
}
