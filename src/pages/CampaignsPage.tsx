import { useState } from 'react';
import { useAccounts } from '../hooks/useAccounts';
import { useCampaigns, useCreateCampaign, useCancelCampaign, useDeleteCampaign } from '../hooks/useCampaigns';
import { useContactLists } from '../hooks/useContacts';
import { api } from '../lib/api';
import type { WhatsAppGroup } from '../types';

export function CampaignsPage() {
  const { accounts } = useAccounts();
  const { lists: contactLists } = useContactLists();
  const { data: campaigns = [], isLoading: campaignsLoading } = useCampaigns();
  const createMutation = useCreateCampaign();
  const cancelMutation = useCancelCampaign();
  const deleteMutation = useDeleteCampaign();

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [accountId, setAccountId] = useState('');
  const [recipientType, setRecipientType] = useState<'LIST' | 'GROUP'>('LIST');
  const [contactListId, setContactListId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [delayMin, setDelayMin] = useState(30);
  const [delayMax, setDelayMax] = useState(60);

  const fetchGroups = async (id: string) => {
    setAccountId(id);
    if (!id) {
      setGroups([]);
      return;
    }
    setGroupsLoading(true);
    try {
      const { data } = await api.get(`/accounts/${id}/groups`);
      setGroups(data);
    } catch {
      setGroups([]);
    } finally {
      setGroupsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync({
      name,
      messageTemplate: message,
      type: recipientType === 'GROUP' ? 'GROUP_MESSAGE' : 'DIRECT_MESSAGE',
      contactListId: recipientType === 'LIST' ? contactListId : undefined,
      groupJids: recipientType === 'GROUP' ? [{ jid: groupId }] : undefined,
      messagesPerMinute: Math.floor(60 / ((delayMin + delayMax) / 2)),
    });
    setModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setMessage('');
    setAccountId('');
    setContactListId('');
    setGroupId('');
    setGroups([]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400';
      case 'RUNNING': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'COMPLETED': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'CANCELLED': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
      case 'FAILED': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const translateStatus = (status: string) => {
    switch (status) {
      case 'PENDING': return 'ממתין';
      case 'RUNNING': return 'בהרצה';
      case 'COMPLETED': return 'הושלם';
      case 'CANCELLED': return 'בוטל';
      case 'FAILED': return 'נכשל';
      default: return status;
    }
  }

  return (
    <div className="text-right">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">קמפיינים</h1>
          <p className="text-sm text-muted mt-1">שלח הודעות בתפוצה רחבה לאנשי קשר או קבוצות</p>
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
                <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">שם הקמפיין</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">סטטוס</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">התקדמות</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">תאריך יצירה</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted uppercase tracking-wider">פעולות</th>
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-charcoal">{c.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(c.status)}`}>
                        {translateStatus(c.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 w-24 bg-cream rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent transition-all duration-500"
                            style={{ width: `${(c.sentCount / (c.totalMessages || 1)) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted font-medium" dir="ltr">{c.sentCount}/{c.totalMessages}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-muted">{new Date(c.createdAt).toLocaleDateString('he-IL')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left" dir="ltr">
                      <div className="flex items-center gap-2 justify-end">
                        {c.status === 'RUNNING' && (
                          <button
                            onClick={() => cancelMutation.mutate(c.id)}
                            className="text-amber-600 hover:text-amber-700 text-xs font-medium"
                          >
                            בטל
                          </button>
                        )}
                        <button
                          onClick={() => deleteMutation.mutate(c.id)}
                          className="text-red-500 hover:text-red-600 p-1"
                          title="מחק קמפיין"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
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
          <div className="bg-white border border-border rounded-2xl w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto text-right">
            <div className="flex items-center justify-between mb-6 flex-row-reverse">
              <h2 className="text-xl font-bold text-charcoal">יצירת קמפיין חדש</h2>
              <button onClick={() => setModalOpen(false)} className="text-muted hover:text-charcoal transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-muted mb-1.5">חשבון שולח</label>
                  <select
                    value={accountId}
                    onChange={(e) => fetchGroups(e.target.value)}
                    required
                    className="w-full bg-cream border border-border text-charcoal rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-colors"
                  >
                    <option value="">בחר חשבון...</option>
                    {accounts.filter(a => a.status === 'AUTHENTICATED').map(a => (
                      <option key={a.id} value={a.id}>{a.label} (+{a.phoneNumber})</option>
                    ))}
                  </select>
                </div>
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
                    <span className="text-sm text-charcoal">קבוצת וואטסאפ</span>
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
                  <label className="block text-sm font-medium text-muted mb-1.5">בחר קבוצה</label>
                  <select
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    required
                    disabled={!accountId || groupsLoading}
                    className="w-full bg-cream border border-border text-charcoal rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-colors"
                  >
                    <option value="">{groupsLoading ? 'טוען קבוצות...' : 'בחר קבוצה...'}</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
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

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">השהיה מינימלית (שניות)</label>
                  <input
                    type="number"
                    value={delayMin}
                    onChange={(e) => setDelayMin(Number(e.target.value))}
                    min={5}
                    className="w-full bg-cream border border-border text-charcoal rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-1.5">השהיה מקסימלית (שניות)</label>
                  <input
                    type="number"
                    value={delayMax}
                    onChange={(e) => setDelayMax(Number(e.target.value))}
                    min={delayMin}
                    className="w-full bg-cream border border-border text-charcoal rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 bg-accent hover:bg-accent-hover text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending ? 'יוצר קמפיין...' : 'הפעל קמפיין'}
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
