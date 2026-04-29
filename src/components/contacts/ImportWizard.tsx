import { useState, useRef } from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';

type Mode = 'file' | 'text';

interface Props {
  open: boolean;
  onClose: () => void;
  onImport: (data: { file: File; listName?: string }) => Promise<any>;
  isImporting: boolean;
}

function parsePhoneLines(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function phonesToCsvFile(phones: string[]): File {
  const rows = ['phoneNumber', ...phones].join('\n');
  const blob = new Blob([rows], { type: 'text/csv' });
  return new File([blob], 'phones.csv', { type: 'text/csv' });
}

export function ImportWizard({ open, onClose, onImport, isImporting }: Props) {
  const [mode, setMode] = useState<Mode>('file');
  const [file, setFile] = useState<File | null>(null);
  const [phoneText, setPhoneText] = useState('');
  const [listName, setListName] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useScrollLock(open);

  if (!open) return null;

  function handleFileSelect(f: File | null) {
    setFile(f);
    if (f && !listName) {
      setListName(f.name.replace(/\.(csv|xlsx|xls)$/i, ''));
    }
  }

  function handleModeSwitch(m: Mode) {
    setMode(m);
    setError(null);
  }

  async function handleImport() {
    setError(null);
    setResult(null);
    try {
      let fileToSend: File;
      if (mode === 'file') {
        if (!file) return;
        fileToSend = file;
      } else {
        const phones = parsePhoneLines(phoneText);
        if (phones.length === 0) {
          setError('יש להזין לפחות מספר טלפון אחד');
          return;
        }
        fileToSend = phonesToCsvFile(phones);
      }
      const res = await onImport({ file: fileToSend, listName: listName.trim() || undefined });
      setResult(res);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'ייבוא נכשל');
    }
  }

  function handleClose() {
    setFile(null);
    setPhoneText('');
    setListName('');
    setResult(null);
    setError(null);
    setMode('file');
    onClose();
  }

  const canImport = mode === 'file' ? !!file : phoneText.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white border border-border rounded-2xl p-4 sm:p-6 w-full max-w-md shadow-2xl text-right">
        <h2 className="text-lg font-semibold text-charcoal mb-4">ייבוא אנשי קשר</h2>

        {!result ? (
          <>
            {/* Mode tabs */}
            <div className="flex gap-1 mb-4 bg-cream rounded-lg p-1">
              <button
                onClick={() => handleModeSwitch('file')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  mode === 'file'
                    ? 'bg-white text-charcoal shadow-sm'
                    : 'text-muted hover:text-charcoal'
                }`}
              >
                קובץ
              </button>
              <button
                onClick={() => handleModeSwitch('text')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  mode === 'text'
                    ? 'bg-white text-charcoal shadow-sm'
                    : 'text-muted hover:text-charcoal'
                }`}
              >
                הדבק מספרים
              </button>
            </div>

            {mode === 'file' ? (
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
                <p className="text-faded text-xs mt-3">
                  עמודות צפויות: phone/phoneNumber, name (אופציונלי), tags (אופציונלי, מופרד בפסיקים)
                </p>
              </>
            ) : (
              <>
                <textarea
                  value={phoneText}
                  onChange={(e) => setPhoneText(e.target.value)}
                  placeholder={`0501234567\n0521234567\n0541234567`}
                  rows={7}
                  className="w-full bg-white border border-border text-charcoal rounded-lg px-3.5 py-2.5 text-sm placeholder-faded outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors resize-none text-right font-mono"
                  dir="ltr"
                />
                <p className="text-faded text-xs mt-1.5">
                  הזן מספר טלפון אחד בכל שורה (או מופרדים בפסיקים)
                </p>
              </>
            )}

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

            {error && <p className="text-red-600 text-sm mt-3">{error}</p>}

            <div className="flex justify-start gap-3 mt-5">
              <button
                onClick={handleImport}
                disabled={!canImport || isImporting}
                className="flex-1 px-5 py-2 text-sm font-medium bg-accent hover:bg-accent-hover disabled:bg-gray-200 disabled:text-gray-400 text-[#ffffff] rounded-lg transition-colors"
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
                className="w-full px-5 py-2 text-sm font-medium bg-accent hover:bg-accent-hover text-[#ffffff] rounded-lg transition-colors"
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
