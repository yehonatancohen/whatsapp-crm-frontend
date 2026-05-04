import { useState, useEffect, useMemo, useRef } from 'react';import { useAccounts } from '../hooks/useAccounts';
import {
  usePromotions,
  useCreatePromotion,
  useUpdatePromotion,
  useDeletePromotion,
  useTogglePromotion,
  usePromotion,
  usePromotionLogs,
  useAddPromotionMessage,
  useUpdatePromotionMessage,
  useDeletePromotionMessage,
  useUpdatePromotionGroups,
} from '../hooks/usePromotions';
import { useGroupCollections, useGroupCollectionDetail } from '../hooks/useGroupCollections';
import { api } from '../lib/api';
import type { WhatsAppGroup, GroupPromotion, GroupPromotionLog } from '../types';
import { WhatsAppPreview } from '../components/WhatsAppPreview';

const DAY_LABELS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

// ─── Main Page ───────────────────────────────────────────────────

export function PromotionsPage() {
  const { accounts } = useAccounts();
  const { data: promotions = [], isLoading } = usePromotions();
  const createMutation = useCreatePromotion();
  const updateMutation = useUpdatePromotion();
  const deleteMutation = useDeletePromotion();
  const toggleMutation = useTogglePromotion();
  const addMessageMutation = useAddPromotionMessage();
  const updateMessageMutation = useUpdatePromotionMessage();
  const deleteMessageMutation = useDeletePromotionMessage();
  const updateGroupsMutation = useUpdatePromotionGroups();

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
  const [messagePool, setMessagePool] = useState<Array<{ id?: string; content: string; isActive: boolean }>>([{ content: '', isActive: true }]);
  const originalMessageIdsRef = useRef<string[]>([]);
  const [dailyLimit, setDailyLimit] = useState(50);
  const [messagesPerMinute, setMessagesPerMinute] = useState(2);

  const { collections: groupCollections } = useGroupCollections();
  const { collection: selectedCollection } = useGroupCollectionDetail(selectedCollectionId || null);

  const [accountGroups, setAccountGroups] = useState<Record<string, WhatsAppGroup[]>>({});
  const [groupsLoading, setGroupsLoading] = useState(false);

  const activeAccounts = accounts.filter(a => a.status === 'AUTHENTICATED');

  // Fetch groups for newly selected accounts
  useEffect(() => {
    const fetchNewAccountGroups = async () => {
      const missing = selectedAccountIds.filter(id => !(id in accountGroups));
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

  const refreshGroups = async () => {
    if (selectedAccountIds.length === 0) return;
    setGroupsLoading(true);
    try {
      const results = await Promise.all(
        selectedAccountIds.map(id => api.get(`/accounts/${id}/groups`).then(r => ({ id, groups: r.data }))),
      );
      const updated: Record<string, WhatsAppGroup[]> = {};
      results.forEach(r => { updated[r.id] = r.groups; });
      setAccountGroups(updated);
    } catch { /* silent */ } finally {
      setGroupsLoading(false);
    }
  };

  const checkAccountAdminInGroup = (accId: string, groupJid: string) =>
    (accountGroups[accId] || []).some(g => g.id === groupJid && g.isAdmin);

  const getAdminAccountsForGroup = (groupJid: string) =>
    selectedAccountIds.filter(accId => checkAccountAdminInGroup(accId, groupJid));

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
    setMessagePool([{ content: '', isActive: true }]);
    originalMessageIdsRef.current = [];
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
    setMessagePool(p.messages.length ? p.messages.map(m => ({ id: m.id, content: m.content, isActive: m.isActive })) : [{ content: '', isActive: true }]);
    originalMessageIdsRef.current = p.messages.map(m => m.id);
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

    if (editId) {
      // Update existing promotion
      await updateMutation.mutateAsync({
        id: editId,
        name,
        sendTimes,
        daysOfWeek: daysOfWeek.length > 0 ? daysOfWeek : [],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        accountIds: selectedAccountIds,
        dailyLimitPerAccount: dailyLimit,
        messagesPerMinute,
      });

      // Update groups
      await updateGroupsMutation.mutateAsync({ promotionId: editId, groups: groupData });

      // Sync messages: update existing, add new, delete removed
      const currentIds = new Set(validMessages.filter(m => m.id).map(m => m.id!));
      const removedIds = originalMessageIdsRef.current.filter(id => !currentIds.has(id));

      await Promise.all([
        ...removedIds.map(id => deleteMessageMutation.mutateAsync({ promotionId: editId, messageId: id })),
        ...validMessages.map(m => {
          if (m.id) {
            return updateMessageMutation.mutateAsync({ promotionId: editId, messageId: m.id, content: m.content, isActive: m.isActive });
          } else {
            return addMessageMutation.mutateAsync({ promotionId: editId, content: m.content });
          }
        }),
      ]);
    } else {
      await createMutation.mutateAsync({
        name,
        sendTimes,
        daysOfWeek: daysOfWeek.length > 0 ? daysOfWeek : undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        accountIds: selectedAccountIds,
        dailyLimitPerAccount: dailyLimit,
        messagesPerMinute,
        groups: groupData,
        messages: validMessages.map(m => ({ content: m.content })),
      });
    }

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
          className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-[#ffffff] text-sm font-medium px-4 py-2.5 rounded-lg transition-colors self-start sm:self-auto"
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
                  <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">בחר חשבונות שולחים תחילה</p>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setSelectedGroupJids(allGroups.map(g => g.id))} className="text-[10px] text-accent hover:underline">בחר הכל</button>
                        <button type="button" onClick={() => setSelectedGroupJids([])} className="text-[10px] text-muted hover:underline">נקה הכל</button>
                      </div>
                      <button
                        type="button"
                        onClick={refreshGroups}
                        disabled={groupsLoading}
                        className="text-[10px] text-accent hover:text-accent-hover flex items-center gap-1 disabled:opacity-50"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                          <path d="M21.5 2v6h-6"/><path d="M2.5 12A10 10 0 0 1 19 4.5l2.5 3.5"/><path d="M2.5 22v-6h6"/><path d="M21.5 12A10 10 0 0 1 5 19.5l-2.5-3.5"/>
                        </svg>
                        רענן
                      </button>
                    </div>
                    <div className="max-h-48 overflow-y-auto p-2 bg-cream border border-border rounded-lg space-y-1">
                      {groupsLoading ? (
                        <p className="text-xs text-muted p-2 text-center">טוען קבוצות...</p>
                      ) : allGroups.length === 0 ? (
                        <p className="text-xs text-muted p-2 text-center">לא נמצאו קבוצות</p>
                      ) : allGroups.map(g => {
                        const adminAccounts = getAdminAccountsForGroup(g.id);
                        const hasAdmin = adminAccounts.length > 0;
                        return (
                          <label key={g.id} className="flex flex-col p-2 hover:bg-white rounded transition-colors cursor-pointer">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedGroupJids.includes(g.id)}
                                onChange={() => setSelectedGroupJids(prev => prev.includes(g.id) ? prev.filter(j => j !== g.id) : [...prev, g.id])}
                                className="accent-accent"
                              />
                              <span className="text-sm text-charcoal">{g.name}</span>
                              <span className="text-[10px] text-muted mr-auto" dir="ltr">{g.participantsCount} חברים</span>
                              {!hasAdmin && (
                                <span className="text-[9px] bg-amber-50 text-amber-600 px-1 rounded border border-amber-100">אין מנהל</span>
                              )}
                            </div>
                            {selectedGroupJids.includes(g.id) && (
                              <div className="mt-1 flex flex-wrap gap-1 pr-6">
                                {hasAdmin ? (
                                  adminAccounts.map(accId => {
                                    const acc = activeAccounts.find(a => a.id === accId);
                                    return (
                                      <span key={accId} className="text-[9px] bg-green-50 text-green-700 px-1 rounded border border-green-100">
                                        ✓ {acc?.label} ישלח
                                      </span>
                                    );
                                  })
                                ) : (
                                  <span className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100">
                                    שום חשבון נבחר אינו מנהל — ההודעה לא תישלח
                                  </span>
                                )}
                              </div>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </>
                )}
                {selectedGroupJids.length > 0 && (
                  <p className="text-[10px] text-accent mt-1">{selectedGroupJids.length} קבוצות נבחרו</p>
                )}
              </div>

              {/* Schedule */}
              <div>
                <label className="block text-sm font-medium text-muted mb-2">תזמון שליחה</label>

                {/* Day of week selection */}
                {/* dir="ltr" + flex-row-reverse keeps Hebrew visual order (Sat←Sun) while using */}
                {/* LTR hit-testing, preventing RTL flex from misfiring adjacent button clicks.  */}
                <div className="flex flex-row-reverse items-center gap-1 mb-3" dir="ltr">
                  <span className="text-xs text-muted ml-2">ימים:</span>
                  {DAY_LABELS.map((label, idx) => (
                    <button
                      key={`day-${idx}`}
                      type="button"
                      onClick={() => setDaysOfWeek(prev => prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx])}
                      className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                        daysOfWeek.includes(idx)
                          ? 'bg-accent text-[#ffffff]'
                          : daysOfWeek.length === 0
                            ? 'bg-accent/20 text-accent border border-accent/30'
                            : 'bg-cream text-muted border border-border hover:border-accent'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  {/* Always rendered (not conditional) to avoid React reconciliation affecting button handlers */}
                  <span className={`text-[10px] text-accent mr-2 ${daysOfWeek.length > 0 ? 'invisible' : ''}`}>כל יום</span>
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
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted font-medium">הודעה {idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => setMessagePool(prev => prev.map((m, i) => i === idx ? { ...m, isActive: !m.isActive } : m))}
                            dir="ltr"
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${msg.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                            title={msg.isActive ? 'פעיל — לחץ לכיבוי' : 'כבוי — לחץ להפעלה'}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${msg.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                          <span className={`text-[10px] font-medium ${msg.isActive ? 'text-green-600' : 'text-muted'}`}>{msg.isActive ? 'פעיל' : 'כבוי'}</span>
                        </div>
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
                    onClick={() => setMessagePool(prev => [...prev, { content: '', isActive: true }])}
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
                    value={dailyLimit || ''}
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
                    value={messagesPerMinute || ''}
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
                  disabled={(editId ? updateMutation.isPending : createMutation.isPending) || selectedAccountIds.length === 0 || selectedGroupJids.length === 0}
                  className="flex-1 bg-accent hover:bg-accent-hover text-[#ffffff] font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  {(editId ? updateMutation.isPending : createMutation.isPending) ? (editId ? 'מעדכן...' : 'יוצר...') : editId ? 'עדכן קידום' : 'צור קידום'}
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
