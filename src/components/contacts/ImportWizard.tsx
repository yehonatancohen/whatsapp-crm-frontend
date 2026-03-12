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
      setError(err.response?.data?.error || err.message || 'Import failed');
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
      <div className="relative bg-slate-900 border border-slate-700/50 rounded-2xl p-4 sm:p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-lg font-semibold text-slate-100 mb-5">Import Contacts</h2>

        {!result ? (
          <>
            <div
              className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:border-slate-600 transition-colors"
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
                <p className="text-slate-200 text-sm">{file.name}</p>
              ) : (
                <>
                  <p className="text-slate-400 text-sm mb-1">Click to select a file</p>
                  <p className="text-slate-600 text-xs">CSV or Excel (.xlsx, .xls)</p>
                </>
              )}
            </div>

            <div className="mt-4">
              <label className="block text-sm text-slate-400 mb-1.5">List Name</label>
              <input
                type="text"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="e.g., March Leads"
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3.5 py-2.5 text-sm placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
              <p className="text-slate-600 text-xs mt-1">
                Imported contacts will be added to this list. Leave empty to skip list creation.
              </p>
            </div>

            <p className="text-slate-600 text-xs mt-3">
              Expected columns: phone/phoneNumber, name (optional), tags (optional, comma-separated)
            </p>

            {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!file || isImporting}
                className="px-5 py-2 text-sm font-medium bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
              >
                {isImporting ? 'Importing...' : 'Import'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Total rows</span>
                <span className="text-slate-200">{result.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Created</span>
                <span className="text-emerald-400">{result.created}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Duplicates (skipped)</span>
                <span className="text-amber-400">{result.duplicates}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Errors</span>
                <span className="text-red-400">{result.errors}</span>
              </div>
              {result.listName && (
                <div className="flex justify-between pt-1 border-t border-slate-800">
                  <span className="text-slate-400">Added to list</span>
                  <span className="text-emerald-400">{result.listName}</span>
                </div>
              )}
            </div>

            {/* Error details */}
            {result.errorDetails && result.errorDetails.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-red-400 mb-2">Error details:</p>
                <div className="max-h-40 overflow-y-auto bg-slate-800/50 border border-red-500/20 rounded-lg divide-y divide-slate-800">
                  {result.errorDetails.map((d: any, i: number) => (
                    <div key={i} className="px-3 py-2 text-xs">
                      <span className="text-slate-500">Row {d.row}</span>
                      {d.phone && <span className="text-slate-400 ml-2">{d.phone}</span>}
                      <span className="text-red-400/80 ml-2">{d.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end mt-5">
              <button
                onClick={handleClose}
                className="px-5 py-2 text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
