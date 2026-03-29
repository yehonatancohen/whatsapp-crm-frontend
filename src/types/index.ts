export type AccountStatus = 'INITIALIZING' | 'QR_READY' | 'AUTHENTICATED' | 'DISCONNECTED';

export type WarmupLevel = 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
export type WarmupIntensity = 'GHOST' | 'LOW' | 'NORMAL' | 'HIGH';

export interface AccountResponse {
  id: string;
  label: string;
  status: AccountStatus;
  qrCode: string | null;
  error: string | null;
  phoneNumber?: string;
  pushName?: string;
  warmupLevel?: WarmupLevel;
  isWarmupEnabled?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
}

export interface WarmupStatus {
  accountId: string;
  label: string;
  level: WarmupLevel;
  intensity: WarmupIntensity;
  isEnabled: boolean;
  messagesSentToday: number;
  maxMessagesPerDay: number;
  warmupStartedAt: string | null;
  daysAtLevel: number;
  minDaysForLevelUp: number;
  totalMessages: number;
  minMessagesForLevelUp: number;
  progress: number; // 0-100 percentage toward next level
}

export interface WarmupOverview {
  accounts: WarmupStatus[];
  totalEnabled: number;
  totalMessages24h: number;
}

export interface WarmupLogEntry {
  id: string;
  activityType: 'MESSAGE_SENT' | 'MESSAGE_RECEIVED' | 'PROFILE_UPDATE' | 'STATUS_POST';
  details: string | null;
  createdAt: string;
}

export type CampaignType = 'DIRECT_MESSAGE' | 'GROUP_MESSAGE';
export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
export type MessageStatus = 'PENDING' | 'QUEUED' | 'SENDING' | 'SENT' | 'DELIVERED' | 'FAILED';

export interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  messageTemplate: string;
  mediaUrl: string | null;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  messagesPerMinute: number;
  dailyLimitPerAccount: number;
  totalMessages: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  contactListId: string | null;
  createdAt: string;
}

export interface CampaignProgress {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  pending: number;
}

export interface CreateCampaignData {
  name: string;
  messageTemplate: string;
  type?: CampaignType;
  accountIds: string[];
  contactListId?: string;
  groupJids?: Array<{ jid: string; name?: string }>;
  scheduledAt?: string;
  messagesPerMinute?: number;
  dailyLimitPerAccount?: number;
}

// ─── Account Profile ─────────────────────────────────────────────
export interface AccountProfile {
  displayName: string | null;
  phoneNumber: string | null;
  profilePicUrl: string | null;
}

// ─── Group Collections ──────────────────────────────────────────
export interface GroupCollection {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count: { entries: number };
}

export interface GroupCollectionWithEntries extends GroupCollection {
  entries: Array<{ id: string; groupJid: string; groupName: string | null }>;
}

// ─── Groups ──────────────────────────────────────────────────────
export interface WhatsAppGroup {
  id: string;
  name: string;
  participantsCount: number;
}

// ─── Admin Users ─────────────────────────────────────────────────
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  _count: { accounts: number; campaigns: number };
  subscription: {
    planTier: string;
    status: string;
    trialEndsAt: string | null;
  } | null;
}

export interface AdminOverview {
  totalUsers: number;
  verifiedUsers: number;
  activeUsers: number;
  newUsersWeek: number;
  newUsersMonth: number;
  subsByStatus: Record<string, number>;
  subsByTier: Record<string, number>;
}

// ─── Activity ────────────────────────────────────────────────────
export interface ActivityLogEntry {
  id: string;
  type: string;
  message: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  account: { id: string; label: string } | null;
}

// ─── Group Promotions ────────────────────────────────────────────
export type PromotionSendStatus = 'PENDING' | 'SENDING' | 'SENT' | 'FAILED';

export interface GroupPromotion {
  id: string;
  name: string;
  isActive: boolean;
  sendTimes: string[];
  daysOfWeek: number[];
  timezone: string;
  accountIds: string[];
  dailyLimitPerAccount: number;
  messagesPerMinute: number;
  lastSentAt: string | null;
  totalSendCount: number;
  createdAt: string;
  updatedAt: string;
  messages: GroupPromotionMessage[];
  groups: GroupPromotionGroup[];
}

export interface GroupPromotionMessage {
  id: string;
  content: string;
  mediaUrl: string | null;
  isActive: boolean;
  promotionId: string;
  createdAt: string;
}

export interface GroupPromotionGroup {
  id: string;
  groupJid: string;
  groupName: string | null;
  promotionId: string;
}

export interface GroupPromotionLog {
  id: string;
  status: PromotionSendStatus;
  resolvedText: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  groupJid: string;
  groupName: string | null;
  accountId: string | null;
  messageId: string | null;
  promotionId: string;
  createdAt: string;
}

export interface CreatePromotionData {
  name: string;
  sendTimes: string[];
  daysOfWeek?: number[];
  timezone?: string;
  accountIds: string[];
  dailyLimitPerAccount?: number;
  messagesPerMinute?: number;
  groups: Array<{ jid: string; name?: string }>;
  messages: Array<{ content: string; mediaUrl?: string }>;
}

// ─── Dashboard Stats ─────────────────────────────────────────────
export interface DashboardStats {
  totalAccounts: number;
  authenticatedAccounts: number;
  totalContacts: number;
  totalCampaigns: number;
  activeCampaigns: number;
  messagesToday: number;
  warmupEnabled: number;
}
