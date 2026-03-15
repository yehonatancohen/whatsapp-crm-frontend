import { useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (label: string, proxy?: string) => Promise<void>;
}

export function AddAccountModal({ open, onClose, onAdd }: Props) {
  const [label, setLabel] = useState('');
  const [proxy, setProxy] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onAdd(label, proxy || undefined);
      setLabel('');
      setProxy('');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'נכשל בהוספת חשבון');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white border border-border rounded-2xl w-full max-w-md p-6 shadow-xl text-right">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-charcoal">הוספת חשבון וואטסאפ</h2>
          <button onClick={onClose} className="text-muted hover:text-charcoal transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">שם החשבון (לדוגמה: שירות לקוחות)</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              autoFocus
              className="w-full bg-cream border border-border text-charcoal rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors text-right"
              placeholder="הכנס שם לחשבון"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-1.5">פרוקסי (אופציונלי)</label>
            <input
              type="text"
              value={proxy}
              onChange={(e) => setProxy(e.target.value)}
              className="w-full bg-cream border border-border text-charcoal rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors text-left"
              placeholder="http://user:pass@host:port"
              dir="ltr"
            />
            <p className="text-[10px] text-faded mt-1.5">השתמש בפרוקסי אם ברצונך לשייך את החשבון למיקום ספציפי.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !label.trim()}
              className="flex-1 bg-accent hover:bg-accent-hover text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'יוצר...' : 'צור חשבון'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-cream hover:bg-cream-dark text-charcoal font-medium py-2.5 rounded-lg transition-colors"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
