import { useState } from 'react';
import { useWarmupOverview, useToggleWarmup } from '../hooks/useWarmup';
import { useAccounts } from '../hooks/useAccounts';
import type { WarmupStatus } from '../types';

export function WarmupPage() {
  const { accounts: allAccounts } = useAccounts();
  const { accounts: warmupStatuses, loading: isLoading } = useWarmupOverview();
  const { toggleWarmup } = useToggleWarmup();

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const activeAccounts = allAccounts.filter(a => a.status === 'AUTHENTICATED');
  
  const currentConfig = warmupStatuses.find((c: WarmupStatus) => c.accountId === selectedAccountId);
  
  const handleToggle = async (enabled: boolean) => {
    if (!selectedAccountId) return;
    await toggleWarmup({
      accountId: selectedAccountId,
      enabled,
    });
  };

  return (
    <div className="text-right">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-charcoal">חימום מספרים</h1>
        <p className="text-sm text-muted mt-1">שפר את המוניטין של החשבון שלך ומנע חסימות באמצעות חימום הדרגתי</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Account Selector */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-sm font-semibold text-charcoal pr-1">בחר חשבון</h2>
          <div className="space-y-2">
            {activeAccounts.length === 0 && !isLoading && (
              <p className="text-xs text-muted bg-white border border-border p-4 rounded-xl">אין חשבונות מחוברים זמינים לחימום.</p>
            )}
            {activeAccounts.map(acc => (
              <button
                key={acc.id}
                onClick={() => setSelectedAccountId(acc.id)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  selectedAccountId === acc.id 
                    ? 'bg-accent-light border-accent text-accent shadow-sm' 
                    : 'bg-white border-border text-charcoal hover:border-accent/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-cream flex items-center justify-center text-xs font-bold">
                    {acc.label.charAt(0)}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{acc.label}</p>
                    <p className="text-[10px] opacity-70" dir="ltr">+{acc.phoneNumber}</p>
                  </div>
                </div>
                {warmupStatuses.find((c: WarmupStatus) => c.accountId === acc.id)?.isEnabled && (
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Warmup Controls */}
        <div className="lg:col-span-2">
          {selectedAccountId ? (
            <div className="bg-white border border-border rounded-2xl p-6 shadow-soft">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-lg font-bold text-charcoal">הגדרות חימום</h2>
                  <p className="text-xs text-muted">מצב: {currentConfig?.isEnabled ? 'פעיל' : 'כבוי'}</p>
                </div>
                <button
                  onClick={() => handleToggle(!currentConfig?.isEnabled)}
                  className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                    currentConfig?.isEnabled 
                      ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                      : 'bg-accent text-white hover:bg-accent-hover'
                  }`}
                >
                  {currentConfig?.isEnabled ? 'עצור חימום' : 'הפעל חימום'}
                </button>
              </div>

              <div className="space-y-8">
                <div>
                  <div className="flex justify-between mb-4">
                    <label className="text-sm font-semibold text-charcoal">רמת חימום נוכחית</label>
                    <span className="text-sm font-bold text-accent">{currentConfig?.level || 'L1'}</span>
                  </div>
                  <div className="relative h-4 bg-cream rounded-full overflow-hidden border border-border">
                    <div 
                      className="absolute inset-y-0 right-0 bg-accent transition-all duration-1000"
                      style={{ width: `${currentConfig?.progress || 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-faded">
                    <span>מתחיל</span>
                    <span>מתקדם</span>
                    <span>מומחה</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-cream/50 rounded-xl border border-border">
                    <p className="text-[10px] text-muted uppercase font-bold mb-1">הודעות היום</p>
                    <p className="text-xl font-bold text-charcoal">{currentConfig?.messagesSentToday || 0} / {currentConfig?.maxMessagesPerDay || 50}</p>
                  </div>
                  <div className="p-4 bg-cream/50 rounded-xl border border-border">
                    <p className="text-[10px] text-muted uppercase font-bold mb-1">סה"כ הודעות חימום</p>
                    <p className="text-xl font-bold text-charcoal">{currentConfig?.totalMessages || 0}</p>
                  </div>
                </div>

                <div className="bg-accent-light/30 border border-accent/10 p-4 rounded-xl">
                  <h3 className="text-sm font-bold text-accent mb-2">איך זה עובד?</h3>
                  <p className="text-xs text-charcoal leading-relaxed">
                    מערכת החימום שולחת הודעות אוטומטיות בין החשבונות המחוברים שלך ומשיבה להן.
                    פעילות זו מדמה שימוש טבעי בוואטסאפ ועוזרת למנוע חסימות של מספרים חדשים או כאלו שלא היו בשימוש זמן רב.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-white border border-border border-dashed rounded-2xl p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-cream flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-muted">
                  <path d="M12 2v10l4.5 4.5" /><circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <h3 className="text-charcoal font-medium">לא נבחר חשבון</h3>
              <p className="text-sm text-muted mt-1">בחר חשבון מהרשימה בצד כדי לנהל את הגדרות החימום שלו.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
