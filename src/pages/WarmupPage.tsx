import { useState } from 'react';
import { useWarmupOverview, useToggleWarmup } from '../hooks/useWarmup';
import { useAccounts } from '../hooks/useAccounts';
import type { WarmupStatus, WarmupLevel } from '../types';

const LEVEL_INFO: Record<WarmupLevel, { name: string; desc: string; msgs: string }> = {
  L1: { name: 'התחלה', desc: 'שליחת הודעות בסיסית בקצב נמוך', msgs: 'עד 50/יום' },
  L2: { name: 'בסיסי', desc: 'הגדלת נפח שליחה הדרגתית', msgs: 'עד 100/יום' },
  L3: { name: 'בינוני', desc: 'מוכן לקמפיינים קטנים', msgs: 'עד 200/יום' },
  L4: { name: 'מתקדם', desc: 'נפח שליחה גבוה, סיכון חסימה נמוך', msgs: 'עד 500/יום' },
  L5: { name: 'מומחה', desc: 'מוכן לתפוצה מלאה', msgs: '1,000+/יום' },
};

const LEVELS: WarmupLevel[] = ['L1', 'L2', 'L3', 'L4', 'L5'];

function getLevelIndex(level: WarmupLevel): number {
  return LEVELS.indexOf(level);
}

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

  const currentLevel = currentConfig?.level || 'L1';
  const levelIdx = getLevelIndex(currentLevel);

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
            {activeAccounts.map(acc => {
              const accWarmup = warmupStatuses.find((c: WarmupStatus) => c.accountId === acc.id);
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
                    <div className="w-8 h-8 rounded-full bg-cream flex items-center justify-center text-xs font-bold">
                      {acc.label.charAt(0)}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{acc.label}</p>
                      <p className="text-[10px] opacity-70" dir="ltr">
                        {acc.phoneNumber ? (acc.phoneNumber.startsWith('+') ? acc.phoneNumber : `+${acc.phoneNumber}`) : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {accWarmup?.level && (
                      <span className="text-[10px] font-bold bg-cream px-1.5 py-0.5 rounded border border-border">
                        {accWarmup.level}
                      </span>
                    )}
                    {accWarmup?.isEnabled && (
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
            <div className="bg-white border border-border rounded-2xl p-6 shadow-soft">
              <div className="flex items-center justify-between mb-6">
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

              <div className="space-y-6">
                {/* Current Level Card */}
                <div className="bg-accent-light/40 border border-accent/10 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg font-bold text-accent">רמה {levelIdx + 1} — {LEVEL_INFO[currentLevel].name}</span>
                    <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full font-bold">{LEVEL_INFO[currentLevel].msgs}</span>
                  </div>
                  <p className="text-sm text-charcoal">{LEVEL_INFO[currentLevel].desc}</p>
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
                            isActive ? 'bg-accent text-white' :
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

                <div className="bg-accent-light/30 border border-accent/10 p-4 rounded-xl">
                  <h3 className="text-sm font-bold text-accent mb-2">איך זה עובד?</h3>
                  <p className="text-xs text-charcoal leading-relaxed">
                    מערכת החימום שולחת הודעות אוטומטיות בין החשבונות המחוברים שלך ומשיבה להן.
                    פעילות זו מדמה שימוש טבעי בוואטסאפ ועוזרת למנוע חסימות של מספרים חדשים.
                    עם כל רמה, נפח ההודעות גדל ומאפשר לך לשלוח יותר הודעות ביום בקמפיינים.
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
