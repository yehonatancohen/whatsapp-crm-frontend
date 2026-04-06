import { useState } from 'react';
import { useAutoReplies, useCreateAutoReply, useUpdateAutoReply, useToggleAutoReply, useDeleteAutoReply } from '../hooks/useAutoReplies';
import { useAccounts } from '../hooks/useAccounts';
import type { AutoReply, AutoReplyMatchType } from '../types';

const MATCH_TYPE_LABELS: Record<AutoReplyMatchType, string> = {
  EXACT: 'התאמה מדויקת',
  CONTAINS: 'מכיל',
  STARTS_WITH: 'מתחיל ב-',
  REGEX: 'ביטוי רגולרי',
};

export function AutoRepliesPage() {
  const { data: rules = [], isLoading } = useAutoReplies();
  const { accounts } = useAccounts();
  const createMutation = useCreateAutoReply();
  const updateMutation = useUpdateAutoReply();
  const toggleMutation = useToggleAutoReply();
  const deleteMutation = useDeleteAutoReply();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AutoReply | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [matchType, setMatchType] = useState<AutoReplyMatchType>('CONTAINS');
  const [matchValue, setMatchValue] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [onlyPrivate, setOnlyPrivate] = useState(true);
  const [cooldownSec, setCooldownSec] = useState(60);

  const activeAccounts = accounts.filter((a) => a.status === 'AUTHENTICATED');

  const openCreate = () => {
    setEditing(null);
    setName('');
    setMatchType('CONTAINS');
    setMatchValue('');
    setReplyMessage('');
    setSelectedAccountIds([]);
    setOnlyPrivate(true);
    setCooldownSec(60);
    setShowModal(true);
  };

  const openEdit = (rule: AutoReply) => {
    setEditing(rule);
    setName(rule.name);
    setMatchType(rule.matchType);
    setMatchValue(rule.matchValue);
    setReplyMessage(rule.replyMessage);
    setSelectedAccountIds(rule.accountIds);
    setOnlyPrivate(rule.onlyPrivate);
    setCooldownSec(rule.cooldownSec);
    setShowModal(true);
  };

  const handleSave = async () => {
    const data = { name, matchType, matchValue, replyMessage, accountIds: selectedAccountIds, onlyPrivate, cooldownSec };
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...data });
    } else {
      await createMutation.mutateAsync(data);
    }
    setShowModal(false);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-charcoal text-right">תגובות אוטומטיות</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors">
          + כלל חדש
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted text-right">טוען...</p>
      ) : rules.length === 0 ? (
        <div className="text-center py-16 bg-white border border-border rounded-xl">
          <p className="text-muted mb-2">אין כללי תגובה אוטומטית</p>
          <p className="text-xs text-muted">צור כלל ראשון כדי להשיב אוטומטית להודעות נכנסות</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className="bg-white border border-border rounded-xl p-4 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(rule)} className="text-xs text-accent hover:text-accent-hover">עריכה</button>
                  <button onClick={() => { if (confirm('למחוק כלל זה?')) deleteMutation.mutate(rule.id); }} className="text-xs text-red-500 hover:text-red-600">מחיקה</button>
                </div>
                <div className="flex-1 text-right">
                  <div className="flex items-center gap-2 justify-end mb-1">
                    <h3 className="text-sm font-semibold text-charcoal">{rule.name}</h3>
                    <button
                      onClick={() => toggleMutation.mutate(rule.id)}
                      className={`w-9 h-5 rounded-full transition-colors relative ${rule.isActive ? 'bg-accent' : 'bg-border'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${rule.isActive ? 'right-0.5' : 'right-4'}`} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 justify-end text-xs text-muted mb-2">
                    <span className="px-2 py-0.5 rounded-full bg-cream font-medium">{MATCH_TYPE_LABELS[rule.matchType]}</span>
                    <span className="font-mono bg-cream px-2 py-0.5 rounded" dir="auto">"{rule.matchValue}"</span>
                    {rule.onlyPrivate && <span className="text-blue-500">פרטי בלבד</span>}
                  </div>
                  <div className="bg-cream/50 rounded-lg p-2.5 text-sm text-right whitespace-pre-wrap" dir="auto">
                    {rule.replyMessage}
                  </div>
                  <div className="flex items-center gap-3 mt-2 justify-end text-[10px] text-muted">
                    <span>הופעל {rule.triggerCount} פעמים</span>
                    <span>השהיה: {rule.cooldownSec} שניות</span>
                    {rule.accountIds.length > 0 && (
                      <span>{rule.accountIds.length} חשבונות</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl w-full max-w-lg mx-4 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-charcoal mb-4 text-right">{editing ? 'עריכת כלל' : 'כלל חדש'}</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1 text-right">שם הכלל</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm text-right" placeholder='למשל: "תגובה למחיר"' />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1 text-right">סוג התאמה</label>
                  <select value={matchType} onChange={(e) => setMatchType(e.target.value as AutoReplyMatchType)} className="w-full px-3 py-2 border border-border rounded-lg text-sm text-right">
                    {Object.entries(MATCH_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1 text-right">ערך להתאמה</label>
                  <input value={matchValue} onChange={(e) => setMatchValue(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm text-right" placeholder="מחיר" dir="auto" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1 text-right">הודעת תגובה</label>
                <textarea value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} rows={3} className="w-full px-3 py-2 border border-border rounded-lg text-sm text-right" placeholder="שלום! המחירון שלנו..." dir="auto" />
              </div>

              <div className="flex items-center gap-3 justify-end">
                <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
                  <input type="checkbox" checked={onlyPrivate} onChange={(e) => setOnlyPrivate(e.target.checked)} className="rounded border-border" />
                  שיחות פרטיות בלבד
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1 text-right">השהיה בין תגובות (שניות)</label>
                <input type="number" value={cooldownSec} onChange={(e) => setCooldownSec(Number(e.target.value))} min={0} max={86400} className="w-full px-3 py-2 border border-border rounded-lg text-sm text-right" />
              </div>

              {activeAccounts.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-muted mb-1 text-right">חשבונות (ריק = כולם)</label>
                  <div className="flex flex-wrap gap-2 justify-end">
                    {activeAccounts.map((acc) => (
                      <label key={acc.id} className="flex items-center gap-1.5 text-xs text-muted cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedAccountIds.includes(acc.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedAccountIds([...selectedAccountIds, acc.id]);
                            else setSelectedAccountIds(selectedAccountIds.filter((id) => id !== acc.id));
                          }}
                          className="rounded border-border"
                        />
                        {acc.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-5 justify-start">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-border rounded-lg text-sm text-muted hover:bg-cream transition-colors">ביטול</button>
              <button
                onClick={handleSave}
                disabled={!name || !matchValue || !replyMessage || createMutation.isPending || updateMutation.isPending}
                className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                {createMutation.isPending || updateMutation.isPending ? 'שומר...' : 'שמור'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
