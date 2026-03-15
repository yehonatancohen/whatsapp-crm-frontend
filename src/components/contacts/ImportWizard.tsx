import { useState, useRef } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  onImport: (data: { file: File; listName?: string }) => Promise<any>;
  isImporting: boolean;
}

export function ImportWizard({ open, onClose, onImport, isImporting }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [listName, setListName] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  function handleFileSelect(f: File | null) {
    setFile(f);
    if (f && !listName) {
      setListName(f.name.replace(/\.(csv|xlsx|xls)$/i, ''));
    }
  }

  async function handleImport() {
    if (!file) return;
    setError(null);
    setResult(null);
    try {
      const res = await onImport({ file, listName: listName.trim() || undefined });
      setResult(res);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'ייבוא נכשל');
    }
  }

  function handleClose() {
    setFile(null);
    setListName('');
    setResult(null);
    setError(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white border border-border rounded-2xl p-4 sm:p-6 w-full max-w-md shadow-2xl text-right">
        <h2 className="text-lg font-semibold text-charcoal mb-5">ייבוא אנשי קשר</h2>

        {!result ? (
          <>
            <div
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-accent transition-colors"
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
              />
              {file ? (
                <p className="text-charcoal text-sm">{file.name}</p>
              ) : (
                <>
                  <p className="text-muted text-sm mb-1">לחץ לבחירת קובץ</p>
                  <p className="text-faded text-xs">CSV או Excel (.xlsx, .xls)</p>
                </>
              )}
            </div>

            <div className="mt-4">
              <label className="block text-sm text-muted mb-1.5">שם הרשימה</label>
              <input
                type="text"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="לדוגמה: לידים מרץ"
                className="w-full bg-white border border-border text-charcoal rounded-lg px-3.5 py-2.5 text-sm placeholder-faded outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors text-right"
              />
              <p className="text-faded text-xs mt-1">
                אנשי הקשר שיובאו יתווספו לרשימה זו. השאר ריק אם אין ברצונך ליצור רשימה.
              </p>
            </div>

            <p className="text-faded text-xs mt-3">
              עמודות צפויות: phone/phoneNumber, name (אופציונלי), tags (אופציונלי, מופרד בפסיקים)
            </p>

            {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

            <div className="flex justify-start gap-3 mt-5">
              <button
                onClick={handleImport}
                disabled={!file || isImporting}
                className="flex-1 px-5 py-2 text-sm font-medium bg-accent hover:bg-accent-hover disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-lg transition-colors"
              >
                {isImporting ? 'מייבא...' : 'ייבא'}
              </button>
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 text-sm text-muted hover:text-charcoal bg-cream rounded-lg transition-colors"
              >
                ביטול
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between flex-row-reverse">
                <span className="text-muted">סה"כ שורות</span>
                <span className="text-charcoal">{result.total}</span>
              </div>
              <div className="flex justify-between flex-row-reverse">
                <span className="text-muted">נוצרו</span>
                <span className="text-accent">{result.created}</span>
              </div>
              <div className="flex justify-between flex-row-reverse">
                <span className="text-muted">כפילויות (דולגו)</span>
                <span className="text-amber-600">{result.duplicates}</span>
              </div>
              <div className="flex justify-between flex-row-reverse">
                <span className="text-muted">שגיאות</span>
                <span className="text-red-600">{result.errors}</span>
              </div>
              {result.listName && (
                <div className="flex justify-between pt-1 border-t border-border flex-row-reverse">
                  <span className="text-muted">נוסף לרשימה</span>
                  <span className="text-accent">{result.listName}</span>
                </div>
              )}
            </div>

            {/* Error details */}
            {result.errorDetails && result.errorDetails.length > 0 && (
              <div className="mt-4 text-right">
                <p className="text-xs font-medium text-red-600 mb-2">פרטי שגיאות:</p>
                <div className="max-h-40 overflow-y-auto bg-white border border-red-500/20 rounded-lg divide-y divide-border">
                  {result.errorDetails.map((d: any, i: number) => (
                    <div key={i} className="px-3 py-2 text-xs flex justify-between flex-row-reverse">
                      <span className="text-faded">שורה {d.row}</span>
                      {d.phone && <span className="text-muted ml-2">{d.phone}</span>}
                      <span className="text-red-600/80 ml-2">{d.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end mt-5">
              <button
                onClick={handleClose}
                className="w-full px-5 py-2 text-sm font-medium bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors"
              >
                סיום
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
