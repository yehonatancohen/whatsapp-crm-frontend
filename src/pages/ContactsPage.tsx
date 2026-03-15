import { useState } from 'react';
import { useContactLists, useContacts } from '../hooks/useContacts';
import { ImportWizard } from '../components/contacts/ImportWizard';

export function ContactsPage() {
  const { lists, loading, createList, deleteList } = useContactLists();
  const { importContacts, isImporting } = useContacts();

  const [wizardOpen, setWizardOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    await createList({ name: newListName });
    setNewListName('');
    setIsCreating(false);
  };

  return (
    <div className="text-right">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-charcoal">אנשי קשר</h1>
          <p className="text-sm text-muted mt-1">נהל רשימות תפוצה וייבא אנשי קשר</p>
        </div>
        <button
          onClick={() => setWizardOpen(true)}
          className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors self-start sm:self-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          ייבוא אנשי קשר
        </button>
      </div>

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
          <div key={list.id} className="bg-white border border-border rounded-xl p-6 shadow-soft hover:border-accent/20 transition-colors flex flex-col">
            <div className="flex items-start justify-between mb-4 flex-row-reverse">
              <div>
                <h3 className="text-charcoal font-semibold">{list.name}</h3>
                <p className="text-xs text-muted mt-1">{list._count.entries} אנשי קשר</p>
              </div>
              <button
                onClick={() => deleteList(list.id)}
                className="text-faded hover:text-red-500 transition-colors"
                title="מחק רשימה"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
            
            <div className="mt-auto pt-4 border-t border-border flex items-center justify-between flex-row-reverse">
              <span className="text-[10px] text-faded uppercase font-medium">נוצר ב-{new Date(list.createdAt).toLocaleDateString('he-IL')}</span>
              <button className="text-accent hover:text-accent-hover text-xs font-medium">נהל אנשי קשר</button>
            </div>
          </div>
        ))}
      </div>

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
