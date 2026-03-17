import { useState, useEffect } from 'react';
import { useAccounts } from '../hooks/useAccounts';
import {
  useCampaigns,
  useCreateCampaign,
  useStartCampaign,
  usePauseCampaign,
  useResumeCampaign,
  useCancelCampaign,
  useDeleteCampaign,
} from '../hooks/useCampaigns';
import { useContactLists } from '../hooks/useContacts';
import { api } from '../lib/api';
import type { WhatsAppGroup, Campaign } from '../types';

export function CampaignsPage() {
  const { accounts } = useAccounts();
  const { lists: contactLists } = useContactLists();
  const { data: campaigns = [], isLoading: campaignsLoading } = useCampaigns();
  const createMutation = useCreateCampaign();
  const startMutation = useStartCampaign();
  const pauseMutation = usePauseCampaign();
  const resumeMutation = useResumeCampaign();
  const cancelMutation = useCancelCampaign();
  const deleteMutation = useDeleteCampaign();

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [recipientType, setRecipientType] = useState<'LIST' | 'GROUP'>('LIST');
  const [contactListId, setContactListId] = useState('');
  const [selectedGroupJids, setSelectedGroupJids] = useState<string[]>([]);

  const [accountGroups, setAccountGroups] = useState<Record<string, WhatsAppGroup[]>>({});
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [delayMin, setDelayMin] = useState(30);
  const [delayMax, setDelayMax] = useState(60);
  const [dailyLimit, setDailyLimit] = useState(50);

  const activeAccounts = accounts.filter(a => a.status === 'AUTHENTICATED');

  // Fetch groups for newly selected accounts
  useEffect(() => {
    const fetchNewAccountGroups = async () => {
      const missing = selectedAccountIds.filter(id => !accountGroups[id]);
      if (missing.length === 0) return;

      setGroupsLoading(true);
      try {
        const results = await Promise.all(
          missing.map(id => api.get(`/accounts/${id}/groups`).then(r => ({ id, groups: r.data })))
        );
        const newGroups = { ...accountGroups };
        results.forEach(res => { newGroups[res.id] = res.groups; });
        setAccountGroups(newGroups);
      } catch (err) {
        console.error('Failed to fetch groups', err);
      } finally {
        setGroupsLoading(false);
      }
    };

    if (recipientType === 'GROUP' && selectedAccountIds.length > 0) {
      fetchNewAccountGroups();
    }
  }, [selectedAccountIds, recipientType]);

  // Aggregate all unique groups from selected accounts
  const allAvailableGroups: WhatsAppGroup[] = [];
  const groupMap = new Map<string, WhatsAppGroup>();

  selectedAccountIds.forEach(accId => {
    const groups = accountGroups[accId] || [];
    groups.forEach(g => {
      if (!groupMap.has(g.id)) {
        groupMap.set(g.id, g);
        allAvailableGroups.push(g);
      }
    });
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAccountIds.length === 0) return;

    await createMutation.mutateAsync({
      name,
      messageTemplate: message,
      accountIds: selectedAccountIds,
      type: recipientType === 'GROUP' ? 'GROUP_MESSAGE' : 'DIRECT_MESSAGE',
      contactListId: recipientType === 'LIST' ? contactListId : undefined,
      groupJids: recipientType === 'GROUP' ? selectedGroupJids.map(jid => ({ jid })) : undefined,
      messagesPerMinute: Math.floor(60 / ((delayMin + delayMax) / 2)),
      dailyLimitPerAccount: dailyLimit,
    });
    setModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setMessage('');
    setSelectedAccountIds([]);
    setContactListId('');
    setSelectedGroupJids([]);
    setDailyLimit(50);
  };

  const toggleAccountId = (id: string) => {
    setSelectedAccountIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleGroupJid = (jid: string) => {
    setSelectedGroupJids(prev =>
      prev.includes(jid) ? prev.filter(j => j !== jid) : [...prev, jid]
    );
  };

  const checkAccountInGroup = (accId: string, groupJid: string) => {
    return (accountGroups[accId] || []).some(g => g.id === groupJid);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
      case 'PENDING': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400';
      case 'RUNNING': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'PAUSED': return 'bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400';
      case 'COMPLETED': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'CANCELLED': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
      case 'FAILED': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const translateStatus = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'טיוטה';
      case 'PENDING': return 'ממתין';
      case 'RUNNING': return 'בהרצה';
      case 'PAUSED': return 'מושהה';
      case 'COMPLETED': return 'הושלם';
      case 'CANCELLED': return 'בוטל';
      case 'FAILED': return 'נכשל';
      default: return status;
    }
  };

  const renderActions = (c: Campaign) => {
    const actions = [];

    if (c.status === 'DRAFT') {
      actions.push(
        <button
          key="start"
          onClick={() => startMutation.mutate(c.id)}
          disabled={startMutation.isPending}
          className="text-green-600 hover:text-green-700 text-xs font-medium disabled:opacity-50"
        >
          הפעל
        </button>
      );
    }

    if (c.status === 'RUNNING') {
      actions.push(
        <button
          key="pause"
          onClick={() => pauseMutation.mutate(c.id)}
          disabled={pauseMutation.isPending}
          className="text-violet-600 hover:text-violet-700 text-xs font-medium disabled:opacity-50"
        >
          השהה
        </button>
      );
      actions.push(
        <button
          key="cancel"
          onClick={() => cancelMutation.mutate(c.id)}
          disabled={cancelMutation.isPending}
          className="text-amber-600 hover:text-amber-700 text-xs font-medium disabled:opacity-50"
        >
          בטל
        </button>
      );
    }

    if (c.status === 'PAUSED') {
      actions.push(
        <button
          key="resume"
          onClick={() => resumeMutation.mutate(c.id)}
          disabled={resumeMutation.isPending}
          className="text-blue-600 hover:text-blue-700 text-xs font-medium disabled:opacity-50"
        >
          המשך
        </button>
      );
      actions.push(
        <button
          key="cancel"
          onClick={() => cancelMutation.mutate(c.id)}
          disabled={cancelMutation.isPending}
          className="text-amber-600 hover:text-amber-700 text-xs font-medium disabled:opacity-50"
        >
          בטל
        </button>
      );
    }

    if (['DRAFT', 'COMPLETED', 'CANCELLED', 'FAILED'].includes(c.status)) {
      actions.push(
        <button
          key="delete"
          onClick={() => deleteMutation.mutate(c.id)}
          className="text-red-500 hover:text-red-600 p-1"
          title="מחק קמפיין"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      );
    }

    return actions;
  };

  return (
    <div className="text-right">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">קמפיינים</h1>
          <p className="text-sm text-muted mt-1">שלח הודעות בתפוצה רחבה — חלוקת עבודה אוטומטית בין חשבונות</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors self-start sm:self-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          קמפיין חדש
        </button>
      </div>

      <div className="bg-white border border-border rounded-xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-cream-dark/50 border-b border-border">
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-muted uppercase tracking-wider">שם הקמפיין</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-muted uppercase tracking-wider">סטטוס</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-muted uppercase tracking-wider hidden sm:table-cell">התקדמות</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-muted uppercase tracking-wider hidden md:table-cell">תאריך יצירה</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-muted uppercase tracking-wider">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {campaignsLoading ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-muted">טוען קמפיינים...</td></tr>
              ) : campaigns.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-muted">לא נמצאו קמפיינים</td></tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-cream/30 transition-colors">
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="text-sm font-medium text-charcoal">{c.name}</div>
                      <div className="text-[10px] text-muted mt-0.5">
                        {c.dailyLimitPerAccount && `${c.dailyLimitPerAccount} הודעות/יום/חשבון`}
                      </div>
                      {/* Show progress inline on mobile */}
                      <div className="sm:hidden text-[10px] text-muted mt-1" dir="ltr">{c.sentCount}/{c.totalMessages}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(c.status)}`}>
                        {translateStatus(c.status)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 w-24 bg-cream rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent transition-all duration-500"
                            style={{ width: `${(c.sentCount / (c.totalMessages || 1)) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted font-medium" dir="ltr">{c.sentCount}/{c.totalMessages}</span>
                      </div>
                      {c.failedCount > 0 && (
                        <p className="text-[10px] text-red-500 mt-0.5">{c.failedCount} נכשלו</p>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-xs text-muted">{new Date(c.createdAt).toLocaleDateString('he-IL')}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {renderActions(c)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-border rounded-2xl w-full max-w-2xl p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto text-right">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-charcoal">יצירת קמפיין חדש</h2>
              <button onClick={() => setModalOpen(false)} className="text-muted hover:text-charcoal transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-muted mb-1.5">שם הקמפיין</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-cream border border-border text-charcoal rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors text-right"
                  placeholder="קמפיין חג שמח"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-2">חשבונות שולחים (העבודה תתחלק ביניהם)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-cream border border-border rounded-lg">
                  {activeAccounts.length === 0 ? (
                    <p className="text-xs text-muted p-2 col-span-full text-center">אין חשבונות מחוברים</p>
                  ) : activeAccounts.map(a => (
                    <label key={a.id} className="flex items-center gap-2 p-2 hover:bg-white rounded transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedAccountIds.includes(a.id)}
                        onChange={() => toggleAccountId(a.id)}
                        className="accent-accent"
                      />
                      <span className="text-sm text-charcoal">{a.label}</span>
                      <span className="text-[10px] text-muted" dir="ltr">{a.phoneNumber ? `+${a.phoneNumber}` : ''}</span>
                    </label>
                  ))}
                </div>
                {selectedAccountIds.length > 0 && (
                  <p className="text-[10px] text-accent mt-1">{selectedAccountIds.length} חשבונות נבחרו — ההודעות יתחלקו ביניהם בצורה שווה</p>
                )}
                {selectedAccountIds.length === 0 && <p className="text-[10px] text-red-500 mt-1">חובה לבחור לפחות חשבון אחד</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-1.5">סוג נמענים</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={recipientType === 'LIST'} onChange={() => setRecipientType('LIST')} className="accent-accent" />
                    <span className="text-sm text-charcoal">רשימת אנשי קשר</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={recipientType === 'GROUP'} onChange={() => setRecipientType('GROUP')} className="accent-accent" />
                    <span className="text-sm text-charcoal">קבוצות וואטסאפ</span>
                  </label>
                </div>
              </div>

              {recipientType === 'LIST' ? (
                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">בחר רשימה</label>
                  <select
                    value={contactListId}
                    onChange={(e) => setContactListId(e.target.value)}
                    required
                    className="w-full bg-cream border border-border text-charcoal rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-colors"
                  >
                    <option value="">בחר רשימה...</option>
                    {contactLists.map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l._count.entries} אנשי קשר)</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">בחר קבוצות</label>
                  {selectedAccountIds.length === 0 ? (
                    <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">בחר חשבונות שולחים תחילה כדי לראות את הקבוצות שלהם</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-2 bg-cream border border-border rounded-lg">
                      {groupsLoading ? <p className="text-xs text-muted p-2 text-center">טוען קבוצות...</p> :
                       allAvailableGroups.length === 0 ? <p className="text-xs text-muted p-2 text-center">לא נמצאו קבוצות בחשבונות שנבחרו</p> :
                       allAvailableGroups.map(g => (
                        <div key={g.id} className="flex flex-col p-2 hover:bg-white rounded transition-colors">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedGroupJids.includes(g.id)}
                              onChange={() => toggleGroupJid(g.id)}
                              className="accent-accent"
                            />
                            <span className="text-sm font-medium text-charcoal">{g.name}</span>
                          </label>
                          {selectedGroupJids.includes(g.id) && (
                            <div className="mt-1 flex flex-wrap gap-1 pr-6">
                              {selectedAccountIds.map(accId => {
                                const inGroup = checkAccountInGroup(accId, g.id);
                                if (inGroup) return null;
                                const acc = activeAccounts.find(a => a.id === accId);
                                return (
                                  <span key={accId} className="text-[9px] bg-red-50 text-red-600 px-1 rounded border border-red-100">
                                    {acc?.label} לא חבר בקבוצה
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-muted mb-1.5">תוכן ההודעה</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={5}
                  className="w-full bg-cream border border-border text-charcoal rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors text-right"
                  placeholder="הקלד את תוכן ההודעה כאן..."
                />
                <p className="text-[10px] text-faded mt-1.5">ניתן להשתמש ב- {'{name}'} כדי להוסיף את שם איש הקשר.</p>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">השהיה מינ' (שניות)</label>
                  <input
                    type="number"
                    value={delayMin}
                    onChange={(e) => setDelayMin(Number(e.target.value))}
                    min={5}
                    className="w-full bg-cream border border-border text-charcoal rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">השהיה מקס' (שניות)</label>
                  <input
                    type="number"
                    value={delayMax}
                    onChange={(e) => setDelayMax(Number(e.target.value))}
                    min={delayMin}
                    className="w-full bg-cream border border-border text-charcoal rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">מגבלה יומית/חשבון</label>
                  <input
                    type="number"
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(Number(e.target.value))}
                    min={1}
                    className="w-full bg-cream border border-border text-charcoal rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-colors"
                  />
                  <p className="text-[10px] text-faded mt-1">מספר הודעות מקסימלי ליום לכל חשבון</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={createMutation.isPending || selectedAccountIds.length === 0}
                  className="flex-1 bg-accent hover:bg-accent-hover text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending ? 'יוצר קמפיין...' : 'צור קמפיין'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 bg-cream hover:bg-cream-dark text-charcoal font-medium py-3 rounded-lg transition-colors"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
