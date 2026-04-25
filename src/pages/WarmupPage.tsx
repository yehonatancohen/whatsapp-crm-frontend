import { useState } from 'react';
import { useWarmupOverview, useToggleWarmup, useSetWarmupIntensity, useBanRecovery } from '../hooks/useWarmup';
import { useAccounts, useReconnectAccount } from '../hooks/useAccounts';
import type { WarmupStatus, WarmupLevel, WarmupIntensity } from '../types';

const LEVEL_INFO: Record<WarmupLevel, { name: string; desc: string; msgs: string }> = {
  L1: { name: 'התחלה', desc: 'שליחת הודעות בסיסית בקצב נמוך', msgs: 'עד 50/יום' },
  L2: { name: 'בסיסי', desc: 'הגדלת נפח שליחה הדרגתית', msgs: 'עד 100/יום' },
  L3: { name: 'בינוני', desc: 'מוכן לקמפיינים קטנים', msgs: 'עד 200/יום' },
  L4: { name: 'מתקדם', desc: 'נפח שליחה גבוה, סיכון חסימה נמוך', msgs: 'עד 500/יום' },
  L5: { name: 'מומחה', desc: 'מוכן לתפוצה מלאה', msgs: '1,000+/יום' },
};

const INTENSITY_OPTIONS: { value: WarmupIntensity; label: string; desc: string; color: string }[] = [
  {
    value: 'LOW',
    label: 'נמוך',
    desc: 'מחצית ההודעות, מרווחים כפולים — בטוח יותר',
    color: 'bg-blue-50 border-blue-200 text-blue-700',
  },
  {
    value: 'NORMAL',
    label: 'רגיל',
    desc: 'הגדרות ברירת המחדל המאוזנות',
    color: 'bg-accent-light border-accent/20 text-accent',
  },
  {
    value: 'HIGH',
    label: 'גבוה',
    desc: '150% הודעות, מרווחים קצרים יותר — מהיר יותר',
    color: 'bg-orange-50 border-orange-200 text-orange-700',
  },
];

const LEVELS: WarmupLevel[] = ['L1', 'L2', 'L3', 'L4', 'L5'];

function getLevelIndex(level: WarmupLevel): number {
  return LEVELS.indexOf(level);
}

function IntensityBadge({ intensity }: { intensity: WarmupIntensity }) {
  const map: Record<WarmupIntensity, { label: string; className: string }> = {
    GHOST: { label: 'שחזור', className: 'bg-purple-100 text-purple-700 border-purple-200' },
    LOW: { label: 'נמוך', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    NORMAL: { label: 'רגיל', className: 'bg-green-100 text-green-700 border-green-200' },
    HIGH: { label: 'גבוה', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  };
  const { label, className } = map[intensity] ?? map.NORMAL;
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${className}`}>
      {label}
    </span>
  );
}

export function WarmupPage() {
  const { accounts: allAccounts } = useAccounts();
  const { accounts: warmupStatuses, loading: isLoading } = useWarmupOverview();
  const { toggleWarmup } = useToggleWarmup();
  const { setIntensity, isSettingIntensity } = useSetWarmupIntensity();
  const { startBanRecovery, isBanRecovering } = useBanRecovery();
  const { reconnect, isReconnecting } = useReconnectAccount();

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showBanConfirm, setShowBanConfirm] = useState(false);

  // Show all accounts (authenticated + disconnected) so user can reconnect or do ban recovery
  const relevantAccounts = allAccounts.filter(
    a => a.status === 'AUTHENTICATED' || a.status === 'DISCONNECTED',
  );

  const currentConfig = warmupStatuses.find((c: WarmupStatus) => c.accountId === selectedAccountId);
  const selectedAccount = allAccounts.find(a => a.id === selectedAccountId);
  const isDisconnected = selectedAccount?.status === 'DISCONNECTED';

  const currentLevel = currentConfig?.level || 'L1';
  const currentIntensity: WarmupIntensity = currentConfig?.intensity || 'NORMAL';
  const levelIdx = getLevelIndex(currentLevel);

  const handleToggle = async (enabled: boolean) => {
    if (!selectedAccountId) return;
    await toggleWarmup({ accountId: selectedAccountId, enabled });
  };

  const handleIntensity = async (intensity: WarmupIntensity) => {
    if (!selectedAccountId) return;
    await setIntensity({ accountId: selectedAccountId, intensity });
  };

  const handleBanRecovery = async () => {
    if (!selectedAccountId) return;
    await startBanRecovery(selectedAccountId);
    setShowBanConfirm(false);
  };

  const handleReconnect = async () => {
    if (!selectedAccountId) return;
    await reconnect(selectedAccountId);
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
            {relevantAccounts.length === 0 && !isLoading && (
              <p className="text-xs text-muted bg-white border border-border p-4 rounded-xl">אין חשבונות זמינים לחימום.</p>
            )}
            {relevantAccounts.map(acc => {
              const accWarmup = warmupStatuses.find((c: WarmupStatus) => c.accountId === acc.id);
              const disconnected = acc.status === 'DISCONNECTED';
              // Other authenticated accounts whose numbers should be saved in this account's contacts
              const otherAuthAccounts = relevantAccounts.filter(
                a => a.id !== acc.id && a.status === 'AUTHENTICATED' && a.phoneNumber,
              );
              const hasContactWarning = !disconnected && otherAuthAccounts.length > 0;
              return (
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
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${disconnected ? 'bg-red-100 text-red-500' : 'bg-cream'}`}>
                      {acc.label.charAt(0)}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{acc.label}</p>
                      <p className="text-[10px] opacity-70" dir="ltr">
                        {acc.phoneNumber ? (acc.phoneNumber.startsWith('+') ? acc.phoneNumber : `+${acc.phoneNumber}`) : ''}
                      </p>
                      {disconnected && (
                        <p className="text-[10px] text-red-500 font-medium">מנותק</p>
                      )}
                      {hasContactWarning && (
                        <p className="text-[10px] text-amber-600 font-medium flex items-center gap-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5 shrink-0"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                          {otherAuthAccounts.length} מספרים לשמירה
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {accWarmup?.intensity && accWarmup.intensity !== 'NORMAL' && (
                      <IntensityBadge intensity={accWarmup.intensity} />
                    )}
                    {accWarmup?.level && (
                      <span className="text-[10px] font-bold bg-cream px-1.5 py-0.5 rounded border border-border">
                        {accWarmup.level}
                      </span>
                    )}
                    {accWarmup?.isEnabled && !disconnected && (
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Warmup Controls */}
        <div className="lg:col-span-2">
          {selectedAccountId ? (
            <div className="bg-white border border-border rounded-2xl p-6 shadow-soft space-y-6">

              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-charcoal">הגדרות חימום</h2>
                  <p className="text-xs text-muted">
                    מצב: {isDisconnected ? 'מנותק' : currentConfig?.isEnabled ? 'פעיל' : 'כבוי'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isDisconnected ? (
                    <button
                      onClick={handleReconnect}
                      disabled={isReconnecting}
                      className="px-5 py-2 rounded-full text-sm font-bold bg-blue-600 text-[#ffffff] hover:bg-blue-700 disabled:opacity-50 transition-all"
                    >
                      {isReconnecting ? 'מתחבר...' : 'חבר מחדש'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggle(!currentConfig?.isEnabled)}
                      className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                        currentConfig?.isEnabled
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-accent text-[#ffffff] hover:bg-accent-hover'
                      }`}
                    >
                      {currentConfig?.isEnabled ? 'עצור חימום' : 'הפעל חימום'}
                    </button>
                  )}
                </div>
              </div>

              {/* Ban Recovery Banner */}
              {!showBanConfirm ? (
                <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-red-700">החשבון שלי נחסם</p>
                    <p className="text-xs text-red-500 mt-0.5">התחל שחזור איטי מאוד ברמה 1 — בטוח לחשבונות שחזרו לאחר חסימה</p>
                  </div>
                  <button
                    onClick={() => setShowBanConfirm(true)}
                    className="shrink-0 mr-3 px-4 py-2 rounded-full text-xs font-bold bg-red-600 text-[#ffffff] hover:bg-red-700 transition-all"
                  >
                    התחל שחזור
                  </button>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-300 rounded-xl px-4 py-4 space-y-3">
                  <p className="text-sm font-bold text-red-700">האם אתה בטוח?</p>
                  <p className="text-xs text-red-600">
                    פעולה זו תאפס את התקדמות החימום לרמה 1 ותגדיר עוצמה נמוכה מאוד (GHOST).
                    החשבון יחמם לאט מאוד כדי למנוע חסימה נוספת.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleBanRecovery}
                      disabled={isBanRecovering}
                      className="px-4 py-2 rounded-full text-xs font-bold bg-red-600 text-[#ffffff] hover:bg-red-700 disabled:opacity-50 transition-all"
                    >
                      {isBanRecovering ? 'מעבד...' : 'כן, אפס והתחל שחזור'}
                    </button>
                    <button
                      onClick={() => setShowBanConfirm(false)}
                      className="px-4 py-2 rounded-full text-xs font-bold bg-white border border-border text-charcoal hover:bg-cream transition-all"
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              )}

              {/* Current Level Card */}
              <div className="bg-accent-light/40 border border-accent/10 rounded-xl p-5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg font-bold text-accent">רמה {levelIdx + 1} — {LEVEL_INFO[currentLevel].name}</span>
                  <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full font-bold">{LEVEL_INFO[currentLevel].msgs}</span>
                </div>
                <p className="text-sm text-charcoal">{LEVEL_INFO[currentLevel].desc}</p>
              </div>

              {/* Intensity Selector */}
              <div>
                <p className="text-sm font-semibold text-charcoal mb-3">עוצמת חימום</p>
                {currentIntensity === 'GHOST' && (
                  <div className="mb-3 flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
                    <span className="text-purple-700 text-sm font-bold">מצב שחזור לאחר חסימה פעיל</span>
                    <span className="text-xs text-purple-500">עוצמה נמוכה מאוד אוטומטית</span>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2">
                  {INTENSITY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleIntensity(opt.value)}
                      disabled={isSettingIntensity}
                      className={`p-3 rounded-xl border text-right transition-all ${
                        currentIntensity === opt.value
                          ? opt.color + ' ring-2 ring-offset-1 ring-current'
                          : 'bg-white border-border text-charcoal hover:border-accent/30'
                      } disabled:opacity-50`}
                    >
                      <p className="text-sm font-bold">{opt.label}</p>
                      <p className="text-[10px] mt-0.5 opacity-70 leading-tight">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Level Steps */}
              <div>
                <p className="text-sm font-semibold text-charcoal mb-3">התקדמות</p>
                <div className="flex items-center gap-1" dir="ltr">
                  {LEVELS.map((level, i) => {
                    const isCurrent = level === currentLevel;
                    const isPast = i < levelIdx;
                    const info = LEVEL_INFO[level];
                    return (
                      <div key={level} className="flex-1 group relative">
                        <div className={`h-2 rounded-full transition-all ${
                          isCurrent ? 'bg-accent' :
                          isPast ? 'bg-accent/40' :
                          'bg-border'
                        }`} />
                        <div className="flex justify-center mt-1.5">
                          <span className={`text-[10px] font-bold ${isCurrent ? 'text-accent' : isPast ? 'text-muted' : 'text-faded'}`}>
                            {info.name}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted mt-2">
                  {currentConfig?.daysAtLevel || 0} ימים ברמה הנוכחית (נדרשים {currentConfig?.minDaysForLevelUp || 0} ימים לעלייה)
                  {' · '}
                  התקדמות לרמה הבאה: {currentConfig?.progress || 0}%
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-cream/50 rounded-xl border border-border">
                  <p className="text-[10px] text-muted uppercase font-bold mb-1">הודעות היום</p>
                  <p className="text-xl font-bold text-charcoal">{currentConfig?.messagesSentToday || 0} / {currentConfig?.maxMessagesPerDay || 50}</p>
                </div>
                <div className="p-4 bg-cream/50 rounded-xl border border-border">
                  <p className="text-[10px] text-muted uppercase font-bold mb-1">סה"כ הודעות</p>
                  <p className="text-xl font-bold text-charcoal">{currentConfig?.totalMessages || 0}</p>
                </div>
                <div className="p-4 bg-cream/50 rounded-xl border border-border">
                  <p className="text-[10px] text-muted uppercase font-bold mb-1">נדרש לעלייה</p>
                  <p className="text-xl font-bold text-charcoal">{currentConfig?.minMessagesForLevelUp || 0} הודעות</p>
                </div>
              </div>

              {/* Level Breakdown */}
              <div>
                <h3 className="text-sm font-semibold text-charcoal mb-3">פירוט רמות</h3>
                <div className="space-y-2">
                  {LEVELS.map((level, i) => {
                    const info = LEVEL_INFO[level];
                    const isActive = level === currentLevel;
                    const isPast = i < levelIdx;
                    return (
                      <div key={level} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        isActive ? 'bg-accent-light border-accent/20' :
                        isPast ? 'bg-cream/30 border-border' :
                        'border-border opacity-50'
                      }`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          isActive ? 'bg-accent text-[#ffffff]' :
                          isPast ? 'bg-green-100 text-green-600' :
                          'bg-cream text-faded'
                        }`}>
                          {isPast ? '✓' : i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isActive ? 'text-accent' : 'text-charcoal'}`}>רמה {i + 1} — {info.name}</p>
                          <p className="text-[10px] text-muted">{info.desc}</p>
                        </div>
                        <span className="text-[10px] text-muted shrink-0">{info.msgs}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Contact Check */}
              {(() => {
                const otherAccounts = relevantAccounts.filter(
                  a => a.id !== selectedAccountId && a.status === 'AUTHENTICATED' && a.phoneNumber,
                );
                if (otherAccounts.length === 0) return null;
                return (
                  <div className="border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-700/30 rounded-xl p-4">
                    <div className="flex items-start gap-2 mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      <div>
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">בדוק שמירת אנשי קשר</p>
                        <p className="text-xs text-amber-700 dark:text-amber-500 mt-0.5 leading-relaxed">
                          החימום עובד טוב יותר כשהמספרים הבאים שמורים באנשי הקשר של חשבון זה. מספר שאינו שמור יופיע כ"מספר לא ידוע" בוואטסאפ ועלול לפגוע באיכות החימום.
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {otherAccounts.map(acc => {
                        const phone = acc.phoneNumber!.startsWith('+') ? acc.phoneNumber! : `+${acc.phoneNumber}`;
                        return (
                          <div key={acc.id} className="flex items-center justify-between bg-white dark:bg-cream-dark border border-amber-100 dark:border-amber-700/20 rounded-lg px-3 py-2">
                            <div>
                              <p className="text-xs font-medium text-charcoal">{acc.label}</p>
                              <p className="text-[11px] text-muted" dir="ltr">{phone}</p>
                            </div>
                            <button
                              onClick={() => navigator.clipboard.writeText(phone)}
                              className="text-[10px] text-accent hover:text-accent-hover font-medium flex items-center gap-1 shrink-0"
                              title="העתק מספר"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                              העתק
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              <div className="bg-accent-light/30 border border-accent/10 p-4 rounded-xl">
                <h3 className="text-sm font-bold text-accent mb-2">איך זה עובד?</h3>
                <p className="text-xs text-charcoal leading-relaxed">
                  מערכת החימום שולחת הודעות אוטומטיות בין החשבונות המחוברים שלך ומשיבה להן.
                  פעילות זו מדמה שימוש טבעי בוואטסאפ ועוזרת למנוע חסימות של מספרים חדשים.
                  עם כל רמה, נפח ההודעות גדל ומאפשר לך לשלוח יותר הודעות ביום בקמפיינים.
                </p>
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
