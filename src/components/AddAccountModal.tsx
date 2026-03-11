import { useState, useEffect } from 'react';
import { extractApiError } from '../lib/errorUtils';

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (label: string, proxy?: string) => Promise<void>;
}

export function AddAccountModal({ open, onClose, onAdd }: Props) {
  const [label, setLabel] = useState('');
  const [proxy, setProxy] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLabel('');
      setProxy('');
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const labelValid = /^[a-zA-Z0-9_-]+$/.test(label.trim());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim() || !labelValid) return;

    setSubmitting(true);
    setError(null);
    try {
      await onAdd(label.trim(), proxy.trim() || undefined);
      onClose();
    } catch (err: unknown) {
      const { message } = extractApiError(err);
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative bg-slate-900 border border-slate-700/50 rounded-2xl p-4 sm:p-6 w-full max-w-md shadow-2xl"
      >
        <h2 className="text-lg font-semibold text-slate-100 mb-5">Add Account</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Account Label</label>
            <input
              type="text"
              placeholder="e.g. account-1"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              autoFocus
              className={`w-full bg-slate-800 border text-slate-100 rounded-lg px-3.5 py-2.5 text-sm placeholder-slate-500 outline-none transition-colors ${
                label.trim() && !labelValid
                  ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                  : 'border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
              }`}
            />
            {label.trim() && !labelValid && (
              <p className="text-red-400 text-xs mt-1">Only letters, numbers, hyphens and underscores allowed.</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Proxy URL <span className="text-slate-600">(optional)</span></label>
            <input
              type="text"
              placeholder="e.g. http://user:pass@host:port"
              value={proxy}
              onChange={(e) => setProxy(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3.5 py-2.5 text-sm placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !label.trim() || !labelValid}
            className="px-5 py-2 text-sm font-medium bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {submitting ? 'Adding...' : 'Add Account'}
          </button>
        </div>
      </form>
    </div>
  );
}
