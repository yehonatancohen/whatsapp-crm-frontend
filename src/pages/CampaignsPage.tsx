import { useState } from 'react';
import {
  useCampaigns,
  useCreateCampaign,
  useDeleteCampaign,
  useStartCampaign,
  usePauseCampaign,
  useResumeCampaign,
  useCancelCampaign,
  useCampaignFailures,
} from '../hooks/useCampaigns';
import { useContactLists } from '../hooks/useContacts';
import { useAccounts, useAccountGroups } from '../hooks/useAccounts';
import { extractApiError } from '../lib/errorUtils';
import { FormError } from '../components/shared/FormError';
import type { Campaign, CampaignStatus, CampaignType, CreateCampaignData } from '../types';

const statusConfig: Record<CampaignStatus, { label: string; bg: string; text: string; pulse?: boolean }> = {
  DRAFT: { label: 'Draft', bg: 'bg-slate-600/30', text: 'text-slate-400' },
  SCHEDULED: { label: 'Scheduled', bg: 'bg-blue-500/20', text: 'text-blue-400' },
  RUNNING: { label: 'Running', bg: 'bg-emerald-500/20', text: 'text-emerald-400', pulse: true },
  PAUSED: { label: 'Paused', bg: 'bg-amber-500/20', text: 'text-amber-400' },
  COMPLETED: { label: 'Completed', bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-slate-600/30', text: 'text-slate-400' },
  FAILED: { label: 'Failed', bg: 'bg-red-500/20', text: 'text-red-400' },
};

export function CampaignsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { data: campaigns, isLoading, error } = useCampaigns();

  const deleteMutation = useDeleteCampaign();
  const startMutation = useStartCampaign();
  const pauseMutation = usePauseCampaign();
  const resumeMutation = useResumeCampaign();
  const cancelMutation = useCancelCampaign();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin w-6 h-6 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
        <p className="text-red-400 text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Campaigns</h1>
          <p className="text-sm text-slate-500 mt-1">
            {campaigns?.length ? `${campaigns.length} campaign${campaigns.length !== 1 ? 's' : ''}` : 'Create and manage messaging campaigns'}
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors self-start sm:self-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Campaign
        </button>
      </div>

      {/* Create Campaign Form */}
      {showCreateForm && (
        <CreateCampaignForm onClose={() => setShowCreateForm(false)} />
      )}

      {/* Empty state */}
      {(!campaigns || campaigns.length === 0) && !showCreateForm && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-slate-500">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </div>
          <h3 className="text-slate-300 font-medium mb-1">No campaigns yet</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-4">
            Create your first campaign to start sending messages to your contacts.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create Campaign
          </button>
        </div>
      )}

      {/* Campaign list */}
      {campaigns && campaigns.length > 0 && (
        <div className="flex flex-col gap-4">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onStart={() => startMutation.mutate(campaign.id)}
              onPause={() => pauseMutation.mutate(campaign.id)}
              onResume={() => resumeMutation.mutate(campaign.id)}
              onCancel={() => cancelMutation.mutate(campaign.id)}
              onDelete={() => deleteMutation.mutate(campaign.id)}
              isActionPending={
                startMutation.isPending || pauseMutation.isPending ||
                resumeMutation.isPending || cancelMutation.isPending ||
                deleteMutation.isPending
              }
            />
          ))}
        </div>
      )}
    </>
  );
}

function StatusBadge({ status }: { status: CampaignStatus }) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${config.bg} ${config.text}`}>
      {config.pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      )}
      {config.label}
    </span>
  );
}

function CampaignCard({
  campaign,
  onStart,
  onPause,
  onResume,
  onCancel,
  onDelete,
  isActionPending,
}: {
  campaign: Campaign;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onDelete: () => void;
  isActionPending: boolean;
}) {
  const [showFailures, setShowFailures] = useState(false);
  const { data: failures, isLoading: failuresLoading } = useCampaignFailures(
    showFailures ? campaign.id : null,
  );

  const progressPercent = campaign.totalMessages > 0
    ? Math.round((campaign.sentCount / campaign.totalMessages) * 100)
    : 0;

  const showProgress = campaign.status === 'RUNNING' || campaign.status === 'COMPLETED' || campaign.status === 'PAUSED';

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600/50 transition-colors">
      {/* Top row: name + status */}
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1 mr-3">
          <h3 className="text-slate-100 font-medium text-sm truncate">{campaign.name}</h3>
          <p className="text-slate-500 text-xs mt-0.5">
            Created {new Date(campaign.createdAt).toLocaleDateString()}
            {campaign.scheduledAt && (
              <> &middot; Scheduled for {new Date(campaign.scheduledAt).toLocaleString()}</>
            )}
          </p>
        </div>
        <StatusBadge status={campaign.status} />
      </div>

      {/* Message template preview */}
      <p className="text-slate-400 text-sm mb-3 line-clamp-2">
        {campaign.messageTemplate.length > 80
          ? campaign.messageTemplate.substring(0, 80) + '...'
          : campaign.messageTemplate}
      </p>

      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
        <div className="flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-slate-500">
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
          <span className="text-xs text-slate-400">
            Total: <span className="text-slate-300">{campaign.totalMessages}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-emerald-500">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="text-xs text-slate-400">
            Sent: <span className="text-emerald-400">{campaign.sentCount}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-red-500">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span className="text-xs text-slate-400">
            Failed: <span className="text-red-400">{campaign.failedCount}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 w-full sm:w-auto sm:ml-auto">
          <span className="text-xs text-slate-500">
            {campaign.messagesPerMinute} msg/min &middot; {campaign.dailyLimitPerAccount}/day per account
          </span>
        </div>
      </div>

      {/* Progress bar */}
      {showProgress && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">Progress</span>
            <span className="text-xs text-slate-500">{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Failure details */}
      {campaign.failedCount > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setShowFailures(!showFailures)}
            className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-3 h-3 transition-transform ${showFailures ? 'rotate-90' : ''}`}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
            {showFailures ? 'Hide' : 'View'} failure reasons ({campaign.failedCount})
          </button>
          {showFailures && (
            <div className="mt-2 max-h-48 overflow-y-auto bg-slate-900/50 border border-slate-700/50 rounded-lg">
              {failuresLoading ? (
                <p className="text-xs text-slate-500 p-3">Loading...</p>
              ) : failures && failures.length > 0 ? (
                <div className="divide-y divide-slate-800">
                  {failures.map((f: any) => (
                    <div key={f.id} className="px-3 py-2 text-xs">
                      <span className="text-slate-400">
                        {f.contact?.name || f.contact?.phoneNumber || f.groupJid || 'Unknown'}
                      </span>
                      <span className="text-red-400/80 ml-2">
                        {f.errorMessage || 'Unknown error'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 p-3">No failure details available</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1">
        {campaign.status === 'DRAFT' && (
          <>
            <ActionButton onClick={onStart} disabled={isActionPending} variant="emerald">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Start
            </ActionButton>
            <ActionButton onClick={onDelete} disabled={isActionPending} variant="red">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Delete
            </ActionButton>
          </>
        )}
        {campaign.status === 'SCHEDULED' && (
          <>
            <ActionButton onClick={onCancel} disabled={isActionPending} variant="slate">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              Cancel
            </ActionButton>
          </>
        )}
        {campaign.status === 'RUNNING' && (
          <>
            <ActionButton onClick={onPause} disabled={isActionPending} variant="amber">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
              Pause
            </ActionButton>
            <ActionButton onClick={onCancel} disabled={isActionPending} variant="red">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              Cancel
            </ActionButton>
          </>
        )}
        {campaign.status === 'PAUSED' && (
          <>
            <ActionButton onClick={onResume} disabled={isActionPending} variant="emerald">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Resume
            </ActionButton>
            <ActionButton onClick={onCancel} disabled={isActionPending} variant="red">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              Cancel
            </ActionButton>
          </>
        )}
        {(campaign.status === 'COMPLETED' || campaign.status === 'FAILED' || campaign.status === 'CANCELLED') && (
          <ActionButton onClick={onDelete} disabled={isActionPending} variant="red">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <path d="M3 6h18" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Delete
          </ActionButton>
        )}
      </div>
    </div>
  );
}

function ActionButton({
  onClick,
  disabled,
  variant,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  variant: 'emerald' | 'red' | 'amber' | 'slate';
  children: React.ReactNode;
}) {
  const variantClasses = {
    emerald: 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20',
    red: 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20',
    amber: 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-amber-500/20',
    slate: 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 border-slate-600/50',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]}`}
    >
      {children}
    </button>
  );
}

function CreateCampaignForm({ onClose }: { onClose: () => void }) {
  const createMutation = useCreateCampaign();
  const { lists: contactLists, loading: listsLoading } = useContactLists();
  const { accounts } = useAccounts();

  const [name, setName] = useState('');
  const [campaignType, setCampaignType] = useState<CampaignType>('DIRECT_MESSAGE');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [contactListId, setContactListId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedGroupJids, setSelectedGroupJids] = useState<Array<{ jid: string; name: string }>>([]);
  const [messagesPerMinute, setMessagesPerMinute] = useState(2);
  const [dailyLimitPerAccount, setDailyLimitPerAccount] = useState(50);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formErrorDetails, setFormErrorDetails] = useState<Array<{ field: string; message: string }>>([]);

  const authenticatedAccounts = accounts.filter((a) => a.status === 'AUTHENTICATED');
  const { data: groups, isLoading: groupsLoading } = useAccountGroups(selectedAccountId);

  const toggleGroup = (jid: string, groupName: string) => {
    setSelectedGroupJids((prev) =>
      prev.some((g) => g.jid === jid)
        ? prev.filter((g) => g.jid !== jid)
        : [...prev, { jid, name: groupName }],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormErrorDetails([]);

    if (!name.trim()) {
      setFormError('Campaign name is required');
      return;
    }
    if (!messageTemplate.trim()) {
      setFormError('Message template is required');
      return;
    }
    if (campaignType === 'GROUP_MESSAGE' && selectedGroupJids.length === 0) {
      setFormError('Select at least one group');
      return;
    }

    const data: CreateCampaignData = {
      name: name.trim(),
      messageTemplate: messageTemplate.trim(),
      type: campaignType,
      messagesPerMinute,
      dailyLimitPerAccount,
    };

    if (campaignType === 'DIRECT_MESSAGE' && contactListId) {
      data.contactListId = contactListId;
    }
    if (campaignType === 'GROUP_MESSAGE') {
      data.groupJids = selectedGroupJids;
    }
    if (scheduleEnabled && scheduledAt) data.scheduledAt = new Date(scheduledAt).toISOString();

    try {
      await createMutation.mutateAsync(data);
      onClose();
    } catch (err: unknown) {
      const { message, details } = extractApiError(err);
      setFormError(message);
      setFormErrorDetails(details);
    }
  };

  const selectClass = "w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors";

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 sm:p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-slate-100">Create Campaign</h2>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-300 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <FormError error={formError} details={formErrorDetails} className="mb-4" />

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Campaign Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., March Promo Blast"
            className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3.5 py-2.5 text-sm placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </div>

        {/* Campaign Type */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Campaign Type</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCampaignType('DIRECT_MESSAGE')}
              className={`flex-1 text-sm font-medium px-4 py-2.5 rounded-lg border transition-colors ${
                campaignType === 'DIRECT_MESSAGE'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300'
              }`}
            >
              Direct Message
            </button>
            <button
              type="button"
              onClick={() => setCampaignType('GROUP_MESSAGE')}
              className={`flex-1 text-sm font-medium px-4 py-2.5 rounded-lg border transition-colors ${
                campaignType === 'GROUP_MESSAGE'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300'
              }`}
            >
              Group Message
            </button>
          </div>
        </div>

        {/* Message template and Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Message Template</label>
            <textarea
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
              placeholder="Type your message here..."
              className="w-full flex-1 min-h-[160px] bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3.5 py-2.5 text-sm placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors resize-none"
            />
            <p className="text-xs text-slate-500 mt-2">
              Supports <span className="text-slate-400 font-mono">*bold*</span>, <span className="text-slate-400 font-mono">_italic_</span>, <span className="text-slate-400 font-mono">~strike~</span> and <span className="text-slate-400 font-mono">{'{spintax|opts}'}</span>
            </p>
          </div>
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-slate-300 mb-1.5">WhatsApp Preview</label>
            <WhatsAppPreview text={messageTemplate} />
          </div>
        </div>

        {/* Target: Contact List or Groups */}
        {campaignType === 'DIRECT_MESSAGE' ? (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Contact List</label>
            <select
              value={contactListId}
              onChange={(e) => setContactListId(e.target.value)}
              className={selectClass}
            >
              <option value="">Select a contact list...</option>
              {listsLoading && <option disabled>Loading...</option>}
              {contactLists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name} ({list._count.entries} contacts)
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Select Groups</label>
            {/* Account selector */}
            <select
              value={selectedAccountId || ''}
              onChange={(e) => { setSelectedAccountId(e.target.value || null); setSelectedGroupJids([]); }}
              className={`${selectClass} mb-3`}
            >
              <option value="">Select an account to load groups...</option>
              {authenticatedAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.label} {acc.phoneNumber ? `(${acc.phoneNumber})` : ''}
                </option>
              ))}
            </select>

            {/* Group list */}
            {selectedAccountId && groupsLoading && (
              <p className="text-sm text-slate-500">Loading groups...</p>
            )}
            {selectedAccountId && !groupsLoading && groups && groups.length === 0 && (
              <p className="text-sm text-slate-500">No groups found for this account.</p>
            )}
            {groups && groups.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-1 border border-slate-700 rounded-lg p-2">
                {groups.map((group) => {
                  const isSelected = selectedGroupJids.some((g) => g.jid === group.id);
                  return (
                    <label
                      key={group.id}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-emerald-500/10' : 'hover:bg-slate-700/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleGroup(group.id, group.name)}
                        className="accent-emerald-500"
                      />
                      <span className="text-sm text-slate-200">{group.name}</span>
                      <span className="text-xs text-slate-500 ml-auto">{group.participantsCount} members</span>
                    </label>
                  );
                })}
              </div>
            )}
            {selectedGroupJids.length > 0 && (
              <p className="text-xs text-emerald-400 mt-2">{selectedGroupJids.length} group{selectedGroupJids.length !== 1 ? 's' : ''} selected</p>
            )}
          </div>
        )}

        {/* Messages per minute */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Messages per Minute: <span className="text-emerald-400">{messagesPerMinute}</span>
          </label>
          <input
            type="range"
            min={1}
            max={10}
            value={messagesPerMinute}
            onChange={(e) => setMessagesPerMinute(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
          <div className="flex justify-between text-xs text-slate-600 mt-0.5">
            <span>1</span>
            <span>10</span>
          </div>
        </div>

        {/* Daily limit per account */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Daily Limit per Account</label>
          <input
            type="number"
            min={1}
            max={200}
            value={dailyLimitPerAccount}
            onChange={(e) => setDailyLimitPerAccount(Math.min(200, Math.max(1, Number(e.target.value))))}
            className="w-full max-w-full sm:max-w-[180px] bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3.5 py-2.5 text-sm placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
          <p className="text-xs text-slate-500 mt-1">Between 1 and 200 messages per account per day</p>
        </div>

        {/* Schedule toggle */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <button
              type="button"
              onClick={() => setScheduleEnabled(!scheduleEnabled)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                scheduleEnabled ? 'bg-emerald-500' : 'bg-slate-600'
              }`}
              role="switch"
              aria-checked={scheduleEnabled}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform ring-0 transition-transform duration-200 ease-in-out mt-0.5 ${
                  scheduleEnabled ? 'translate-x-4 ml-0.5' : 'translate-x-0 ml-0.5'
                }`}
              />
            </button>
            <span className="text-sm font-medium text-slate-300">Schedule for later</span>
          </div>
          {scheduleEnabled && (
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full max-w-full sm:max-w-[280px] bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors [color-scheme:dark]"
            />
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? (
              <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            )}
            Create Campaign
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-slate-400 hover:text-slate-200 px-4 py-2.5 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function WhatsAppPreview({ text }: { text: string }) {
  const formatText = (input: string) => {
    if (!input) return null;
    let html = input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br />')
      .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/~(.*?)~/g, '<del>$1</del>')
      .replace(/```(.*?)```/gs, '<code class="bg-black/20 rounded px-1 font-mono text-xs">$1</code>');
      
    // Handle spintax optionally by highlighting it mentally, or just let users see it raw.
    html = html.replace(/(\{[^{}]+\})/g, '<span class="text-emerald-300 opacity-80">$1</span>');

    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="w-full flex-1 min-h-[160px] bg-[#0b141a] rounded-lg border border-slate-700/50 shadow-inner relative overflow-hidden flex flex-col p-4 z-0">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.06] pointer-events-none z-0" 
        style={{ backgroundImage: 'url("https://static.whatsapp.net/rsrc.php/v3/yl/r/r_QNOpNGJ6t.png")' }}
      />
      
      <div className="flex-1 overflow-y-auto z-10 custom-scrollbar flex flex-col justify-end">
        {text ? (
          <div className="relative self-end bg-[#005c4b] text-[#e9edef] text-[14.2px] leading-[19px] px-2 py-1.5 rounded-lg rounded-tr-none max-w-[95%] shadow-sm mt-2">
            {/* Tail */}
            <svg viewBox="0 0 8 13" width="8" height="13" className="absolute top-0 -right-[8px] text-[#005c4b]">
              <path fill="currentColor" d="M1.533 2.568 8 11.193V0H2.812C1.042 0 .474 1.026 1.533 2.568z"></path>
            </svg>
            
            <div className="font-sans whitespace-pre-wrap break-words inline-block max-w-full">
              {formatText(text)}
              <span className="inline-block w-14 h-3"></span> {/* Spacer for time float */}
            </div>
            
            <div className="absolute bottom-1 right-2 flex items-center justify-end gap-1">
              <span className="text-[11px] text-[#ffffff99] leading-none">{time}</span>
              <svg viewBox="0 0 16 11" width="16" height="11">
                <path fill="#53bdeb" d="M11.8 1.6l-7.7 7.7-3.7-3.7-1.1 1.1 4.8 4.8 8.8-8.8z" />
                <path fill="#53bdeb" d="M14.9 1.6l-1.1-1.1-3.7 3.7 1.1 1.1z" />
              </svg>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full opacity-50 text-slate-400 text-sm italic">
            Message preview
          </div>
        )}
      </div>
    </div>
  );
}
