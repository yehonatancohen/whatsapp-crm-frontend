import { useState } from 'react';
import { useWarmupOverview, useToggleWarmup } from '../hooks/useWarmup';
import type { WarmupLevel, WarmupStatus } from '../types';

const levelConfig: Record<WarmupLevel, { color: string; bg: string; border: string; label: string }> = {
  L1: { color: 'text-slate-300', bg: 'bg-slate-600', border: 'border-slate-500', label: 'Starter' },
  L2: { color: 'text-blue-400', bg: 'bg-blue-500', border: 'border-blue-400', label: 'Warming' },
  L3: { color: 'text-amber-400', bg: 'bg-amber-500', border: 'border-amber-400', label: 'Active' },
  L4: { color: 'text-purple-400', bg: 'bg-purple-500', border: 'border-purple-400', label: 'Trusted' },
  L5: { color: 'text-emerald-400', bg: 'bg-emerald-500', border: 'border-emerald-400', label: 'Fully Warmed' },
};

const levelProgression = [
  { level: 'L1', name: 'Starter', messages: '5-10/day', activities: 'Self-to-self messaging', days: '3 days' },
  { level: 'L2', name: 'Warming', messages: '10-25/day', activities: '+ Peer messaging', days: '5 days' },
  { level: 'L3', name: 'Active', messages: '25-50/day', activities: '+ Profile updates, status posts', days: '7 days' },
  { level: 'L4', name: 'Trusted', messages: '50-80/day', activities: '+ Group interactions', days: '10 days' },
  { level: 'L5', name: 'Fully Warmed', messages: '80-120/day', activities: 'All activities unlocked', days: 'Final level' },
];

export function WarmupPage() {
  const { accounts, totalEnabled, totalMessages24h, loading, error } = useWarmupOverview();
  const { toggleWarmup, isToggling } = useToggleWarmup();
  const [infoOpen, setInfoOpen] = useState(false);

  if (loading) {
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
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-100">Warmup Engine</h1>
        <p className="text-sm text-slate-500 mt-1">
          {totalEnabled} account{totalEnabled !== 1 ? 's' : ''} enabled
          {' \u00B7 '}
          {totalMessages24h} message{totalMessages24h !== 1 ? 's' : ''} sent today
        </p>
      </div>

      {/* Empty state */}
      {accounts.length === 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-slate-500">
              <path d="M12 2v10l4.5 4.5" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>
          <h3 className="text-slate-300 font-medium mb-1">No authenticated accounts</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Add and authenticate WhatsApp accounts first, then come back to enable warmup.
          </p>
        </div>
      )}

      {/* Account warmup cards grid */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {accounts.map((account) => (
            <WarmupCard
              key={account.accountId}
              account={account}
              onToggle={toggleWarmup}
              isToggling={isToggling}
            />
          ))}
        </div>
      )}

      {/* Level progression info panel */}
      <div className="mt-2">
        <button
          onClick={() => setInfoOpen(!infoOpen)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`w-4 h-4 transition-transform ${infoOpen ? 'rotate-90' : ''}`}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          Level progression guide
        </button>

        {infoOpen && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mt-3">
            {/* Timeline */}
            <div className="flex items-start gap-0 overflow-x-auto pb-2">
              {levelProgression.map((step, i) => {
                const config = levelConfig[step.level as WarmupLevel];
                return (
                  <div key={step.level} className="flex items-start min-w-[180px] flex-1">
                    <div className="flex flex-col items-center">
                      {/* Circle */}
                      <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                        {step.level}
                      </div>
                    </div>
                    <div className="ml-3 pr-4">
                      <p className={`text-sm font-medium ${config.color}`}>{step.name}</p>
                      <p className="text-xs text-slate-400 mt-1">{step.messages}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{step.activities}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{step.days}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function WarmupCard({
  account,
  onToggle,
  isToggling,
}: {
  account: WarmupStatus;
  onToggle: (params: { accountId: string; enabled: boolean }) => Promise<unknown>;
  isToggling: boolean;
}) {
  const config = levelConfig[account.level] || levelConfig.L1;
  const messagesPercent = account.maxMessagesPerDay > 0
    ? Math.min(100, Math.round((account.messagesSentToday / account.maxMessagesPerDay) * 100))
    : 0;

  const handleToggle = () => {
    onToggle({ accountId: account.accountId, enabled: !account.isEnabled });
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600/50 transition-colors">
      {/* Top row: label + toggle */}
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <h3 className="text-slate-100 font-medium text-sm truncate">{account.label}</h3>
          {account.warmupStartedAt && (
            <p className="text-slate-500 text-xs mt-0.5">
              Warming since {new Date(account.warmupStartedAt).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Toggle switch */}
        <button
          onClick={handleToggle}
          disabled={isToggling}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
            account.isEnabled ? 'bg-emerald-500' : 'bg-slate-600'
          }`}
          role="switch"
          aria-checked={account.isEnabled}
          title={account.isEnabled ? 'Disable warmup' : 'Enable warmup'}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform ring-0 transition-transform duration-200 ease-in-out mt-0.5 ${
              account.isEnabled ? 'translate-x-4 ml-0.5' : 'translate-x-0 ml-0.5'
            }`}
          />
        </button>
      </div>

      {/* Level badge */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${config.color} ${config.border} bg-transparent`}>
          {account.level}
        </span>
        <span className="text-xs text-slate-400">{config.label}</span>
      </div>

      {/* Overall progress toward next level */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-400">Level progress</span>
          <span className="text-xs text-slate-500">{account.progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${account.progress}%` }}
          />
        </div>
      </div>

      {/* Messages today */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-400">Messages today</span>
          <span className="text-xs text-slate-300">
            {account.messagesSentToday} / {account.maxMessagesPerDay}
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500/70 rounded-full transition-all duration-500"
            style={{ width: `${messagesPercent}%` }}
          />
        </div>
      </div>

      {/* Days at level */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">Days at level</span>
        <span className="text-xs text-slate-300">
          {account.daysAtLevel} / {account.minDaysForLevelUp} days
        </span>
      </div>

      {/* Disabled overlay hint */}
      {!account.isEnabled && (
        <div className="mt-3 text-xs text-slate-600 flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
          Warmup paused
        </div>
      )}
    </div>
  );
}
