import { useState } from 'react';
import { useScheduledMessages, useCancelScheduledMessage, useDeleteScheduledMessage } from '../hooks/useScheduledMessages';

const STATUS_LABELS: Record<string, { label: string; style: string }> = {
  PENDING: { label: 'ממתין', style: 'bg-blue-50 text-blue-600' },
  SENT: { label: 'נשלח', style: 'bg-emerald-50 text-emerald-600' },
  FAILED: { label: 'נכשל', style: 'bg-red-50 text-red-600' },
  CANCELLED: { label: 'בוטל', style: 'bg-gray-100 text-gray-600' },
};

export function ScheduledMessagesPage() {
  const { data: messages = [], isLoading } = useScheduledMessages();
  const cancelMutation = useCancelScheduledMessage();
  const deleteMutation = useDeleteScheduledMessage();
  const [filter, setFilter] = useState<string>('ALL');

  const filtered = filter === 'ALL' ? messages : messages.filter((m) => m.status === filter);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-charcoal text-right">הודעות מתוזמנות</h1>
      </div>

      <p className="text-xs text-muted text-right mb-4">
        ניתן לתזמן הודעות מתוך עמוד הצ'אט. כאן תוכל לצפות בהודעות שתוזמנו ולבטל אותן.
      </p>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { key: 'ALL', label: 'הכל' },
          { key: 'PENDING', label: 'ממתינות' },
          { key: 'SENT', label: 'נשלחו' },
          { key: 'FAILED', label: 'נכשלו' },
          { key: 'CANCELLED', label: 'בוטלו' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === tab.key ? 'bg-accent text-white' : 'bg-cream text-muted hover:bg-cream-dark'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted text-right">טוען...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-border rounded-xl">
          <p className="text-muted mb-2">אין הודעות מתוזמנות</p>
          <p className="text-xs text-muted">עבור לעמוד הצ'אט כדי לתזמן הודעה</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((msg) => {
            const statusInfo = STATUS_LABELS[msg.status] || STATUS_LABELS.PENDING;
            return (
              <div key={msg.id} className="bg-white border border-border rounded-xl p-4 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {msg.status === 'PENDING' && (
                      <button
                        onClick={() => cancelMutation.mutate(msg.id)}
                        className="text-xs text-red-500 hover:text-red-600"
                        disabled={cancelMutation.isPending}
                      >
                        ביטול
                      </button>
                    )}
                    {msg.status !== 'PENDING' && (
                      <button
                        onClick={() => deleteMutation.mutate(msg.id)}
                        className="text-xs text-red-500 hover:text-red-600"
                        disabled={deleteMutation.isPending}
                      >
                        מחיקה
                      </button>
                    )}
                  </div>
                  <div className="flex-1 text-right">
                    <div className="flex items-center gap-2 justify-end mb-1">
                      <span className="text-sm font-medium text-charcoal">{msg.chatName || msg.chatId}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusInfo.style}`}>{statusInfo.label}</span>
                    </div>
                    <p className="text-xs text-muted mb-1">חשבון: {msg.account.label}</p>
                    <div className="bg-cream/50 rounded-lg p-2.5 text-sm text-right whitespace-pre-wrap mb-2" dir="auto">
                      {msg.body}
                    </div>
                    <div className="flex items-center gap-3 justify-end text-[10px] text-muted">
                      <span>מתוזמן ל: {new Date(msg.scheduledAt).toLocaleString('he-IL')}</span>
                      {msg.sentAt && <span>נשלח: {new Date(msg.sentAt).toLocaleString('he-IL')}</span>}
                      {msg.errorMessage && <span className="text-red-500">{msg.errorMessage}</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
