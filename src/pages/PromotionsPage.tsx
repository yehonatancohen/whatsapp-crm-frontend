import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAccounts } from '../hooks/useAccounts';
import {
  usePromotions,
  useCreatePromotion,
  useDeletePromotion,
  useTogglePromotion,
  usePromotion,
  usePromotionLogs,
} from '../hooks/usePromotions';
import { useGroupCollections, useGroupCollectionDetail } from '../hooks/useGroupCollections';
import { api } from '../lib/api';
import type { WhatsAppGroup, GroupPromotion, GroupPromotionLog } from '../types';

const DAY_LABELS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

const URL_REGEX = /https?:\/\/[^\s<>"']+/i;

function extractFirstUrl(text: string): string | null {
  const match = text.match(URL_REGEX);
  return match ? match[0] : null;
}

function useLinkPreview(url: string | null) {
  return useQuery({
    queryKey: ['link-preview', url],
    queryFn: async () => {
      const { data } = await api.get('/utils/link-preview', { params: { url } });
      return data as { title: string | null; description: string | null; image: string | null; siteName: string | null; url: string };
    },
    enabled: !!url,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    retry: false,
  });
}

// ─── WhatsApp Message Preview ────────────────────────────────────

function WhatsAppPreview({ text }: { text: string }) {
  const resolved = useMemo(() => resolveSpintaxPreview(text), [text]);
  const formatted = useMemo(() => formatWhatsApp(resolved), [resolved]);
  const url = useMemo(() => extractFirstUrl(resolved), [resolved]);
  const { data: ogData } = useLinkPreview(url);

  const domain = url ? new URL(url).hostname.replace(/^www\./, '') : '';

  return (
    <div className="flex justify-end mt-2">
      <div
        className="max-w-[85%] rounded-lg overflow-hidden bg-[#dcf8c6] dark:bg-[#005c4b] text-gray-900 dark:text-gray-100 shadow-sm"
        dir="auto"
      >
        {/* OG Link Preview Card */}
        {ogData && (ogData.image || ogData.title) && (
          <div className="bg-[#d1f4c0] dark:bg-[#004a3d] border-b border-black/5">
            {ogData.image && (
              <img
                src={ogData.image}
                alt={ogData.title || ''}
                className="w-full max-h-40 object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <div className="px-3 py-2">
              {ogData.title && (
                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">{ogData.title}</p>
              )}
              {ogData.description && (
                <p className="text-[10px] text-gray-600 dark:text-gray-400 line-clamp-2 mt-0.5">{ogData.description}</p>
              )}
              <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-0.5">{domain}</p>
            </div>
          </div>
        )}

        {/* Message text */}
        <div className="px-3 py-2 text-sm">
          <span dangerouslySetInnerHTML={{ __html: formatted }} />
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-[10px] text-gray-500 dark:text-gray-400">12:00</span>
            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function resolveSpintaxPreview(text: string): string {
  return text.replace(/\{([^{}]+)\}/g, (_match, group: string) => {
    const options = group.split('|');
    return options[Math.floor(Math.random() * options.length)];
  });
}

function formatWhatsApp(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold: *text*
  html = html.replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>');
  // Italic: _text_
  html = html.replace(/_([^_\n]+)_/g, '<em>$1</em>');
  // Strikethrough: ~text~
  html = html.replace(/~([^~\n]+)~/g, '<del>$1</del>');
  // URLs
  html = html.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<span class="underline text-blue-600 dark:text-blue-400">$1</span>',
  );
  // Newlines
  html = html.replace(/\n/g, '<br/>');

  return html;
}

// ─── Main Page ───────────────────────────────────────────────────

export function PromotionsPage() {
  const { accounts } = useAccounts();
  const { data: promotions = [], isLoading } = usePromotions();
  const createMutation = useCreatePromotion();
  const deleteMutation = useDeletePromotion();
  const toggleMutation = useTogglePromotion();

  const [modalOpen, setModalOpen] = useState(false);
  const [logsId, setLogsId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  // ─── Create/Edit Form State ──────────────────────────────────

  const [name, setName] = useState('');
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [selectedGroupJids, setSelectedGroupJids] = useState<string[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  const [sendTimes, setSendTimes] = useState<string[]>(['09:00']);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [messagePool, setMessagePool] = useState<Array<{ content: string }>>([{ content: '' }]);
  const [dailyLimit, setDailyLimit] = useState(50);
  const [messagesPerMinute, setMessagesPerMinute] = useState(2);

  const { collections: groupCollections } = useGroupCollections();
  const { collection: selectedCollection } = useGroupCollectionDetail(selectedCollectionId || null);

  const [accountGroups, setAccountGroups] = useState<Record<string, WhatsAppGroup[]>>({});
  const [groupsLoading, setGroupsLoading] = useState(false);

  const activeAccounts = accounts.filter(a => a.status === 'AUTHENTICATED');

  // Fetch groups for selected accounts
  useEffect(() => {
    const fetchNewAccountGroups = async () => {
      const missing = selectedAccountIds.filter(id => !accountGroups[id]);
      if (missing.length === 0) return;
      setGroupsLoading(true);
      try {
        const results = await Promise.all(
          missing.map(id => api.get(`/accounts/${id}/groups`).then(r => ({ id, groups: r.data }))),
        );
        const updated = { ...accountGroups };
        results.forEach(r => { updated[r.id] = r.groups; });
        setAccountGroups(updated);
      } catch { /* silent */ } finally {
        setGroupsLoading(false);
      }
    };
    if (selectedAccountIds.length > 0) fetchNewAccountGroups();
  }, [selectedAccountIds]);

  // Load groups from selected collection
  useEffect(() => {
    if (selectedCollection?.entries) {
      setSelectedGroupJids(selectedCollection.entries.map(e => e.groupJid));
    }
  }, [selectedCollection]);

  // Aggregate unique groups
  const allGroups = useMemo(() => {
    const map = new Map<string, WhatsAppGroup>();
    selectedAccountIds.forEach(accId => {
      (accountGroups[accId] || []).forEach(g => {
        if (!map.has(g.id)) map.set(g.id, g);
      });
    });
    return Array.from(map.values());
  }, [selectedAccountIds, accountGroups]);

  const resetForm = () => {
    setName('');
    setSelectedAccountIds([]);
    setSelectedGroupJids([]);
    setSelectedCollectionId('');
    setSendTimes(['09:00']);
    setDaysOfWeek([]);
    setMessagePool([{ content: '' }]);
    setDailyLimit(50);
    setMessagesPerMinute(2);
    setEditId(null);
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (p: GroupPromotion) => {
    setEditId(p.id);
    setName(p.name);
    setSelectedAccountIds(p.accountIds);
    setSelectedGroupJids(p.groups.map(g => g.groupJid));
    setSendTimes(p.sendTimes.length ? p.sendTimes : ['09:00']);
    setDaysOfWeek(p.daysOfWeek);
    setMessagePool(p.messages.length ? p.messages.map(m => ({ content: m.content })) : [{ content: '' }]);
    setDailyLimit(p.dailyLimitPerAccount);
    setMessagesPerMinute(p.messagesPerMinute);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAccountIds.length === 0 || selectedGroupJids.length === 0) return;
    const validMessages = messagePool.filter(m => m.content.trim());
    if (validMessages.length === 0) return;

    const groupData = selectedGroupJids.map(jid => {
      const g = allGroups.find(g => g.id === jid);
      return { jid, name: g?.name };
    });

    await createMutation.mutateAsync({
      name,
      sendTimes,
      daysOfWeek: daysOfWeek.length > 0 ? daysOfWeek : undefined,
      accountIds: selectedAccountIds,
      dailyLimitPerAccount: dailyLimit,
      messagesPerMinute,
      groups: groupData,
      messages: validMessages,
    });

    setModalOpen(false);
    resetForm();
  };

  const formatSchedule = (p: GroupPromotion) => {
    const times = p.sendTimes.join(', ');
    if (p.daysOfWeek.length === 0 || p.daysOfWeek.length === 7) return `כל יום: ${times}`;
    const days = p.daysOfWeek.map(d => DAY_LABELS[d]).join('');
    return `${days}: ${times}`;
  };

  return (
    <div className="text-right">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">קידום קבוצות</h1>
          <p className="text-sm text-muted mt-1">שליחת הודעות חוזרות לקבוצות — תזמון אוטומטי עם מאגר הודעות</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors self-start sm:self-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          קידום חדש
        </button>
      </div>

      {/* Promotions Table */}
      <div className="bg-white border border-border rounded-xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-cream-dark/50 border-b border-border">
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-muted uppercase tracking-wider">שם</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-muted uppercase tracking-wider">סטטוס</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-muted uppercase tracking-wider hidden sm:table-cell">תזמון</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-muted uppercase tracking-wider hidden md:table-cell">קבוצות</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-muted uppercase tracking-wider hidden md:table-cell">הודעות</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-muted uppercase tracking-wider hidden lg:table-cell">סה"כ שליחות</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-muted uppercase tracking-wider">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-muted">טוען...</td></tr>
              ) : promotions.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-muted">לא נמצאו קידומים</td></tr>
              ) : promotions.map(p => (
                <tr key={p.id} className="hover:bg-cream/30 transition-colors">
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <div className="text-sm font-medium text-charcoal">{p.name}</div>
                    <div className="sm:hidden text-[10px] text-muted mt-0.5" dir="ltr">{formatSchedule(p)}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleMutation.mutate(p.id)}
                      disabled={toggleMutation.isPending}
                      dir="ltr"
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${p.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${p.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs text-muted hidden sm:table-cell" dir="ltr">
                    {formatSchedule(p)}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-muted hidden md:table-cell">{p.groups?.length || 0}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-muted hidden md:table-cell">{p.messages?.length || 0}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-muted hidden lg:table-cell">{p.totalSendCount}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(p)} className="text-accent hover:text-accent-hover text-xs font-medium">
                        ערוך
                      </button>
                      <button onClick={() => setLogsId(p.id)} className="text-blue-600 hover:text-blue-700 text-xs font-medium">
                        לוגים
                      </button>
                      <button
                        onClick={() => { if (confirm('למחוק קידום זה?')) deleteMutation.mutate(p.id); }}
                        className="text-red-500 hover:text-red-600 p-1"
                        title="מחק"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-border rounded-2xl w-full max-w-3xl p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto text-right">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-charcoal">{editId ? 'עריכת קידום' : 'קידום חדש'}</h2>
              <button onClick={() => { setModalOpen(false); resetForm(); }} className="text-muted hover:text-charcoal transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-muted mb-1.5">שם הקידום</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full bg-cream border border-border text-charcoal rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors text-right"
                  placeholder="קידום יומי - קבוצות שיווק"
                />
              </div>

              {/* Accounts */}
              <div>
                <label className="block text-sm font-medium text-muted mb-2">חשבונות שולחים</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-cream border border-border rounded-lg">
                  {activeAccounts.length === 0 ? (
                    <p className="text-xs text-muted p-2 col-span-full text-center">אין חשבונות מחוברים</p>
                  ) : activeAccounts.map(a => (
                    <label key={a.id} className="flex items-center gap-2 p-2 hover:bg-white rounded transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedAccountIds.includes(a.id)}
                        onChange={() => setSelectedAccountIds(prev => prev.includes(a.id) ? prev.filter(i => i !== a.id) : [...prev, a.id])}
                        className="accent-accent"
                      />
                      <span className="text-sm text-charcoal">{a.label}</span>
                      <span className="text-[10px] text-muted" dir="ltr">{a.phoneNumber ? `+${a.phoneNumber}` : ''}</span>
                    </label>
                  ))}
                </div>
                {selectedAccountIds.length > 0 && (
                  <p className="text-[10px] text-accent mt-1">{selectedAccountIds.length} חשבונות נבחרו</p>
                )}
              </div>

              {/* Groups */}
              <div>
                <label className="block text-sm font-medium text-muted mb-2">קבוצות יעד</label>
                {/* Collection picker */}
                {groupCollections.length > 0 && (
                  <div className="mb-3">
                    <select
                      value={selectedCollectionId}
                      onChange={(e) => setSelectedCollectionId(e.target.value)}
                      className="w-full bg-cream border border-border text-charcoal rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-colors"
                    >
                      <option value="">טען מאוסף שמור...</option>
                      {groupCollections.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c._count.entries} קבוצות)</option>
                      ))}
                    </select>
                  </div>
                )}
                {selectedAccountIds.length === 0 ? (
                  <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 p-3 rounded-lg border border-amber-100 dark:border-amber-800">בחר חשבונות שולחים תחילה</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto p-2 bg-cream border border-border rounded-lg space-y-1">
                    {groupsLoading ? (
                      <p className="text-xs text-muted p-2 text-center">טוען קבוצות...</p>
                    ) : allGroups.length === 0 ? (
                      <p className="text-xs text-muted p-2 text-center">לא נמצאו קבוצות</p>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 pb-2 border-b border-border mb-1">
                          <button
                            type="button"
                            onClick={() => setSelectedGroupJids(allGroups.map(g => g.id))}
                            className="text-[10px] text-accent hover:underline"
                          >
                            בחר הכל
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedGroupJids([])}
                            className="text-[10px] text-muted hover:underline"
                          >
                            נקה הכל
                          </button>
                        </div>
                        {allGroups.map(g => (
                          <label key={g.id} className="flex items-center gap-2 p-2 hover:bg-white rounded transition-colors cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedGroupJids.includes(g.id)}
                              onChange={() => setSelectedGroupJids(prev => prev.includes(g.id) ? prev.filter(j => j !== g.id) : [...prev, g.id])}
                              className="accent-accent"
                            />
                            <span className="text-sm text-charcoal">{g.name}</span>
                            <span className="text-[10px] text-muted">{g.participantsCount} משתתפים</span>
                          </label>
                        ))}
                      </>
                    )}
                  </div>
                )}
                {selectedGroupJids.length > 0 && (
                  <p className="text-[10px] text-accent mt-1">{selectedGroupJids.length} קבוצות נבחרו</p>
                )}
              </div>

              {/* Schedule */}
              <div>
                <label className="block text-sm font-medium text-muted mb-2">תזמון שליחה</label>

                {/* Day of week selection */}
                <div className="flex items-center gap-1 mb-3">
                  <span className="text-xs text-muted ml-2">ימים:</span>
                  {DAY_LABELS.map((label, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setDaysOfWeek(prev => prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx])}
                      className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                        daysOfWeek.includes(idx)
                          ? 'bg-accent text-white'
                          : daysOfWeek.length === 0
                            ? 'bg-accent/20 text-accent border border-accent/30'
                            : 'bg-cream text-muted border border-border hover:border-accent'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  {daysOfWeek.length === 0 && (
                    <span className="text-[10px] text-accent mr-2">כל יום</span>
                  )}
                </div>

                {/* Send times */}
                <div className="space-y-2">
                  {sendTimes.map((time, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="time"
                        value={time}
                        onChange={e => setSendTimes(prev => prev.map((t, i) => i === idx ? e.target.value : t))}
                        className="bg-cream border border-border text-charcoal rounded-lg px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
                      />
                      {sendTimes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setSendTimes(prev => prev.filter((_, i) => i !== idx))}
                          className="text-red-400 hover:text-red-500 text-xs"
                        >
                          הסר
                        </button>
                      )}
                    </div>
                  ))}
                  {sendTimes.length < 24 && (
                    <button
                      type="button"
                      onClick={() => setSendTimes(prev => [...prev, '12:00'])}
                      className="text-xs text-accent hover:text-accent-hover font-medium"
                    >
                      + הוסף שעה
                    </button>
                  )}
                </div>
              </div>

              {/* Message Pool */}
              <div>
                <label className="block text-sm font-medium text-muted mb-2">מאגר הודעות (המערכת תבחר באקראי)</label>
                <div className="space-y-4">
                  {messagePool.map((msg, idx) => (
                    <div key={idx} className="border border-border rounded-lg p-3 bg-cream/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-muted font-medium">הודעה {idx + 1}</span>
                        {messagePool.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setMessagePool(prev => prev.filter((_, i) => i !== idx))}
                            className="text-red-400 hover:text-red-500 text-xs"
                          >
                            הסר
                          </button>
                        )}
                      </div>
                      <textarea
                        value={msg.content}
                        onChange={e => setMessagePool(prev => prev.map((m, i) => i === idx ? { ...m, content: e.target.value } : m))}
                        rows={3}
                        className="w-full bg-white border border-border text-charcoal rounded-lg px-3 py-2 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors text-right"
                        placeholder="הקלד הודעה... ניתן להשתמש ב-{אפשרות1|אפשרות2} לגיוון"
                        dir="auto"
                      />
                      {/* WhatsApp Preview */}
                      {msg.content.trim() && (
                        <div className="mt-2 p-2 bg-[#e5ddd5] dark:bg-[#0b141a] rounded-lg">
                          <p className="text-[9px] text-muted mb-1 text-center">תצוגה מקדימה</p>
                          <WhatsAppPreview text={msg.content} />
                        </div>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setMessagePool(prev => [...prev, { content: '' }])}
                    className="text-xs text-accent hover:text-accent-hover font-medium"
                  >
                    + הוסף הודעה למאגר
                  </button>
                </div>
                <p className="text-[10px] text-faded mt-2">
                  השתמש ב-{'{'} אפשרות1 | אפשרות2 {'}'} ליצירת גיוון (Spintax). קישורים יקבלו תצוגה מקדימה בוואטסאפ.
                </p>
              </div>

              {/* Limits */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">מגבלה יומית/חשבון</label>
                  <input
                    type="number"
                    value={dailyLimit}
                    onChange={e => setDailyLimit(Number(e.target.value))}
                    min={1}
                    max={200}
                    className="w-full bg-cream border border-border text-charcoal rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">הודעות בדקה</label>
                  <input
                    type="number"
                    value={messagesPerMinute}
                    onChange={e => setMessagesPerMinute(Number(e.target.value))}
                    min={1}
                    max={10}
                    className="w-full bg-cream border border-border text-charcoal rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={createMutation.isPending || selectedAccountIds.length === 0 || selectedGroupJids.length === 0}
                  className="flex-1 bg-accent hover:bg-accent-hover text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending ? 'יוצר...' : editId ? 'עדכן קידום' : 'צור קידום'}
                </button>
                <button
                  type="button"
                  onClick={() => { setModalOpen(false); resetForm(); }}
                  className="flex-1 bg-cream hover:bg-cream-dark text-charcoal font-medium py-3 rounded-lg transition-colors"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {logsId && <LogsModal promotionId={logsId} onClose={() => setLogsId(null)} />}
    </div>
  );
}

// ─── Logs Modal ──────────────────────────────────────────────────

function LogsModal({ promotionId, onClose }: { promotionId: string; onClose: () => void }) {
  const [offset, setOffset] = useState(0);
  const limit = 50;
  const { data, isLoading } = usePromotionLogs(promotionId, limit, offset);
  const { data: promotion } = usePromotion(promotionId);

  const logs = data?.logs || [];
  const total = data?.total || 0;

  const statusLabel = (s: string) => {
    switch (s) {
      case 'PENDING': return 'ממתין';
      case 'SENDING': return 'שולח';
      case 'SENT': return 'נשלח';
      case 'FAILED': return 'נכשל';
      default: return s;
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'PENDING': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400';
      case 'SENDING': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'SENT': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'FAILED': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white border border-border rounded-2xl w-full max-w-4xl p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto text-right">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-bold text-charcoal">
            לוגי שליחה — {promotion?.name || '...'}
          </h2>
          <button onClick={onClose} className="text-muted hover:text-charcoal transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="bg-cream-dark/50 border-b border-border">
                <th className="px-3 sm:px-4 py-3 text-xs font-semibold text-muted">סטטוס</th>
                <th className="px-3 sm:px-4 py-3 text-xs font-semibold text-muted">קבוצה</th>
                <th className="px-3 sm:px-4 py-3 text-xs font-semibold text-muted hidden sm:table-cell">הודעה</th>
                <th className="px-3 sm:px-4 py-3 text-xs font-semibold text-muted hidden md:table-cell">שגיאה</th>
                <th className="px-3 sm:px-4 py-3 text-xs font-semibold text-muted">זמן</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">טוען...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">אין לוגים</td></tr>
              ) : logs.map((log: GroupPromotionLog) => (
                <tr key={log.id} className="hover:bg-cream/30 transition-colors">
                  <td className="px-3 sm:px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor(log.status)}`}>
                      {statusLabel(log.status)}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-xs text-charcoal">{log.groupName || log.groupJid}</td>
                  <td className="px-3 sm:px-4 py-3 text-xs text-muted max-w-[200px] truncate hidden sm:table-cell" dir="auto">
                    {log.resolvedText || '-'}
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-xs text-red-500 max-w-[150px] truncate hidden md:table-cell">
                    {log.errorMessage || '-'}
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-xs text-muted whitespace-nowrap" dir="ltr">
                    {log.sentAt ? new Date(log.sentAt).toLocaleString('he-IL') : new Date(log.createdAt).toLocaleString('he-IL')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="text-xs text-accent hover:underline disabled:text-muted disabled:no-underline"
            >
              הקודם
            </button>
            <span className="text-xs text-muted">{offset + 1}–{Math.min(offset + limit, total)} מתוך {total}</span>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
              className="text-xs text-accent hover:underline disabled:text-muted disabled:no-underline"
            >
              הבא
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
