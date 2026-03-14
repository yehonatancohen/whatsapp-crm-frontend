import { useState } from 'react';
import { useContacts, useContactLists } from '../hooks/useContacts';
import { DataTable } from '../components/shared/DataTable';
import { ImportWizard } from '../components/contacts/ImportWizard';

interface Contact {
  id: string;
  phoneNumber: string;
  name: string | null;
  tags: string[];
  createdAt: string;
}

export function ContactsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListError, setNewListError] = useState<string | null>(null);

  const { contacts, pagination, loading, error, deleteContact, importContacts, isImporting } =
    useContacts(page, search || undefined);

  const { lists, createList, deleteList } = useContactLists();

  async function handleCreateList(e: React.FormEvent) {
    e.preventDefault();
    if (!newListName.trim()) return;
    setNewListError(null);
    try {
      await createList({ name: newListName.trim() });
      setNewListName('');
      setShowNewList(false);
    } catch (err: any) {
      setNewListError(err.response?.data?.error || err.message || 'Failed to create list');
    }
  }

  const columns = [
    { key: 'phoneNumber', header: 'Phone Number' },
    {
      key: 'name',
      header: 'Name',
      render: (c: Contact) => c.name || <span className="text-faded">-</span>,
    },
    {
      key: 'tags',
      header: 'Tags',
      render: (c: Contact) =>
        c.tags.length > 0 ? (
          <div className="flex gap-1 flex-wrap">
            {c.tags.map((tag) => (
              <span key={tag} className="text-xs bg-cream text-charcoal px-2 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-faded">-</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      render: (c: Contact) => (
        <button
          onClick={() => deleteContact(c.id)}
          className="text-faded hover:text-red-400 transition-colors"
          title="Delete"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      ),
    },
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">Contacts</h1>
          <p className="text-sm text-faded mt-1">
            {pagination ? `${pagination.total} contacts` : 'Manage your contacts'}
          </p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowNewList(true)}
            className="flex items-center gap-2 bg-cream hover:bg-cream-dark text-charcoal text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New List
          </button>
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 bg-accent hover:bg-accent text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Import
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* New List Form */}
      {showNewList && (
        <div className="bg-white border border-charcoal rounded-xl p-4 shadow-soft mb-4">
          <form onSubmit={handleCreateList} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm text-muted mb-1.5">List Name</label>
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="e.g., VIP Customers"
                autoFocus
                className="w-full bg-white border border-charcoal text-charcoal rounded-lg px-3.5 py-2.5 text-sm placeholder-slate-500 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={!newListName.trim()}
              className="px-4 py-2.5 text-sm font-medium bg-accent hover:bg-accent disabled:bg-cream disabled:text-faded text-white rounded-lg transition-colors"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => { setShowNewList(false); setNewListName(''); setNewListError(null); }}
              className="px-4 py-2.5 text-sm text-muted hover:text-charcoal transition-colors"
            >
              Cancel
            </button>
          </form>
          {newListError && <p className="text-red-400 text-xs mt-2">{newListError}</p>}
        </div>
      )}

      {/* Contact Lists */}
      {lists.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-muted mb-3">Contact Lists</h2>
          <div className="flex flex-wrap gap-2">
            {lists.map((list) => (
              <div
                key={list.id}
                className="flex items-center gap-2 bg-white border border-charcoal rounded-lg px-3 py-2 group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-faded">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <span className="text-sm text-charcoal">{list.name}</span>
                <span className="text-xs text-faded">{list._count.entries}</span>
                <button
                  onClick={() => deleteList(list.id)}
                  className="text-faded hover:text-red-400 transition-colors md:opacity-0 md:group-hover:opacity-100"
                  title="Delete list"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by phone or name..."
          className="w-full max-w-sm bg-white border border-charcoal text-charcoal rounded-lg px-3.5 py-2.5 text-sm placeholder-slate-500 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
        />
      </div>

      <div className="bg-white border border-charcoal rounded-xl">
        <DataTable columns={columns} data={contacts} keyField="id" loading={loading} emptyMessage="No contacts yet. Import a CSV to get started." />
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-faded">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs bg-white border border-charcoal rounded-lg text-charcoal hover:bg-cream disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= pagination.totalPages}
              className="px-3 py-1.5 text-xs bg-white border border-charcoal rounded-lg text-charcoal hover:bg-cream disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <ImportWizard
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={importContacts}
        isImporting={isImporting}
      />
    </>
  );
}
