import { useState } from 'react';
import { useContactLists, useContacts } from '../hooks/useContacts';
import { ImportWizard } from '../components/contacts/ImportWizard';
import { DataTable } from '../components/shared/DataTable';

type Tab = 'all' | 'lists';

export function ContactsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  const { lists, loading: listsLoading, deleteList, addContactsToList } = useContactLists();
  const { contacts, loading: contactsLoading, importContacts, isImporting, deleteContact, pagination } = useContacts(page, search);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAddingToList, setIsAddingToList] = useState(false);
  const [targetListId, setTargetListId] = useState('');

  // Selection handlers
  const handleSelect = (id: string | number) => {
    const next = new Set(selectedIds);
    if (next.has(String(id))) next.delete(String(id));
    else next.add(String(id));
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === contacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(contacts.map(c => c.id)));
    }
  };

  const handleBatchAddToList = async () => {
    if (!targetListId || selectedIds.size === 0) return;
    setIsAddingToList(true);
    try {
      await addContactsToList({ listId: targetListId, contactIds: Array.from(selectedIds) });
      setSelectedIds(new Set());
      setTargetListId('');
      alert('אנשי הקשר נוספו לרשימה בהצלחה');
    } catch (err) {
      alert('שגיאה בהוספת אנשי קשר לרשימה');
    } finally {
      setIsAddingToList(false);
    }
  };

  const columns = [
    { header: 'שם', accessor: (c: any) => c.name || 'ללא שם', className: 'font-medium' },
    { header: 'מספר טלפון', accessor: (c: any) => <span dir="ltr">+{c.phoneNumber}</span> },
    { header: 'תגיות', accessor: (c: any) => (
      <div className="flex flex-wrap gap-1">
        {c.tags.map((t: string) => (
          <span key={t} className="text-[10px] bg-cream px-1.5 py-0.5 rounded border border-border">{t}</span>
        ))}
      </div>
    )},
    { header: 'תאריך יצירה', accessor: (c: any) => new Date(c.createdAt).toLocaleDateString('he-IL') },
    { header: '', accessor: (c: any) => (
      <button onClick={() => deleteContact(c.id)} className="text-faded hover:text-red-500 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    )},
  ];

  return (
    <div className="text-right">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">אנשי קשר</h1>
          <p className="text-sm text-muted mt-1">נהל את כל רשימת אנשי הקשר שלך</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setWizardOpen(true)}
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            ייבוא
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'all' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-charcoal'}`}
        >
          כל אנשי הקשר
        </button>
        <button
          onClick={() => setActiveTab('lists')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'lists' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-charcoal'}`}
        >
          רשימות תפוצה
        </button>
      </div>

      {activeTab === 'all' ? (
        <div className="space-y-4">
          {/* Toolbar for selection */}
          {selectedIds.size > 0 && (
            <div className="bg-accent-light border border-accent/20 rounded-xl p-4 mb-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
              <div className="text-sm font-medium text-accent">
                {selectedIds.size} אנשי קשר נבחרו
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <select
                  value={targetListId}
                  onChange={(e) => setTargetListId(e.target.value)}
                  className="flex-1 sm:w-48 bg-white border border-accent/20 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="">הוסף לרשימה...</option>
                  {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
                <button
                  onClick={handleBatchAddToList}
                  disabled={!targetListId || isAddingToList}
                  className="bg-accent text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  בצע הוספה
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="text-accent hover:underline text-xs font-medium"
                >
                  ביטול
                </button>
              </div>
            </div>
          )}

          <div className="relative max-w-sm ml-auto">
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="חפש לפי שם או מספר..."
              className="w-full bg-white border border-border text-charcoal rounded-lg pr-10 pl-3 py-2 text-sm outline-none focus:border-accent transition-colors text-right"
            />
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-muted absolute right-3 top-1/2 -translate-y-1/2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          <DataTable
            columns={columns}
            data={contacts}
            isLoading={contactsLoading}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            onSelectAll={handleSelectAll}
            isAllSelected={contacts.length > 0 && selectedIds.size === contacts.length}
          />

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 rounded-lg border border-border hover:bg-cream disabled:opacity-30 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 rotate-180">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <span className="text-sm text-muted">עמוד {page} מתוך {pagination.totalPages}</span>
              <button
                disabled={page === pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 rounded-lg border border-border hover:bg-cream disabled:opacity-30 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            </div>
          )}
        </div>
      ) : (
        <ContactListsView lists={lists} loading={listsLoading} onDelete={deleteList} />
      )}

      {/* Import Wizard */}
      <ImportWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onImport={importContacts}
        isImporting={isImporting}
      />
    </div>
  );
}

function ContactListsView({ lists, loading, onDelete }: { lists: any[], loading: boolean, onDelete: (id: string) => void }) {
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const { createList } = useContactLists();

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    await createList({ name: newListName });
    setNewListName('');
    setIsCreating(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Add New List Card */}
      <div className="bg-white border border-border border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-cream/50 transition-colors group">
        {isCreating ? (
          <form onSubmit={handleCreateList} className="w-full">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              autoFocus
              placeholder="שם הרשימה..."
              className="w-full bg-cream border border-border text-charcoal rounded-lg px-3 py-2 text-sm outline-none focus:border-accent mb-3 text-right"
            />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-accent text-white text-xs font-medium py-2 rounded-lg">צור</button>
              <button type="button" onClick={() => setIsCreating(false)} className="flex-1 bg-cream text-charcoal text-xs font-medium py-2 rounded-lg">ביטול</button>
            </div>
          </form>
        ) : (
          <button onClick={() => setIsCreating(true)} className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-accent-light text-accent flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <h3 className="text-charcoal font-medium">רשימה חדשה</h3>
            <p className="text-xs text-muted mt-1">צור רשימת אנשי קשר ריקה</p>
          </button>
        )}
      </div>

      {/* List Cards */}
      {loading ? (
        <div className="col-span-full py-12 flex justify-center">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : lists.map((list) => (
        <div key={list.id} className="bg-white border border-border rounded-xl p-6 shadow-soft hover:border-accent/20 transition-colors flex flex-col text-right">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-charcoal font-semibold">{list.name}</h3>
              <p className="text-xs text-muted mt-1">{list._count.entries} אנשי קשר</p>
            </div>
            <button
              onClick={() => onDelete(list.id)}
              className="text-faded hover:text-red-500 transition-colors"
              title="מחק רשימה"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
          
          <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
            <span className="text-[10px] text-faded uppercase font-medium">נוצר ב-{new Date(list.createdAt).toLocaleDateString('he-IL')}</span>
            <button className="text-accent hover:text-accent-hover text-xs font-medium">נהל אנשי קשר</button>
          </div>
        </div>
      ))}
    </div>
  );
}
