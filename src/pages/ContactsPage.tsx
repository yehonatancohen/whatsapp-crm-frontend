import { useState } from 'react';
import { useContacts } from '../hooks/useContacts';
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

  const { contacts, pagination, loading, error, deleteContact, importContacts, isImporting } =
    useContacts(page, search || undefined);

  const columns = [
    { key: 'phoneNumber', header: 'Phone Number' },
    {
      key: 'name',
      header: 'Name',
      render: (c: Contact) => c.name || <span className="text-slate-600">-</span>,
    },
    {
      key: 'tags',
      header: 'Tags',
      render: (c: Contact) =>
        c.tags.length > 0 ? (
          <div className="flex gap-1 flex-wrap">
            {c.tags.map((tag) => (
              <span key={tag} className="text-xs bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-slate-600">-</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      render: (c: Contact) => (
        <button
          onClick={() => deleteContact(c.id)}
          className="text-slate-600 hover:text-red-400 transition-colors"
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Contacts</h1>
          <p className="text-sm text-slate-500 mt-1">
            {pagination ? `${pagination.total} contacts` : 'Manage your contacts'}
          </p>
        </div>
        <button
          onClick={() => setImportOpen(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Import
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
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
          className="w-full max-w-sm bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3.5 py-2.5 text-sm placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
        />
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl">
        <DataTable columns={columns} data={contacts} keyField="id" loading={loading} emptyMessage="No contacts yet. Import a CSV to get started." />
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-slate-500">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= pagination.totalPages}
              className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
