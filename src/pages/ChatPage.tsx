import { useState, useRef, useEffect } from 'react';
import {
  useConversations,
  useChatMessages,
  useSendMessage,
  useSendVoice,
  useMarkSeen,
  useDeleteMessage,
  useGroupInfo,
  useAddParticipants,
  usePromoteParticipants,
  useDemoteParticipants,
  useRemoveParticipants,
  useUpdateGroupSettings,
  useGroupInviteLink,
  type Conversation,
  type ChatMessage,
  type AddParticipantResult,
} from '../hooks/useChat';
import { useAccounts } from '../hooks/useAccounts';
import { useTheme } from '../context/ThemeContext';
import { useCreateScheduledMessage } from '../hooks/useScheduledMessages';

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
      <div className={`${msg.type === 'sticker' ? 'max-w-[120px] sm:max-w-[160px]' : 'max-w-full'}`}>
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
      <div className="max-w-full">
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
      <audio src={mediaUrl} controls preload="metadata" className="max-w-full" onError={() => setError(true)} />
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

function formatDateSeparator(ts: number) {
  const d = new Date(ts * 1000);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'היום';
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'אתמול';
  return d.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
}

function sameDay(ts1: number, ts2: number) {
  return new Date(ts1 * 1000).toDateString() === new Date(ts2 * 1000).toDateString();
}

// Deterministic per-author color from a fixed palette (WhatsApp-style)
const AUTHOR_COLORS = ['#e91e8c','#0099cc','#00bfa5','#7c4dff','#ff6d00','#388e3c','#c62828','#1565c0'];
function authorColor(authorId: string) {
  let hash = 0;
  for (let i = 0; i < authorId.length; i++) hash = (hash * 31 + authorId.charCodeAt(i)) >>> 0;
  return AUTHOR_COLORS[hash % AUTHOR_COLORS.length];
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
  const [showInviteLink, setShowInviteLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const { data: inviteLinkData, isLoading: inviteLinkLoading } = useGroupInviteLink(accountId, chatId, showInviteLink);

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
      if (Object.values(res).some(r => r.inviteSent)) setShowInviteLink(true);
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
      if (Object.values(res).some(r => r.inviteSent)) setShowInviteLink(true);
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

        {/* Invite Link */}
        {groupInfo.iAmAdmin && (
          <div className="border border-border rounded-lg p-3 bg-cream/50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-charcoal flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                לינק הצטרפות לקבוצה
              </h4>
              {!showInviteLink && (
                <button
                  onClick={() => setShowInviteLink(true)}
                  className="text-xs text-accent hover:text-accent-hover font-medium"
                >
                  הצג
                </button>
              )}
            </div>
            {showInviteLink && (
              inviteLinkLoading ? (
                <div className="flex items-center justify-center py-2">
                  <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              ) : inviteLinkData?.inviteLink ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-white border border-border rounded-lg p-2">
                    <p className="text-xs text-charcoal flex-1 break-all" dir="ltr">{inviteLinkData.inviteLink}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(inviteLinkData.inviteLink);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="flex-1 text-xs bg-accent hover:bg-accent-hover text-white font-medium py-1.5 rounded-lg transition-colors"
                    >
                      {copiedLink ? '✓ הועתק!' : 'העתק לינק'}
                    </button>
                    <button
                      onClick={() => setShowInviteLink(false)}
                      className="text-xs text-muted hover:text-charcoal py-1.5 px-3 transition-colors"
                    >
                      הסתר
                    </button>
                  </div>
                  <p className="text-[10px] text-muted">שלח לינק זה לאנשים שרוצים להצטרף לקבוצה</p>
                </div>
              ) : (
                <p className="text-xs text-red-500">לא ניתן לקבל לינק כעת</p>
              )
            )}
          </div>
        )}

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
                  <div key={id} className={`text-xs p-2 rounded-md ${r.success ? 'bg-green-50 text-green-700' : r.inviteSent ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
                    <div className="flex items-center justify-between">
                      <span dir="ltr" className="font-mono">{id.replace('@c.us', '')}</span>
                      <span>{r.success ? 'נוסף ✓' : r.inviteSent ? 'הזמנה נשלחה' : r.message}</span>
                    </div>
                    {r.inviteSent && (
                      <p className="text-[10px] mt-1 text-blue-600">הגדרות פרטיות מנעו הוספה ישירה — ניתן לשלוח לינק הצטרפות במקום (ראה "לינק הצטרפות" למעלה)</p>
                    )}
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
  const { accounts } = useAccounts();
  const [selectedChat, setSelectedChat] = useState<{ accountId: string; chatId: string; name: string; isGroup: boolean } | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showList, setShowList] = useState(true);
  const [showGroupPanel, setShowGroupPanel] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [msgLimit, setMsgLimit] = useState(100);

  // New chat
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatPhone, setNewChatPhone] = useState('');
  const [newChatAccountId, setNewChatAccountId] = useState('');

  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scheduleMutation = useCreateScheduledMessage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, loading: loadingMessages } = useChatMessages(
    selectedChat?.accountId ?? null,
    selectedChat?.chatId ?? null,
    msgLimit,
  );
  const sendMutation = useSendMessage();
  const sendVoiceMutation = useSendVoice();
  const markSeen = useMarkSeen();
  const deleteMessage = useDeleteMessage();

  // Reset limit when switching chats
  useEffect(() => { setMsgLimit(100); }, [selectedChat?.accountId, selectedChat?.chatId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark chat as seen when opened
  useEffect(() => {
    if (!selectedChat) return;
    markSeen.mutateAsync({ accountId: selectedChat.accountId, chatId: selectedChat.chatId }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat?.accountId, selectedChat?.chatId]);

  // Pre-select first authenticated account for new chat modal
  useEffect(() => {
    if (!newChatAccountId) {
      const first = accounts.find(a => a.status === 'AUTHENTICATED');
      if (first) setNewChatAccountId(first.id);
    }
  }, [accounts, newChatAccountId]);

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

  function handleNewChat() {
    if (!newChatPhone.trim() || !newChatAccountId) return;
    const phone = newChatPhone.trim().replace(/[\s\-+()]/g, '');
    const chatId = `${phone}@c.us`;
    setSelectedChat({ accountId: newChatAccountId, chatId, name: newChatPhone.trim(), isGroup: false });
    setShowNewChat(false);
    setShowList(false);
    setNewChatPhone('');
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedChat || !messageText.trim() || sendMutation.isPending) return;
    const text = messageText.trim();
    const quotedId = replyTo?.id;
    setMessageText('');
    setReplyTo(null);
    try {
      await sendMutation.mutateAsync({
        accountId: selectedChat.accountId,
        chatId: selectedChat.chatId,
        body: text,
        quotedMessageId: quotedId,
        _limit: msgLimit,
      });
    } catch {
      setMessageText(text);
    }
    inputRef.current?.focus();
  }

  async function startRecording() {
    if (!selectedChat) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
        ? 'audio/ogg;codecs=opus'
        : 'audio/webm';
      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.start(100);
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => setRecordingDuration(d => d + 1), 1000);
    } catch {
      alert('לא ניתן לגשת למיקרופון');
    }
  }

  async function stopRecordingAndSend() {
    const mr = mediaRecorderRef.current;
    if (!mr || !selectedChat) return;
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingDuration(0);
    const capturedLimit = msgLimit;
    mr.onstop = async () => {
      const mimeType = mr.mimeType || 'audio/webm';
      const blob = new Blob(audioChunksRef.current, { type: mimeType });
      if (blob.size < 500) { mr.stream.getTracks().forEach(t => t.stop()); return; }
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        try {
          await sendVoiceMutation.mutateAsync({
            accountId: selectedChat.accountId,
            chatId: selectedChat.chatId,
            data: base64,
            mimeType,
            _limit: capturedLimit,
          });
        } catch { /* ignore */ }
      };
      reader.readAsDataURL(blob);
      mr.stream.getTracks().forEach(t => t.stop());
    };
    mr.stop();
    mediaRecorderRef.current = null;
  }

  function cancelRecording() {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    mr.onstop = null;
    try { mr.stop(); } catch { /* ignore */ }
    mr.stream.getTracks().forEach(t => t.stop());
    mediaRecorderRef.current = null;
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingDuration(0);
  }

  const activeConv = conversations.find(
    (c) => c.accountId === selectedChat?.accountId && c.chatId === selectedChat?.chatId,
  );

  const sortedMsgs = [...messages].sort((a, b) => a.timestamp - b.timestamp);

  const chatBg = theme === 'dark' ? '#0b141a' : '#e5ddd5';

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-[calc(100vh-6rem)] -m-4 md:-m-8 overflow-x-hidden md:rounded-xl shadow-lg border border-border">
      {/* Sidebar: Chat List */}
      <div className={`${showList ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-72 lg:w-80 xl:w-96 border-l border-border bg-white flex-shrink-0 transition-all`}>
        <div className="p-3 bg-cream-dark border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-charcoal font-semibold text-base sm:text-lg">תיבת הודעות</h2>
            <button
              onClick={() => setShowNewChat(true)}
              className="w-8 h-8 rounded-full bg-accent hover:bg-accent-hover flex items-center justify-center text-white transition-colors shrink-0"
              title="שיחה חדשה"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </button>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חפש צ'אטים..."
            className="w-full bg-white text-charcoal rounded-lg px-3 py-2 text-sm border border-border outline-none placeholder:text-muted focus:ring-1 focus:ring-accent/50"
          />
        </div>

        {/* New Chat Modal */}
        {showNewChat && (
          <div className="absolute inset-0 z-50 bg-black/40 flex items-start justify-center pt-16 px-4">
            <div className="bg-white dark:bg-cream-dark rounded-xl shadow-xl w-full max-w-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setShowNewChat(false)} className="text-muted hover:text-charcoal">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
                <h3 className="text-charcoal font-semibold">שיחה חדשה</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted block mb-1 text-right">מספר טלפון</label>
                  <input
                    type="tel"
                    value={newChatPhone}
                    onChange={(e) => setNewChatPhone(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNewChat()}
                    placeholder="972501234567"
                    dir="ltr"
                    autoFocus
                    className="w-full bg-cream border border-border text-charcoal rounded-lg px-3 py-2.5 text-sm outline-none placeholder:text-muted focus:ring-1 focus:ring-accent/50"
                  />
                  <p className="text-[10px] text-muted mt-1 text-right">ללא + ורווחים, כולל קידומת מדינה (ישראל: 972...)</p>
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1 text-right">חשבון שולח</label>
                  <select
                    value={newChatAccountId}
                    onChange={(e) => setNewChatAccountId(e.target.value)}
                    className="w-full bg-cream border border-border text-charcoal rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-accent/50"
                  >
                    {accounts.filter(a => a.status === 'AUTHENTICATED').map(a => (
                      <option key={a.id} value={a.id}>{a.label} {a.phoneNumber ? `(${a.phoneNumber})` : ''}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleNewChat}
                  disabled={!newChatPhone.trim() || !newChatAccountId}
                  className="w-full bg-accent hover:bg-accent-hover disabled:opacity-40 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
                >
                  פתח שיחה
                </button>
              </div>
            </div>
          </div>
        )}

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
                    className={`flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 text-right transition-colors border-b border-border hover:bg-cream active:bg-cream-dark ${isSelected ? 'bg-cream-dark' : ''}`}
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-cream-dark border border-border flex-shrink-0 flex items-center justify-center text-muted">
                      {chat.isGroup ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex justify-between items-center gap-1 mb-0.5">
                        <span className="text-charcoal font-medium text-sm truncate">{chat.name}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {chat.unreadCount > 0 && (
                            <span className="bg-accent text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none">{chat.unreadCount}</span>
                          )}
                          {chat.timestamp != null && (
                            <span className="text-[10px] text-muted whitespace-nowrap">{formatDate(chat.timestamp)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 overflow-hidden">
                        {chat.lastMessage?.fromMe && (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-muted shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                        )}
                        <p className="text-xs text-muted truncate min-w-0" dir="auto">
                          {chat.lastMessage?.body || ''}
                        </p>
                        <span className="text-[10px] shrink-0 px-1 py-0.5 rounded bg-accent-light text-accent border border-accent/20 ml-auto">{chat.accountLabel}</span>
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
      <div className={`${!showList ? 'flex' : 'hidden'} md:flex flex-col flex-1 min-w-0 relative overflow-hidden`} style={{ background: chatBg }}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-2 sm:p-3 bg-white dark:bg-cream-dark border-b border-border flex items-center gap-2 sm:gap-3 z-10 w-full shadow-sm">
              {/* Back button - mobile */}
              <button onClick={() => setShowList(true)} className="text-muted hover:text-charcoal md:hidden">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-cream border border-border flex items-center justify-center text-muted shrink-0">
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
                  {/* Load earlier messages */}
                  {sortedMsgs.length >= msgLimit && (
                    <div className="flex justify-center py-2">
                      <button
                        onClick={() => setMsgLimit(l => l + 100)}
                        disabled={loadingMessages}
                        className="text-xs px-4 py-1.5 rounded-full shadow-sm transition-colors disabled:opacity-50"
                        style={{ background: theme === 'dark' ? 'rgba(11,20,26,0.85)' : 'rgba(225,220,212,0.95)', color: theme === 'dark' ? '#8aab9e' : '#667b6e' }}
                      >
                        {loadingMessages ? '...' : 'טען הודעות קודמות'}
                      </button>
                    </div>
                  )}
                  {sortedMsgs.map((msg, index) => {
                    const prev = index > 0 ? sortedMsgs[index - 1] : null;
                    const showTail = !prev || prev.fromMe !== msg.fromMe;
                    const isHovered = hoveredMsgId === msg.id;
                    const authorId = msg.author || '';
                    const authorDisplay = msg.authorName || (authorId ? authorId.replace('@c.us', '') : '');
                    const showDateSep = !prev || !sameDay(prev.timestamp, msg.timestamp);

                    const sentBubble = theme === 'dark'
                      ? 'bg-[#005c4b] text-white'
                      : 'bg-[#dcf8c6] text-[#111111]';
                    const recvBubble = theme === 'dark'
                      ? 'bg-[#202c33] text-white'
                      : 'bg-white border border-border/60 text-charcoal';
                    const sentTimeColor = theme === 'dark' ? 'text-white/50' : 'text-[#111111]/50';
                    const recvTimeColor = theme === 'dark' ? 'text-white/50' : 'text-charcoal/50';

                    // RTL: justify-start = right, justify-end = left
                    return (
                      <div key={msg.id}>
                        {showDateSep && (
                          <div className="flex justify-center my-2">
                            <span className="text-[11px] px-3 py-1 rounded-full shadow-sm select-none"
                              style={{ background: theme === 'dark' ? 'rgba(11,20,26,0.85)' : 'rgba(225,220,212,0.95)', color: theme === 'dark' ? '#8aab9e' : '#667b6e' }}>
                              {formatDateSeparator(msg.timestamp)}
                            </span>
                          </div>
                        )}
                        <div
                          className={`flex ${msg.fromMe ? 'justify-start' : 'justify-end'} ${showTail ? 'mt-1' : 'mt-px'} group/msg relative`}
                          onMouseEnter={() => setHoveredMsgId(msg.id)}
                          onMouseLeave={() => setHoveredMsgId(null)}
                        >
                          {/* Action buttons on hover */}
                          <div className={`flex items-center gap-1 mx-1.5 transition-opacity duration-100 ${isHovered ? 'opacity-100' : 'opacity-0'} ${msg.fromMe ? 'order-first' : 'order-last'}`}>
                            <button
                              onClick={() => setReplyTo(msg)}
                              title="ענה"
                              className="w-7 h-7 rounded-full bg-white shadow border border-border flex items-center justify-center text-muted hover:text-accent transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" /></svg>
                            </button>
                            {msg.fromMe && (
                              <button
                                onClick={async () => {
                                  if (!confirm('למחוק הודעה זו?')) return;
                                  try {
                                    await deleteMessage.mutateAsync({ accountId: selectedChat.accountId, chatId: selectedChat.chatId, messageId: msg.id });
                                  } catch { /* ignore */ }
                                }}
                                title="מחק"
                                className="w-7 h-7 rounded-full bg-white shadow border border-border flex items-center justify-center text-muted hover:text-red-500 transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                              </button>
                            )}
                          </div>

                          <div className={`msg-in relative max-w-[78%] sm:max-w-[68%] md:max-w-[58%] min-w-0 rounded-xl px-2.5 sm:px-3 py-1.5 shadow-sm text-[13.5px] sm:text-[14px] leading-[18px] sm:leading-[19px] overflow-hidden ${msg.fromMe ? sentBubble : recvBubble} ${showTail ? (msg.fromMe ? 'rounded-tr-sm' : 'rounded-tl-sm') : ''}`}>
                            {/* Sender name in group chats */}
                            {selectedChat.isGroup && authorDisplay && !msg.fromMe && (
                              <p className="text-[11.5px] font-semibold mb-0.5 leading-tight" style={{ color: authorColor(authorId) }}>{authorDisplay}</p>
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
                              <div className="break-words whitespace-pre-wrap italic opacity-60" dir="auto">
                                {msg.type === 'image' ? '📷 תמונה' :
                                 msg.type === 'video' ? '🎥 וידאו' :
                                 msg.type === 'audio' || msg.type === 'ptt' ? '🎵 אודיו' :
                                 msg.type === 'document' ? '📄 מסמך' :
                                 msg.type === 'sticker' ? '🏷️ סטיקר' :
                                 msg.body || `[${msg.type}]`}
                              </div>
                            )}
                            <div className={`flex items-center justify-end gap-1 mt-0.5 ${msg.fromMe ? sentTimeColor : recvTimeColor}`}>
                              <span className="text-[11px] leading-none">{formatTime(msg.timestamp)}</span>
                              {msg.fromMe && msg.ack != null && (
                                msg.ack === 0 ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[13px] h-[13px] opacity-40"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`w-[14px] h-[14px] ${msg.ack >= 3 ? 'text-blue-400' : 'opacity-50'}`}>
                                    {msg.ack >= 2 ? (
                                      <><polyline points="20 6 9 17 4 12" /><polyline points="20 10 16 14" /></>
                                    ) : (
                                      <polyline points="20 6 9 17 4 12" />
                                    )}
                                  </svg>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Reply Preview Bar */}
            {replyTo && (
              <div className="px-3 pt-2 pb-0 bg-white dark:bg-cream-dark border-t border-border z-10 w-full flex items-center gap-2">
                <div className="flex-1 border-r-4 border-accent bg-cream rounded-md px-3 py-1.5 min-w-0">
                  <p className="text-[11px] font-semibold text-accent truncate">{replyTo.fromMe ? 'אתה' : (replyTo.author?.replace('@c.us', '') || 'נמען')}</p>
                  <p className="text-xs text-charcoal/70 truncate" dir="auto">{replyTo.body || `[${replyTo.type}]`}</p>
                </div>
                <button onClick={() => setReplyTo(null)} className="text-muted hover:text-charcoal shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            )}

            {/* Schedule Modal */}
            {showScheduleModal && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30">
                <div className="bg-white rounded-xl p-5 w-80 shadow-xl mx-4">
                  <h3 className="text-sm font-semibold text-charcoal mb-3 text-right">תזמון הודעה</h3>
                  <p className="text-xs text-muted text-right mb-3 whitespace-pre-wrap" dir="auto">"{messageText.trim().slice(0, 100)}{messageText.length > 100 ? '...' : ''}"</p>
                  <div className="space-y-2 mb-4">
                    <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                    <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                  </div>
                  <div className="flex gap-2 justify-start">
                    <button onClick={() => setShowScheduleModal(false)} className="px-3 py-1.5 border border-border rounded-lg text-xs text-muted hover:bg-cream">ביטול</button>
                    <button
                      disabled={!scheduleDate || !scheduleTime || scheduleMutation.isPending}
                      onClick={async () => {
                        const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
                        await scheduleMutation.mutateAsync({
                          chatId: selectedChat!.chatId,
                          chatName: selectedChat!.name,
                          body: messageText.trim(),
                          scheduledAt,
                          accountId: selectedChat!.accountId,
                        });
                        setMessageText('');
                        setShowScheduleModal(false);
                        setScheduleDate('');
                        setScheduleTime('');
                      }}
                      className="px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-medium hover:bg-accent-hover disabled:opacity-50"
                    >
                      {scheduleMutation.isPending ? 'מתזמן...' : 'תזמן'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSend} className={`p-2 sm:p-3 bg-white dark:bg-cream-dark flex items-center gap-2 z-10 w-full ${replyTo ? '' : 'border-t border-border'}`}>
              {isRecording ? (
                /* Recording state */
                <div className="flex-1 flex items-center gap-2.5 bg-cream border border-accent/50 rounded-lg px-3 py-2.5">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                  <span className="text-sm text-charcoal flex-1">מקליט... {recordingDuration}ש'</span>
                  <button type="button" onClick={cancelRecording} className="text-muted hover:text-red-500 transition-colors shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
              ) : (
                <input
                  ref={inputRef}
                  type="text"
                  className="flex-1 bg-cream border border-border text-charcoal rounded-lg px-3 sm:px-4 py-2.5 outline-none placeholder:text-muted focus:ring-1 focus:ring-accent/50 text-sm min-w-0"
                  dir="auto"
                  placeholder="הקלד הודעה"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  disabled={sendMutation.isPending}
                />
              )}

              {isRecording ? (
                /* Stop recording → send */
                <button
                  type="button"
                  onClick={stopRecordingAndSend}
                  className="w-11 h-11 rounded-full bg-accent flex items-center justify-center text-white hover:bg-accent-hover transition-colors shrink-0 animate-pulse"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>
                </button>
              ) : messageText.trim() ? (
                <>
                  {/* Schedule button */}
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      now.setMinutes(now.getMinutes() + 30);
                      setScheduleDate(now.toISOString().split('T')[0]);
                      setScheduleTime(now.toTimeString().slice(0, 5));
                      setShowScheduleModal(true);
                    }}
                    className="w-10 h-10 rounded-full bg-cream border border-border flex items-center justify-center text-muted hover:text-accent hover:border-accent/30 transition-colors shrink-0"
                    title="תזמן הודעה"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  </button>
                  {/* Send button */}
                  <button
                    type="submit"
                    disabled={sendMutation.isPending}
                    className="w-11 h-11 rounded-full bg-accent flex items-center justify-center text-white disabled:opacity-50 hover:bg-accent-hover transition-colors shrink-0"
                  >
                    {sendMutation.isPending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                    )}
                  </button>
                </>
              ) : (
                /* Mic button */
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={sendVoiceMutation.isPending}
                  className="w-11 h-11 rounded-full bg-accent flex items-center justify-center text-white hover:bg-accent-hover transition-colors shrink-0 disabled:opacity-50"
                  title="הקלטת הודעה קולית"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
                </button>
              )}
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
