import { useState, useRef, useEffect } from 'react';
import {
  useConversations,
  useChatMessages,
  useSendMessage,
  useGroupInfo,
  useAddParticipants,
  usePromoteParticipants,
  useDemoteParticipants,
  useRemoveParticipants,
  useUpdateGroupSettings,
  type Conversation,
  type ChatMessage,
  type AddParticipantResult,
} from '../hooks/useChat';
import { useAccounts } from '../hooks/useAccounts';
import { useTheme } from '../context/ThemeContext';

const API_BASE = (import.meta.env.VITE_API_URL || 'https://api.parties247.co.il/api').replace(/\/api\/?$/, '');

function getMediaUrl(accountId: string, chatId: string, messageId: string) {
  const token = localStorage.getItem('accessToken');
  return `${API_BASE}/api/chat/${accountId}/${encodeURIComponent(chatId)}/messages/${encodeURIComponent(messageId)}/media?token=${token}`;
}

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;

function extractUrls(text: string): string[] {
  return text?.match(URL_REGEX) || [];
}

function LinkPreview({ url }: { url: string }) {
  let hostname: string;
  try { hostname = new URL(url).hostname; } catch { return null; }


  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-1.5 rounded-lg border border-border/50 overflow-hidden hover:border-accent/30 transition-colors bg-white/10">
      <div className="px-3 py-2">
        <p className="text-xs font-medium truncate opacity-90">{hostname}</p>
        <p className="text-[10px] opacity-60 truncate" dir="ltr">{url}</p>
      </div>
    </a>
  );
}

function MediaBubble({ msg, accountId, chatId }: { msg: ChatMessage; accountId: string; chatId: string }) {
  const mediaUrl = getMediaUrl(accountId, chatId, msg.id);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="text-xs italic opacity-70 py-1" dir="auto">
        {msg.type === 'image' ? '📷 תמונה' :
         msg.type === 'video' ? '🎥 וידאו' :
         msg.type === 'sticker' ? '🏷️ סטיקר' :
         msg.body || `[${msg.type}]`}
      </div>
    );
  }

  if (msg.type === 'image' || msg.type === 'sticker') {
    return (
      <div className={`${msg.type === 'sticker' ? 'max-w-[120px] sm:max-w-[160px]' : 'max-w-[200px] sm:max-w-[280px]'}`}>
        <img
          src={mediaUrl}
          alt={msg.body || 'תמונה'}
          className="rounded-md max-w-full"
          loading="lazy"
          onError={() => setError(true)}
        />
        {msg.body && msg.type !== 'sticker' && (
          <p className="text-sm mt-1 break-words whitespace-pre-wrap" dir="auto">{msg.body}</p>
        )}
      </div>
    );
  }

  if (msg.type === 'video') {
    return (
      <div className="max-w-[200px] sm:max-w-[280px]">
        <video
          src={mediaUrl}
          controls
          preload="metadata"
          className="rounded-md max-w-full"
          onError={() => setError(true)}
        />
        {msg.body && (
          <p className="text-sm mt-1 break-words whitespace-pre-wrap" dir="auto">{msg.body}</p>
        )}
      </div>
    );
  }

  if (msg.type === 'audio' || msg.type === 'ptt') {
    return (
      <audio src={mediaUrl} controls preload="metadata" className="max-w-[240px]" onError={() => setError(true)} />
    );
  }

  if (msg.type === 'document') {
    return (
      <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 py-1 hover:opacity-80">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
        </svg>
        <span className="text-sm underline">{msg.body || 'מסמך'}</span>
      </a>
    );
  }

  // Fallback
  return (
    <div className="text-xs italic opacity-70 py-1" dir="auto">
      {msg.body || `[${msg.type}]`}
    </div>
  );
}

function formatTime(ts: number) {
  return new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(ts: number) {
  const d = new Date(ts * 1000);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return formatTime(ts);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'אתמול';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function GroupPanel({ accountId, chatId, onClose }: { accountId: string; chatId: string; onClose: () => void }) {
  const { groupInfo, loading, refetch } = useGroupInfo(accountId, chatId);
  const { accounts } = useAccounts();
  const addMutation = useAddParticipants();
  const promoteMutation = usePromoteParticipants();
  const demoteMutation = useDemoteParticipants();
  const removeMutation = useRemoveParticipants();
  const settingsMutation = useUpdateGroupSettings();
  const [phoneInput, setPhoneInput] = useState('');
  const [results, setResults] = useState<Record<string, AddParticipantResult> | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string>>(new Set());
  const [showManualInput, setShowManualInput] = useState(false);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  const canAdd = groupInfo?.iAmAdmin || groupInfo?.canAnyoneAdd;

  // Authenticated accounts not already in the group
  const participantNumbers = new Set(
    (groupInfo?.participants || []).map((p) => p.id.replace('@c.us', '')),
  );
  const availableAccounts = accounts.filter(
    (a) => a.status === 'AUTHENTICATED' && a.phoneNumber && !participantNumbers.has(a.phoneNumber),
  );

  function toggleAccount(id: string) {
    setSelectedAccountIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAddAccounts() {
    const phones = accounts
      .filter((a) => selectedAccountIds.has(a.id) && a.phoneNumber)
      .map((a) => a.phoneNumber!);
    if (phones.length === 0) return;
    if (phones.length > 5) {
      alert('ניתן להוסיף עד 5 משתתפים בכל פעם');
      return;
    }
    try {
      const res = await addMutation.mutateAsync({ accountId, chatId, phoneNumbers: phones });
      setResults(res);
      setSelectedAccountIds(new Set());
    } catch {
      // error handled by mutation
    }
  }

  async function handleAddManual() {
    if (!phoneInput.trim()) return;
    const numbers = phoneInput.split(/[,\n]+/).map(n => n.trim()).filter(Boolean);
    if (numbers.length === 0) return;
    if (numbers.length > 5) {
      alert('ניתן להוסיף עד 5 משתתפים בכל פעם');
      return;
    }
    try {
      const res = await addMutation.mutateAsync({ accountId, chatId, phoneNumbers: numbers });
      setResults(res);
      setPhoneInput('');
    } catch {
      // error handled by mutation
    }
  }

  if (loading) {
    return (
      <div className="absolute inset-0 bg-white z-30 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!groupInfo) return null;

  return (
    <div className="absolute inset-0 bg-white z-30 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center gap-3 bg-cream-dark">
        <button onClick={onClose} className="text-muted hover:text-charcoal">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
        <div className="flex-1 text-right">
          <h3 className="text-charcoal font-semibold">פרטי הקבוצה</h3>
          <p className="text-xs text-muted">{groupInfo.participantCount} משתתפים</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Group Info */}
        <div>
          <h4 className="text-sm font-medium text-charcoal mb-1">{groupInfo.name}</h4>
          {groupInfo.description && (
            <p className="text-xs text-muted" dir="auto">{groupInfo.description}</p>
          )}
        </div>

        {/* Add Participants */}
        {canAdd && (
          <div className="border border-border rounded-lg p-3 bg-cream/50">
            <h4 className="text-sm font-medium text-charcoal mb-2 flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
              הוסף משתתפים
            </h4>

            {!showWarning ? (
              <button
                onClick={() => setShowWarning(true)}
                className="w-full text-sm bg-accent hover:bg-accent-hover text-white font-medium py-2 rounded-lg transition-colors"
              >
                הוסף אנשים לקבוצה
              </button>
            ) : (
              <>
                {/* Warning */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 text-right">
                  <div className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-amber-600 shrink-0 mt-0.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                    <div>
                      <p className="text-sm font-medium text-amber-800">שימו לב - סיכון חסימה</p>
                      <ul className="text-xs text-amber-700 mt-1 space-y-0.5 list-disc list-inside">
                        <li>וואטסאפ עלול לחסום חשבונות שמוסיפים אנשים רבים לקבוצות</li>
                        <li>הוסיפו רק אנשים שמכירים אתכם ושמרו את המספר שלכם</li>
                        <li>מקסימום 5 אנשים בכל פעם, עם השהייה בין כל הוספה</li>
                        <li>אנשים עם הגדרות פרטיות מחמירות יקבלו הזמנה במקום</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Select from accounts */}
                {availableAccounts.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-muted mb-1.5 text-right">בחר מהחשבונות שלך:</p>
                    <div className="space-y-1.5">
                      {availableAccounts.map((a) => (
                        <label
                          key={a.id}
                          className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer transition-colors ${
                            selectedAccountIds.has(a.id)
                              ? 'border-accent bg-accent/5'
                              : 'border-border hover:bg-cream/80'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedAccountIds.has(a.id)}
                            onChange={() => toggleAccount(a.id)}
                            className="accent-accent w-3.5 h-3.5 shrink-0"
                          />
                          <div className="w-7 h-7 rounded-full bg-cream-dark border border-border flex items-center justify-center text-muted shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                          </div>
                          <div className="flex-1 min-w-0 text-right">
                            <span className="text-sm text-charcoal block truncate">{a.label}</span>
                            <span className="text-[11px] text-muted font-mono" dir="ltr">{a.phoneNumber}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                    {selectedAccountIds.size > 0 && (
                      <button
                        onClick={handleAddAccounts}
                        disabled={addMutation.isPending}
                        className="w-full mt-2 text-sm bg-accent hover:bg-accent-hover text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {addMutation.isPending ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            מוסיף...
                          </span>
                        ) : `הוסף ${selectedAccountIds.size} חשבונות`}
                      </button>
                    )}
                  </div>
                )}

                {availableAccounts.length === 0 && !showManualInput && (
                  <p className="text-xs text-muted text-center mb-2">כל החשבונות שלך כבר בקבוצה</p>
                )}

                {/* Manual phone input (collapsible) */}
                {!showManualInput ? (
                  <button
                    onClick={() => setShowManualInput(true)}
                    className="w-full text-xs text-muted hover:text-charcoal py-1.5 transition-colors flex items-center justify-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    הזן מספר טלפון ידנית
                  </button>
                ) : (
                  <div className="border-t border-border pt-3 mt-1">
                    <p className="text-xs text-muted mb-1.5 text-right">הזנה ידנית:</p>
                    <textarea
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="הזן מספרי טלפון (מופרדים בפסיק או שורה חדשה)&#10;דוגמה: 972501234567, 972509876543"
                      dir="ltr"
                      className="w-full bg-white text-charcoal rounded-lg px-3 py-2 text-sm border border-border outline-none placeholder:text-muted focus:ring-1 focus:ring-accent/50 resize-none h-20"
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={handleAddManual}
                        disabled={!phoneInput.trim() || addMutation.isPending}
                        className="flex-1 text-sm bg-accent hover:bg-accent-hover text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {addMutation.isPending ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            מוסיף...
                          </span>
                        ) : 'הוסף'}
                      </button>
                      <button
                        onClick={() => setShowManualInput(false)}
                        className="text-sm text-muted hover:text-charcoal py-2 px-3 transition-colors"
                      >
                        ביטול
                      </button>
                    </div>
                  </div>
                )}

                {/* Cancel all */}
                <button
                  onClick={() => { setShowWarning(false); setResults(null); setSelectedAccountIds(new Set()); setShowManualInput(false); }}
                  className="w-full text-xs text-muted hover:text-charcoal py-1.5 mt-1 transition-colors"
                >
                  ביטול
                </button>
              </>
            )}

            {/* Results */}
            {results && (
              <div className="mt-3 space-y-1.5">
                {Object.entries(results).map(([id, r]) => (
                  <div key={id} className={`flex items-center justify-between text-xs p-2 rounded-md ${r.success ? 'bg-green-50 text-green-700' : r.inviteSent ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
                    <span dir="ltr" className="font-mono">{id.replace('@c.us', '')}</span>
                    <span>{r.success ? 'נוסף' : r.inviteSent ? 'הזמנה נשלחה' : r.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!canAdd && (
          <div className="text-xs text-muted bg-cream/50 border border-border rounded-lg p-3 text-center">
            רק מנהלי הקבוצה יכולים להוסיף משתתפים
          </div>
        )}

        {/* Group Settings (admin only) */}
        {groupInfo.iAmAdmin && groupInfo.settings && (
          <div className="border border-border rounded-lg p-3 bg-cream/50">
            <h4 className="text-sm font-medium text-charcoal mb-2 flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
              הגדרות קבוצה
            </h4>
            <div className="space-y-2">
              {[
                { key: 'messagesAdminsOnly' as const, label: 'רק מנהלים שולחים הודעות', value: groupInfo.settings.messagesAdminsOnly },
                { key: 'infoAdminsOnly' as const, label: 'רק מנהלים עורכים פרטי קבוצה', value: groupInfo.settings.infoAdminsOnly },
                { key: 'addMembersAdminsOnly' as const, label: 'רק מנהלים מוסיפים משתתפים', value: groupInfo.settings.addMembersAdminsOnly },
              ].map((s) => (
                <label key={s.key} className="flex items-center justify-between gap-2 text-xs cursor-pointer">
                  <span className="text-charcoal">{s.label}</span>
                  <button
                    onClick={async () => {
                      try {
                        await settingsMutation.mutateAsync({ accountId, chatId, [s.key]: !s.value });
                        refetch();
                      } catch { /* handled */ }
                    }}
                    disabled={settingsMutation.isPending}
                    className={`relative w-9 h-5 rounded-full transition-colors ${s.value ? 'bg-accent' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${s.value ? 'left-[1.125rem]' : 'left-0.5'}`} />
                  </button>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Participants List */}
        <div>
          <h4 className="text-sm font-medium text-charcoal mb-2">משתתפים ({groupInfo.participantCount})</h4>
          <div className="space-y-1">
            {groupInfo.participants.map((p) => (
              <div key={p.id} className="relative flex items-center justify-between text-sm py-1.5 px-2 rounded hover:bg-cream/50">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-cream-dark border border-border flex items-center justify-center text-muted shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  </div>
                  <div className="min-w-0">
                    {p.name && <span className="text-charcoal text-xs block truncate">{p.name}</span>}
                    <span className="text-muted font-mono text-[11px]" dir="ltr">{p.id.replace('@c.us', '')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {(p.isAdmin || p.isSuperAdmin) && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-light text-accent border border-accent/20">
                      {p.isSuperAdmin ? 'יוצר' : 'מנהל'}
                    </span>
                  )}
                  {/* Admin actions menu */}
                  {groupInfo.iAmAdmin && !p.isSuperAdmin && (
                    <div className="relative">
                      <button
                        onClick={() => setActionMenu(actionMenu === p.id ? null : p.id)}
                        className="text-muted hover:text-charcoal p-0.5 rounded"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                      </button>
                      {actionMenu === p.id && (
                        <div className="absolute left-0 top-full mt-1 bg-white border border-border rounded-lg shadow-lg z-10 py-1 min-w-[140px]">
                          {p.isAdmin ? (
                            <button
                              onClick={async () => {
                                try { await demoteMutation.mutateAsync({ accountId, chatId, participantIds: [p.id] }); refetch(); } catch { /* handled */ }
                                setActionMenu(null);
                              }}
                              disabled={demoteMutation.isPending}
                              className="w-full text-right text-xs px-3 py-1.5 hover:bg-cream/80 text-charcoal"
                            >
                              הסר מנהל
                            </button>
                          ) : (
                            <button
                              onClick={async () => {
                                try { await promoteMutation.mutateAsync({ accountId, chatId, participantIds: [p.id] }); refetch(); } catch { /* handled */ }
                                setActionMenu(null);
                              }}
                              disabled={promoteMutation.isPending}
                              className="w-full text-right text-xs px-3 py-1.5 hover:bg-cream/80 text-charcoal"
                            >
                              הפוך למנהל
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              if (!confirm(`להסיר את ${p.id.replace('@c.us', '')} מהקבוצה?`)) return;
                              try { await removeMutation.mutateAsync({ accountId, chatId, participantIds: [p.id] }); refetch(); } catch { /* handled */ }
                              setActionMenu(null);
                            }}
                            disabled={removeMutation.isPending}
                            className="w-full text-right text-xs px-3 py-1.5 hover:bg-red-50 text-red-600"
                          >
                            הסר מהקבוצה
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChatPage() {
  const { theme } = useTheme();
  const { conversations, loading: loadingConversations } = useConversations();
  const [selectedChat, setSelectedChat] = useState<{ accountId: string; chatId: string; name: string; isGroup: boolean } | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showList, setShowList] = useState(true); // mobile toggle
  const [showGroupPanel, setShowGroupPanel] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, loading: loadingMessages } = useChatMessages(
    selectedChat?.accountId ?? null,
    selectedChat?.chatId ?? null,
  );
  const sendMutation = useSendMessage();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter conversations
  const filtered = searchQuery
    ? conversations.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.accountLabel.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : conversations;

  function handleSelect(conv: Conversation) {
    setSelectedChat({ accountId: conv.accountId, chatId: conv.chatId, name: conv.name, isGroup: conv.isGroup });
    setShowList(false);
    setShowGroupPanel(false);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedChat || !messageText.trim() || sendMutation.isPending) return;
    const text = messageText.trim();
    setMessageText('');
    try {
      await sendMutation.mutateAsync({
        accountId: selectedChat.accountId,
        chatId: selectedChat.chatId,
        body: text,
      });
    } catch {
      setMessageText(text);
    }
    inputRef.current?.focus();
  }

  // Find active conversation metadata
  const activeConv = conversations.find(
    (c) => c.accountId === selectedChat?.accountId && c.chatId === selectedChat?.chatId,
  );

  // Sorted messages (oldest first)
  const sortedMsgs = [...messages].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-[calc(100vh-6rem)] -m-4 md:-m-8 bg-cream overflow-hidden md:rounded-xl shadow-lg border border-border">
      {/* Sidebar: Chat List */}
      <div className={`${showList ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-80 lg:w-96 border-l border-border bg-white flex-shrink-0`}>
        <div className="p-3 bg-cream-dark border-b border-border">
          <h2 className="text-charcoal font-semibold text-lg mb-2">תיבת הודעות</h2>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חפש צ'אטים..."
            className="w-full bg-white text-charcoal rounded-lg px-3 py-2 text-sm border border-border outline-none placeholder:text-muted focus:ring-1 focus:ring-accent/50"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-center text-muted text-sm">
              {searchQuery ? 'לא נמצאו צ\'אטים התואמים לחיפוש' : 'אין צ\'אטים פעילים. חבר חשבון וואטסאפ כדי לראות שיחות כאן.'}
            </div>
          ) : (
            <div className="flex flex-col">
              {filtered.map((chat) => {
                const isSelected = selectedChat?.accountId === chat.accountId && selectedChat?.chatId === chat.chatId;
                return (
                  <button
                    key={`${chat.accountId}-${chat.chatId}`}
                    onClick={() => handleSelect(chat)}
                    className={`flex items-start gap-3 p-3 text-right transition-colors border-b border-border hover:bg-cream ${isSelected ? 'bg-cream-dark' : ''}`}
                  >
                    <div className="w-12 h-12 rounded-full bg-cream-dark border border-border flex-shrink-0 flex items-center justify-center text-muted">
                      {chat.isGroup ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="text-charcoal font-medium truncate pl-2">{chat.name}</span>
                        {chat.timestamp != null && (
                          <span className="text-xs text-muted whitespace-nowrap">{formatDate(chat.timestamp)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        {chat.lastMessage && (
                          <>
                            {chat.lastMessage.fromMe && (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-muted flex-shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                            )}
                            <p className="text-sm text-muted truncate" dir="auto">{chat.lastMessage.body}</p>
                          </>
                        )}
                      </div>
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-light text-accent border border-accent/20">{chat.accountLabel}</span>
                        {chat.unreadCount > 0 && (
                          <span className="bg-accent text-white text-xs px-2 py-0.5 rounded-full">{chat.unreadCount}</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Area: Chat */}
      <div className={`${!showList ? 'flex' : 'hidden'} md:flex flex-col flex-1 bg-cream-dark relative overflow-hidden`}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-3 bg-white border-b border-border flex items-center gap-3 z-10 w-full shadow-sm">
              {/* Back button - mobile */}
              <button onClick={() => setShowList(true)} className="text-muted hover:text-charcoal md:hidden">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
              <div className="w-10 h-10 rounded-full bg-cream border border-border flex items-center justify-center text-muted shrink-0">
                {selectedChat.isGroup ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                )}
              </div>
              <div className="min-w-0 flex-1 text-right">
                <h3 className="text-charcoal font-medium leading-tight truncate">{selectedChat.name}</h3>
                <span className="text-xs text-muted truncate block">באמצעות {activeConv?.accountLabel || selectedChat.accountId}</span>
              </div>
              {selectedChat.isGroup && (
                <button
                  onClick={() => setShowGroupPanel(true)}
                  className="text-muted hover:text-accent transition-colors p-1.5 rounded-lg hover:bg-cream shrink-0"
                  title="פרטי הקבוצה"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
                </button>
              )}
            </div>

            {/* Group Panel Overlay */}
            {showGroupPanel && selectedChat.isGroup && (
              <GroupPanel
                accountId={selectedChat.accountId}
                chatId={selectedChat.chatId}
                onClose={() => setShowGroupPanel(false)}
              />
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1 z-10">
              {loadingMessages ? (
                <div className="flex items-center justify-center flex-1">
                  <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              ) : sortedMsgs.length === 0 ? (
                <div className="flex items-center justify-center flex-1">
                  <div className="text-center py-3 bg-white border border-border rounded-lg px-4 text-sm text-muted shadow-sm">אין הודעות עדיין. תגיד שלום!</div>
                </div>
              ) : (
                <div className="flex flex-col justify-end mt-auto gap-0.5">
                  {sortedMsgs.map((msg, index) => {
                    const prev = index > 0 ? sortedMsgs[index - 1] : null;
                    const showTail = !prev || prev.fromMe !== msg.fromMe;
                    
                    // RTL context: justify-start = right, justify-end = left
                    // User messages (fromMe) → right side → justify-start
                    // Other messages (!fromMe) → left side → justify-end
                    return (
                      <div key={msg.id} className={`flex ${msg.fromMe ? 'justify-start' : 'justify-end'} ${showTail ? 'mt-1' : ''}`}>
                        <div className={`relative max-w-[85%] sm:max-w-[75%] rounded-lg px-3 py-1.5 shadow-sm text-[14.2px] leading-[19px] ${msg.fromMe ? 'bg-accent text-white' : 'bg-white border border-border text-charcoal'} ${showTail ? (msg.fromMe ? 'rounded-tr-none' : 'rounded-tl-none') : ''}`}>
                          {/* Sender Name for Group Chats */}
                          {selectedChat.isGroup && msg.author && !msg.fromMe && (
                            <p className="text-[11px] font-bold mb-0.5 text-accent opacity-90">{msg.author}</p>
                          )}
                          
                          {msg.hasMedia && ['image', 'video', 'audio', 'ptt', 'document', 'sticker'].includes(msg.type) ? (
                            <MediaBubble msg={msg} accountId={selectedChat.accountId} chatId={selectedChat.chatId} />
                          ) : msg.type === 'chat' ? (
                            <>
                              <div className="break-words whitespace-pre-wrap" dir="auto">{msg.body}</div>
                              {extractUrls(msg.body).slice(0, 1).map(url => (
                                <LinkPreview key={url} url={url} />
                              ))}
                            </>
                          ) : (
                            <div className={`break-words whitespace-pre-wrap italic ${msg.fromMe ? 'text-white/70' : 'text-muted'}`} dir="auto">
                              {msg.type === 'image' ? '📷 תמונה' :
                               msg.type === 'video' ? '🎥 וידאו' :
                               msg.type === 'audio' || msg.type === 'ptt' ? '🎵 אודיו' :
                               msg.type === 'document' ? '📄 מסמך' :
                               msg.type === 'sticker' ? '🏷️ סטיקר' :
                               msg.body || `[${msg.type}]`}
                            </div>
                          )}
                          <div className={`flex items-center justify-end gap-1 mt-0.5 ${msg.fromMe ? 'text-white/70' : 'text-muted'}`}>
                            <span className="text-[11px] leading-none">{formatTime(msg.timestamp)}</span>
                            {msg.fromMe && msg.ack != null && (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-[14px] h-[14px] leading-none ${msg.ack >= 2 ? (theme === 'dark' ? 'text-blue-400' : 'text-blue-200') : 'text-white/50'}`}>
                                {msg.ack >= 2 ? (
                                  <><polyline points="20 6 9 17 4 12" /><polyline points="20 10 16 14" /></>
                                ) : (
                                  <polyline points="20 6 9 17 4 12" />
                                )}
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-border flex items-center gap-3 z-10 w-full">
              <input
                ref={inputRef}
                type="text"
                className="flex-1 bg-cream border border-border text-charcoal rounded-lg px-4 py-2.5 outline-none placeholder:text-muted focus:ring-1 focus:ring-accent/50 text-sm"
                dir="auto"
                placeholder="הקלד הודעה"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                disabled={sendMutation.isPending}
              />
              <button
                type="submit"
                disabled={!messageText.trim() || sendMutation.isPending}
                className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white disabled:opacity-50 hover:bg-accent-hover transition-colors shrink-0"
              >
                {sendMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-0.5 rotate-180"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                )}
              </button>
            </form>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center flex-col gap-4 z-10">
            <div className="w-24 h-24 rounded-full bg-accent-light flex items-center justify-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-accent/30"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
            </div>
            <h1 className="text-xl text-charcoal font-medium px-6 text-center bg-white border border-border py-1 rounded-md shadow-sm">תיבת הודעות וואטסאפ</h1>
            <p className="text-muted text-sm text-center max-w-sm px-4 py-2 bg-white border border-border rounded-md shadow-sm">בחר שיחה כדי להתחיל להתכתב מכל החשבונות המחוברים שלך.</p>
          </div>
        )}
      </div>
    </div>
  );
}
