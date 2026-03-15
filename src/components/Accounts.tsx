import { useState } from 'react';
import { useAccounts } from '../hooks/useAccounts';
import { AccountCard } from './AccountCard';
import { AddAccountModal } from './AddAccountModal';

export function Accounts() {
    const { accounts, loading, error, addAccount, removeAccount, renameAccount } = useAccounts();
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-charcoal">WhatsApp Accounts</h1>
                    <p className="text-sm text-muted mt-1">Manage and connect your numbers</p>
                </div>
                <button
                    onClick={() => setModalOpen(true)}
                    className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors self-start sm:self-auto"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Account
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6">
                    <p className="text-red-600 text-sm">Backend error: {error}</p>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <svg className="animate-spin w-6 h-6 text-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                </div>
            )}

            {/* Account Cards */}
            {!loading && accounts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {accounts.map((account) => (
                        <AccountCard
                            key={account.id}
                            account={account}
                            onRemove={removeAccount}
                            onRename={renameAccount}
                        />
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && accounts.length === 0 && !error && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-cream border border-border flex items-center justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-muted">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>
                    <h3 className="text-ink font-medium mb-1">No accounts yet</h3>
                    <p className="text-muted text-sm mb-4">Add your first WhatsApp account to get started.</p>
                    <button
                        onClick={() => setModalOpen(true)}
                        className="text-accent hover:text-accent-hover text-sm font-medium transition-colors"
                    >
                        + Add Account
                    </button>
                </div>
            )}

            {/* Modal */}
            <AddAccountModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onAdd={addAccount}
            />
        </>
    );
}
