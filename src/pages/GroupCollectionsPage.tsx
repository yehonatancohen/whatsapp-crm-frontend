import { useState, useEffect, useMemo } from 'react';
import { useScrollLock } from '../hooks/useScrollLock';
import { useAccounts } from '../hooks/useAccounts';
import { useGroupCollections, useGroupCollectionDetail } from '../hooks/useGroupCollections';
import { api } from '../lib/api';
import type { WhatsAppGroup } from '../types';

export function GroupCollectionsPage() {
  const { collections, loading, createCollection, deleteCollection, isCreating } = useGroupCollections();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  useScrollLock(modalOpen);

  const openCreate = () => {
    setEditId(null);
    setModalOpen(true);
  };

  const openEdit = (id: string) => {
    setEditId(id);
    setModalOpen(true);
  };

  return (
    <div className="text-right">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">אוספי קבוצות</h1>
          <p className="text-sm text-muted mt-1">צור אוספים של קבוצות לשימוש חוזר בקמפיינים וקידומים</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-[#ffffff] text-sm font-medium px-4 py-2.5 rounded-lg transition-colors self-start sm:self-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          אוסף חדש
        </button>
      </div>

      {/* Collections Table */}
      <div className="bg-white border border-border rounded-xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-cream-dark/50 border-b border-border">
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-muted uppercase tracking-wider">שם</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-muted uppercase tracking-wider hidden sm:table-cell">תיאור</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-muted uppercase tracking-wider">קבוצות</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-muted uppercase tracking-wider hidden md:table-cell">נוצר</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-muted uppercase tracking-wider">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-muted">טוען...</td></tr>
              ) : collections.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-muted">לא נמצאו אוספי קבוצות</td></tr>
              ) : collections.map(c => (
                <tr key={c.id} className="hover:bg-cream/30 transition-colors">
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <div className="text-sm font-medium text-charcoal">{c.name}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                    <div className="text-xs text-muted truncate max-w-[200px]">{c.description || '-'}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-muted">{c._count.entries}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                    <div className="text-xs text-muted">{new Date(c.createdAt).toLocaleDateString('he-IL')}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(c.id)} className="text-accent hover:text-accent-hover text-xs font-medium">
                        ערוך
                      </button>
                      <button
                        onClick={() => { if (confirm('למחוק אוסף זה?')) deleteCollection(c.id); }}
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

      {/* Create/Edit Modal */}
      {modalOpen && (
        <CollectionModal
          editId={editId}
          onClose={() => { setModalOpen(false); setEditId(null); }}
          onCreate={createCollection}
          isCreating={isCreating}
        />
      )}
    </div>
  );
}

// ─── Collection Modal ───────────────────────────────────────────

function CollectionModal({
  editId,
  onClose,
  onCreate,
  isCreating,
}: {
  editId: string | null;
  onClose: () => void;
  onCreate: (data: { name: string; description?: string }) => Promise<unknown>;
  isCreating: boolean;
}) {
  const { accounts } = useAccounts();
  const { collection: existing, replaceGroups, updateCollection, isSaving } = useGroupCollectionDetail(editId);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [selectedGroupJids, setSelectedGroupJids] = useState<string[]>([]);
  const [accountGroups, setAccountGroups] = useState<Record<string, WhatsAppGroup[]>>({});
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const activeAccounts = accounts.filter(a => a.status === 'AUTHENTICATED');

  // Load existing collection data
  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setDescription(existing.description || '');
      setSelectedGroupJids(existing.entries.map(e => e.groupJid));
    }
  }, [existing]);

  // Fetch groups for selected accounts
  useEffect(() => {
    const fetchGroups = async () => {
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
    if (selectedAccountIds.length > 0) fetchGroups();
  }, [selectedAccountIds]);

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

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return allGroups;
    const q = searchQuery.toLowerCase();
    return allGroups.filter(g => g.name.toLowerCase().includes(q));
  }, [allGroups, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editId) {
      // Update name/description
      await updateCollection({ id: editId, name, description: description || undefined });
      // Replace groups
      if (selectedGroupJids.length > 0) {
        const groupData = selectedGroupJids.map(jid => {
          const g = allGroups.find(g => g.id === jid);
          return { jid, name: g?.name };
        });
        await replaceGroups({ id: editId, groups: groupData });
      }
    } else {
      // Create collection, then add groups
      const created = await onCreate({ name, description: description || undefined }) as { id: string };
      if (created?.id && selectedGroupJids.length > 0) {
        const groupData = selectedGroupJids.map(jid => {
          const g = allGroups.find(g => g.id === jid);
          return { jid, name: g?.name };
        });
        // Use the API directly since we need the new collection ID
        await api.put(`/group-collections/${created.id}/groups`, { groups: groupData });
      }
    }

    onClose();
  };

  const busy = isCreating || isSaving;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white border border-border rounded-2xl w-full max-w-2xl p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto text-right">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-charcoal">{editId ? 'עריכת אוסף' : 'אוסף חדש'}</h2>
          <button onClick={onClose} className="text-muted hover:text-charcoal transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">שם האוסף</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full bg-cream border border-border text-charcoal rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors text-right"
              placeholder="קבוצות שיווק"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">תיאור (אופציונלי)</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-cream border border-border text-charcoal rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-colors text-right"
              placeholder="כל קבוצות השיווק הפעילות"
            />
          </div>

          {/* Accounts */}
          <div>
            <label className="block text-sm font-medium text-muted mb-2">בחר חשבונות (כדי לראות קבוצות)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 bg-cream border border-border rounded-lg">
              {activeAccounts.length === 0 ? (
                <p className="text-xs text-muted p-2 col-span-full text-center">אין חשבונות מחוברים</p>
              ) : activeAccounts.map(a => (
                <label key={a.id} className="flex items-center gap-2 p-2 hover:bg-white rounded transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedAccountIds.includes(a.id)}
                    onChange={() => setSelectedAccountIds(prev =>
                      prev.includes(a.id) ? prev.filter(i => i !== a.id) : [...prev, a.id]
                    )}
                    className="accent-accent"
                  />
                  <span className="text-sm text-charcoal">{a.label}</span>
                  <span className="text-[10px] text-muted" dir="ltr">{a.phoneNumber ? `+${a.phoneNumber}` : ''}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Groups */}
          <div>
            <label className="block text-sm font-medium text-muted mb-2">קבוצות</label>
            {selectedAccountIds.length === 0 ? (
              <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">בחר חשבונות תחילה כדי לראות קבוצות</p>
            ) : (
              <>
                {/* Search */}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-cream border border-border text-charcoal rounded-lg px-3 py-2 text-sm outline-none focus:border-accent transition-colors text-right mb-2"
                  placeholder="חפש קבוצה..."
                />
                <div className="max-h-56 overflow-y-auto p-2 bg-cream border border-border rounded-lg space-y-1">
                  {groupsLoading ? (
                    <p className="text-xs text-muted p-2 text-center">טוען קבוצות...</p>
                  ) : filteredGroups.length === 0 ? (
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
                      {filteredGroups.map(g => (
                        <label key={g.id} className="flex items-center gap-2 p-2 hover:bg-white rounded transition-colors cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedGroupJids.includes(g.id)}
                            onChange={() => setSelectedGroupJids(prev =>
                              prev.includes(g.id) ? prev.filter(j => j !== g.id) : [...prev, g.id]
                            )}
                            className="accent-accent"
                          />
                          <span className="text-sm text-charcoal">{g.name}</span>
                          <span className="text-[10px] text-muted">{g.participantsCount} משתתפים</span>
                        </label>
                      ))}
                    </>
                  )}
                </div>
              </>
            )}
            {selectedGroupJids.length > 0 && (
              <p className="text-[10px] text-accent mt-1">{selectedGroupJids.length} קבוצות נבחרו</p>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={busy || !name.trim()}
              className="flex-1 bg-accent hover:bg-accent-hover text-[#ffffff] font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {busy ? 'שומר...' : editId ? 'עדכן אוסף' : 'צור אוסף'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-cream hover:bg-cream-dark text-charcoal font-medium py-3 rounded-lg transition-colors"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
