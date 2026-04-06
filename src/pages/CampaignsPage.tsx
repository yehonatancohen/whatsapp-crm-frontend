import { useState, useEffect, useRef } from 'react';
import { useAccounts } from '../hooks/useAccounts';
import {
  useCampaigns,
  useCreateCampaign,
  useUpdateCampaign,
  useStartCampaign,
  usePauseCampaign,
  useResumeCampaign,
  useCancelCampaign,
  useDeleteCampaign,
  useRestartCampaign,
} from '../hooks/useCampaigns';
import { useContactLists } from '../hooks/useContacts';
import { useGroupCollections, useGroupCollectionDetail } from '../hooks/useGroupCollections';
import { api } from '../lib/api';
import type { WhatsAppGroup, Campaign } from '../types';
import { WhatsAppPreview } from '../components/WhatsAppPreview';

export function CampaignsPage() {
  const { accounts } = useAccounts();
  const { lists: contactLists } = useContactLists();
  const { data: campaigns = [], isLoading: campaignsLoading } = useCampaigns();
  const createMutation = useCreateCampaign();
  const updateMutation = useUpdateCampaign();
  const startMutation = useStartCampaign();
  const pauseMutation = usePauseCampaign();
  const resumeMutation = useResumeCampaign();
  const cancelMutation = useCancelCampaign();
  const deleteMutation = useDeleteCampaign();
  const restartMutation = useRestartCampaign();

  // modal mode: null = closed, 'create' | 'edit' | 'clone'
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'clone' | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [recipientType, setRecipientType] = useState<'LIST' | 'GROUP'>('LIST');
  const [contactListId, setContactListId] = useState('');
  const [selectedGroupJids, setSelectedGroupJids] = useState<string[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  const { collections: groupCollections } = useGroupCollections();
  const { collection: selectedCollection } = useGroupCollectionDetail(selectedCollectionId || null);

  const [accountGroups, setAccountGroups] = useState<Record<string, WhatsAppGroup[]>>({});
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [delayMin, setDelayMin] = useState(30);
  const [delayMax, setDelayMax] = useState(60);
  const [dailyLimit, setDailyLimit] = useState(50);

  // Track pending action to avoid double-submit
  const pendingAction = useRef<'start' | 'draft' | 'save' | null>(null);

  // A/B Testing state
  const [enableAB, setEnableAB] = useState(false);
  const [variants, setVariants] = useState<Array<{ name: string; messageTemplate: string; weight: number }>>([]);

  const activeAccounts = accounts.filter(a => a.status === 'AUTHENTICATED');

  // Fetch groups for newly selected accounts
  useEffect(() => {
    const fetchNewAccountGroups = async () => {
      const missing = selectedAccountIds.filter(id => !(id in accountGroups));
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

  // Load groups from selected collection
  useEffect(() => {
    if (selectedCollection?.entries) {
      setSelectedGroupJids(selectedCollection.entries.map(e => e.groupJid));
    }
  }, [selectedCollection]);

  // Aggregate all unique groups from selected accounts
  const allAvailableGroups: WhatsAppGroup[] = [];
  const groupMap = new Map<string, WhatsAppGroup>();
  selectedAccountIds.forEach(accId => {
    (accountGroups[accId] || []).forEach(g => {
      if (!groupMap.has(g.id)) { groupMap.set(g.id, g); allAvailableGroups.push(g); }
    });
  });

  const resetForm = () => {
    setName('');
    setMessage('');
    setSelectedAccountIds([]);
    setRecipientType('LIST');
    setContactListId('');
    setSelectedGroupJids([]);
    setSelectedCollectionId('');
    setScheduledAt('');
    setDelayMin(30);
    setDelayMax(60);
    setDailyLimit(50);
    setEnableAB(false);
    setVariants([]);
  };

  const fillFormFromCampaign = (c: Campaign) => {
    setName(c.name);
    setMessage(c.messageTemplate);
    setRecipientType(c.type === 'GROUP_MESSAGE' ? 'GROUP' : 'LIST');
    setContactListId(c.contactListId ?? '');
    setSelectedGroupJids([]);
    setSelectedCollectionId('');
    setScheduledAt(c.scheduledAt ? new Date(c.scheduledAt).toISOString().slice(0, 16) : '');
    setDailyLimit(c.dailyLimitPerAccount ?? 50);
    setDelayMin(30);
    setDelayMax(60);
    // Pre-select accounts that still exist and are active
    const validIds = (c.accountIds ?? []).filter(id => accounts.some(a => a.id === id));
    setSelectedAccountIds(validIds);
  };

  const openCreate = () => {
    resetForm();
    setEditingCampaign(null);
    setModalMode('create');
  };

  const openEdit = (c: Campaign) => {
    fillFormFromCampaign(c);
    setEditingCampaign(c);
    setModalMode('edit');
  };

  const openClone = (c: Campaign) => {
    fillFormFromCampaign(c);
    setName(`עותק של ${c.name}`);
    setEditingCampaign(null);
    setModalMode('clone');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingCampaign(null);
    pendingAction.current = null;
  };

  const buildPayload = () => ({
    name,
    messageTemplate: message,
    accountIds: selectedAccountIds,
    type: recipientType === 'GROUP' ? 'GROUP_MESSAGE' as const : 'DIRECT_MESSAGE' as const,
    contactListId: recipientType === 'LIST' ? contactListId : undefined,
    groupJids: recipientType === 'GROUP' ? selectedGroupJids.map(jid => ({ jid })) : undefined,
    scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
    messagesPerMinute: Math.floor(60 / ((delayMin + delayMax) / 2)),
    dailyLimitPerAccount: dailyLimit,
    variants: enableAB ? variants : undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAccountIds.length === 0) return;
    const action = pendingAction.current;

    if (modalMode === 'edit' && editingCampaign) {
      await updateMutation.mutateAsync({ id: editingCampaign.id, ...buildPayload() });
      closeModal();
      return;
    }

    // create or clone
    const created = await createMutation.mutateAsync(buildPayload());
    if (action === 'start') {
      await startMutation.mutateAsync(created.id);
    }
    closeModal();
  };

  const toggleAccountId = (id: string) =>
    setSelectedAccountIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const toggleGroupJid = (jid: string) =>
    setSelectedGroupJids(prev => prev.includes(jid) ? prev.filter(j => j !== jid) : [...prev, jid]);

  const checkAccountAdminInGroup = (accId: string, groupJid: string) =>
    (accountGroups[accId] || []).some(g => g.id === groupJid && g.isAdmin);

  const getAdminAccountsForGroup = (groupJid: string) =>
    selectedAccountIds.filter(accId => checkAccountAdminInGroup(accId, groupJid));

  const refreshGroups = async () => {
    if (selectedAccountIds.length === 0) return;
    setGroupsLoading(true);
    try {
      const results = await Promise.all(
        selectedAccountIds.map(id => api.get(`/accounts/${id}/groups`).then(r => ({ id, groups: r.data })))
      );
      const newGroups: Record<string, WhatsAppGroup[]> = {};
      results.forEach(res => { newGroups[res.id] = res.groups; });
      setAccountGroups(newGroups);
    } catch (err) {
      console.error('Failed to refresh groups', err);
    } finally {
      setGroupsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
      case 'SCHEDULED': return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
      case 'RUNNING': return 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400';
      case 'PAUSED': return 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400';
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-600 dark:bg-green-900/20 dark:text-green-400';
      case 'CANCELLED': return 'bg-red-50 text-red-500 dark:bg-gray-800 dark:text-gray-400';
      case 'FAILED': return 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const translateStatus = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'טיוטה';
      case 'SCHEDULED': return 'מתוזמן';
      case 'RUNNING': return 'פעיל';
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
        <button key="start" onClick={() => startMutation.mutate(c.id)} disabled={startMutation.isPending}
          className="text-green-600 hover:text-green-700 text-xs font-medium disabled:opacity-50">
          הפעל
        </button>
      );
      actions.push(
        <button key="edit" onClick={() => openEdit(c)}
          className="text-accent hover:text-accent-hover text-xs font-medium" title="ערוך קמפיין">
          ערוך
        </button>
      );
    }

    if (c.status === 'SCHEDULED') {
      actions.push(
        <button key="edit" onClick={() => openEdit(c)}
          className="text-accent hover:text-accent-hover text-xs font-medium" title="ערוך קמפיין">
          ערוך
        </button>
      );
    }

    if (c.status === 'RUNNING') {
      actions.push(
        <button key="pause" onClick={() => pauseMutation.mutate(c.id)} disabled={pauseMutation.isPending}
          className="text-violet-600 hover:text-violet-700 text-xs font-medium disabled:opacity-50">
          השהה
        </button>
      );
      actions.push(
        <button key="cancel" onClick={() => cancelMutation.mutate(c.id)} disabled={cancelMutation.isPending}
          className="text-amber-600 hover:text-amber-700 text-xs font-medium disabled:opacity-50">
          בטל
        </button>
      );
    }

    if (c.status === 'PAUSED') {
      actions.push(
        <button key="resume" onClick={() => resumeMutation.mutate(c.id)} disabled={resumeMutation.isPending}
          className="text-blue-600 hover:text-blue-700 text-xs font-medium disabled:opacity-50">
          המשך
        </button>
      );
      actions.push(
        <button key="cancel" onClick={() => cancelMutation.mutate(c.id)} disabled={cancelMutation.isPending}
          className="text-amber-600 hover:text-amber-700 text-xs font-medium disabled:opacity-50">
          בטל
        </button>
      );
    }

    if (['COMPLETED', 'CANCELLED', 'FAILED'].includes(c.status)) {
      actions.push(
        <button key="restart" onClick={() => restartMutation.mutate(c.id)} disabled={restartMutation.isPending}
          className="text-blue-600 hover:text-blue-700 text-xs font-medium disabled:opacity-50">
          הפעל מחדש
        </button>
      );
    }

    // Clone available for all statuses
    actions.push(
      <button key="clone" onClick={() => openClone(c)}
        className="text-muted hover:text-charcoal text-xs font-medium" title="שכפל קמפיין">
        שכפל
      </button>
    );

    if (['DRAFT', 'COMPLETED', 'CANCELLED', 'FAILED'].includes(c.status)) {
      actions.push(
        <button key="delete" onClick={() => deleteMutation.mutate(c.id)}
          className="text-red-500 hover:text-red-600 p-1" title="מחק קמפיין">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      );
    }

    return actions;
  };

  const modalOpen = modalMode !== null;
  const isEditing = modalMode === 'edit';
  const isBusy = createMutation.isPending || updateMutation.isPending || startMutation.isPending;

  const modalTitle = isEditing
    ? `עריכת קמפיין — ${editingCampaign?.name ?? ''}`
    : modalMode === 'clone'
    ? 'שכפול קמפיין'
    : 'יצירת קמפיין חדש';

  const inputClass = 'w-full bg-cream border border-border text-charcoal rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors text-right';

  return (
    <div className="text-right">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">קמפיינים</h1>
          <p className="text-sm text-muted mt-1">שלח הודעות בתפוצה רחבה — חלוקת עבודה אוטומטית בין חשבונות</p>
        </div>
        <button
          onClick={openCreate}
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
                          <div className="h-full bg-accent transition-all duration-500" style={{ width: `${(c.sentCount / (c.totalMessages || 1)) * 100}%` }} />
                        </div>
                        <span className="text-xs text-muted font-medium" dir="ltr">{c.sentCount}/{c.totalMessages}</span>
                      </div>
                      {c.failedCount > 0 && <p className="text-[10px] text-red-500 mt-0.5">{c.failedCount} נכשלו</p>}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-xs text-muted">{new Date(c.createdAt).toLocaleDateString('he-IL')}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 flex-wrap">{renderActions(c)}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-border rounded-2xl w-full max-w-2xl p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto text-right">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-charcoal">{modalTitle}</h2>
              <button onClick={closeModal} className="text-muted hover:text-charcoal transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-muted mb-1.5">שם הקמפיין</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} placeholder="קמפיין חג שמח" />
              </div>

              {/* Accounts */}
              <div>
                <label className="block text-sm font-medium text-muted mb-2">חשבונות שולחים (העבודה תתחלק ביניהם)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-cream border border-border rounded-lg">
                  {activeAccounts.length === 0 ? (
                    <p className="text-xs text-muted p-2 col-span-full text-center">אין חשבונות מחוברים</p>
                  ) : activeAccounts.map(a => (
                    <label key={a.id} className="flex items-center gap-2 p-2 hover:bg-white rounded transition-colors cursor-pointer">
                      <input type="checkbox" checked={selectedAccountIds.includes(a.id)} onChange={() => toggleAccountId(a.id)} className="accent-accent" />
                      <span className="text-sm text-charcoal">{a.label}</span>
                      <span className="text-[10px] text-muted" dir="ltr">{a.phoneNumber ? `+${a.phoneNumber}` : ''}</span>
                    </label>
                  ))}
                </div>
                {selectedAccountIds.length > 0
                  ? <p className="text-[10px] text-accent mt-1">{selectedAccountIds.length} חשבונות נבחרו — ההודעות יתחלקו ביניהם בצורה שווה</p>
                  : <p className="text-[10px] text-red-500 mt-1">חובה לבחור לפחות חשבון אחד</p>}
              </div>

              {/* Recipient type */}
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

              {/* List or Group selector */}
              {recipientType === 'LIST' ? (
                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">בחר רשימה</label>
                  <select value={contactListId} onChange={(e) => setContactListId(e.target.value)} required className={inputClass}>
                    <option value="">בחר רשימה...</option>
                    {contactLists.map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l._count.entries} אנשי קשר)</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">בחר קבוצות</label>
                  {groupCollections.length > 0 && (
                    <div className="mb-3">
                      <select value={selectedCollectionId} onChange={(e) => setSelectedCollectionId(e.target.value)} className={inputClass}>
                        <option value="">טען מאוסף שמור...</option>
                        {groupCollections.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c._count.entries} קבוצות)</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {selectedAccountIds.length === 0 ? (
                    <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">בחר חשבונות שולחים תחילה כדי לראות את הקבוצות שלהם</p>
                  ) : (
                    <>
                      <div className="flex items-center justify-end mb-1.5">
                        <button type="button" onClick={refreshGroups} disabled={groupsLoading}
                          className="text-[10px] text-accent hover:text-accent-hover flex items-center gap-1 disabled:opacity-50">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                            <path d="M21.5 2v6h-6"/><path d="M2.5 12A10 10 0 0 1 19 4.5l2.5 3.5"/><path d="M2.5 22v-6h6"/><path d="M21.5 12A10 10 0 0 1 5 19.5l-2.5-3.5"/>
                          </svg>
                          רענן קבוצות
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-2 bg-cream border border-border rounded-lg">
                        {groupsLoading ? <p className="text-xs text-muted p-2 text-center">טוען קבוצות...</p> :
                         allAvailableGroups.length === 0 ? <p className="text-xs text-muted p-2 text-center">לא נמצאו קבוצות בחשבונות שנבחרו</p> :
                         allAvailableGroups.map(g => {
                           const adminAccounts = getAdminAccountsForGroup(g.id);
                           const hasAdmin = adminAccounts.length > 0;
                           return (
                             <label key={g.id} className="flex flex-col p-2 hover:bg-white rounded transition-colors cursor-pointer">
                               <div className="flex items-center gap-2">
                                 <input type="checkbox" checked={selectedGroupJids.includes(g.id)} onChange={() => toggleGroupJid(g.id)} className="accent-accent" />
                                 <span className="text-sm font-medium text-charcoal">{g.name}</span>
                                 <span className="text-[10px] text-muted mr-auto" dir="ltr">{g.participantsCount} חברים</span>
                                 {!hasAdmin && <span className="text-[9px] bg-amber-50 text-amber-600 px-1 rounded border border-amber-100">אין מנהל</span>}
                               </div>
                               {selectedGroupJids.includes(g.id) && (
                                 <div className="mt-1 flex flex-wrap gap-1 pr-6">
                                   {hasAdmin ? adminAccounts.map(accId => {
                                     const acc = activeAccounts.find(a => a.id === accId);
                                     return <span key={accId} className="text-[9px] bg-green-50 text-green-700 px-1 rounded border border-green-100">✓ {acc?.label} ישלח</span>;
                                   }) : (
                                     <span className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100">שום חשבון נבחר אינו מנהל בקבוצה זו — ההודעה לא תישלח</span>
                                   )}
                                 </div>
                               )}
                             </label>
                           );
                         })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-muted mb-1.5">תוכן ההודעה</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={5} className={inputClass} placeholder="הקלד את תוכן ההודעה כאן..." />
                <p className="text-[10px] text-faded mt-1.5 mb-3">ניתן להשתמש ב- {'{name}'} וב- {'{אופציה1|אופציה2}'} לגיוון.</p>
                {message.trim() && (
                  <div className="p-2 bg-[#e5ddd5] dark:bg-[#0b141a] rounded-lg">
                    <p className="text-[9px] text-muted mb-1 text-center">תצוגה מקדימה</p>
                    <WhatsAppPreview text={message} />
                  </div>
                )}

                {/* A/B Testing Toggle */}
                <div className="mt-3 border-t border-border pt-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={enableAB} onChange={(e) => {
                      setEnableAB(e.target.checked);
                      if (e.target.checked && variants.length === 0) {
                        setVariants([
                          { name: 'וריאנט A', messageTemplate: message, weight: 50 },
                          { name: 'וריאנט B', messageTemplate: '', weight: 50 },
                        ]);
                      }
                    }} className="rounded border-border" />
                    <span className="text-sm font-medium text-muted">A/B Testing</span>
                    <span className="text-[10px] text-faded">— שלח הודעות שונות לקבוצות שונות ובדוק מה עובד</span>
                  </label>

                  {enableAB && (
                    <div className="mt-3 space-y-3">
                      {variants.map((v, i) => (
                        <div key={i} className="border border-border rounded-lg p-3 bg-cream/30">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {variants.length > 2 && (
                                <button type="button" onClick={() => setVariants(variants.filter((_, j) => j !== i))} className="text-red-500 text-xs hover:text-red-600">הסר</button>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                value={v.name}
                                onChange={(e) => { const u = [...variants]; u[i].name = e.target.value; setVariants(u); }}
                                className="w-28 px-2 py-1 border border-border rounded text-xs text-right"
                                placeholder="שם הוריאנט"
                              />
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={v.weight}
                                  onChange={(e) => { const u = [...variants]; u[i].weight = Number(e.target.value); setVariants(u); }}
                                  min={1} max={100}
                                  className="w-14 px-2 py-1 border border-border rounded text-xs text-center"
                                />
                                <span className="text-[10px] text-muted">%</span>
                              </div>
                            </div>
                          </div>
                          <textarea
                            value={v.messageTemplate}
                            onChange={(e) => { const u = [...variants]; u[i].messageTemplate = e.target.value; setVariants(u); }}
                            rows={3}
                            className="w-full px-3 py-2 border border-border rounded-lg text-sm text-right bg-white"
                            placeholder="תוכן ההודעה לוריאנט זה..."
                            dir="auto"
                          />
                          {v.messageTemplate.trim() && (
                            <div className="mt-1.5 p-2 bg-[#e5ddd5] dark:bg-[#0b141a] rounded-lg">
                              <WhatsAppPreview text={v.messageTemplate} />
                            </div>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setVariants([...variants, { name: `וריאנט ${String.fromCharCode(65 + variants.length)}`, messageTemplate: '', weight: Math.floor(100 / (variants.length + 1)) }])}
                        className="text-xs text-accent hover:text-accent-hover font-medium"
                      >
                        + הוסף וריאנט
                      </button>
                      <div className="text-[10px] text-muted text-right">
                        סה"כ משקל: {variants.reduce((s, v) => s + v.weight, 0)}%
                        {variants.reduce((s, v) => s + v.weight, 0) !== 100 && (
                          <span className="text-amber-500 mr-1">(מומלץ 100%)</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Schedule */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">תזמון שליחה (אופציונלי)</label>
                  <div className="flex items-center gap-2">
                    <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
                      className="flex-1 bg-cream border border-border text-charcoal rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-colors text-right" />
                    {scheduledAt && (
                      <button type="button" onClick={() => setScheduledAt('')} className="text-muted hover:text-red-500 transition-colors flex-shrink-0" title="נקה תזמון">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Delay & daily limit */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">השהיה מינ' (שניות)</label>
                  <input type="number" value={delayMin} onChange={(e) => setDelayMin(Number(e.target.value))} min={5} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">השהיה מקס' (שניות)</label>
                  <input type="number" value={delayMax} onChange={(e) => setDelayMax(Number(e.target.value))} min={delayMin} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">מגבלה יומית/חשבון</label>
                  <input type="number" value={dailyLimit} onChange={(e) => setDailyLimit(Number(e.target.value))} min={1} className={inputClass} />
                  <p className="text-[10px] text-faded mt-1">מספר הודעות מקסימלי ליום לכל חשבון</p>
                </div>
              </div>

              {/* Footer buttons */}
              <div className="flex flex-wrap gap-3 pt-4">
                {isEditing ? (
                  <>
                    <button type="submit" disabled={isBusy || selectedAccountIds.length === 0}
                      className="flex-1 bg-accent hover:bg-accent-hover text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50">
                      {updateMutation.isPending ? 'שומר...' : 'שמור שינויים'}
                    </button>
                    <button type="button" onClick={closeModal}
                      className="flex-1 bg-cream hover:bg-cream-dark text-charcoal font-medium py-3 rounded-lg transition-colors">
                      ביטול
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="submit"
                      disabled={isBusy || selectedAccountIds.length === 0}
                      onClick={() => { pendingAction.current = 'start'; }}
                      className="flex-1 bg-accent hover:bg-accent-hover text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      {isBusy && pendingAction.current === 'start' ? 'מפעיל...' : 'הפעל קמפיין'}
                    </button>
                    <button
                      type="submit"
                      disabled={isBusy || selectedAccountIds.length === 0}
                      onClick={() => { pendingAction.current = 'draft'; }}
                      className="flex-1 bg-cream hover:bg-cream-dark text-charcoal font-medium py-3 rounded-lg transition-colors disabled:opacity-50 border border-border"
                    >
                      {isBusy && pendingAction.current === 'draft' ? 'שומר...' : 'שמור כטיוטה'}
                    </button>
                    <button type="button" onClick={closeModal}
                      className="px-5 bg-white hover:bg-cream text-muted font-medium py-3 rounded-lg transition-colors border border-border">
                      ביטול
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
